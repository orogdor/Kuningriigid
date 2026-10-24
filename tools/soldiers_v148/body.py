"""Anatomical human body for V148 soldiers (quad lofts, rigid sections).

Proportions follow a 1.76 m adult male: head 0.235 m (7.5 heads), shoulder
joints 0.372 m apart, hip joints 0.18 m apart, upper arm 0.30 m, forearm
0.265 m, fist 0.11 m, thigh 0.435 m, shin 0.41 m, foot 0.27 m.
"""
import math
import numpy as np
from geom import (vertical_loft, ring_loft, section_ring, ellipsoid, path_loft,
                  smoothstep, lerp, mat_t, mat_rx, mat_ry, mat_rz, mat_s, norm)

# (y, rx, zfront, zback, dx, dz) – model space, bind pose
PELVIS = [(0.835, 0.110, 0.070, 0.080, 0, 0.002), (0.860, 0.148, 0.088, 0.104, 0, 0.0),
          (0.900, 0.167, 0.097, 0.118, 0, -0.002), (0.950, 0.170, 0.095, 0.112, 0, -0.002),
          (1.000, 0.158, 0.092, 0.098, 0, 0.0), (1.060, 0.148, 0.092, 0.090, 0, 0.0),
          (1.115, 0.150, 0.096, 0.090, 0, 0.0), (1.135, 0.120, 0.080, 0.075, 0, 0.0)]
CHEST = [(1.020, 0.120, 0.075, 0.075, 0, 0), (1.040, 0.150, 0.092, 0.092, 0, 0),
         (1.100, 0.150, 0.097, 0.090, 0, 0), (1.180, 0.160, 0.108, 0.093, 0, 0),
         (1.260, 0.170, 0.118, 0.099, 0, 0), (1.330, 0.177, 0.117, 0.103, 0, -0.003),
         (1.395, 0.182, 0.106, 0.102, 0, -0.006), (1.435, 0.180, 0.090, 0.094, 0, -0.008),
         (1.460, 0.160, 0.074, 0.082, 0, -0.008), (1.480, 0.112, 0.062, 0.070, 0, -0.008),
         (1.496, 0.068, 0.054, 0.060, 0, -0.006), (1.507, 0.040, 0.035, 0.040, 0, -0.006)]
# limb tables are bone-local: (y, rx, rzf, rzb, dx, dz)
UPPER_ARM = [(0.040, 0.026, 0.030, 0.030, -0.012, 0), (0.020, 0.050, 0.053, 0.051, -0.004, 0),
             (-0.020, 0.057, 0.057, 0.054, 0.002, 0), (-0.090, 0.049, 0.051, 0.050, 0.003, -0.001),
             (-0.165, 0.045, 0.050, 0.046, 0.004, -0.003), (-0.245, 0.040, 0.040, 0.040, 0.006, -0.005),
             (-0.295, 0.037, 0.036, 0.037, 0.007, -0.006), (-0.320, 0.024, 0.024, 0.024, 0.007, -0.006)]
FOREARM = [(0.030, 0.024, 0.024, 0.024, 0, 0), (0.012, 0.037, 0.037, 0.038, 0, 0),
           (-0.035, 0.043, 0.041, 0.040, 0, 0.001), (-0.085, 0.043, 0.041, 0.038, 0, 0.002),
           (-0.180, 0.033, 0.030, 0.028, 0, 0.003), (-0.262, 0.026, 0.022, 0.022, 0, 0.004)]
FIST = [(-0.262, 0.020, 0.025, 0.024, 0, 0.004), (-0.288, 0.024, 0.038, 0.035, 0, 0.006),
        (-0.318, 0.028, 0.044, 0.040, 0, 0.008), (-0.343, 0.030, 0.042, 0.036, 0, 0.009),
        (-0.362, 0.024, 0.032, 0.028, 0, 0.009), (-0.373, 0.012, 0.017, 0.015, 0, 0.009)]
THIGH = [(0.075, 0.050, 0.055, 0.060, -0.004, 0), (0.035, 0.084, 0.084, 0.094, -0.002, 0),
         (-0.050, 0.083, 0.083, 0.088, 0.000, 0.002), (-0.170, 0.071, 0.073, 0.070, 0.002, 0.004),
         (-0.295, 0.059, 0.061, 0.056, 0.004, 0.006), (-0.395, 0.050, 0.053, 0.048, 0.006, 0.006),
         (-0.450, 0.042, 0.040, 0.042, 0.007, 0.004), (-0.470, 0.026, 0.026, 0.026, 0.007, 0.004)]
SHIN = [(0.035, 0.040, 0.044, 0.040, 0, 0), (0.010, 0.049, 0.052, 0.049, 0, 0),
        (-0.050, 0.050, 0.048, 0.060, 0, -0.002), (-0.130, 0.050, 0.045, 0.063, 0, -0.004),
        (-0.250, 0.040, 0.040, 0.043, 0, -0.004), (-0.360, 0.032, 0.034, 0.034, 0, -0.004),
        (-0.420, 0.030, 0.032, 0.032, 0, -0.004)]
# foot rows: (z, half width, top y, bottom y) in shin-local space (ground = -0.49)
FOOT = [(-0.072, 0.024, -0.438, -0.488), (-0.058, 0.034, -0.408, -0.490), (0.000, 0.039, -0.410, -0.490),
        (0.070, 0.045, -0.438, -0.490), (0.135, 0.046, -0.458, -0.490), (0.180, 0.039, -0.468, -0.489),
        (0.200, 0.024, -0.475, -0.486), (0.207, 0.010, -0.479, -0.484)]
GROUND_LOCAL = -0.490


def prof(table, y):
    """Interpolate a profile table (sorted either ascending or descending in y)."""
    t = sorted(table, key=lambda r: r[0])
    if y <= t[0][0]:
        return t[0]
    if y >= t[-1][0]:
        return t[-1]
    for a, b in zip(t, t[1:]):
        if a[0] <= y <= b[0]:
            k = (y - a[0]) / (b[0] - a[0])
            return tuple([y] + [lerp(a[i], b[i], k) for i in range(1, len(a))])


def banded(table, cuts, grow=0.0, ys=None):
    """Return rows of table resampled with extra rings at `cuts`, grown by `grow`."""
    base = [r[0] for r in table]
    lo, hi = min(base), max(base)
    allys = sorted(set(base + [c for c in cuts if lo < c < hi] + ([y for y in (ys or []) if lo < y < hi])))
    desc = table[0][0] > table[-1][0]
    if desc:
        allys = allys[::-1]
    out = []
    for y in allys:
        r = list(prof(table, y))
        r[1] += grow
        r[2] += grow
        r[3] += grow
        out.append(tuple(r))
    return out


def colorize_quads(verts, quads, fn, axis=1):
    return [fn(float(np.mean([verts[i][axis] for i in set(q)]))) for q in quads]


def band_fn(bands, default):
    """bands: list of (lo, hi, color); first match wins."""
    def f(y):
        for lo, hi, c in bands:
            if lo <= y < hi:
                return c
        return default
    return f


# --------------------------------------------------------------- body parts
def build_torso(m, o):
    n = m.n(16)
    # Pelvis / abdomen on 'body'
    cuts = [c for lo, hi, _ in o['pelvis_bands'] for c in (lo, hi)]
    rows = banded(PELVIS, cuts, o.get('torso_grow', 0.012))
    vq = vertical_loft(n, rows, p=2.35)
    qc = colorize_quads(vq[0], vq[1], band_fn(o['pelvis_bands'], o['legwear'][1]))
    m.add('body', vq, o['pelvis_bands'][0][2], qcolor=qc, label='pelvis')
    # Chest on 'chest'
    cuts = [c for lo, hi, _ in o['chest_bands'] for c in (lo, hi)]
    rows = banded(CHEST, cuts, o.get('torso_grow', 0.012))
    vq = vertical_loft(n, rows, p=2.4)
    qc = colorize_quads(vq[0], vq[1], band_fn(o['chest_bands'], o['chest_bands'][-1][2]))
    m.add('chest', vq, o['chest_bands'][0][2], qcolor=qc, label='chest')


def build_neck_head(m, o, variant=0, tags=()):
    n = m.n(18)
    rings = m.n(12) if m.lod == 0 else 7
    skin = o['skin']
    # neck (head bone local)
    neck = [(-0.075, 0.052, 0.048, 0.054), (-0.030, 0.050, 0.046, 0.053), (0.020, 0.048, 0.045, 0.051),
            (0.060, 0.046, 0.040, 0.050), (0.085, 0.030, 0.026, 0.034)]
    m.add('head', vertical_loft(m.n(10), neck, cz=-0.008), skin, space='local', label='neck', tags=tags)
    HC = 0.122           # head centre above the head pivot
    rx, ry, rz = 0.077, 0.118, 0.098

    deform = head_deform(HC, rx, ry, rz)
    vq = ellipsoid(n, rings, rx, ry, rz, deform, lat0=-1.40)
    m.add('head', vq, skin, space='local', label='skull', tags=tags)
    surf = face_surface(deform, rx, ry, rz)
    # nose: a short loft from the bridge to the tip
    nose = path_loft([(0, HC + 0.030, surf(0, HC + 0.030) - 0.004), (0, HC + 0.006, surf(0, HC + 0.006) + 0.004),
                      (0, HC - 0.018, surf(0, HC - 0.018) + 0.017), (0, HC - 0.029, surf(0, HC - 0.029) + 0.016),
                      (0, HC - 0.036, surf(0, HC - 0.036) + 0.002)],
                     [(0.007, 0.006), (0.009, 0.009), (0.012, 0.011), (0.015, 0.010), (0.011, 0.005)],
                     m.n(8), front=(0, 0, 1))
    m.add('head', nose, skin, space='local', label='nose', tags=tags)
    for side in (1, -1):
        ear = ellipsoid(m.n(6), 4, 0.010, 0.030, 0.019)
        mm = mat_t(side * (rx * 0.985), HC + 0.002, -0.008) @ mat_ry(side * 0.35) @ mat_rz(-side * 0.12)
        m.add('head', ear, o.get('ear', skin), space='local', m=mm, label='ear', tags=tags)
        ex, ey = side * 0.032, HC + 0.010
        ez = surf(ex, ey)
        white = ellipsoid(m.n(8), 3, 0.0130, 0.0052, 0.0050)
        m.add('head', white, '#d6cab8', space='local', m=mat_t(ex, ey, ez - 0.0035), label='eye_white', tags=tags)
        iris = ellipsoid(m.n(6), 3, 0.0058, 0.0050, 0.0040)
        m.add('head', iris, o.get('eyes', '#2c2219'), space='local', m=mat_t(ex - side * 0.001, ey, ez - 0.0005), label='iris', tags=tags)
        bz = [surf(side * x, HC + y) for x, y in ((0.013, 0.025), (0.034, 0.029), (0.054, 0.024))]
        brow = path_loft([(side * 0.013, HC + 0.025, bz[0] + 0.001), (side * 0.034, HC + 0.029, bz[1] + 0.001), (side * 0.054, HC + 0.024, bz[2] + 0.0)],
                         [(0.004, 0.0035), (0.0045, 0.004), (0.0035, 0.003)], 4, front=(0, 0, 1))
        m.add('head', brow, o.get('brow', o['hair']), space='local', label='brow', tags=tags)
    ly = HC - 0.056
    lips = path_loft([(-0.021, ly - 0.002, surf(-0.021, ly) - 0.002), (0, ly + 0.001, surf(0, ly) + 0.001), (0.021, ly - 0.002, surf(0.021, ly) - 0.002)],
                     [(0.004, 0.004), (0.0055, 0.005), (0.004, 0.004)], 4, front=(0, 1, 0))
    m.add('head', lips, o.get('lips', '#8f5a4a'), space='local', label='lips', tags=tags)
    m.meta['surf'] = surf
    build_hair(m, o, HC, rx, ry, rz, tags)
    build_beard(m, o, HC, rx, ry, rz, tags)
    return HC


def head_deform(HC, rx, ry, rz):
    def deform(x, y, z, lat, a):
        s = math.sin(a)               # +1 = face front, -1 = occiput
        front = max(0.0, s)
        if z < 0:                     # fuller cranium, occiput tucks into neck
            z *= 1.06 - 0.32 * smoothstep(-0.05, -0.9, lat)
        if lat < -0.15:               # jaw taper
            k = smoothstep(-0.15, -1.25, lat)
            x *= 1 - 0.34 * k
        if z > 0:
            z *= 1 - 0.07 * front ** 3                                  # face plane
            z += 0.034 * front ** 2.5 * smoothstep(-0.35, -1.10, lat)   # chin & jaw line
            z += 0.0075 * front ** 6 * math.exp(-((lat - 0.20) / 0.09) ** 2)  # brow ridge
            side = math.cos(a)
            z -= 0.0055 * math.exp(-((lat - 0.07) / 0.07) ** 2) * math.exp(-((abs(side) - 0.38) / 0.16) ** 2) * front
            x *= 1 + 0.035 * math.exp(-((lat + 0.02) / 0.15) ** 2) * front   # cheekbones
        if lat > 0.55:
            x *= 1 - 0.05 * smoothstep(0.55, 1.3, lat)
        if lat < -1.0:                # flatter underside of the jaw
            y = y * (1 - 0.18 * smoothstep(-1.0, -1.4, lat))
        return x, y + HC, z + 0.010
    return deform


def face_surface(deform, rx, ry, rz):
    pts = []
    for j in range(161):
        lat = -1.35 + 2.4 * j / 160
        for i in range(91):
            a = math.pi * (0.12 + 0.76 * i / 90)
            x, y, z = deform(rx * math.cos(lat) * math.cos(a), ry * math.sin(lat), rz * math.cos(lat) * math.sin(a), lat, a)
            pts.append((x, y, z))
    pts = np.array(pts)

    def surf(x, y):
        d = (pts[:, 0] - x) ** 2 + (pts[:, 1] - y) ** 2
        idx = np.argsort(d)[:4]
        w = 1 / (np.sqrt(d[idx]) + 1e-5)
        return float(np.sum(pts[idx, 2] * w) / np.sum(w))
    return surf


def build_hair(m, o, HC, rx, ry, rz, tags):
    style = o.get('hair_style', 'short')
    if style == 'bald' or o.get('hide_hair'):
        return
    n = m.n(18)
    grow = 1.075 if style != 'long' else 1.09
    rows = []
    levels = [0, 0.18, 0.38, 0.58, 0.78, 0.92, 1.0]
    for t in levels:
        ring = []
        for i in range(n):
            a = 2 * math.pi * i / n
            s = math.sin(a)
            # hairline: forehead high (front), nape low (back)
            if style == 'long':
                lat_edge = lerp(-0.85, 0.42, max(0, s) ** 1.2)
            else:
                lat_edge = lerp(-0.40, 0.46, (s + 1) / 2) if s > -0.2 else lerp(-0.40, -0.10, (s + 1) / 0.8 * 0.5)
            lat = lerp(lat_edge, math.pi / 2 * 0.985, t)
            x = rx * grow * math.cos(lat) * math.cos(a)
            y = ry * grow * math.sin(lat)
            z = rz * grow * math.cos(lat) * s
            if z < 0:
                z *= 1.04
            ring.append((x, y + HC + 0.004, z + 0.006))
        rows.append(ring)
    m.add('head', ring_loft(rows), o['hair'], space='local', label='hair', tags=tags + ('hair',))
    if style == 'tied':
        knot = ellipsoid(m.n(8), 4, 0.025, 0.030, 0.025)
        m.add('head', knot, o['hair'], space='local', m=mat_t(0, HC + 0.03, -0.112), label='hair_knot', tags=tags + ('hair',))


def build_beard(m, o, HC, rx, ry, rz, tags):
    style = o.get('beard', 'none')
    if style == 'none':
        return
    n = m.n(16)
    thick = {'full': 0.016, 'short': 0.009, 'stubble': 0.003, 'moustache': 0.0}[style]
    color = o.get('beard_color', o['hair'])
    if style != 'moustache':
        deform = head_deform(HC, rx, ry, rz)
        rows = []
        for lat in [-0.10, -0.32, -0.62, -0.90, -1.12, -1.30, -1.40]:
            ring = []
            for i in range(n):
                a = 2 * math.pi * i / n
                s = math.sin(a)
                x, y, z = deform(rx * math.cos(lat) * math.cos(a), ry * math.sin(lat), rz * math.cos(lat) * s, lat, a)
                d = np.array([x, (y - HC) * 0.6, z - 0.010])
                d = d / (np.linalg.norm(d) + 1e-9)
                k = max(0.0, s) ** 0.6 * (1 if lat < -0.2 else 0.5)
                if s < -0.1:
                    k = -0.6            # tuck the back of the ring inside the neck
                g = thick * k + 0.0015
                ring.append((x + d[0] * g, y + d[1] * g - (0.010 if style == 'full' and lat < -1.0 else 0), z + d[2] * g))
            rows.append(ring)
        m.add('head', ring_loft(rows), color, space='local', label='beard', tags=tags + ('beard',))
    surf = m.meta['surf']
    must = path_loft([(-0.026, HC - 0.052, surf(-0.026, HC - 0.052) + 0.002), (0, HC - 0.045, surf(0, HC - 0.045) + 0.005), (0.026, HC - 0.052, surf(0.026, HC - 0.052) + 0.002)],
                     [(0.004, 0.005), (0.007, 0.006), (0.004, 0.005)], 4, front=(0, 1, 0))
    m.add('head', must, color, space='local', label='moustache', tags=tags + ('beard',))


def build_arms(m, o):
    n = m.n(10)
    sleeve, scol = o['sleeve']
    cuff = {'long': -0.240, 'short': -0.150, 'elbow': -0.300, 'none': 1.0}[sleeve]
    for side, sx in (('L', 1), ('R', -1)):
        mir = mat_s(sx, 1, 1)
        # upper arm (sleeve over shoulder)
        cut = cuff if sleeve in ('short',) else -0.31
        rows = banded(UPPER_ARM, [cut], o.get('sleeve_grow', 0.006) if sleeve != 'none' else 0)
        vq = vertical_loft(n, rows)
        col = (lambda y, c=cut: scol if y > c else o['skin']) if sleeve in ('short',) else (lambda y: scol if sleeve != 'none' else o['skin'])
        m.add('upperArm_' + side, vq, scol, space='local', m=mir, qcolor=colorize_quads(vq[0], vq[1], col), label='upper_arm')
        # forearm + fist
        if sleeve == 'long':
            rows = banded(FOREARM, [cuff], 0.005)
            vq = vertical_loft(n, rows)
            qc = colorize_quads(vq[0], vq[1], lambda y: scol if y > cuff else o['skin'])
        else:
            vq = vertical_loft(n, FOREARM)
            qc = None
        m.add('forearm_' + side, vq, o['skin'] if sleeve != 'long' else scol, space='local', m=mir, qcolor=qc, label='forearm')
        if o.get('cuff'):
            c = vertical_loft(n, [(cuff + 0.02, 0.033, 0.031, 0.030), (cuff - 0.03, 0.031, 0.028, 0.027)])
            m.add('forearm_' + side, c, o['cuff'], space='local', m=mir, label='cuff')
        hand = o.get('gloves', o['skin'])
        hm = mir @ mat_t(0, 0.262, -0.004)          # elbow-relative table -> wrist (hand bone) space
        m.add('hand_' + side, vertical_loft(m.n(8), FIST), hand, space='local', m=hm, label='fist')
        thumb = path_loft([(0.004, -0.282, 0.034), (0.002, -0.305, 0.050), (-0.006, -0.330, 0.050), (-0.014, -0.338, 0.040)],
                          [(0.011, 0.012), (0.011, 0.011), (0.010, 0.010), (0.007, 0.007)], 4 if m.lod else 6, front=(1, 0, 0))
        m.add('hand_' + side, thumb, hand, space='local', m=hm, label='thumb')


def build_legs(m, o):
    n = m.n(10)
    kind, col = o['legwear'][0], o['legwear'][1]
    skin = o['skin']
    foot_kind, fcol, boot_h = o['foot']
    for side, sx in (('L', 1), ('R', -1)):
        mir = mat_s(sx, 1, 1)
        rows = banded(THIGH, [], o.get('leg_grow', 0.004) if kind != 'bare' else 0)
        thigh_col = skin if kind == 'bare' else col
        if kind == 'wrapped':
            thigh_col = col
        vq = vertical_loft(n, rows)
        m.add('thigh_' + side, vq, thigh_col, space='local', m=mir, label='thigh')
        # shin: legwear, optional wraps/boot shafts as separate overlays
        shin_col = skin if kind in ('bare', 'shorts') else col
        cuts = []
        if o.get('leg_wrap'):
            cuts = [-0.06, -0.40]
        boot_top = -0.42 + boot_h if foot_kind in ('boot', 'tallboot', 'modernboot', 'wrap', 'shoe') and boot_h > 0 else None
        if boot_top is not None:
            cuts.append(boot_top)
        grow = o.get('leg_grow', 0.004) if kind not in ('bare', 'shorts') else 0
        if boot_top is not None:
            grow = max(grow, 0.008)
        rows = banded(SHIN, cuts, grow)
        vq = vertical_loft(n, rows)
        wc = o.get('leg_wrap')

        def shin_color(y, wc=wc, bt=boot_top):
            if bt is not None and y < bt:
                return fcol
            if wc and -0.40 <= y < -0.06:
                return wc
            return shin_col
        qc = colorize_quads(vq[0], vq[1], shin_color) if (wc or boot_top is not None) else None
        m.add('shin_' + side, vq, shin_col, space='local', m=mir, qcolor=qc, label='shin')
        # foot
        if foot_kind == 'bare':
            fc = skin
        else:
            fc = fcol
        rings = []
        fn = m.n(8)
        for z, hw, yt, yb in FOOT:
            ring = []
            for i in range(fn):
                a = 2 * math.pi * i / fn
                c, s = math.cos(a), math.sin(a)
                yc, h = (yt + yb) / 2, (yt - yb) / 2
                # flat sole: squash the bottom half
                yy = yc + h * (s if s > 0 else max(-1, s * 1.35))
                yy = max(yy, yb)
                ring.append((c * hw * (1.06 if foot_kind not in ('bare', 'sandal') else 1.0), yy, z))
            rings.append(ring)
        vq = ring_loft(rings)
        if foot_kind == 'sandal':
            qc = colorize_quads(vq[0], vq[1], lambda y: fcol if y < GROUND_LOCAL + 0.012 else skin)
            m.add('shin_' + side, vq, skin, space='local', m=mir, qcolor=qc, label='foot')
            strap = vertical_loft(fn, [(-0.425, 0.040, 0.041, 0.040), (-0.440, 0.042, 0.050, 0.042)])
            m.add('shin_' + side, strap, fcol, space='local', m=mir, label='sandal_strap')
        else:
            m.add('shin_' + side, vq, fc, space='local', m=mir, label='foot')


def build_skirt(m, o):
    sk = o.get('skirt')
    if not sk:
        return
    hem, col, flare = sk[0], sk[1], sk[2]
    top = sk[3] if len(sk) > 3 else 1.00
    n = m.n(16)
    r0 = prof(PELVIS, min(top, 1.10))
    rows = []
    steps = 4 if m.lod == 0 else 2
    for k in range(steps + 1):
        t = k / steps
        y = lerp(top, hem, t)
        base = prof(PELVIS, max(0.86, y))
        g = 0.016 + flare * t ** 1.3
        rows.append((y, max(base[1], r0[1]) + g, max(base[2], 0.09) + g * 1.1, max(base[3], 0.10) + g, 0, 0.0))
    vq = vertical_loft(n, rows, p=2.2)
    qc = None
    if len(sk) > 4 and sk[4]:
        trim = sk[4]
        qc = colorize_quads(vq[0], vq[1], lambda y: trim if y < hem + 0.03 else col)
        vq = vertical_loft(n, banded(rows, [hem + 0.03]), p=2.2)
        qc = colorize_quads(vq[0], vq[1], lambda y: trim if y < hem + 0.03 else col)
    m.add('body', vq, col, qcolor=qc, label='skirt', tags=o.get('skirt_tags', ()))


def build_belt(m, o, y=1.0, col=None, tags=()):
    col = col or o.get('belt')
    if not col:
        return
    n = m.n(16)
    r = prof(PELVIS, y)
    rows = [(y - 0.022, r[1] + 0.022, r[2] + 0.022, r[3] + 0.022), (y + 0.022, r[1] + 0.021, r[2] + 0.021, r[3] + 0.021)]
    m.add('body', vertical_loft(n, rows, p=2.35), col, label='belt', tags=tags)
    if o.get('buckle'):
        m.add('body', ellipsoid(m.n(8), 3, 0.020, 0.018, 0.006), o['buckle'], 'metal', m=mat_t(0, y, r[2] + 0.024), label='buckle', tags=tags)


def build_cape(m, col, top=1.47, hem=0.70, width=0.23, tags=(), lining=None):
    """A cloak hanging from the shoulders: a closed crescent-section shell."""
    n_arc = m.n(10)
    rows = []
    levels = [top, top - 0.06, 1.25, 1.0, hem] if m.lod == 0 else [top, 1.2, hem]
    for y in levels:
        t = (top - y) / (top - hem)
        w = width + 0.06 * t
        depth = 0.115 + 0.05 * t
        ring = []
        for i in range(n_arc + 1):
            a = math.pi * (0.06 + 0.88 * i / n_arc)
            ring.append((math.cos(a) * w, y, -math.sin(a) * depth - 0.01))
        for i in range(n_arc, -1, -1):
            a = math.pi * (0.06 + 0.88 * i / n_arc)
            ring.append((math.cos(a) * (w - 0.012), y, -math.sin(a) * (depth - 0.012) - 0.01))
        rows.append(ring)
    m.add('chest', ring_loft(rows), col, label='cape', tags=tags)


def build_human(m, o, head_variants=None):
    build_torso(m, o)
    build_arms(m, o)
    build_legs(m, o)
    build_skirt(m, o)
    build_belt(m, o)
    variants = head_variants or [{}]
    hc = None
    for k, ov in enumerate(variants):
        oo = dict(o)
        oo.update(ov)
        tags = ('v%d' % k,) if len(variants) > 1 else ()
        hc = build_neck_head(m, oo, k, tags)
    return hc
