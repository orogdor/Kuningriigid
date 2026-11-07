"""V345: far LOD (6 triangles) from the baked views of near.glb.

  python3 tools/forest-trees-v345/make_far.py bake.json [assets/sapling-trees]

Two crossed vertical cards (front and side view) plus one horizontal card
seen from above, like the Sapling far.glb files. Unlit, alpha MASK.
"""
import base64, hashlib, io, json, struct, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / (sys.argv[2] if len(sys.argv) > 2 else 'assets/sapling-trees')
bake = json.loads(Path(sys.argv[1]).read_text())


def decode(url):
    return Image.open(io.BytesIO(base64.b64decode(url.split(',', 1)[1]))).convert('RGBA')


def bleed(im):
    """Fill transparent texels with nearby colour: no dark rim with mipmaps."""
    rgb, a = im.convert('RGB'), im.getchannel('A')
    fill = rgb
    for r in (2, 6, 16):
        blur = rgb.filter(ImageFilter.GaussianBlur(r))
        wa = a.filter(ImageFilter.GaussianBlur(r))
        arr = np.asarray(blur, np.float32) / np.maximum(np.asarray(wa, np.float32)[..., None] / 255, 1e-3)
        fill = Image.composite(fill, Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)), a.point(lambda v: 255 if v > 8 else 0))
    return Image.merge('RGBA', (*fill.split(), a))


def png_bytes(im):
    q = im.quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
    b = io.BytesIO(); q.save(b, 'PNG', optimize=True); return b.getvalue()


def glb(path, quads, images):
    """quads: list of (positions[4], uvs[4], material index)."""
    parts, views, acc, prims = [], [], [], []

    def push(data, target=None):
        off = sum(len(p) for p in parts); parts.append(data + b'\0' * ((-len(data)) % 4))
        v = {'buffer': 0, 'byteOffset': off, 'byteLength': len(data)}
        if target: v['target'] = target
        views.append(v); return len(views) - 1
    for mat in range(len(images)):
        sel = [q for q in quads if q[2] == mat]
        P = np.array([p for q in sel for p in q[0]], np.float32)
        U = np.array([u for q in sel for u in q[1]], np.float32)
        N = np.tile(np.array([0, 1, 0], np.float32), (len(P), 1))
        I = np.array([k * 4 + o for k in range(len(sel)) for o in (0, 1, 2, 0, 2, 3)], np.uint16)
        a = {}
        for name, arr, typ in (('POSITION', P, 'VEC3'), ('NORMAL', N, 'VEC3'), ('TEXCOORD_0', U, 'VEC2')):
            d = {'bufferView': push(arr.tobytes(), 34962), 'componentType': 5126, 'count': len(arr), 'type': typ}
            if name == 'POSITION': d['min'] = P.min(0).tolist(); d['max'] = P.max(0).tolist()
            acc.append(d); a[name] = len(acc) - 1
        acc.append({'bufferView': push(I.tobytes(), 34963), 'componentType': 5123, 'count': len(I), 'type': 'SCALAR'})
        prims.append({'attributes': a, 'indices': len(acc) - 1, 'material': mat})
    imgs = [{'bufferView': push(b), 'mimeType': 'image/png'} for b in images]
    mats = [{'name': f'impostor_{k}', 'pbrMetallicRoughness': {'baseColorTexture': {'index': k}, 'baseColorFactor': [1, 1, 1, 1], 'metallicFactor': 0, 'roughnessFactor': 1},
             'alphaMode': 'MASK', 'alphaCutoff': .4, 'doubleSided': True, 'extensions': {'KHR_materials_unlit': {}}} for k in range(len(images))]
    doc = {'asset': {'version': '2.0', 'generator': 'Kuningriigid V345 make_far.py'}, 'extensionsUsed': ['KHR_materials_unlit'],
           'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'mesh': 0, 'name': 'far'}], 'meshes': [{'primitives': prims}],
           'materials': mats, 'textures': [{'source': k, 'sampler': 0} for k in range(len(images))],
           'samplers': [{'magFilter': 9729, 'minFilter': 9987, 'wrapS': 33071, 'wrapT': 33071}], 'images': imgs,
           'buffers': [{'byteLength': sum(len(p) for p in parts)}], 'bufferViews': views, 'accessors': acc}
    js = json.dumps(doc, separators=(',', ':')).encode(); js += b' ' * ((-len(js)) % 4)
    binary = b''.join(parts)
    data = struct.pack('<4sII', b'glTF', 2, 28 + len(js) + len(binary)) + struct.pack('<I4s', len(js), b'JSON') + js + struct.pack('<I4s', len(binary), b'BIN\0') + binary
    path.write_bytes(data)
    return {'triangles': len(quads) * 2, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


manifest = json.loads((OUT / 'manifest.json').read_text())
for rec in manifest['trees']:
    b = bake[rec['id']]; dest = OUT / rec['id']
    front, side, top = decode(b['front']), decode(b['side']), decode(b['top'])
    sheet = Image.new('RGBA', (front.width * 2, front.height), (0, 0, 0, 0))
    sheet.paste(front, (0, 0)); sheet.paste(side, (front.width, 0))
    sheet, top = bleed(sheet), bleed(top)
    sheet.save(dest / 'impostor.png'); top.save(dest / 'top.png')
    cx, cy, cz = b['center']; ws, hs, ts = b['ws'], b['hs'], b['ts']
    x0, x1, y0, y1, z0, z1 = cx - ws / 2, cx + ws / 2, cy - hs / 2, cy + hs / 2, cz - ws / 2, cz + ws / 2
    # glTF UV origin is the top-left texel: bottom of the tree -> v = 1.
    front_q = ([(x0, y0, cz), (x1, y0, cz), (x1, y1, cz), (x0, y1, cz)], [(0, 1), (.5, 1), (.5, 0), (0, 0)], 0)
    # side camera looks along -X from +X: image right is -Z.
    side_q = ([(cx, y0, z1), (cx, y0, z0), (cx, y1, z0), (cx, y1, z1)], [(.5, 1), (1, 1), (1, 0), (.5, 0)], 0)
    t0, t1 = cx - ts / 2, cx + ts / 2
    s0, s1 = cz - ts / 2, cz + ts / 2
    ym = b['min'][1] + (b['max'][1] - b['min'][1]) * .45
    top_q = ([(t0, ym, s0), (t1, ym, s0), (t1, ym, s1), (t0, ym, s1)], [(0, 0), (1, 0), (1, 1), (0, 1)], 1)
    rec['far'] = glb(dest / 'far.glb', [front_q, side_q, top_q], [png_bytes(sheet), png_bytes(top)])
    rec['preview'] = 'preview.png'; rec['impostorViews'] = 2
    print(rec['id'], rec['far'])
(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2))
