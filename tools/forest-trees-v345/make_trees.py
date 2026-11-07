"""V345: all game tree species, generated in the style of a dense northern
forest (tall trunks, drooping layered branches, real twig sprays).

Pure Python (numpy + Pillow), no Blender. Writes Sapling-compatible files
into assets/sapling-trees/<kind>_0N/{near,mid}.glb plus manifest.json; the
far level (6 triangles) is baked from near.glb by bake.html + make_far.py.

  python3 tools/forest-trees-v345/make_trees.py [--species spruce,pine]

Budgets per tree: near <= 2000 triangles, mid <= 250.
"""
import argparse, hashlib, io, json, math, random, struct
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
ap = argparse.ArgumentParser()
ap.add_argument('--species', default='spruce,pine,oak,lime,birch,palm')
ap.add_argument('--out', default=str(ROOT / 'assets/sapling-trees'))
args = ap.parse_args()
OUT = Path(args.out); OUT.mkdir(parents=True, exist_ok=True)
BUDGET = {'near': 2000, 'mid': 250}
VARIANTS = 5

A = 1024                 # atlas: four 512 x 448 foliage tiles + bark strip
TILE_H = 448
BARK_Y = 2 * TILE_H      # rows 896..959 bark A, 960..1023 bark B


# ======================================================== textures
def jitter(rng, col, k=.18):
    f = rng.uniform(1 - k, 1 + k)
    return tuple(max(0, min(255, int(c * f))) for c in col)


def poly_leaf(draw, cx, cy, ang, ln, wd, shape, col, vein, s, rng):
    """Leaf silhouette as a polygon, petiole at (cx, cy)."""
    pts = []
    n = 26
    for i in range(n + 1):
        t = i / n                               # 0 base .. 1 tip .. back
        a = t * math.pi
        u = (1 - math.cos(a)) / 2               # 0..1 along the leaf
        if shape == 'oak':
            w = math.sin(u * math.pi) ** .8 * (1 + .28 * math.sin(u * math.pi * 7))
        elif shape == 'lime':
            w = (math.sin(u * math.pi) ** .55) * (1.15 - .5 * u)
        elif shape == 'birch':
            w = math.sin(u * math.pi) ** .9 * (1.25 - .6 * u) * (1 + .05 * math.sin(u * 40))
        else:
            w = math.sin(u * math.pi)
        pts.append((u, w))
    outline = [(u, w) for u, w in pts] + [(u, -w) for u, w in reversed(pts)]
    ca, sa = math.cos(ang), math.sin(ang)
    poly = [(cx + (u * ln) * ca - (v * wd / 2) * sa, cy + (u * ln) * sa + (v * wd / 2) * ca) for u, v in outline]
    draw.polygon(poly, fill=col + (255,))
    draw.line([(cx, cy), (cx + ln * .92 * ca, cy + ln * .92 * sa)], fill=vein + (255,), width=max(1, int(.8 * s)))


def needle_spray(draw, ox, oy, w, h, rng, s, kind):
    """Spruce: bushy drooping spray. Pine: twig with long needle tufts."""
    cy = oy + h * (.30 if kind == 'spruce' else .45)
    axis = [(ox + 6 * s + t / 39 * (w - 20 * s), cy + (t / 39) ** 1.6 * h * (.2 if kind == 'spruce' else .06)) for t in range(40)]
    dark = (52, 84, 44) if kind == 'spruce' else (58, 86, 40)
    fresh = (126, 152, 68) if kind == 'spruce' else (112, 138, 60)

    def twig(bx, by, ang, ln, droop, k=9):
        out = []
        for i in range(k):
            u = i / (k - 1); a = ang * (1 - .3 * u)
            out.append((bx + math.cos(a) * ln * u, by + math.sin(a) * ln * u + droop * ln * u * u))
        return out
    twigs = []
    if kind == 'spruce':
        n = 26
        for i in range(n):
            t = .04 + .93 * i / (n - 1); bx, by = axis[int(t * 39)]
            env = math.sin(min(1, t * 1.1) * math.pi) ** .55 * (1 - .3 * t)
            for side in (-1, 1):
                if rng.random() < .08: continue
                ln = h * .46 * env * rng.uniform(.7, 1.1); ang = math.radians(rng.uniform(40, 60)) * side
                pts = twig(bx, by, ang, ln, rng.uniform(.15, .45)); twigs.append((pts, 1))
                for j in range(2, 8, 2):
                    if rng.random() < .35: continue
                    px, py = pts[j]
                    twigs.append((twig(px, py, ang + side * math.radians(rng.uniform(25, 45)), ln * rng.uniform(.25, .4), .2, 5), 2))
        lens = (9.5, 7.5, 6.0)
    else:
        n = 13
        for i in range(n):
            t = .08 + .88 * i / (n - 1); bx, by = axis[int(t * 39)]
            for side in (-1, 1):
                if rng.random() < .12: continue
                ln = h * .34 * rng.uniform(.7, 1.1)
                twigs.append((twig(bx, by, math.radians(rng.uniform(25, 50)) * side, ln, .1, 6), 1))
        lens = (34.0, 30.0, 26.0)
    wood = (84, 58, 36) if kind == 'pine' else (70, 50, 31)
    for pts, order in [(axis, 0)] + twigs:
        total = len(pts)
        for k in range(total - 1):
            (x0, y0), (x1, y1) = pts[k], pts[k + 1]
            seg = math.hypot(x1 - x0, y1 - y0) or 1
            ux, uy = (x1 - x0) / seg, (y1 - y0) / seg
            steps = max(1, int(seg / ((1.15 if kind == 'spruce' else 1.6) * s)))
            for j in range(steps):
                f = j / steps; px, py = x0 + (x1 - x0) * f, y0 + (y1 - y0) * f
                tip = (k + f) / (total - 1)
                young = tip > .72 and rng.random() < .7
                for _ in range(2 if kind == 'spruce' else 3):
                    side = rng.choice((-1, 1))
                    nl = lens[order] * s * rng.uniform(.6, 1.25) * (1 - .3 * tip)
                    a = math.radians(rng.uniform(30, 85) if kind == 'spruce' else rng.uniform(15, 70)) * side
                    dx = ux * math.cos(a) - uy * math.sin(a); dy = ux * math.sin(a) + uy * math.cos(a) + (.3 if kind == 'spruce' else .1)
                    l = math.hypot(dx, dy)
                    col = jitter(rng, fresh if young else dark, .22)
                    draw.line([(px, py), (px + dx / l * nl, py + dy / l * nl)], fill=col + (255,), width=max(1, int((1.2 if kind == 'spruce' else 1.0) * s)))
        draw.line(pts, fill=wood + (255,), width=max(1, int((2.8, 1.3, .9)[order] * s)))


def leaf_cluster(draw, ox, oy, w, h, rng, s, kind):
    """A leafy twig: woody axis from the left, leaves along side twigs."""
    cfg = {'oak': ((70, 104, 38), 62, .62, 'oak'), 'lime': ((84, 120, 44), 56, .95, 'lime'),
           'birch': ((92, 128, 46), 38, .72, 'birch')}[kind]
    base, size, aspect, shape = cfg
    cy = oy + h * .5
    axis = [(ox + 8 * s + t / 19 * (w - 30 * s), cy + math.sin(t / 19 * 2.4) * h * .05) for t in range(20)]
    draw.line(axis, fill=(80, 62, 44, 255), width=int(3 * s))
    leaves = []
    for i in range(46 if kind != 'birch' else 64):
        t = rng.uniform(.08, 1.0); bx, by = axis[min(19, int(t * 19))]
        side = rng.choice((-1, 1))
        tw = rng.uniform(.03, .2) * h
        a = math.radians(rng.uniform(25, 70)) * side + (math.radians(25) if kind == 'birch' else 0)
        tx, ty = bx + math.cos(a) * tw, by + math.sin(a) * tw
        draw.line([(bx, by), (tx, ty)], fill=(86, 66, 46, 255), width=int(1.4 * s))
        for k in range(3 if kind != 'birch' else 4):
            la = a + rng.uniform(-.9, .9) + (math.radians(40) if kind == 'birch' else 0)
            ln = size * s * rng.uniform(.75, 1.2) * (.8 + .4 * t)
            leaves.append((tx, ty, la, ln))
    rng.shuffle(leaves)
    for tx, ty, la, ln in leaves:
        light = rng.random()
        col = jitter(rng, tuple(int(c * (.78 + .5 * light)) for c in base), .12)
        vein = tuple(int(c * 1.18) for c in col)
        poly_leaf(draw, tx, ty, la, ln, ln * aspect, shape, col, vein, s, rng)


def palm_frond(draw, ox, oy, w, h, rng, s):
    """Pinnate frond, rachis along the tile from left to right."""
    cy = oy + h * .5
    rach = [(ox + 6 * s + t / 29 * (w - 14 * s), cy + (t / 29) ** 2 * h * .08) for t in range(30)]
    for i in range(70):
        t = .03 + .96 * i / 69; bx, by = rach[min(29, int(t * 29))]
        for side in (-1, 1):
            ln = h * .46 * math.sin(min(1, t * 1.05) * math.pi) ** .45 * rng.uniform(.85, 1.05)
            a = math.radians(rng.uniform(55, 75)) * side
            ex, ey = bx + math.cos(a) * ln, by + math.sin(a) * ln + ln * .22
            col = jitter(rng, (70, 112, 44), .15)
            draw.polygon([(bx - 3 * s, by - 2 * s), (ex - 2 * s, ey), (ex + 2 * s, ey + 1 * s), (bx + 5 * s, by + 2 * s)], fill=col + (255,))
            draw.line([(bx, by), (ex, ey)], fill=tuple(int(c * 1.2) for c in col) + (255,), width=max(1, int(.6 * s)))
    draw.line(rach, fill=(110, 104, 58, 255), width=int(3 * s))


def bark_rows(kind, rng):
    w, h = A, (A - BARK_Y) // 2
    x = np.arange(w, dtype=np.float32)
    y = np.arange(h, dtype=np.float32)[:, None]
    noise = np.random.default_rng(hash(kind) & 0xffff).random((h, w)).astype(np.float32)

    def plates(k_max, seed):
        r = random.Random(seed); p = np.zeros(w, np.float32)
        for k in range(1, k_max):
            p += np.sin(x / w * math.tau * k + r.uniform(0, 6.3)) / k ** .9
        return (p - p.min()) / (p.max() - p.min())

    def shade(v, dark, light):
        dark, light = np.array(dark, np.float32), np.array(light, np.float32)
        return dark + (light - dark) * np.clip(v, 0, 1)[..., None]
    if kind in ('spruce', 'pine', 'oak', 'lime'):
        p = plates(40 if kind != 'lime' else 18, 7)[None, :]
        fiss = np.clip((p - .35) * 3, 0, 1)
        v = (.6 * p + .25 * np.sin(y / h * math.pi * 6 + p * 9) * .5 + .25 * noise) * (.35 + .65 * fiss)
        cols = {'spruce': ((30, 26, 23), (104, 94, 82)), 'pine': ((36, 28, 22), (112, 92, 72)),
                'oak': ((28, 25, 21), (98, 90, 78)), 'lime': ((44, 42, 38), (122, 116, 104))}[kind]
        a = shade(v, *cols)
        b = a.copy()
        if kind == 'pine':   # upper trunk of a Scots pine: thin orange flakes
            v2 = .55 + .3 * plates(30, 11)[None, :] + .2 * noise
            b = shade(v2, (120, 62, 32), (206, 126, 70))
    elif kind == 'birch':
        lent = np.zeros((h, w), np.float32)
        r = random.Random(3)
        for _ in range(140):
            cx, cy, ln = r.uniform(0, w), r.uniform(0, h), r.uniform(10, 60)
            lent += np.exp(-((y - cy) / 1.6) ** 2) * (np.abs(x - cx) < ln)
        v = np.clip(1 - .9 * np.clip(lent, 0, 1) - .12 * noise, 0, 1)
        b = shade(v, (24, 22, 20), (226, 222, 210))     # upper: white with black marks
        p = plates(30, 5)[None, :]
        a = shade(.3 * p + .3 * noise, (32, 30, 28), (120, 116, 106))   # lower: dark, cracked
    else:                    # palm: rings of old leaf bases
        rings = .5 + .5 * np.sin(y / h * math.tau * 3) ** 3
        v = .45 * rings + .3 * noise + .25 * plates(10, 9)[None, :]
        a = shade(v, (70, 58, 44), (150, 132, 102)); b = a.copy()
    img = np.concatenate([a, b], 0)
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), 'RGB')


def make_atlas(kind):
    rng = random.Random(345 + sum(map(ord, kind)))
    s = 2
    big = Image.new('RGBA', (A * s, BARK_Y * s), (0, 0, 0, 0)); d = ImageDraw.Draw(big)
    for tile in range(4):
        ox, oy = (tile % 2) * 512 * s, (tile // 2) * TILE_H * s
        if kind in ('spruce', 'pine'): needle_spray(d, ox, oy, 512 * s, TILE_H * s, rng, s, kind)
        elif kind == 'palm': palm_frond(d, ox, oy, 512 * s, TILE_H * s, rng, s)
        else: leaf_cluster(d, ox, oy, 512 * s, TILE_H * s, rng, s, kind)
    fol = big.resize((A, BARK_Y), Image.LANCZOS)
    rgb, alpha = fol.convert('RGB'), fol.getchannel('A')
    fill = rgb
    for r in (2, 6, 16):  # colour bleed into transparent texels
        blur = np.asarray(rgb.filter(ImageFilter.GaussianBlur(r)), np.float32)
        wa = np.asarray(alpha.filter(ImageFilter.GaussianBlur(r)), np.float32)[..., None] / 255
        fill = Image.composite(fill, Image.fromarray(np.clip(blur / np.maximum(wa, 1e-3), 0, 255).astype(np.uint8)), alpha.point(lambda v: 255 if v > 8 else 0))
    atlas = Image.new('RGBA', (A, A), (0, 0, 0, 255))
    atlas.paste(Image.merge('RGBA', (*fill.split(), alpha)), (0, 0))
    atlas.paste(bark_rows(kind, rng).convert('RGBA'), (0, BARK_Y))
    return atlas


def tile_uv(tile, u, v):
    x0, y0 = (tile % 2) * 512, (tile // 2) * TILE_H
    return ((x0 + 4 + u * 504) / A, (y0 + 4 + v * (TILE_H - 8)) / A)


def bark_uv(u, v, row=0):
    y0 = BARK_Y + row * (A - BARK_Y) // 2
    return (u, (y0 + 2 + v * ((A - BARK_Y) // 2 - 4)) / A)


# ======================================================== geometry
class Mesh:
    def __init__(self): self.p, self.n, self.uv, self.i = [], [], [], []
    def vert(self, p, n, uv): self.p.append(p); self.n.append(n); self.uv.append(uv); return len(self.p) - 1
    def tri(self, a, b, c): self.i += [a, b, c]
    def tris(self): return len(self.i) // 3


def norm(v):
    l = math.sqrt(sum(c * c for c in v)) or 1
    return tuple(c / l for c in v)


def add(a, b, k=1): return tuple(x + y * k for x, y in zip(a, b))
def sub(a, b): return tuple(x - y for x, y in zip(a, b))
def cross(a, b): return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])
def dot(a, b): return sum(x * y for x, y in zip(a, b))


def rot_about(v, axis, ang):
    axis = norm(axis); c, s = math.cos(ang), math.sin(ang); d = dot(v, axis); cr = cross(axis, v)
    return tuple(v[i] * c + cr[i] * s + axis[i] * d * (1 - c) for i in range(3))


def tube(m, path, radii, sides, ulen=1.3, row=lambda p: 0):
    rings, vacc = [], 0.0
    for k, (p, r) in enumerate(zip(path, radii)):
        a, b = path[max(0, k - 1)], path[min(len(path) - 1, k + 1)]
        t = norm(sub(b, a)); ref = (0, 0, 1) if abs(t[1]) > .9 else (0, 1, 0)
        u = norm(cross(t, ref)); w = norm(cross(t, u))
        if k: vacc += math.dist(path[k - 1], p) / ulen
        vv = vacc % 2; vv = vv if vv <= 1 else 2 - vv
        ring = []
        for s in range(sides + 1):
            ang = s / sides * math.tau
            d = add(tuple(c * math.cos(ang) for c in u), tuple(c * math.sin(ang) for c in w))
            q = add(p, d, r); q = (q[0], max(0.0, q[1]), q[2])
            ring.append(m.vert(q, d, bark_uv(s / sides, vv, row(p))))
        rings.append(ring)
    for r0, r1 in zip(rings, rings[1:]):
        for s in range(sides):
            m.tri(r0[s], r1[s + 1], r1[s]); m.tri(r0[s], r0[s + 1], r1[s + 1])


def card(m, origin, axis, side, length, width, tile, hint, flip=False, u0=0., u1=1.):
    ids = []
    for u, v in [(0, -.5), (1, -.5), (1, .5), (0, .5)]:
        p = add(add(origin, axis, u * length), side, v * width); p = (p[0], max(0.0, p[1]), p[2])
        ids.append(m.vert(p, hint, tile_uv(tile, u0 + (u1 - u0) * u, (1 - (v + .5)) if flip else (v + .5))))
    # Front face toward the shading normal; three.js flips back-face normals,
    # so a light under the crown still lights the underside.
    if dot(cross(axis, side), hint) >= 0: m.tri(ids[0], ids[1], ids[2]); m.tri(ids[0], ids[2], ids[3])
    else: m.tri(ids[0], ids[2], ids[1]); m.tri(ids[0], ids[3], ids[2])


def cluster(m, c, size, hint, rng, crossed=True):
    """Leaf cluster: one or two crossed cards around point c."""
    ax = norm((rng.uniform(-1, 1), rng.uniform(-.35, .35), rng.uniform(-1, 1)))
    sd = norm(cross(ax, (0, 1, 0))); sd = rot_about(sd, ax, rng.uniform(-.6, .6))
    o = add(c, ax, -size / 2)
    card(m, o, ax, sd, size, size * .88, rng.randrange(4), hint, rng.random() < .5)
    if crossed:
        sd2 = rot_about(sd, ax, math.pi / 2)
        card(m, o, ax, sd2, size, size * .88, rng.randrange(4), hint, rng.random() < .5)


# ---------------------------------------------------- conifers
CONIFER = {
    'spruce': [(16.5, .28), (19.0, .34), (14.0, .22), (21.0, .38), (17.5, .30)],
    'pine':   [(17.0, .58), (19.5, .64), (15.0, .55), (21.0, .66), (18.0, .60)]}


def conifer(kind, variant, lod, density):
    rng = random.Random(9100 + variant * 31 + (0 if kind == 'spruce' else 500))
    pick = random.Random(77 + variant)
    h0, cb = CONIFER[kind][variant]
    H = h0 * rng.uniform(.97, 1.03); crown_base = H * cb
    r0 = (.07 + H * .0048) * (1.25 if kind == 'pine' else 1)
    lean = (rng.uniform(-.3, .3), rng.uniform(-.3, .3)) if kind == 'spruce' else (rng.uniform(-.9, .9), rng.uniform(-.9, .9))
    bark, leaf = Mesh(), Mesh(); near = lod == 'near'
    trunk_at = lambda z: (lean[0] * (z / H) ** 2 + .05 * math.sin(z * 1.3 + variant), z, lean[1] * (z / H) ** 2 + .05 * math.cos(z * 1.1 + variant))
    radius_at = lambda z: r0 * (1 - z / H) ** .85 + .018 + r0 * .35 * math.exp(-z / .35)
    nz = 9 if near else 4
    zs = [H * (k / nz) ** 1.15 for k in range(nz + 1)]
    row = (lambda p: 1 if p[1] > H * .45 else 0) if kind == 'pine' else (lambda p: 0)
    tube(bark, [trunk_at(z) for z in zs], [radius_at(z) for z in zs], 6 if near else 4, row=row)
    if near:
        for k in range(6):
            z = rng.uniform(1.4, crown_base); az = rng.uniform(0, math.tau); d = (math.cos(az), 0, math.sin(az))
            base = add(trunk_at(z), d, radius_at(z) * .8); ln = rng.uniform(.3, .9) * (z / crown_base) ** .5
            tube(bark, [base, add(add(base, d, ln), (0, -1, 0), ln * rng.uniform(.15, .5))], [.022, .006], 3, row=row)
    z, whorl, golden = crown_base, 0, math.radians(137.5)
    max_len = H * (.22 if kind == 'spruce' else .2)
    while z < H - .5:
        t = (z - crown_base) / (H - crown_base)
        n = rng.randint(4, 6) if kind == 'spruce' else rng.randint(3, 5)
        for b in range(n):
            az = whorl * golden + b * math.tau / n + rng.uniform(-.35, .35)
            if kind == 'spruce':
                env = (1 - t) ** .95 * (.82 + .18 * math.sin(t * math.pi * 1.7))
                pitch0, droop = math.radians(18 * t - 4 + rng.uniform(-6, 6)), math.radians((34 - 26 * t) * rng.uniform(.8, 1.2))
            else:   # pine: flat-topped, irregular crown, branches rising
                env = (math.sin(min(1, t * 1.25) * math.pi * .5 + .35) * (1 - t * .55)) * rng.uniform(.6, 1.1)
                pitch0, droop = math.radians(rng.uniform(15, 40)), math.radians(rng.uniform(5, 25))
            L = max(.35, max_len * env * rng.uniform(.8, 1.12))
            rolls = iter([rng.random() for _ in range(160)])
            dir0 = (math.cos(az), 0, math.sin(az)); start = add(trunk_at(z), dir0, radius_at(z) * .7)
            pts, seg = [start], 4
            for k in range(1, seg + 1):
                p = pitch0 - droop * (k / seg) ** 1.6
                pts.append(add(pts[-1], (math.cos(az) * math.cos(p), math.sin(p), math.sin(az) * math.cos(p)), L / seg))
            side_h = (-math.sin(az), 0, math.cos(az))
            up_hint = lambda ax: norm(add(add((0, .8, 0), dir0, .6), norm(cross(side_h, ax)), .25))
            if near:
                if L > 2.2: tube(bark, pts[::2], [max(.012, .05 * L / max_len) + .006, .02, .006], 3, row=row)
                count = max(1, round(L / 1.05)) if kind == 'spruce' else max(2, round(L / .55))
                for c in range(count):
                    if pick.random() > density and c: continue
                    s = (.2 + .78 * c / count if kind == 'spruce' else .45 + .55 * c / count) + (next(rolls) - .5) * .08
                    k = min(seg - 1, int(s * seg)); f = s * seg - k
                    dv = sub(pts[k + 1], pts[k]); o = add(pts[k], dv, f); ax = norm(dv)
                    ln = (min(2.1, max(.8, L * .8)) if kind == 'spruce' else min(2.3, max(1.1, L * .8))) * (.85 + .25 * next(rolls)) * (1 - .2 * s)
                    hint = up_hint(ax)
                    card(leaf, o, ax, rot_about(side_h, ax, (next(rolls) - .5) * .9), ln, ln * .9, int(next(rolls) * 4) % 4, hint, next(rolls) < .5)
                    for sg in (-1, 1):
                        if next(rolls) < .3 or pick.random() > density: continue
                        a2 = norm(add(rot_about(ax, (0, 1, 0), sg * (.6 + .35 * next(rolls))), (0, -1, 0), .1 + .2 * next(rolls)))
                        s2 = rot_about(norm(cross((0, 1, 0), a2)), a2, (next(rolls) - .5) + sg * .35)
                        card(leaf, o, a2, s2, ln * .8, ln * .72, int(next(rolls) * 4) % 4, hint, sg < 0)
            else:
                if pick.random() > density: continue
                ax = norm(sub(pts[-1], pts[0])); hint = up_hint(ax)
                o = start if kind == 'spruce' else add(start, ax, L * .3)
                card(leaf, o, ax, rot_about(side_h, ax, (next(rolls) - .5) * .5), L * (1.12 if kind == 'spruce' else .85), L * 1.05, int(next(rolls) * 4) % 4, hint)
        z += (rng.uniform(.5, .7) * (1 - .25 * t)) if kind == 'spruce' else rng.uniform(.4, .7)
        whorl += 1
    top = trunk_at(H - .2)
    for k in range(2):
        az = k * math.pi / 2 + .3
        card(leaf, add(top, (0, -1.4, 0)), (0, 1, 0), (math.cos(az), 0, math.sin(az)), 1.9, .7, k, (0, 1, 0))
    return H, bark, leaf


# ---------------------------------------------------- broadleaves
BROAD = {  # height, fork height fraction, limbs, limb angle from vertical, crown width factor
    'oak':   [(15, .30, 6, 44, .72), (17, .26, 7, 48, .8), (13, .34, 5, 40, .68), (18, .28, 7, 50, .82), (16, .32, 6, 46, .76)],
    'lime':  [(17, .24, 7, 35, .62), (19, .22, 8, 38, .66), (15, .26, 6, 33, .58), (20, .2, 8, 40, .7), (18, .24, 7, 36, .64)],
    'birch': [(16, .32, 6, 28, .42), (18, .36, 7, 30, .45), (14, .3, 5, 26, .4), (19, .38, 7, 32, .47), (17, .34, 6, 29, .44)]}


def broadleaf(kind, variant, lod, density):
    rng = random.Random(4100 + variant * 53 + sum(map(ord, kind)))
    pick = random.Random(91 + variant)
    H, fork, limbs, spread, widthf = BROAD[kind][variant]
    H *= rng.uniform(.96, 1.04)
    bark, leaf = Mesh(), Mesh(); near = lod == 'near'
    r0 = {'oak': .045, 'lime': .032, 'birch': .022}[kind] * H
    zf = H * fork
    lean = (rng.uniform(-.4, .4), rng.uniform(-.4, .4))
    row = (lambda p: 1 if p[1] > 1.6 else 0) if kind == 'birch' else (lambda p: 0)
    # trunk: up to the fork; a central leader continues for lime and birch
    top_z = zf if kind == 'oak' else H * .82
    nz = 6 if near else 3
    path = [(lean[0] * (k / nz) ** 2 * top_z / H, top_z * k / nz, lean[1] * (k / nz) ** 2 * top_z / H) for k in range(nz + 1)]
    radii = [r0 * (1 - .55 * k / nz) + r0 * .4 * math.exp(-path[k][1] / .4) for k in range(nz + 1)]
    tube(bark, path, radii, 6 if near else 4, row=row)
    crown_c = (lean[0] * .6, zf + (H - zf) * .52, lean[1] * .6)
    crown_r = (H - zf) * .52
    hint_at = lambda p: norm(add(sub(p, crown_c), (0, crown_r * .6, 0)))
    for li in range(limbs):
        az = li / limbs * math.tau + rng.uniform(-.3, .3)
        base_z = zf + (0 if kind == 'oak' else rng.uniform(0, (top_z - zf) * .9))
        tlen = 1 - (base_z - zf) / max(1e-3, H - zf)
        base = (lean[0] * (base_z / H) ** 2, base_z, lean[1] * (base_z / H) ** 2)
        ang = math.radians(spread * rng.uniform(.85, 1.15) * (1 if kind == 'oak' else (.6 + .6 * tlen)))
        L = (H - zf) * widthf * rng.uniform(.75, 1.05) * (1 if kind == 'oak' else (.45 + .65 * tlen))
        segs = 4 if near else 2
        pts = [base]
        for k in range(1, segs + 1):
            s = k / segs
            a = ang + (math.radians(rng.uniform(-14, 14)) if kind == 'oak' else 0) + (math.radians(28) * s * s if kind == 'birch' else 0)
            d = (math.sin(a) * math.cos(az), math.cos(a), math.sin(a) * math.sin(az))
            pts.append(add(pts[-1], d, L / segs))
        lr = radii[-1] * (.8 if kind == 'oak' else .55)
        tube(bark, pts, [lr * (1 - .75 * k / segs) + .015 for k in range(segs + 1)], 4 if near else 3, row=row)
        # secondary branches and leaf clusters
        nsec = (4 if kind == 'oak' else 3) if near else 1
        for sb in range(nsec):
            s = .35 + .6 * (sb + rng.random() * .5) / nsec
            k = min(segs - 1, int(s * segs)); f = s * segs - k
            o = add(pts[k], sub(pts[k + 1], pts[k]), f)
            out = norm(add(sub(o, (crown_c[0], o[1], crown_c[2])), (0, .4 if kind != 'birch' else -.6, 0)))
            out = rot_about(out, (0, 1, 0), rng.uniform(-.7, .7))
            sl = L * rng.uniform(.35, .55)
            tip = add(o, out, sl)
            if near:
                tube(bark, [o, tip], [lr * .45 + .01, .008], 3, row=row)
            ncl = (3 if kind != 'birch' else 4) if near else 2
            for c in range(ncl):
                if pick.random() > density and c: continue
                q = add(o, out, sl * (.35 + .65 * c / max(1, ncl - 1)))
                q = add(q, (rng.uniform(-.4, .4), rng.uniform(-.3, .3) - (.6 if kind == 'birch' else 0), rng.uniform(-.4, .4)))
                size = {'oak': 2.6, 'lime': 2.4, 'birch': 2.1}[kind] * rng.uniform(.85, 1.15) * (1.55 if not near else 1)
                cluster(leaf, q, size, hint_at(q), rng, crossed=near or c == 0)
        if near and pick.random() <= density:   # cluster at the limb tip
            cluster(leaf, pts[-1], {'oak': 2.8, 'lime': 2.6, 'birch': 2.2}[kind], hint_at(pts[-1]), rng)
    # Crown fill: clusters spread over an ellipsoid shell give the full,
    # closed silhouette of a real crown at every viewing angle.
    shell = {'oak': (.62, .42), 'lime': (.4, .56), 'birch': (.3, .55)}[kind]
    rx, ry = (H - zf) * shell[0], (H - zf) * shell[1]
    fill = (150 if near else 46) if kind != 'birch' else (95 if near else 34)
    golden = math.pi * (3 - math.sqrt(5))
    for i in range(fill):
        if pick.random() > density: continue
        yy = 1 - (i + .5) / fill * (1.75 if kind != 'birch' else 1.9)
        rr = math.sqrt(max(0, 1 - yy * yy)); th = i * golden
        k = rng.uniform(.72, 1.0)
        q = (crown_c[0] + math.cos(th) * rr * rx * k, crown_c[1] + yy * ry * k, crown_c[2] + math.sin(th) * rr * rx * k)
        size = {'oak': 3.0, 'lime': 2.7, 'birch': 1.9}[kind] * rng.uniform(.85, 1.15) * (1.7 if not near else 1)
        cluster(leaf, q, size, hint_at(q), rng, crossed=near)
    if kind != 'oak':   # crown top
        q = (path[-1][0], top_z + .6, path[-1][2])
        cluster(leaf, q, 2.4 * (1.3 if not near else 1), (0, 1, 0), rng)
    return H, bark, leaf


# ---------------------------------------------------- palm
PALM = [(11, .35), (13, .5), (9.5, .25), (14, .6), (12, .42)]


def palm(variant, lod, density):
    rng = random.Random(7300 + variant * 19); pick = random.Random(17 + variant)
    H, bend = PALM[variant]; H *= rng.uniform(.96, 1.04)
    az0 = rng.uniform(0, math.tau); near = lod == 'near'
    bark, leaf = Mesh(), Mesh()
    nz = 8 if near else 4
    trunk = [(math.cos(az0) * bend * (k / nz) ** 2 * H * .25, H * k / nz, math.sin(az0) * bend * (k / nz) ** 2 * H * .25) for k in range(nz + 1)]
    tube(bark, trunk, [.24 * (1 - .35 * k / nz) + .12 * math.exp(-trunk[k][1] / .5) for k in range(nz + 1)], 7 if near else 4, ulen=.9)
    top = trunk[-1]
    fronds = 18 if near else 10
    for f in range(fronds):
        if pick.random() > density and f % 3: continue
        az = f / fronds * math.tau + rng.uniform(-.2, .2)
        lift = math.radians(rng.uniform(-10, 45))
        L = rng.uniform(5.0, 6.4)
        segs = 3 if near else 2
        pts = [top]
        for k in range(1, segs + 1):
            p = lift - math.radians(55) * (k / segs) ** 1.4
            pts.append(add(pts[-1], (math.cos(az) * math.cos(p), math.sin(p), math.sin(az) * math.cos(p)), L / segs))
        side = (-math.sin(az), 0, math.cos(az)); tile = rng.randrange(4)
        roll = rng.uniform(-.35, .35)
        for k in range(segs):
            ax = norm(sub(pts[k + 1], pts[k])); sd = rot_about(side, ax, roll)
            hint = norm(add(cross(ax, sd), (0, .6, 0)))
            if hint[1] < 0: hint = tuple(-c for c in hint)
            card(leaf, pts[k], ax, sd, math.dist(pts[k], pts[k + 1]), 2.3 * (1 - .25 * k / segs), tile, hint, False, k / segs, (k + 1) / segs)
    return H, bark, leaf


def build(kind, variant, lod, density):
    if kind in CONIFER: return conifer(kind, variant, lod, density)
    if kind in BROAD: return broadleaf(kind, variant, lod, density)
    return palm(variant, lod, density)


def budgeted(kind, variant, lod):
    density = 1.0
    while True:
        H, bark, leaf = build(kind, variant, lod, density)
        if bark.tris() + leaf.tris() <= BUDGET[lod] or density < .12:
            return H, bark, leaf, density
        density *= .93


# ======================================================== GLB
def write_glb(path, prims, png, extras):
    parts, views, accessors = [], [], []

    def push(data, target=None):
        off = sum(len(b) for b in parts); parts.append(data + b'\0' * ((-len(data)) % 4))
        v = {'buffer': 0, 'byteOffset': off, 'byteLength': len(data)}
        if target: v['target'] = target
        views.append(v); return len(views) - 1
    mp = []
    for m, mat in prims:
        P = np.array(m.p, np.float32); N = np.array(m.n, np.float32); U = np.array(m.uv, np.float32); I = np.array(m.i, np.uint16)
        acc = {}
        for name, arr, typ in (('POSITION', P, 'VEC3'), ('NORMAL', N, 'VEC3'), ('TEXCOORD_0', U, 'VEC2')):
            a = {'bufferView': push(arr.tobytes(), 34962), 'componentType': 5126, 'count': len(arr), 'type': typ}
            if name == 'POSITION': a['min'] = P.min(0).tolist(); a['max'] = P.max(0).tolist()
            accessors.append(a); acc[name] = len(accessors) - 1
        accessors.append({'bufferView': push(I.tobytes(), 34963), 'componentType': 5123, 'count': len(I), 'type': 'SCALAR'})
        mp.append({'attributes': acc, 'indices': len(accessors) - 1, 'material': mat})
    img = push(png)
    doc = {'asset': {'version': '2.0', 'generator': 'Kuningriigid V345 make_trees.py', 'extras': extras},
           'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'mesh': 0, 'name': path.parent.name}], 'meshes': [{'primitives': mp}],
           'materials': [
               {'name': 'bark', 'pbrMetallicRoughness': {'baseColorTexture': {'index': 0}, 'baseColorFactor': [1, 1, 1, 1], 'metallicFactor': 0, 'roughnessFactor': .95}},
               {'name': 'foliage', 'pbrMetallicRoughness': {'baseColorTexture': {'index': 0}, 'baseColorFactor': [1, 1, 1, 1], 'metallicFactor': 0, 'roughnessFactor': .9}, 'alphaMode': 'MASK', 'alphaCutoff': .4, 'doubleSided': True}],
           'textures': [{'source': 0, 'sampler': 0}], 'samplers': [{'magFilter': 9729, 'minFilter': 9987}],
           'images': [{'bufferView': img, 'mimeType': 'image/png'}],
           'buffers': [{'byteLength': sum(len(b) for b in parts)}], 'bufferViews': views, 'accessors': accessors}
    js = json.dumps(doc, separators=(',', ':')).encode(); js += b' ' * ((-len(js)) % 4)
    binary = b''.join(parts)
    data = struct.pack('<4sII', b'glTF', 2, 28 + len(js) + len(binary)) + struct.pack('<I4s', len(js), b'JSON') + js + struct.pack('<I4s', len(binary), b'BIN\0') + binary
    path.write_bytes(data)
    return {'triangles': sum(m.tris() for m, _ in prims), 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


manifest_path = OUT / 'manifest.json'
manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {'trees': []}
keep = {t['id']: t for t in manifest.get('trees', [])}
for kind in args.species.split(','):
    atlas = make_atlas(kind)
    small = atlas.quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
    buf = io.BytesIO(); small.save(buf, 'PNG', optimize=True); png = buf.getvalue()
    (OUT / f'{kind}_foliage.png').write_bytes(png)
    for v in range(VARIANTS):
        ident = f'{kind}_{v + 1:02}'; dest = OUT / ident; dest.mkdir(exist_ok=True)
        for old in dest.iterdir():   # previous Sapling/Blender files
            if old.suffix in ('.blend', '.blend1') or old.name.startswith('view_') or old.name == 'recipe.json':
                old.unlink()
        rec = {'id': ident, 'species': kind, 'variant': v + 1, 'generator': 'tools/forest-trees-v345/make_trees.py'}
        for lod in ('near', 'mid'):
            H, bark, leaf, density = budgeted(kind, v, lod)
            rec[lod] = write_glb(dest / f'{lod}.glb', [(bark, 0), (leaf, 1)], png, {'height': H, 'lod': lod})
            rec[lod]['density'] = round(density, 3)
            if lod == 'near':
                P = np.array(bark.p + leaf.p, np.float32); lo, hi = P.min(0), P.max(0)
                # Sapling manifests store Blender Z-up bounds: [x, -z, y].
                rec['boundsZUp'] = [[float(lo[0]), float(-hi[2]), float(lo[1])], [float(hi[0]), float(-lo[2]), float(hi[1])]]
        if ident in keep and 'far' in keep[ident]: rec['far'] = keep[ident]['far']
        keep[ident] = rec
        print(ident, 'near', rec['near']['triangles'], rec['near']['density'], 'mid', rec['mid']['triangles'], rec['mid']['density'], 'H', round(rec['boundsZUp'][1][2], 1), flush=True)
order = ['pine', 'spruce', 'oak', 'lime', 'birch', 'palm']
trees = sorted(keep.values(), key=lambda t: (order.index(t['species']) if t['species'] in order else 99, t['id']))
manifest_path.write_text(json.dumps({'approved': True, 'generator': 'V345 make_trees.py', 'trees': trees}, indent=2))
