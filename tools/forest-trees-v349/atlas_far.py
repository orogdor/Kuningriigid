"""V349: one texture and one primitive per far tree card.

  python3 tools/forest-trees-v349/atlas_far.py [assets/sapling-trees]

make_far.py writes far.glb with two primitives: the crossed side cards
(512x512 view) and the top card (256x256 view), each with its own texture,
so every far tree variant costs two draw calls. This packs both views into
one 1024x512 atlas and merges the cards into one primitive: one draw call.

The picture does not change: the same texels are sampled. Both tiles sit on
a 128 px grid with transparent gutters, so every mipmap down to 8x4 holds
exactly the averages the separate textures had. Run it after make_far.py;
files that already have one primitive are left alone.
"""
import io, json, struct, sys
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / (sys.argv[1] if len(sys.argv) > 1 else 'assets/sapling-trees')
W, H, SIDE, TOP, TX, TY = 1024, 512, 512, 256, 640, 128


def read(path):
    b = path.read_bytes(); n = struct.unpack('<I', b[12:16])[0]
    doc = json.loads(b[20:20 + n]); return doc, b[20 + n + 8:]


def view(doc, binary, i):
    v = doc['bufferViews'][i]; o = v.get('byteOffset', 0); return binary[o:o + v['byteLength']]


def accessor(doc, binary, i):
    a = doc['accessors'][i]; dt = {5126: np.float32, 5123: np.uint16, 5125: np.uint32}[a['componentType']]
    width = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3}[a['type']]
    raw = view(doc, binary, a['bufferView'])[a.get('byteOffset', 0):]
    return np.frombuffer(raw, dt, a['count'] * width).reshape(a['count'], width).copy()


def convert(path):
    doc, binary = read(path)
    prims = doc['meshes'][0]['primitives']
    if len(prims) == 1 and len(doc.get('images', [])) == 1: return 'already one primitive'
    if len(prims) != 2 or len(doc['images']) != 2: return 'skipped: unexpected layout'
    imgs = [Image.open(io.BytesIO(view(doc, binary, im['bufferView']))).convert('RGBA') for im in doc['images']]
    order = [doc['textures'][doc['materials'][p['material']]['pbrMetallicRoughness']['baseColorTexture']['index']]['source'] for p in prims]
    side, top = imgs[order[0]], imgs[order[1]]
    if side.size != (SIDE, SIDE) or top.size != (TOP, TOP): return 'skipped: unexpected texture size'
    s = np.asarray(side); t = np.asarray(top)
    mean = s[..., :3][s[..., 3] > 128].mean(0) if (s[..., 3] > 128).any() else np.array([60, 80, 40])
    atlas = np.zeros((H, W, 4), np.uint8); atlas[..., :3] = np.round(mean).astype(np.uint8)  # gutters: leaf colour, alpha 0
    atlas[:, :SIDE] = s; atlas[TY:TY + TOP, TX:TX + TOP] = t
    png = io.BytesIO(); Image.fromarray(atlas, 'RGBA').save(png, 'PNG', optimize=True); png = png.getvalue()
    P, N, U, I, base = [], [], [], [], 0
    for k, p in enumerate(prims):
        pos = accessor(doc, binary, p['attributes']['POSITION']); uv = accessor(doc, binary, p['attributes']['TEXCOORD_0'])
        if k == 0: uv = uv * [SIDE / W, SIDE / H]
        else: uv = (uv * TOP + [TX, TY]) / [W, H]
        P.append(pos); N.append(accessor(doc, binary, p['attributes']['NORMAL'])); U.append(uv.astype(np.float32))
        I.append(accessor(doc, binary, p['indices']).reshape(-1).astype(np.uint16) + base); base += len(pos)
    P, N, U, I = np.concatenate(P), np.concatenate(N), np.concatenate(U), np.concatenate(I).astype(np.uint16)
    parts, views, acc = [], [], []

    def push(data, target=None):
        off = sum(len(x) for x in parts); parts.append(data + b'\0' * ((-len(data)) % 4))
        v = {'buffer': 0, 'byteOffset': off, 'byteLength': len(data)}
        if target: v['target'] = target
        views.append(v); return len(views) - 1
    attrs = {}
    for name, arr, typ in (('POSITION', P, 'VEC3'), ('NORMAL', N, 'VEC3'), ('TEXCOORD_0', U, 'VEC2')):
        d = {'bufferView': push(arr.astype(np.float32).tobytes(), 34962), 'componentType': 5126, 'count': len(arr), 'type': typ}
        if name == 'POSITION': d['min'] = P.min(0).tolist(); d['max'] = P.max(0).tolist()
        acc.append(d); attrs[name] = len(acc) - 1
    acc.append({'bufferView': push(I.tobytes(), 34963), 'componentType': 5123, 'count': len(I), 'type': 'SCALAR'})
    material = dict(doc['materials'][prims[0]['material']]); material['name'] = 'impostor'
    material['pbrMetallicRoughness'] = {**material['pbrMetallicRoughness'], 'baseColorTexture': {'index': 0}}
    new = {'asset': {'version': '2.0', 'generator': 'Kuningriigid V349 atlas_far.py'}, 'extensionsUsed': doc.get('extensionsUsed', ['KHR_materials_unlit']),
           'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'mesh': 0, 'name': 'far'}],
           'meshes': [{'primitives': [{'attributes': attrs, 'indices': len(acc) - 1, 'material': 0}]}],
           'materials': [material], 'textures': [{'source': 0, 'sampler': 0}], 'samplers': doc['samplers'],
           'images': [{'bufferView': push(png), 'mimeType': 'image/png'}],
           'buffers': [{'byteLength': sum(len(x) for x in parts)}], 'bufferViews': views, 'accessors': acc}
    js = json.dumps(new, separators=(',', ':')).encode(); js += b' ' * ((-len(js)) % 4); body = b''.join(parts)
    path.write_bytes(struct.pack('<4sII', b'glTF', 2, 28 + len(js) + len(body)) + struct.pack('<I4s', len(js), b'JSON') + js + struct.pack('<I4s', len(body), b'BIN\0') + body)
    edge = max(int(s[:, -1, 3].max()), int(t[0, :, 3].max()), int(t[-1, :, 3].max()), int(t[:, 0, 3].max()), int(t[:, -1, 3].max()))
    return f'atlas {W}x{H}, {len(I) // 3} triangles, edge alpha {edge}'


for far in sorted(OUT.glob('*/far.glb')):
    print(far.parent.name, convert(far))
