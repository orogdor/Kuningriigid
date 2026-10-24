"""Clothing overlays, armour, helmets, shields and weapons (quad lofts).

Weapons are authored in GRIP SPACE: origin at the centre of the fist,
+Y = thumb side (the 'up' end of a weapon held upright), +Z = the direction
the knuckles point (distal), X = across the fist. grip() maps grip space
onto the forearm bone, so weapons follow the hand in every animation.
"""
import math
import numpy as np
from geom import (vertical_loft, ring_loft, torus_loft, section_ring, ellipsoid, path_loft, box, cylinder,
                  outline_extrude, superellipse_outline, arc_points, smoothstep, lerp, merge, oriented,
                  transform_vq, mat_t, mat_rx, mat_ry, mat_rz, mat_s, apply, norm)
from body import PELVIS, CHEST, UPPER_ARM, FOREARM, THIGH, SHIN, prof, banded

HC = 0.122
RX, RY, RZ = 0.077, 0.118, 0.098
GRIP_L = np.array([0.004, -0.056, 0.014])      # fist centre in hand-bone space (left)
WOOD, WOOD_D, WOOD_L = '#7b5a37', '#5b4129', '#9a774c'
LEATHER, LEATHER_D = '#6d4b30', '#4a3322'
BRONZE, BRONZE_D = '#b8893f', '#8a6430'
IRON, IRON_D, STEEL = '#8b9196', '#5f656a', '#a9b0b5'
BRASS = '#c8a24a'
ROPE = '#b9a57a'
LINEN = '#ddd0ad'


def qcolor3(vq, fn):
    v, q = vq
    return [fn(*np.mean([v[i] for i in set(f)], axis=0)) for f in q]


# ------------------------------------------------------------------ helmets
def head_shell(m, edge, grow, color, mat='metal', top=None, label='helmet', tags=(), levels=None,
               n=None, group=None, zscale=1.0, qfn=None):
    n = n or m.n(18)
    levels = levels or ([0, 0.16, 0.34, 0.52, 0.70, 0.86, 1.0] if m.lod == 0 else [0, 0.4, 0.75, 1.0])
    rows = []
    for t in levels:
        ring = []
        for i in range(n):
            a = 2 * math.pi * i / n
            s = math.sin(a)
            lat = lerp(edge(a), math.pi / 2 * 0.985, t)
            x = RX * grow * math.cos(lat) * math.cos(a)
            y = RY * grow * math.sin(lat)
            z = RZ * grow * math.cos(lat) * s * zscale
            if z < 0:
                z *= 1.04
            if top:
                x, y, z = top(x, y, z, lat, t, a)
            ring.append((x, y + HC + 0.004, z + 0.008))
        rows.append(ring)
    vq = ring_loft(rows)
    qc = qcolor3(vq, qfn) if qfn else None
    return m.add('head', vq, color, mat, space='local', label=label, tags=tags, group=group, qcolor=qc)


def brim(m, y, r_in, r_out, color, mat='cloth', droop=0.0, upturn=None, thick=0.008, tags=(), zoff=0.008, label='brim', rz_scale=1.12):
    n = m.n(20)
    rings = []
    for k, (r, dy) in enumerate([(r_in, -thick / 2), (r_out, -thick / 2), (r_out, thick / 2), (r_in, thick / 2)]):
        ring = []
        for i in range(n):
            a = 2 * math.pi * i / n
            s, c = math.sin(a), math.cos(a)
            outer = (r - r_in) / max(1e-6, (r_out - r_in))
            yy = y + dy - droop * outer
            if upturn:
                yy += upturn(a) * outer
            ring.append((c * r, yy, s * r * rz_scale + zoff))
        rings.append(ring)
    return m.add('head', torus_loft(rings), color, mat, space='local', label=label, tags=tags)


def plume(m, color, base, tip, r=0.02, tags=(), bone='head', bend=(0, 0, 0), space='local', label='plume'):
    base, tip = np.array(base), np.array(tip)
    mid = (base + tip) / 2 + np.array(bend)
    pts = [base, base * 0.7 + mid * 0.3, mid, mid * 0.5 + tip * 0.5, tip]
    rad = [(r * 0.5, r * 0.5), (r, r * 0.9), (r * 1.1, r), (r * 0.8, r * 0.7), (r * 0.15, r * 0.15)]
    return m.add(bone, path_loft(pts, rad, m.n(8)), color, space=space, label=label, tags=tags)


def helmet(m, kind, o, tags=()):
    t = tags
    if kind == 'none':
        return
    if kind == 'bronze_cone':
        def cone(x, y, z, lat, tt, a):
            k = smoothstep(0.35, 1.5, lat)
            return x * (1 - 0.35 * k), y + 0.075 * k, z * (1 - 0.35 * k)
        head_shell(m, lambda a: 0.30 if math.sin(a) > 0.2 else 0.05, 1.16, o.get('helm_col', BRONZE), top=cone, tags=t)
        brim(m, HC + 0.025, RX * 1.12, RX * 1.25, o.get('helm_col', BRONZE), 'metal', thick=0.012, tags=t, label='helmet_rim')
        for side in (1, -1):    # cheek guards
            v, q = outline_extrude(superellipse_outline(m.n(8), 0.055, 0.085, 3.0, taper=0.3),
                                   [(-0.004, 1, 0), (0.004, 1, 0)])
            mm = mat_t(side * 0.083, HC - 0.035, 0.035) @ mat_ry(side * 1.25) @ mat_rx(-0.08)
            m.add('head', (v, q), o.get('helm_col', BRONZE), 'metal', space='local', m=mm, label='cheek_guard', tags=t)
        if o.get('crest'):
            pts = [(0, HC + 0.16, 0.06), (0, HC + 0.205, 0.0), (0, HC + 0.19, -0.07), (0, HC + 0.12, -0.13)]
            m.add('head', path_loft(pts, [(0.010, 0.014), (0.016, 0.018), (0.014, 0.016), (0.006, 0.008)], m.n(8)),
                  o['crest'], space='local', label='crest', tags=t)
        return
    if kind == 'boar_tusk':
        def cone(x, y, z, lat, tt, a):
            k = smoothstep(0.35, 1.5, lat)
            return x * (1 - 0.30 * k), y + 0.06 * k, z * (1 - 0.30 * k)
        head_shell(m, lambda a: 0.28 if math.sin(a) > 0.2 else 0.02, 1.16, '#e2d2ab', 'cloth', top=cone, tags=t,
                   qfn=lambda x, y, z: '#e2d2ab' if int((y - HC) / 0.028) % 2 == 0 else '#bfae86')
        return
    if kind == 'leather_cap':
        head_shell(m, lambda a: 0.36 if math.sin(a) > 0.3 else 0.12, 1.09, o.get('cap_col', LEATHER), 'cloth', tags=t, label='cap')
        return
    if kind == 'fur_cap':
        head_shell(m, lambda a: 0.40 if math.sin(a) > 0.3 else 0.05, 1.13, o.get('cap_col', '#6b5338'), 'cloth', tags=t, label='fur_cap',
                   qfn=lambda x, y, z: '#7a603f' if (int((math.atan2(z, x) + 4) * 6) % 2) else '#5f4932')
        return
    if kind == 'headband':
        n = m.n(16)
        rows = [(HC + 0.030, RX * 1.06, RZ * 1.03, RZ * 1.08, 0, 0.010), (HC + 0.052, RX * 1.04, RZ * 0.99, RZ * 1.06, 0, 0.010)]
        m.add('head', vertical_loft(n, rows), o.get('band_col', 'TEAM'), space='local', label='headband', tags=t)
        if o.get('feather'):
            plume(m, o['feather'], (0.02, HC + 0.05, -0.10), (0.05, HC + 0.21, -0.14), r=0.010, tags=t)
        return
    if kind == 'montefortino':
        def knob(x, y, z, lat, tt, a):
            k = smoothstep(0.9, 1.55, lat)
            return x * (1 - 0.1 * k), y + 0.012 * k, z * (1 - 0.1 * k)
        head_shell(m, lambda a: 0.30 if math.sin(a) > 0.25 else -0.05, 1.14, o.get('helm_col', BRONZE), top=knob, tags=t)
        m.add('head', cylinder(m.n(8), 0.012, 0.03, 0.006), o.get('helm_col', BRONZE), 'metal', space='local', m=mat_t(0, HC + 0.148, 0.008), tags=t, label='helmet_knob')
        brim(m, HC + 0.018, RX * 1.12, RX * 1.26, o.get('helm_col', BRONZE), 'metal', thick=0.010, tags=t, label='helmet_rim',
             upturn=lambda a: -0.025 * max(0, -math.sin(a)) ** 2)
        for side in (1, -1):
            v, q = outline_extrude(superellipse_outline(m.n(8), 0.060, 0.090, 2.6, taper=0.25), [(-0.004, 1, 0), (0.004, 1, 0)])
            mm = mat_t(side * 0.085, HC - 0.030, 0.030) @ mat_ry(side * 1.3)
            m.add('head', (v, q), o.get('helm_col', BRONZE), 'metal', space='local', m=mm, label='cheek_guard', tags=t)
        if o.get('crest'):
            plume(m, o['crest'], (0, HC + 0.16, 0.0), (0, HC + 0.25, -0.02), r=0.014, tags=t)
        return
    if kind in ('nasal', 'nasal_coif'):
        if kind == 'nasal_coif':
            coif(m, o, t)
        def cone(x, y, z, lat, tt, a):
            k = smoothstep(0.3, 1.5, lat)
            return x * (1 - 0.25 * k), y + 0.05 * k, z * (1 - 0.18 * k)
        g = 1.20 if kind == 'nasal_coif' else 1.13
        head_shell(m, lambda a: 0.30 if math.sin(a) > 0.2 else 0.15, g, o.get('helm_col', IRON), top=cone, tags=t)
        m.add('head', box(0.016, 0.075, 0.010), o.get('helm_col', IRON), 'metal', space='local',
              m=mat_t(0, HC + 0.000, 0.113 + (0.008 if kind == 'nasal_coif' else 0)) @ mat_rx(0.12), tags=t, label='nasal')
        return
    if kind in ('kettle', 'kettle_coif'):
        if kind == 'kettle_coif':
            coif(m, o, t)
        g = 1.22 if kind == 'kettle_coif' else 1.15
        head_shell(m, lambda a: 0.26, g, o.get('helm_col', IRON), tags=t)
        brim(m, HC + 0.035, RX * g * 0.98, RX * g + 0.075, o.get('helm_col', IRON), 'metal', droop=0.028, thick=0.006, tags=t, label='kettle_brim')
        return
    if kind == 'great_helm':
        n = m.n(16)
        rows = [(HC - 0.140, 0.100, 0.125, 0.115, 0, 0.012), (HC - 0.06, 0.108, 0.132, 0.122, 0, 0.010),
                (HC + 0.040, 0.110, 0.134, 0.124, 0, 0.010), (HC + 0.11, 0.104, 0.124, 0.118, 0, 0.008),
                (HC + 0.142, 0.090, 0.104, 0.104, 0, 0.008)]
        vq = vertical_loft(n, banded(rows, [HC + 0.005, HC + 0.022]), p=2.6)
        col = o.get('helm_col', STEEL)
        qc = qcolor3(vq, lambda x, y, z: '#141414' if HC + 0.005 < y < HC + 0.022 and z > 0.07 else col)
        m.add('head', vq, col, 'metal', space='local', qcolor=qc, label='great_helm', tags=t)
        m.add('head', box(0.012, 0.15, 0.008), BRASS, 'metal', space='local', m=mat_t(0, HC - 0.04, 0.146), tags=t, label='helm_cross')
        m.add('head', box(0.13, 0.012, 0.008), BRASS, 'metal', space='local', m=mat_t(0, HC - 0.03, 0.143), tags=t, label='helm_cross')
        if o.get('crest'):
            m.add('head', ellipsoid(m.n(10), 5, 0.06, 0.035, 0.07), o['crest'], space='local', m=mat_t(0, HC + 0.17, 0.0), tags=t, label='helm_crest')
        return
    if kind == 'bascinet':
        coif(m, o, t, low=True)
        def point(x, y, z, lat, tt, a):
            k = smoothstep(0.4, 1.5, lat)
            return x * (1 - 0.3 * k), y + 0.06 * k, z * (1 - 0.3 * k) - 0.02 * k
        head_shell(m, lambda a: 0.15 if math.sin(a) > 0.3 else -0.40, 1.20, o.get('helm_col', STEEL), top=point, tags=t)
        return
    if kind == 'morion':
        col = o.get('helm_col', STEEL)
        head_shell(m, lambda a: 0.32, 1.15, col, tags=t, top=lambda x, y, z, lat, tt, a: (x, y * 1.18, z))
        brim(m, HC + 0.040, RX * 1.13, RX * 1.13 + 0.055, col, 'metal', thick=0.006, tags=t, label='morion_brim',
             upturn=lambda a: 0.06 * abs(math.sin(a)) ** 3, rz_scale=1.45)
        # comb along the crown
        pts = [(0, HC + 0.10, 0.10), (0, HC + 0.19, 0.05), (0, HC + 0.205, -0.02), (0, HC + 0.18, -0.09), (0, HC + 0.10, -0.12)]
        m.add('head', path_loft(pts, [(0.003, 0.003), (0.004, 0.030), (0.004, 0.036), (0.004, 0.030), (0.003, 0.003)], 4, front=(0, 1, 0)), col, 'metal', space='local', tags=t, label='morion_comb')
        if o.get('crest'):
            plume(m, o['crest'], (-0.04, HC + 0.10, -0.08), (-0.10, HC + 0.24, -0.16), r=0.012, tags=t)
        return
    if kind == 'felt_hat':
        col = o.get('hat_col', '#3b3530')
        n = m.n(16)
        rows = [(HC + 0.04, RX * 1.10, RZ * 1.08, RZ * 1.12, 0, 0.008), (HC + 0.15, RX * 1.08, RZ * 1.02, RZ * 1.06, 0, 0.004),
                (HC + 0.17, RX * 0.96, RZ * 0.90, RZ * 0.95, 0, 0.004)]
        m.add('head', vertical_loft(n, rows), col, space='local', tags=t, label='hat_crown')
        brim(m, HC + 0.045, RX * 1.08, 0.205, col, droop=0.0, thick=0.008, tags=t, label='hat_brim', rz_scale=1.0,
             upturn=lambda a: 0.10 * max(0, math.cos(a)) ** 3)
        n2 = m.n(16)
        m.add('head', vertical_loft(n2, [(HC + 0.05, RX * 1.11, RZ * 1.09, RZ * 1.13, 0, 0.008), (HC + 0.075, RX * 1.105, RZ * 1.085, RZ * 1.125, 0, 0.008)]),
              o.get('band_col', '#2a2420'), space='local', tags=t, label='hat_band')
        if o.get('crest'):
            plume(m, o['crest'], (0.08, HC + 0.08, -0.02), (0.06, HC + 0.17, -0.22), r=0.022, bend=(0.04, 0.06, 0), tags=t)
        return
    if kind == 'burgonet':
        col = o.get('helm_col', '#5d6266')
        head_shell(m, lambda a: 0.22 if math.sin(a) > 0.3 else -0.25, 1.17, col, tags=t)
        brim(m, HC + 0.035, RX * 1.12, RX * 1.12 + 0.045, col, 'metal', thick=0.006, tags=t, label='burgonet_peak',
             upturn=lambda a: -0.08 * (1 - max(0, math.sin(a))), rz_scale=1.30)
        for side in (1, -1):
            v, q = outline_extrude(superellipse_outline(m.n(8), 0.065, 0.10, 2.4, taper=0.2), [(-0.004, 1, 0), (0.004, 1, 0)])
            m.add('head', (v, q), col, 'metal', space='local', m=mat_t(side * 0.090, HC - 0.030, 0.020) @ mat_ry(side * 1.3), tags=t, label='cheek_plate')
        m.add('head', box(0.012, 0.13, 0.008), col, 'metal', space='local', m=mat_t(0, HC - 0.005, 0.135), tags=t, label='nasal_bar')
        for k in range(3):     # lobster-tail neck guard lames
            yy = HC - 0.03 - k * 0.032
            v = vertical_loft(m.n(10), [(yy - 0.018, 0.085 + k * 0.006, 0.02, 0.11 + k * 0.012, 0, -0.02), (yy + 0.014, 0.083 + k * 0.006, 0.02, 0.105 + k * 0.012, 0, -0.02)])
            m.add('head', v, col, 'metal', space='local', tags=t, label='neck_lame')
        return
    if kind == 'shako':
        col = o.get('hat_col', '#1e1f22')
        n = m.n(16)
        rows = [(HC + 0.035, RX * 1.10, RZ * 1.08, RZ * 1.12, 0, 0.010), (HC + 0.16, RX * 1.20, RZ * 1.16, RZ * 1.20, 0, 0.004),
                (HC + 0.235, RX * 1.24, RZ * 1.19, RZ * 1.22, 0, 0.0), (HC + 0.245, RX * 1.18, RZ * 1.13, RZ * 1.16, 0, 0.0)]
        vq = vertical_loft(n, banded(rows, [HC + 0.21]))
        qc = qcolor3(vq, lambda x, y, z: o.get('shako_band', BRASS) if y > HC + 0.21 else col)
        m.add('head', vq, col, space='local', qcolor=qc, tags=t, label='shako')
        brim(m, HC + 0.040, RX * 1.05, RX * 1.05 + 0.03, '#141414', thick=0.006, droop=0.02, tags=t, label='shako_peak',
             upturn=lambda a: -0.05 * (1 - max(0, math.sin(a)) ** 0.5), rz_scale=1.5)
        m.add('head', ellipsoid(m.n(8), 4, 0.022, 0.026, 0.010), BRASS, 'metal', space='local', m=mat_t(0, HC + 0.11, 0.124), tags=t, label='shako_plate')
        if o.get('crest'):
            plume(m, o['crest'], (0, HC + 0.235, 0.09), (0, HC + 0.33, 0.10), r=0.016, tags=t)
        return
    if kind == 'kepi':
        col = o.get('hat_col', 'TEAM_D')
        n = m.n(16)
        rows = [(HC + 0.035, RX * 1.10, RZ * 1.08, RZ * 1.12, 0, 0.010), (HC + 0.13, RX * 1.06, RZ * 1.06, RZ * 0.98, 0, 0.020),
                (HC + 0.16, RX * 1.00, RZ * 1.00, RZ * 0.92, 0, 0.026)]
        m.add('head', vertical_loft(n, rows), col, space='local', tags=t, label='kepi')
        brim(m, HC + 0.040, RX * 1.05, RX * 1.05 + 0.03, '#141414', thick=0.006, droop=0.015, tags=t, label='kepi_peak',
             upturn=lambda a: -0.05 * (1 - max(0, math.sin(a)) ** 0.5), rz_scale=1.45)
        return
    if kind == 'dragoon_helmet':
        col = o.get('helm_col', STEEL)
        head_shell(m, lambda a: 0.26 if math.sin(a) > 0.3 else -0.05, 1.16, col, tags=t)
        brim(m, HC + 0.035, RX * 1.08, RX * 1.08 + 0.035, '#1b1b1b', thick=0.006, tags=t, label='helmet_peak',
             upturn=lambda a: -0.06 * (1 - max(0, math.sin(a)) ** 0.5), rz_scale=1.45)
        pts = [(0, HC + 0.12, 0.10), (0, HC + 0.21, 0.05), (0, HC + 0.225, -0.03), (0, HC + 0.18, -0.12)]
        m.add('head', path_loft(pts, [(0.006, 0.01), (0.008, 0.035), (0.008, 0.035), (0.006, 0.01)], 4, front=(0, 1, 0)), BRASS, 'metal', space='local', tags=t, label='crest_comb')
        hair = [(0, HC + 0.20, -0.06), (0, HC + 0.17, -0.15), (0, HC + 0.06, -0.19), (0, HC - 0.08, -0.17), (0, HC - 0.16, -0.14)]
        m.add('head', path_loft(hair, [(0.012, 0.012), (0.024, 0.02), (0.026, 0.02), (0.022, 0.016), (0.008, 0.006)], m.n(8)), '#151515', space='local', tags=t, label='horsehair')
        return
    if kind == 'modern_helmet':
        col = o.get('helm_col', '#55603f')
        def flare(x, y, z, lat, tt, a):
            k = 1 - tt
            return x * (1 + 0.06 * k ** 3), y, z * (1 + 0.06 * k ** 3)
        head_shell(m, lambda a: 0.30 if math.sin(a) > 0.5 else (-0.05 if math.sin(a) > -0.3 else -0.28), 1.25, col, 'cloth', top=flare, tags=t, label='combat_helmet')
        m.add('head', box(0.06, 0.03, 0.012, 0.004), '#2c2f2a', space='local', m=mat_t(0, HC + 0.07, 0.123) @ mat_rx(-0.4), tags=t, label='nvg_mount')
        return
    if kind == 'hood':
        coif(m, o, t, cloth=True)
        return
    raise ValueError(kind)


def coif(m, o, tags, low=False, cloth=False):
    """Mail coif or cloth hood: covers skull, cheeks and neck, face open."""
    col = o.get('hood_col' if cloth else 'mail_col', '#7d8286' if not cloth else '#6b5c45')
    mat = 'cloth' if cloth else 'metal'

    def edge(a):
        s = math.sin(a)
        if s > 0.62:
            return 0.36 - (0.0 if not low else 0.3)
        if s > 0.30:
            return lerp(-1.30, 0.36, (s - 0.30) / 0.32)
        return -1.32
    head_shell(m, edge, 1.12, col, mat, tags=tags, label='hood' if cloth else 'mail_coif',
               qfn=None if cloth else (lambda x, y, z: col if int((y - HC) / 0.018) % 2 else '#6f7477'))
    n = m.n(16)
    mantle = [(-0.085, 0.07, 0.07, 0.075, 0, -0.01), (-0.06, 0.12, 0.11, 0.12, 0, -0.012),
              (-0.03, 0.19, 0.13, 0.14, 0, -0.012), (-0.015, 0.21, 0.135, 0.145, 0, -0.012)]
    if not cloth:
        mantle = [(r[0], r[1], r[2], r[3], 0, r[5]) for r in mantle]
    mv = vertical_loft(n, [(1.505 + r[0] - 1.52, r[1], r[2], r[3], 0, r[5]) for r in mantle], p=2.3)
    # mantle hangs on the chest bone (shoulders) so it does not spin with the head
    m.add('chest', ([(x, y + 1.52, z) for x, y, z in mv[0]], mv[1]), col, mat, label='coif_mantle', tags=tags)


# ------------------------------------------------------------------ torso & limb shells
def torso_shell(m, y0, y1, grow, color, mat='cloth', p=2.4, tags=(), qfn=None, label='torso_shell', front_ridge=0.0, steps=None):
    """Closed shell around the torso between y0..y1, split across body/chest bones."""
    parts = []
    for bone, table, lo, hi in (('body', PELVIS, 0.84, 1.13), ('chest', CHEST, 1.04, 1.505)):
        a, b = max(y0, lo), min(y1, hi)
        if b - a < 0.02:
            continue
        ys = [r[0] for r in table if a < r[0] < b]
        rows = []
        for y in [a] + ys + [b]:
            r = prof(table, y)
            rows.append((y, r[1] + grow, r[2] + grow + front_ridge, r[3] + grow, r[4], r[5]))
        n = m.n(16)
        vq = vertical_loft(n, rows, p=p)
        if front_ridge:
            v = vq[0]
            for i in range(len(v)):
                if v[i][2] > 0:
                    v[i][2] -= front_ridge * min(1, abs(v[i][0]) / 0.09)
        qc = qcolor3(vq, qfn) if qfn else None
        parts.append(m.add(bone, vq, color, mat, qcolor=qc, label=label, tags=tags))
    return parts


def limb_shell(m, bone, table, y0, y1, grow, color, mat='metal', tags=(), front_only=False, label='limb_shell', mirror=None):
    sx = mirror if mirror is not None else (1 if bone.endswith('_L') else -1)
    t = sorted(table, key=lambda r: r[0])
    ys = [y0] + [r[0] for r in t if y0 < r[0] < y1] + [y1]
    rows = []
    for y in ys[::-1]:
        r = prof(table, y)
        if front_only:
            rows.append((y, r[1] + grow, r[2] + grow, r[3] * 0.25, r[4], r[5] + r[3] * 0.1))
        else:
            rows.append((y, r[1] + grow, r[2] + grow, r[3] + grow, r[4], r[5]))
    vq = vertical_loft(m.n(12), rows, p=2.2)
    return m.add(bone, vq, color, mat, space='local', m=mat_s(sx, 1, 1), label=label, tags=tags)


def pauldron(m, side, color, size=1.0, tags=(), lames=0):
    bone = 'upperArm_' + side
    sx = 1 if side == 'L' else -1
    vq = ellipsoid(m.n(12), 6, 0.075 * size, 0.06 * size, 0.075 * size, lat0=-0.35)
    m.add(bone, vq, color, 'metal', space='local', m=mat_s(sx, 1, 1) @ mat_t(0.010, 0.005, 0.0) @ mat_rz(-0.25), label='pauldron', tags=tags)
    for k in range(lames):
        vq = ellipsoid(m.n(12), 4, 0.070 * size, 0.03, 0.070 * size, lat0=-0.3)
        m.add(bone, vq, color, 'metal', space='local', m=mat_s(sx, 1, 1) @ mat_t(0.010, -0.045 - k * 0.035, 0.0), label='arm_lame', tags=tags)


def skirt_shell(m, top, hem, color, flare, mat='cloth', tags=(), qfn=None, label='skirt', split_front=False, grow=0.03):
    n = m.n(16)
    rows = []
    steps = 4 if m.lod == 0 else 2
    for k in range(steps + 1):
        t = k / steps
        y = lerp(top, hem, t)
        base = prof(PELVIS, max(0.86, y))
        g = grow + flare * t ** 1.3
        rows.append((y, max(base[1], 0.155) + g, max(base[2], 0.095) + g * 1.1, max(base[3], 0.105) + g, 0, 0.0))
    vq = vertical_loft(n, rows, p=2.2)
    qc = qcolor3(vq, qfn) if qfn else None
    return m.add('body', vq, color, mat, qcolor=qc, label=label, tags=tags)


def coat_tails(m, color, top=0.98, hem=0.62, width=0.15, tags=(), lining=None):
    """Two coat tails at the back (tailcoat / frock coat)."""
    for side in (1, -1):
        pts = []
        rows = []
        for y, w, d in [(top, width, 0.012), ((top + hem) / 2, width * 0.9, 0.012), (hem, width * 0.75, 0.010)]:
            r = prof(PELVIS, max(0.86, y))
            zb = -(r[3] + 0.04)
            ring = [(side * 0.01, y, zb - 0.0), (side * (0.01 + w), y, zb + 0.03), (side * (0.01 + w), y, zb + 0.03 - d), (side * 0.01, y, zb - d)]
            rows.append(ring)
        m.add('body', ring_loft(rows), color, label='coat_tail', tags=tags)


def strap(m, bone, pts, w, t, color, tags=(), label='strap', mat='cloth'):
    rad = [(w / 2, t / 2)] * len(pts)
    m.add(bone, path_loft(pts, rad, 4, front=(0, 0, 1), p=6), color, mat, label=label, tags=tags)


def crossbelt(m, color, side=1, tags=(), w=0.05):
    """Diagonal belt from one shoulder to the opposite hip, wrapping the torso."""
    pts = []
    for k in range(9):
        t = k / 8
        y = lerp(1.44, 0.98, t)
        x = lerp(side * 0.13, -side * 0.15, t)
        r = prof(CHEST if y > 1.04 else PELVIS, y)
        zf = r[2] + 0.022
        pts.append((x, y, zf * math.sqrt(max(0.05, 1 - (x / (r[1] + 0.03)) ** 2))))
    back = []
    for k in range(9):
        t = k / 8
        y = lerp(0.98, 1.44, t)
        x = lerp(-side * 0.15, side * 0.13, t)
        r = prof(CHEST if y > 1.04 else PELVIS, y)
        zb = r[3] + 0.022
        back.append((x, y, -zb * math.sqrt(max(0.05, 1 - (x / (r[1] + 0.03)) ** 2))))
    bone = 'chest'
    strap(m, bone, pts, w, 0.008, color, tags, 'crossbelt_front')
    strap(m, bone, back, w, 0.008, color, tags, 'crossbelt_back')


def quiver(m, color=LEATHER, arrows=12, fletch='#d8d0c0', tags=(), group=None):
    n = m.n(10)
    q = cylinder(n, 0.045, 0.52, 0.05)
    mm = mat_t(-0.04, 1.20, -0.175) @ mat_rz(0.40) @ mat_rx(-0.10)
    m.add('chest', q, color, label='quiver', tags=tags, m=mm, group=group)
    rows = 3 if m.lod == 0 else 1
    for k in range(rows):
        for j in range(3):
            pos = apply(mm, [(0.016 * (j - 1), 0.30 + 0.03 * k, 0.016 * (k - 1))])[0]
            v = ellipsoid(m.n(6), 3, 0.012, 0.045, 0.004)
            m.add('chest', v, fletch, label='fletching', tags=tags, m=mat_t(*pos) @ mat_rz(0.40) @ mat_ry(j * 1.1), group=group)


def backpack(m, color, tags=(), roll=None):
    m.add('chest', box(0.30, 0.34, 0.14, 0.03), color, m=mat_t(0, 1.25, -0.19), label='backpack', tags=tags)
    if roll:
        m.add('chest', cylinder(m.n(10), 0.05, 0.36), roll, m=mat_t(0, 1.45, -0.18) @ mat_rz(math.pi / 2), label='bedroll', tags=tags)
    for s in (1, -1):
        strap(m, 'chest', [(s * 0.10, 1.43, -0.12), (s * 0.12, 1.46, 0.02), (s * 0.11, 1.38, 0.12), (s * 0.12, 1.20, 0.135)], 0.035, 0.008, color, tags, 'pack_strap')


def pouch(m, color, x, y, z, w=0.08, h=0.07, d=0.04, tags=(), bone='body', group=None):
    m.add(bone, box(w, h, d, 0.012), color, m=mat_t(x, y, z), label='pouch', tags=tags, group=group)


def canteen(m, color, tags=()):
    m.add('body', cylinder(m.n(10), 0.055, 0.04), color, m=mat_t(-0.17, 0.92, -0.08) @ mat_rz(math.pi / 2) @ mat_ry(0.3), label='canteen', tags=tags)


def scabbard(m, color, fitting, length=0.72, side=1, tags=(), group=None, angle=0.35):
    """Sword scabbard hanging from the belt at the hip."""
    x = side * 0.19
    base = mat_t(x, 0.98, -0.03) @ mat_rx(angle) @ mat_rz(-side * 0.08)
    sc = vertical_loft(m.n(8), [(0.0, 0.020, 0.010, 0.010), (-length * 0.8, 0.018, 0.009, 0.009), (-length, 0.008, 0.006, 0.006)], p=3)
    m.add('body', sc, color, m=base, label='scabbard', tags=tags, group=group)
    m.add('body', box(0.05, 0.02, 0.025), fitting, 'metal', m=base @ mat_t(0, 0.005, 0), label='scabbard_mouth', tags=tags, group=group)
    # grip and pommel above the mouth
    m.add('body', box(0.085, 0.012, 0.018), fitting, 'metal', m=base @ mat_t(0, 0.025, 0), label='hilt_guard', tags=tags, group=group)
    m.add('body', cylinder(6, 0.011, 0.10), LEATHER_D, m=base @ mat_t(0, 0.08, 0), label='hilt_grip', tags=tags, group=group)
    m.add('body', ellipsoid(6, 3, 0.016, 0.016, 0.016), fitting, 'metal', m=base @ mat_t(0, 0.135, 0), label='pommel', tags=tags, group=group)


# ------------------------------------------------------------------ weapon library (grip space)
def W(vq, color, mat='cloth', m=None):
    if m is not None:
        vq = transform_vq(vq, m)
    return (oriented(vq), color, mat)


def shaft(n, r, y0, y1, color=WOOD, r1=None):
    r1 = r if r1 is None else r1
    return W(vertical_loft(n, [(y0, r, r, r), (y1, r1, r1, r1)]), color)


def leaf_blade(n, length, width, thick, y0, color, mat='metal', socket=0.0):
    rows = []
    for t, w in [(0.0, 0.25), (0.08, 0.55), (0.28, 1.0), (0.55, 0.85), (0.82, 0.45), (1.0, 0.02)]:
        rows.append((y0 + t * length, width * w / 2, thick * max(0.15, w) / 2, thick * max(0.15, w) / 2))
    out = [W(vertical_loft(n, rows, p=1.6), color, mat)]
    if socket:
        out.append(W(vertical_loft(6, [(y0 - socket, 0.016, 0.016, 0.016), (y0 + 0.01, 0.012, 0.012, 0.012)]), color, mat))
    return out


def straight_blade(length, width, thick, y0, color=STEEL, taper=0.35, n=6):
    rows = [(y0, width / 2, thick / 2, thick / 2), (y0 + length * 0.7, width / 2 * (1 - taper * 0.5), thick / 2 * 0.9, thick / 2 * 0.9),
            (y0 + length * 0.94, width / 2 * 0.45, thick / 2 * 0.6, thick / 2 * 0.6), (y0 + length, width * 0.03, thick * 0.1, thick * 0.1)]
    return [W(vertical_loft(n, rows, p=1.5), color, 'metal')]


def weapon(name, lod=0, team='TEAM'):
    n = 8 if lod == 0 else 5
    if name == 'wood_spear':
        return [shaft(n, 0.015, -0.80, 1.20, '#86643c', 0.012),
                W(vertical_loft(n, [(1.20, 0.012, 0.012, 0.012), (1.30, 0.008, 0.008, 0.008), (1.42, 0.0015, 0.0015, 0.0015)]), '#3d2d1f')]
    if name == 'flint_spear':
        return [shaft(n, 0.015, -0.80, 1.22, '#86643c', 0.013)] + leaf_blade(6, 0.16, 0.05, 0.012, 1.22, '#8e8a80', 'cloth') + \
               [W(vertical_loft(n, [(1.18, 0.017, 0.017, 0.017), (1.25, 0.017, 0.017, 0.017)]), ROPE)]
    if name == 'stone_axe':
        head = merge(oriented(vertical_loft(6, [(0.0, 0.028, 0.02, 0.02), (0.055, 0.032, 0.05, 0.022), (0.10, 0.026, 0.055, 0.02)], p=2.5)))
        return [shaft(n, 0.017, -0.14, 0.50, WOOD, 0.020),
                W(head, '#7f8076', m=mat_t(0, 0.47, 0.0) @ mat_rx(-math.pi / 2) @ mat_t(0, -0.02, 0)),
                W(vertical_loft(n, [(0.41, 0.024, 0.024, 0.024), (0.52, 0.024, 0.024, 0.024)]), ROPE)]
    if name == 'club':
        return [W(vertical_loft(n, [(-0.12, 0.018, 0.018, 0.018), (0.20, 0.024, 0.024, 0.024), (0.48, 0.040, 0.040, 0.040), (0.56, 0.030, 0.03, 0.03), (0.58, 0.01, 0.01, 0.01)]), WOOD)]
    if name == 'sling':
        cord = path_loft([(0, 0.0, 0.0), (0, -0.10, 0.01), (0, -0.25, 0.02), (0, -0.40, 0.015)], [(0.004, 0.004)] * 4, 4)
        return [W(cord, ROPE), W(ellipsoid(6, 3, 0.03, 0.02, 0.035), LEATHER, m=mat_t(0, -0.43, 0.015))]
    if name == 'self_bow':
        return bow(1.55, 0.17, 0.016, WOOD_L, recurve=False)
    if name == 'composite_bow':
        return bow(1.22, 0.16, 0.017, '#5a3d27', recurve=True, tips='#e0d4b6')
    if name == 'bronze_spear':
        return [shaft(n, 0.016, -0.85, 1.30, WOOD, 0.014)] + leaf_blade(6, 0.27, 0.07, 0.016, 1.30, BRONZE, socket=0.08) + \
               [W(vertical_loft(6, [(-0.95, 0.002, 0.002, 0.002), (-0.85, 0.016, 0.016, 0.016), (-0.82, 0.017, 0.017, 0.017)]), BRONZE, 'metal')]
    if name == 'bronze_axe':
        outline = [(0.0, -0.025), (0.06, -0.035), (0.11, -0.06), (0.125, 0.0), (0.11, 0.06), (0.06, 0.035), (0.0, 0.025), (-0.02, 0.0)]
        v, q = outline_extrude(outline, [(-0.006, 1, 0), (0.006, 1, 0)])
        return [shaft(n, 0.016, -0.20, 0.70, WOOD, 0.017),
                W((v, q), BRONZE, 'metal', m=mat_t(0, 0.63, 0.0) @ _axe_plane())]
    if name == 'bronze_sword':
        return leaf_blade(6, 0.52, 0.05, 0.010, 0.07, BRONZE) + [
            W(box(0.09, 0.018, 0.022), BRONZE_D, 'metal', m=mat_t(0, 0.06, 0)),
            W(cylinder(6, 0.013, 0.11), LEATHER_D, m=mat_t(0, 0.0, 0)),
            W(ellipsoid(6, 3, 0.022, 0.014, 0.018), BRONZE_D, 'metal', m=mat_t(0, -0.06, 0))]
    if name in ('gladius', 'arming_sword', 'sabre', 'rapier'):
        L = {'gladius': 0.50, 'arming_sword': 0.78, 'sabre': 0.82, 'rapier': 0.95}[name]
        wdt = {'gladius': 0.055, 'arming_sword': 0.048, 'sabre': 0.034, 'rapier': 0.020}[name]
        guard = {'gladius': 0.07, 'arming_sword': 0.20, 'sabre': 0.10, 'rapier': 0.16}[name]
        blade = straight_blade(L, wdt, 0.008, 0.07, STEEL)
        if name == 'sabre':
            pts = [(0, 0.07 + L * t, -0.06 * t ** 2) for t in (0, 0.33, 0.66, 0.9, 1.0)]
            blade = [W(path_loft(pts, [(0.004, 0.017), (0.004, 0.017), (0.0035, 0.016), (0.003, 0.012), (0.0005, 0.002)], 4, front=(0, 0, 1), p=1.5), STEEL, 'metal')]
        return blade + [
            W(box(guard, 0.016, 0.022), BRASS if name in ('sabre', 'rapier') else IRON_D, 'metal', m=mat_t(0, 0.062, 0)),
            W(cylinder(6, 0.013, 0.12), LEATHER_D, m=mat_t(0, 0.0, 0)),
            W(ellipsoid(6, 3, 0.022, 0.018, 0.022), BRASS if name in ('sabre', 'rapier') else IRON_D, 'metal', m=mat_t(0, -0.07, 0))]
    if name == 'javelin':
        return [shaft(n, 0.011, -0.55, 0.85, WOOD_L, 0.010)] + leaf_blade(5, 0.12, 0.028, 0.010, 0.85, IRON, socket=0.05)
    if name == 'iron_spear':
        return [shaft(n, 0.016, -0.95, 1.35, WOOD, 0.014)] + leaf_blade(6, 0.30, 0.055, 0.014, 1.35, IRON, socket=0.08)
    if name == 'halberd':
        axe = [(0.0, -0.09), (0.012, -0.09), (0.10, -0.12), (0.12, 0.0), (0.10, 0.06), (0.012, 0.03), (0.0, 0.03)]
        v, q = outline_extrude(axe, [(-0.004, 1, 0), (0.004, 1, 0)])
        hook = [(0.0, -0.02), (-0.08, 0.02), (-0.10, 0.06), (-0.07, 0.02), (0.0, 0.02)]
        hv, hq = outline_extrude(hook, [(-0.004, 1, 0), (0.004, 1, 0)])
        return [shaft(n, 0.017, -0.70, 1.45, WOOD_D, 0.016),
                W((v, q), STEEL, 'metal', m=mat_t(0, 1.38, 0.0) @ _axe_plane()),
                W((hv, hq), STEEL, 'metal', m=mat_t(0, 1.40, 0.0) @ _axe_plane()),
                ] + straight_blade(0.30, 0.03, 0.012, 1.48, STEEL, n=4)
    if name == 'pike':
        return [shaft(n, 0.017, -1.30, 3.00, WOOD_L, 0.014)] + leaf_blade(5, 0.20, 0.035, 0.014, 3.00, STEEL, socket=0.25)
    if name == 'lance':
        out = [W(vertical_loft(n, [(-0.95, 0.018, 0.018, 0.018), (-0.20, 0.028, 0.028, 0.028), (0.05, 0.022, 0.022, 0.022), (2.20, 0.016, 0.016, 0.016), (2.30, 0.002, 0.002, 0.002)]), '#d8cfba'),
               W(vertical_loft(n, [(0.06, 0.02, 0.02, 0.02), (0.13, 0.085, 0.085, 0.085), (0.135, 0.02, 0.02, 0.02)]), STEEL, 'metal')]
        flag = outline_extrude([(0.0, 0.0), (0.0, -0.14), (0.28, -0.07)], [(-0.003, 1, 0), (0.003, 1, 0)])
        out.append(W(flag, team, m=mat_t(0, 2.05, 0.0) @ mat_ry(math.pi / 2) @ mat_rz(math.pi / 2) @ mat_rz(-math.pi / 2)))
        return out
    if name == 'mace':
        flange = []
        for k in range(6):
            flange.append(oriented(transform_vq(box(0.008, 0.10, 0.07), mat_ry(k * math.pi / 6) @ mat_t(0, 0, 0))))
        return [shaft(n, 0.014, -0.10, 0.48, IRON_D, 0.016), W(merge(*flange), IRON, 'metal', m=mat_t(0, 0.50, 0))]
    if name == 'crossbow':
        # stock along +Z (distal); the right hand holds the rear of the stock at the trigger
        ring = [np.array(arc_points(r, 0, 2 * math.pi, 8, 'xy', (0, 0.0, 0.67)))[:-1] + np.array([0, 0, dz]) for r, dz in ((0.05, -0.005), (0.05, 0.005), (0.04, 0.005), (0.04, -0.005))]
        out = [W(box(0.045, 0.055, 0.78, 0.01), WOOD, m=mat_t(0, 0.005, 0.24)),
               W(path_loft([(-0.36, 0.03, 0.56), (-0.18, 0.03, 0.595), (0, 0.03, 0.605), (0.18, 0.03, 0.595), (0.36, 0.03, 0.56)],
                           [(0.010, 0.012)] * 5, 4, front=(0, 1, 0)), IRON_D, 'metal'),
               W(path_loft([(-0.35, 0.035, 0.56), (0, 0.038, 0.30), (0.35, 0.035, 0.56)], [(0.002, 0.002)] * 3, 4, front=(0, 1, 0)), LINEN),
               W(torus_loft(ring), IRON_D, 'metal')]
        return out
    if name in ('arquebus', 'musket', 'rifle', 'carbine'):
        L = {'arquebus': 1.15, 'musket': 1.45, 'rifle': 1.30, 'carbine': 0.95}[name]
        stock_col = '#6e4a2c' if name != 'rifle' else '#5f3f26'
        # authored lying along +Z (muzzle forward), fist at the wrist of the stock
        out = [W(box(0.042, 0.075, 0.36, 0.012), stock_col, m=mat_t(0, -0.035, -0.20) @ mat_rx(-0.10)),
               W(box(0.034, 0.040, L * 0.62, 0.008), stock_col, m=mat_t(0, 0.012, 0.03 + L * 0.31)),
               W(cylinder(n, 0.011, L * 0.82, 0.010), IRON_D, 'metal', m=mat_t(0, 0.034, L * 0.41) @ mat_rx(math.pi / 2)),
               W(box(0.02, 0.03, 0.06), IRON_D, 'metal', m=mat_t(0.022 if name == 'arquebus' else 0.0, 0.02, 0.04))]
        if name == 'rifle':
            out += straight_blade(0.38, 0.022, 0.006, 0.0, STEEL, n=4)
            out[-1] = (oriented(transform_vq(out[-1][0], mat_t(0, 0.040, L * 0.80) @ mat_rx(math.pi / 2))), STEEL, 'metal')
        return out
    if name == 'pistol':
        return [W(box(0.035, 0.09, 0.08, 0.012), '#6e4a2c', m=mat_t(0, -0.01, -0.02) @ mat_rx(0.4)),
                W(cylinder(n, 0.010, 0.30, 0.009), IRON_D, 'metal', m=mat_t(0, 0.035, 0.15) @ mat_rx(math.pi / 2)),
                W(box(0.03, 0.04, 0.05), IRON_D, 'metal', m=mat_t(0.0, 0.03, 0.02))]
    if name == 'assault_rifle':
        out = [W(box(0.040, 0.075, 0.26, 0.012), '#2b2e2a', m=mat_t(0, 0.035, 0.10)),
               W(box(0.034, 0.060, 0.24, 0.010), '#30332e', m=mat_t(0, 0.030, 0.33)),
               W(cylinder(n, 0.009, 0.20, 0.008), '#1c1d1c', 'metal', m=mat_t(0, 0.035, 0.53) @ mat_rx(math.pi / 2)),
               W(box(0.035, 0.070, 0.22, 0.012), '#2b2e2a', m=mat_t(0, 0.0, -0.15) @ mat_rx(-0.08)),
               W(box(0.028, 0.12, 0.045, 0.006), '#3a3b36', m=mat_t(0, -0.035, 0.18) @ mat_rx(0.25)),
               W(box(0.030, 0.035, 0.11, 0.008), '#1b1c1b', 'metal', m=mat_t(0, 0.090, 0.12))]
        return out
    raise ValueError(name)


def _axe_plane():
    """Axe heads are authored as 2D outlines in XY (x = toward the edge);
    rotate so the edge faces +Z (distal) and the blade plane contains Y/Z."""
    return mat_ry(-math.pi / 2)


def bow(length, brace, r, color, recurve=False, tips=None):
    half = length / 2
    pts, rad = [], []
    segs = 8
    for k in range(segs + 1):
        t = -1 + 2 * k / segs
        y = t * half
        z = -brace * 0.55 * abs(t) ** 1.7
        if recurve and abs(t) > 0.82:
            z += 0.07 * (abs(t) - 0.82) / 0.18
        pts.append((0, y, z))
        w = r * (1.25 if abs(t) < 0.12 else max(0.45, 1 - abs(t) * 0.5))
        rad.append((w * 0.9, w * 1.2))
    out = [W(path_loft(pts, rad, 6, front=(1, 0, 0)), color)]
    end_z = pts[0][2]
    string_z = min(end_z, -brace)
    out.append(W(path_loft([(0, -half * 0.985, pts[0][2]), (0, 0, -brace), (0, half * 0.985, pts[-1][2])], [(0.0018, 0.0018)] * 3, 4), LINEN))
    if tips:
        for s in (1, -1):
            out.append(W(ellipsoid(6, 3, 0.012, 0.03, 0.012), tips, m=mat_t(0, s * half * 0.97, pts[0][2])))
    return out


def grip(m, side, parts, group=None, tags=(), m_extra=None, label='weapon'):
    """Attach grip-space weapon parts to the forearm bone of `side`."""
    bone = 'hand_' + side
    g = GRIP_L * np.array([1 if side == 'L' else -1, 1, 1])
    base = mat_t(*g) @ mat_rx(math.pi / 2)
    if m_extra is not None:
        base = base @ m_extra
    for vq, color, mat in parts:
        m.add(bone, vq, color, mat, space='local', m=base, group=group, tags=tags, label=label)


# ------------------------------------------------------------------ shields (authored facing +Z, centre at origin)
def shield_parts(kind, lod=0, team='TEAM'):
    n = 24 if lod == 0 else 12
    if kind == 'figure_eight':
        out = []
        outline = []
        for i in range(n * 2):
            a = 2 * math.pi * i / (n * 2)
            c, s = math.cos(a), math.sin(a)
            y = s * 0.56
            w = 0.36 * (abs(math.cos(math.pi * (y / 0.56))) * 0.35 + 0.65) if True else 0.36
            # pinched waist: narrow at y≈0
            w = 0.37 * (0.62 + 0.38 * abs(math.sin(math.pi * y / 0.56 * 0.5 + (0 if y == 0 else 0))) ** 0.0)
            w = 0.37 * (0.64 + 0.36 * min(1, (abs(y) / 0.28)) ** 0.8) if abs(y) < 0.28 else 0.37 * (1 - ((abs(y) - 0.28) / 0.28) ** 2) ** 0.5
            outline.append((c * w, y))
        v, q = outline_extrude(outline, [(-0.03, 0.98, 0.0), (0.0, 1.0, 0.0), (0.03, 0.85, 0.07), (0.035, 0.5, 0.12), (0.036, 0.05, 0.14)])
        out.append(W((v, q), team))
        out.append(W(vertical_loft(6, [(-0.5, 0.03, 0.01, 0.01), (0.5, 0.03, 0.01, 0.01)], p=4), '#e6dcc0', m=mat_t(0, 0, 0.16)))
        return out
    if kind in ('round_small', 'round_boss', 'round_wicker'):
        r = {'round_small': 0.30, 'round_boss': 0.40, 'round_wicker': 0.38}[kind]
        outline = superellipse_outline(n, r * 2, r * 2)
        v, q = outline_extrude(outline, [(-0.012, 1.0, 0), (0.0, 1.0, 0), (0.012, 0.97, 0.0), (0.014, 0.6, 0.02), (0.015, 0.05, 0.03)])
        qc = None
        out = [W((v, q), team if kind != 'round_wicker' else '#a58a5a')]
        rim = torus_loft([[(math.cos(2 * math.pi * i / n) * rr, math.sin(2 * math.pi * i / n) * rr, z) for i in range(n)]
                          for rr, z in ((r * 0.97, -0.014), (r * 1.02, -0.014), (r * 1.02, 0.016), (r * 0.97, 0.016))])
        out.append(W(rim, BRONZE if kind == 'round_small' else (IRON_D if kind == 'round_boss' else WOOD_D), 'metal' if kind != 'round_wicker' else 'cloth'))
        out.append(W(ellipsoid(n // 2, 5, 0.075, 0.075, 0.05, lat0=0.0), BRONZE if kind == 'round_small' else IRON, 'metal', m=mat_t(0, 0, 0.03)))
        return out
    if kind == 'oval':
        outline = superellipse_outline(n, 0.66, 1.10, 2.2)
        v, q = outline_extrude(outline, [(-0.02, 1.0, 0), (0.0, 1.0, 0), (0.02, 0.98, 0.0), (0.03, 0.7, 0.04), (0.03, 0.1, 0.06)])
        out = [W((v, q), team)]
        out.append(W(vertical_loft(6, [(-0.5, 0.025, 0.008, 0.008), (0.5, 0.025, 0.008, 0.008)], p=4), IRON_D, 'metal', m=mat_t(0, 0, 0.065)))
        out.append(W(ellipsoid(12, 5, 0.085, 0.085, 0.06, lat0=0.0), IRON, 'metal', m=mat_t(0, 0, 0.07)))
        return out
    if kind == 'heater':
        outline = []
        for i in range(n):
            a = 2 * math.pi * i / n
            c, s = math.cos(a), math.sin(a)
            if s >= 0:
                x, y = c * 0.27, 0.22 + s * 0.06 * (1 - abs(c) ** 6)
                x = math.copysign(abs(c) ** 0.3, c) * 0.27
                y = 0.22
            else:
                t = -s
                x = math.copysign(abs(c) ** 0.6, c) * 0.27 * (1 - t ** 2.2)
                y = 0.22 - 0.62 * t ** 0.9
            outline.append((x, y))
        v, q = outline_extrude(outline, [(-0.015, 1.0, 0), (0.0, 1.0, 0), (0.015, 0.97, 0.0), (0.02, 0.6, 0.03), (0.02, 0.1, 0.04)])
        out = [W((v, q), team)]
        stripe = outline_extrude([(-0.05, 0.22), (0.05, 0.22), (0.05, -0.30), (0.0, -0.36), (-0.05, -0.30)], [(0.045, 1, 0), (0.05, 1, 0)])
        out.append(W(stripe, '#e8e0cc'))
        return out
    raise ValueError(kind)


def place_shield(m, kind, center, normal, up=(0, 1, 0), tags=(), group=None, lod=0, team='TEAM', bone='forearm_L'):
    """Place a shield in rest-pose world space on the given bone."""
    nrm = norm(normal)
    upv = np.asarray(up, float)
    upv = norm(upv - np.dot(upv, nrm) * nrm)
    xv = np.cross(upv, nrm)
    M = np.eye(4)
    M[:3, 0], M[:3, 1], M[:3, 2], M[:3, 3] = xv, upv, nrm, center
    for vq, color, mat in shield_parts(kind, lod, team):
        m.add(bone, vq, color, mat, space='posed', m=M, tags=tags, group=group, label='shield')
