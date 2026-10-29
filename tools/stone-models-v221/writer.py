"""Minimal GLB writer: one primitive, optional skin (JOINTS_0/WEIGHTS_0 + joints) and a JPEG base texture."""
import json, struct, io, numpy as np
def _pad(b, c=b'\x00'):
    return b + c * ((4 - len(b) % 4) % 4)
def write(path, P, N, UV, F, img=None, skin=None, extras=None, jpeg_q=85, roughness=.92):
    bin_ = b''; views = []; accs = []
    def add(arr, target=None, comp=5126, typ='VEC3', minmax=False):
        nonlocal bin_
        data = arr.tobytes(); off = len(bin_); bin_ = _pad(bin_ + data)
        views.append({'buffer': 0, 'byteOffset': off, 'byteLength': len(data), **({'target': target} if target else {})})
        a = {'bufferView': len(views) - 1, 'componentType': comp, 'count': len(arr), 'type': typ}
        if minmax:
            a['min'] = arr.min(0).tolist(); a['max'] = arr.max(0).tolist()
        accs.append(a); return len(accs) - 1
    attrs = {'POSITION': add(P.astype(np.float32), 34962, minmax=True), 'NORMAL': add(N.astype(np.float32), 34962)}
    if UV is not None: attrs['TEXCOORD_0'] = add(UV.astype(np.float32), 34962, typ='VEC2')
    if skin is not None:
        attrs['JOINTS_0'] = add(skin['joints'].astype(np.uint8), 34962, comp=5121, typ='VEC4')
        attrs['WEIGHTS_0'] = add(skin['weights'].astype(np.float32), 34962, typ='VEC4')
    ind = F.astype(np.uint16 if F.max() < 65535 else np.uint32).ravel()
    iacc = add(ind, 34963, comp=5123 if ind.dtype == np.uint16 else 5125, typ='SCALAR')
    j = {'asset': {'version': '2.0', 'generator': 'kuningriigid-v221', **({'extras': extras} if extras else {})},
         'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'name': 'model', 'mesh': 0}],
         'meshes': [{'primitives': [{'attributes': attrs, 'indices': iacc, 'material': 0}]}],
         'materials': [{'pbrMetallicRoughness': {'baseColorFactor': [1, 1, 1, 1], 'metallicFactor': 0, 'roughnessFactor': roughness}}]}
    if img is not None:
        b = io.BytesIO(); img.convert('RGB').save(b, 'JPEG', quality=jpeg_q, optimize=True); data = b.getvalue()
        off = len(bin_); bin_ = _pad(bin_ + data); views.append({'buffer': 0, 'byteOffset': off, 'byteLength': len(data)})
        j['images'] = [{'bufferView': len(views) - 1, 'mimeType': 'image/jpeg'}]
        j['samplers'] = [{'magFilter': 9729, 'minFilter': 9987, 'wrapS': 33071, 'wrapT': 33071}]
        j['textures'] = [{'source': 0, 'sampler': 0}]
        j['materials'][0]['pbrMetallicRoughness']['baseColorTexture'] = {'index': 0}
    if skin is not None:
        nodes = j['nodes']; first = len(nodes)
        for k, jt in enumerate(skin['bones']):
            nodes.append({'name': jt['name'], 'translation': list(map(float, jt['t'])),
                          **({'children': [first + c for c in jt['children']]} if jt['children'] else {})})
        ibm = add(np.array(skin['ibm'], np.float32).reshape(-1, 16), typ='MAT4')
        j['skins'] = [{'joints': list(range(first, first + len(skin['bones']))), 'inverseBindMatrices': ibm, 'skeleton': first}]
        nodes[0]['skin'] = 0
        j['scenes'][0]['nodes'] = [0, first]
    j['bufferViews'] = views; j['accessors'] = accs; j['buffers'] = [{'byteLength': len(bin_)}]
    js = _pad(json.dumps(j, separators=(',', ':')).encode(), b' ')
    out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(bin_)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(bin_), 0x004E4942) + bin_
    open(path, 'wb').write(out)
