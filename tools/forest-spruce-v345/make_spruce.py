"""V345 experiment: tall forest spruces like a dense northern stand.

Pure Python (numpy + Pillow), no Blender. Writes GLB files that the game's
own loader (glb-lite-v221.js) reads: two primitives (bark, foliage) sharing
one RGBA atlas. Everything, including the needle texture, is generated here.

  python3 tools/forest-spruce-v345/make_spruce.py [--out assets/forest-spruce-v345]
"""
import argparse, io, json, math, random, struct, hashlib
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
ap = argparse.ArgumentParser()
ap.add_argument('--out', default=str(ROOT / 'assets/forest-spruce-v345'))
ap.add_argument('--variants', type=int, default=4)
args = ap.parse_args()
OUT = Path(args.out); OUT.mkdir(parents=True, exist_ok=True)

A = 1024                 # atlas size
SPRAY_H = 448            # four spray tiles 512 x 448, bark strip below
BARK_Y = 2 * SPRAY_H     # 896..1024


# ---------------------------------------------------------------- texture
def needle_colour(rng, fresh):
    if fresh:
        return (rng.randint(112, 140), rng.randint(140, 166), rng.randint(60, 78))
    k = rng.uniform(.75, 1.25)
    return (int(52 * k), int(84 * k), int(44 * k))


def draw_spray(draw, ox, oy, w, h, rng, s):
    """One bushy, drooping spruce branch spray. The axis runs from the left
    edge (attached to the branch) to the right tip; side twigs branch again.
    s = supersampling factor."""
    cy = oy + h * .30
    axis = [(ox + 6 * s + t / 39 * (w - 20 * s), cy + (t / 39) ** 1.6 * h * .2) for t in range(40)]

    def twig(bx, by, ang, ln, droop, k=9):
        pts = []
        for i in range(k):
            u = i / (k - 1)
            a = ang * (1 - .3 * u)
            pts.append((bx + math.cos(a) * ln * u, by + math.sin(a) * ln * u + droop * ln * u * u))
        return pts

    twigs = []
    n = 26
    for i in range(n):
        t = .04 + .93 * i / (n - 1)
        bx, by = axis[int(t * 39)]
        env = math.sin(min(1, t * 1.1) * math.pi) ** .55 * (1 - .3 * t)
        for side in (-1, 1):
            if rng.random() < .08:
                continue
            ln = h * .46 * env * rng.uniform(.7, 1.1)
            ang = math.radians(rng.uniform(40, 60)) * side
            droop = rng.uniform(.15, .45)
            pts = twig(bx, by, ang, ln, droop)
            twigs.append((pts, 1))
            # second-order twiglets
            for j in range(2, 8, 2):
                if rng.random() < .35:
                    continue
                px, py = pts[j]
                twigs.append((twig(px, py, ang + side * math.radians(rng.uniform(25, 45)), ln * rng.uniform(.25, .4), droop * .6, 5), 2))
    wood = (70, 50, 31)
    for pts, order in [(axis, 0)] + twigs:
        total = len(pts)
        base_len = (9.5, 7.5, 6.0)[order]
        for k in range(total - 1):
            (x0, y0), (x1, y1) = pts[k], pts[k + 1]
            seg = math.hypot(x1 - x0, y1 - y0) or 1
            ux, uy = (x1 - x0) / seg, (y1 - y0) / seg
            steps = max(1, int(seg / (1.15 * s)))
            for j in range(steps):
                f = j / steps
                px, py = x0 + (x1 - x0) * f, y0 + (y1 - y0) * f
                tip = (k + f) / (total - 1)
                fresh = tip > .72 and rng.random() < .7
                for _ in range(2):
                    side = rng.choice((-1, 1))
                    nl = base_len * s * rng.uniform(.6, 1.25) * (1 - .3 * tip)
                    a = math.radians(rng.uniform(30, 85)) * side
                    dx = ux * math.cos(a) - uy * math.sin(a)
                    dy = ux * math.sin(a) + uy * math.cos(a) + .3
                    l = math.hypot(dx, dy)
                    col = needle_colour(rng, fresh)
                    if order == 0 and not fresh:
                        col = tuple(int(c * .8) for c in col)
                    draw.line([(px, py), (px + dx / l * nl, py + dy / l * nl)], fill=col + (255,), width=max(1, int(1.2 * s)))
        draw.line(pts, fill=wood + (255,), width=max(1, int((2.8, 1.3, .9)[order] * s)))


def bark_strip(rng):
    w, h = A, A - BARK_Y
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    base = np.zeros((h, w, 3), np.float32)
    # vertical plates and fissures, wraps horizontally (u around the trunk)
    plates = np.zeros(w, np.float32)
    for k in range(1, 40):
        plates += np.sin(x[0] / w * math.tau * k + rng.uniform(0, 6.3)) / k ** .9
    plates = (plates - plates.min()) / (plates.max() - plates.min())
    flakes = np.zeros((h, w), np.float32)
    for k in range(6):
        fx, fy = rng.randint(2, 9), rng.randint(1, 4)
        flakes += np.sin(x / w * math.tau * fx * 8 + rng.uniform(0, 6)) * np.sin(y / h * math.pi * fy * 2 + rng.uniform(0, 6))
    v = .55 * plates[None, :] + .18 * (flakes / 6 + .5) + .27 * np.random.default_rng(7).random((h, w)).astype(np.float32)
    v = np.clip(v, 0, 1)
    # grey-brown spruce bark: dark fissures between scaly, lighter plates
    fiss = np.clip((plates[None, :] - .35) * 3, 0, 1)
    v = v * (.35 + .65 * fiss)
    dark = np.array([30, 26, 23], np.float32); light = np.array([104, 94, 82], np.float32)
    base = dark + (light - dark) * v[..., None] ** 1.1
    return Image.fromarray(base.astype(np.uint8), 'RGB')


def make_atlas(seed=345):
    rng = random.Random(seed)
    s = 2  # supersample
    big = Image.new('RGBA', (A * s, BARK_Y * s), (0, 0, 0, 0))
    d = ImageDraw.Draw(big)
    for tile in range(4):
        ox, oy = (tile % 2) * 512 * s, (tile // 2) * SPRAY_H * s
        draw_spray(d, ox, oy, 512 * s, SPRAY_H * s, rng, s)
    spray = big.resize((A, BARK_Y), Image.LANCZOS)
    # colour bleed into transparent pixels: no dark fringes with mipmaps
    rgb = spray.convert('RGB'); alpha = spray.getchannel('A')
    bleed = rgb.filter(ImageFilter.GaussianBlur(6))
    mask = alpha.point(lambda a: 255 if a > 8 else 0)
    filled = Image.composite(rgb, Image.composite(bleed, Image.new('RGB', rgb.size, (40, 62, 33)), bleed.convert('L').point(lambda v: 255 if v > 4 else 0)), mask)
    atlas = Image.new('RGBA', (A, A), (0, 0, 0, 0))
    atlas.paste(Image.merge('RGBA', (*filled.split(), alpha)), (0, 0))
    bark = bark_strip(rng).convert('RGBA')
    atlas.paste(bark, (0, BARK_Y))
    return atlas


def tile_uv(tile, u, v):
    """u along the spray (0 attached .. 1 tip), v across (0..1)."""
    x0, y0 = (tile % 2) * 512, (tile // 2) * SPRAY_H
    return ((x0 + 4 + u * 504) / A, (y0 + 4 + v * (SPRAY_H - 8)) / A)


def bark_uv(u, v):
    return (u, (BARK_Y + 2 + v * (A - BARK_Y - 4)) / A)


# ---------------------------------------------------------------- geometry
class Mesh:
    def __init__(self):
        self.p, self.n, self.uv, self.i = [], [], [], []

    def vert(self, p, n, uv):
        self.p.append(p); self.n.append(n); self.uv.append(uv); return len(self.p) - 1

    def tri(self, a, b, c):
        self.i += [a, b, c]


def norm(v):
    l = math.sqrt(sum(c * c for c in v)) or 1
    return tuple(c / l for c in v)


def add(a, b, k=1):
    return tuple(x + y * k for x, y in zip(a, b))


def cross(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def tube(m, path, radii, sides, vflip_every=None, ulen=1.0):
    """Generalised cylinder along path (list of points, Y up)."""
    rings = []
    vacc = 0.0
    for k, (p, r) in enumerate(zip(path, radii)):
        a = path[max(0, k - 1)]; b = path[min(len(path) - 1, k + 1)]
        t = norm((b[0] - a[0], b[1] - a[1], b[2] - a[2]))
        ref = (0, 0, 1) if abs(t[1]) > .9 else (0, 1, 0)
        u = norm(cross(t, ref)); w = norm(cross(t, u))
        if k:
            vacc += math.dist(path[k - 1], p) / ulen
        ring = []
        for s in range(sides + 1):
            ang = s / sides * math.tau
            d = add(tuple(c * math.cos(ang) for c in u), tuple(c * math.sin(ang) for c in w))
            vv = vacc % 2; vv = vv if vv <= 1 else 2 - vv   # mirror: no seam
            ring.append(m.vert(add(p, d, r), d, bark_uv(s / sides, vv)))
        rings.append(ring)
    for r0, r1 in zip(rings, rings[1:]):
        for s in range(sides):
            m.tri(r0[s], r1[s + 1], r1[s]); m.tri(r0[s], r0[s + 1], r1[s + 1])


def card(m, origin, axis, side, length, width, tile, normal_hint, flip=False):
    """Quad from origin along axis (length) and +-side (width/2)."""
    corners = [(0, -.5), (1, -.5), (1, .5), (0, .5)]
    ids = []
    for u, v in corners:
        p = add(add(origin, axis, u * length), side, v * width)
        uv = tile_uv(tile, u, (1 - (v + .5)) if flip else (v + .5))
        ids.append(m.vert(p, normal_hint, uv))
    # Front face toward the shading normal: from below, three.js flips the
    # normal of a back face, so a lamp under the crown lights the underside.
    if sum(a * b for a, b in zip(cross(axis, side), normal_hint)) >= 0:
        m.tri(ids[0], ids[1], ids[2]); m.tri(ids[0], ids[2], ids[3])
    else:
        m.tri(ids[0], ids[2], ids[1]); m.tri(ids[0], ids[3], ids[2])


def rot_about(v, axis, ang):
    axis = norm(axis); c, s = math.cos(ang), math.sin(ang)
    d = sum(a * b for a, b in zip(v, axis))
    cr = cross(axis, v)
    return tuple(v[i] * c + cr[i] * s + axis[i] * d * (1 - c) for i in range(3))


def spruce(variant, lod='near'):
    rng = random.Random(9100 + variant * 31)
    H = [16.5, 19.0, 14.0, 21.0][variant % 4] * rng.uniform(.97, 1.03)
    crown_base = H * [.38, .46, .30, .52][variant % 4]
    r0 = .07 + H * .0048
    lean = (rng.uniform(-.25, .25), rng.uniform(-.25, .25))
    bark, leaf = Mesh(), Mesh()

    def trunk_at(z):
        t = z / H
        return (lean[0] * t * t + .05 * math.sin(z * 1.3 + variant), z, lean[1] * t * t + .05 * math.cos(z * 1.1 + variant))

    def radius_at(z):
        t = z / H
        return r0 * (1 - t) ** .85 + .018 + r0 * .35 * math.exp(-z / .35)

    # trunk
    nz = 22 if lod == 'near' else 9
    zs = [H * (k / nz) ** 1.0 for k in range(nz + 1)]
    tube(bark, [trunk_at(z) for z in zs], [radius_at(z) for z in zs], 9 if lod == 'near' else 5, ulen=1.3)

    # dead stubs on the bare lower trunk
    if lod == 'near':
        for k in range(int(crown_base * 2.2)):
            z = rng.uniform(1.4, crown_base)
            az = rng.uniform(0, math.tau)
            d = (math.cos(az), 0, math.sin(az))
            base = add(trunk_at(z), d, radius_at(z) * .8)
            ln = rng.uniform(.25, .9) * (z / crown_base) ** .5
            tip = add(add(base, d, ln), (0, -1, 0), ln * rng.uniform(.15, .5))
            tube(bark, [base, tip], [.022, .006], 3)

    # whorls
    z = crown_base
    whorl = 0
    golden = math.radians(137.5)
    max_len = H * .19
    while z < H - .5:
        t = (z - crown_base) / (H - crown_base)
        n = rng.randint(4, 6)
        for b in range(n):
            if lod != 'near' and (b + whorl) % 2:
                continue
            az = whorl * golden + b * math.tau / n + rng.uniform(-.35, .35)
            env = (1 - t) ** .95 * (.82 + .18 * math.sin(t * math.pi * 1.7))
            L = max(.35, max_len * env * rng.uniform(.8, 1.12))
            pitch0 = math.radians(18 * t - 4 + rng.uniform(-6, 6))
            droop = math.radians((34 - 26 * t) * rng.uniform(.8, 1.2))
            dir0 = (math.cos(az), 0, math.sin(az))
            start = add(trunk_at(z), dir0, radius_at(z) * .7)
            pts = [start]
            seg = 5
            for k in range(1, seg + 1):
                s = k / seg
                p = pitch0 - droop * s ** 1.6
                d = (math.cos(az) * math.cos(p), math.sin(p), math.sin(az) * math.cos(p))
                pts.append(add(pts[-1], d, L / seg))
            if lod == 'near':
                tube(bark, pts, [max(.012, .055 * L / max_len) * (1 - .8 * k / seg) + .006 for k in range(seg + 1)], 4)
            # foliage sprays along the branch: a main spray + two side sprays
            side_h = (-math.sin(az), 0, math.cos(az))
            count = max(1, round(L / .45))
            for c in range(count):
                s = .18 + .8 * c / max(1, count) + rng.uniform(-.04, .04)
                k = min(seg - 1, int(s * seg))
                f = s * seg - k
                o = add(pts[k], (pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1], pts[k + 1][2] - pts[k][2]), f)
                ax = norm((pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1], pts[k + 1][2] - pts[k][2]))
                ln = min(1.6, max(.6, L * .7)) * rng.uniform(.85, 1.1) * (1 - .2 * s)
                wd = ln * .9
                up = norm(cross(side_h, ax))
                hint = norm(add(add((0, .8, 0), dir0, .6), up, .25))
                roll = rng.uniform(-.45, .45)
                sd = rot_about(side_h, ax, roll)
                card(leaf, o, ax, sd, ln, wd, rng.randrange(4), hint, rng.random() < .5)
                if lod == 'near' or c % 2 == 0:
                    for sg in (-1, 1):
                        if rng.random() < .25:
                            continue
                        a2 = rot_about(ax, (0, 1, 0), sg * rng.uniform(.6, .95))
                        a2 = norm(add(a2, (0, -1, 0), rng.uniform(.1, .3)))
                        s2 = norm(cross((0, 1, 0), a2))
                        s2 = rot_about(s2, a2, rng.uniform(-.5, .5) + sg * .35)
                        card(leaf, o, a2, s2, ln * .8, wd * .8, rng.randrange(4), hint, sg < 0)
        z += rng.uniform(.36, .52) * (1 - .25 * t)
        whorl += 1
    # leader: crossed vertical sprays at the top
    top = trunk_at(H - .2)
    for k in range(2):
        az = k * math.pi / 2 + .3
        side = (math.cos(az), 0, math.sin(az))
        card(leaf, add(top, (0, -1.4, 0)), (0, 1, 0), side, 1.9, .55, k, (0, 1, 0))
    return H, bark, leaf


# ---------------------------------------------------------------- GLB
def write_glb(path, prims, atlas_png, extras):
    bin_parts, views, accessors = [], [], []

    def push(arr, target=None):
        data = arr.tobytes(); off = sum(len(b) for b in bin_parts)
        pad = (-len(data)) % 4
        bin_parts.append(data + b'\0' * pad)
        v = {'buffer': 0, 'byteOffset': off, 'byteLength': len(data)}
        if target: v['target'] = target
        views.append(v); return len(views) - 1

    meshes_prims = []
    for idx, (m, mat) in enumerate(prims):
        P = np.array(m.p, np.float32); N = np.array(m.n, np.float32); U = np.array(m.uv, np.float32); I = np.array(m.i, np.uint32)
        acc = {}
        for name, arr, typ in (('POSITION', P, 'VEC3'), ('NORMAL', N, 'VEC3'), ('TEXCOORD_0', U, 'VEC2')):
            a = {'bufferView': push(arr, 34962), 'componentType': 5126, 'count': len(arr), 'type': typ}
            if name == 'POSITION': a['min'] = P.min(0).tolist(); a['max'] = P.max(0).tolist()
            accessors.append(a); acc[name] = len(accessors) - 1
        accessors.append({'bufferView': push(I, 34963), 'componentType': 5125, 'count': len(I), 'type': 'SCALAR'})
        meshes_prims.append({'attributes': acc, 'indices': len(accessors) - 1, 'material': mat})
    img_view = push(np.frombuffer(atlas_png, np.uint8))
    doc = {
        'asset': {'version': '2.0', 'generator': 'Kuningriigid V345 make_spruce.py', 'extras': extras},
        'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'mesh': 0, 'name': path.parent.name}],
        'meshes': [{'primitives': meshes_prims}],
        'materials': [
            {'name': 'bark', 'pbrMetallicRoughness': {'baseColorTexture': {'index': 0}, 'baseColorFactor': [1, 1, 1, 1], 'metallicFactor': 0, 'roughnessFactor': .95}},
            {'name': 'needles', 'pbrMetallicRoughness': {'baseColorTexture': {'index': 0}, 'baseColorFactor': [1, 1, 1, 1], 'metallicFactor': 0, 'roughnessFactor': .9}, 'alphaMode': 'MASK', 'alphaCutoff': .4, 'doubleSided': True}],
        'textures': [{'source': 0, 'sampler': 0}], 'samplers': [{'magFilter': 9729, 'minFilter': 9987}],
        'images': [{'bufferView': img_view, 'mimeType': 'image/png'}],
        'buffers': [{'byteLength': sum(len(b) for b in bin_parts)}], 'bufferViews': views, 'accessors': accessors}
    js = json.dumps(doc, separators=(',', ':')).encode(); js += b' ' * ((-len(js)) % 4)
    binary = b''.join(bin_parts)
    out = struct.pack('<4sII', b'glTF', 2, 12 + 8 + len(js) + 8 + len(binary)) + struct.pack('<I4s', len(js), b'JSON') + js + struct.pack('<I4s', len(binary), b'BIN\0') + binary
    path.write_bytes(out)
    return {'bytes': len(out), 'sha256': hashlib.sha256(out).hexdigest(),
            'triangles': sum(len(m.i) // 3 for m, _ in prims)}


atlas = make_atlas()
atlas.save(OUT / 'spruce_atlas.png')
buf = io.BytesIO(); atlas.save(buf, 'PNG', optimize=True); png = buf.getvalue()
records = []
for v in range(args.variants):
    ident = f'spruce_{v + 1:02}'; dest = OUT / ident; dest.mkdir(exist_ok=True)
    rec = {'id': ident, 'species': 'spruce', 'variant': v + 1}
    for lod in ('near', 'mid'):
        H, bark, leaf = spruce(v, lod)
        rec[lod] = write_glb(dest / f'{lod}.glb', [(bark, 0), (leaf, 1)], png, {'height': H, 'lod': lod})
        rec['height'] = H
    records.append(rec)
    print(json.dumps(rec))
(OUT / 'manifest.json').write_text(json.dumps({'approved': False, 'trees': records}, indent=2))
