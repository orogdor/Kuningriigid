"""Riding horse (about 1.55 m at the withers) with tack, built from quad lofts.
Anatomy: barrel, croup, withers, arched neck, wedge head with ears, forearm/
carpus/cannon/fetlock/pastern/hoof in front, gaskin/hock/cannon behind."""
import math
import numpy as np
from geom import path_loft, ellipsoid, vertical_loft, box, cylinder, ring_loft, torus_loft, mat_t, mat_rx, mat_ry, mat_rz, mat_s, lerp
from rig import SADDLE_TOP, SADDLE_Z

COATS = {
    'bay': dict(coat='#6a4430', dark='#2a1f1a', hoof='#3b3530', muzzle='#3f3029'),
    'chestnut': dict(coat='#8a5131', dark='#6a3a22', hoof='#4a3d33', muzzle='#5a3a2a'),
    'grey': dict(coat='#a9a59c', dark='#77736c', hoof='#4a4743', muzzle='#6c6863'),
    'black': dict(coat='#2f2a27', dark='#1c1917', hoof='#2a2725', muzzle='#262220'),
}

BODY = [  # z, yc, rx, top, bottom
    (-0.835, 1.19, 0.06, 0.06, 0.08), (-0.80, 1.20, 0.15, 0.14, 0.18), (-0.70, 1.21, 0.21, 0.19, 0.25),
    (-0.56, 1.22, 0.235, 0.205, 0.285), (-0.36, 1.20, 0.240, 0.185, 0.305), (-0.08, 1.17, 0.250, 0.195, 0.315),
    (0.20, 1.19, 0.245, 0.215, 0.305), (0.44, 1.23, 0.215, 0.240, 0.285), (0.62, 1.21, 0.175, 0.215, 0.255),
    (0.73, 1.19, 0.115, 0.15, 0.18), (0.78, 1.18, 0.05, 0.06, 0.08)]


def build_horse(m, coat='bay', barding=None, saddle_cloth='TEAM', tags=()):
    c = COATS[coat]
    n = m.n(16)
    pts = [(0, yc, z) for z, yc, rx, top, bot in BODY]
    rad = [(rx, top, bot) for z, yc, rx, top, bot in BODY]
    m.add('horse', path_loft(pts, rad, n, front=(0, 1, 0), p=2.2), c['coat'], label='horse_body', tags=tags)
    # neck (arched), crest + mane
    neck_pts = [(0, 1.26, 0.50), (0, 1.40, 0.64), (0, 1.58, 0.77), (0, 1.74, 0.87), (0, 1.84, 0.92)]
    neck_rad = [(0.14, 0.17, 0.20), (0.125, 0.15, 0.17), (0.10, 0.12, 0.13), (0.08, 0.10, 0.10), (0.06, 0.07, 0.07)]
    m.add('horseNeck', path_loft(neck_pts, neck_rad, m.n(12), front=(0, 0.55, -0.83)), c['coat'], label='horse_neck', tags=tags)
    mane = [(0, 1.43, 0.50), (0, 1.60, 0.63), (0, 1.77, 0.76), (0, 1.90, 0.86)]
    m.add('horseNeck', path_loft(mane, [(0.02, 0.03), (0.025, 0.035), (0.025, 0.03), (0.018, 0.02)], m.n(6), front=(0, 0.6, -0.8)), c['dark'], label='mane', tags=tags)
    # head: forehead -> nose -> muzzle
    head_pts = [(0, 1.86, 0.90), (0, 1.82, 0.99), (0, 1.70, 1.10), (0, 1.56, 1.22), (0, 1.47, 1.30), (0, 1.43, 1.33)]
    head_rad = [(0.075, 0.07, 0.10), (0.085, 0.07, 0.13), (0.075, 0.06, 0.10), (0.060, 0.05, 0.07), (0.058, 0.05, 0.065), (0.045, 0.035, 0.04)]
    m.add('horseHead', path_loft(head_pts, head_rad, m.n(12), front=(0, 0.6, 0.8)), c['coat'], label='horse_head', tags=tags)
    m.add('horseHead', ellipsoid(m.n(10), 4, 0.058, 0.05, 0.055), c['muzzle'], m=mat_t(0, 1.45, 1.31) @ mat_rx(-0.75), label='muzzle', tags=tags)
    for s in (1, -1):
        ear = path_loft([(s * 0.05, 1.88, 0.90), (s * 0.06, 1.94, 0.89), (s * 0.065, 1.99, 0.88)], [(0.018, 0.012), (0.016, 0.010), (0.003, 0.002)], m.n(6), front=(0, 0, 1))
        m.add('horseHead', ear, c['coat'], label='ear', tags=tags)
        m.add('horseHead', ellipsoid(m.n(6), 3, 0.012, 0.016, 0.016), '#1a1512', m=mat_t(s * 0.072, 1.80, 1.00), label='eye', tags=tags)
        m.add('horseHead', ellipsoid(m.n(6), 3, 0.010, 0.012, 0.010), '#1a1512', m=mat_t(s * 0.03, 1.44, 1.355), label='nostril', tags=tags)
    # forelock
    m.add('horseHead', path_loft([(0, 1.90, 0.90), (0, 1.86, 0.96), (0, 1.80, 1.01)], [(0.03, 0.01), (0.03, 0.012), (0.012, 0.006)], m.n(6), front=(0, 0, 1)), c['dark'], label='forelock', tags=tags)
    # legs
    for side, sx in (('L', 1), ('R', -1)):
        x = sx * 0.165
        # front: forearm + carpus
        m.add('horseLeg_F' + side, path_loft([(x, 1.10, 0.52), (x, 0.95, 0.53), (x, 0.72, 0.54), (x, 0.55, 0.54), (x, 0.50, 0.54)],
                                              [(0.075, 0.085, 0.07), (0.065, 0.08, 0.065), (0.047, 0.05, 0.045), (0.040, 0.045, 0.04), (0.035, 0.035, 0.035)], m.n(10), front=(0, 0, 1)),
              c['coat'], label='forearm', tags=tags)
        lower_f = [(x, 0.56, 0.54), (x, 0.50, 0.54), (x, 0.32, 0.54), (x, 0.19, 0.545), (x, 0.15, 0.555), (x, 0.09, 0.585), (x, 0.06, 0.60)]
        m.add('horseShin_F' + side, path_loft(lower_f, [(0.04, 0.045, 0.04), (0.034, 0.035, 0.038), (0.028, 0.026, 0.032), (0.038, 0.042, 0.040), (0.033, 0.034, 0.034), (0.030, 0.030, 0.030), (0.035, 0.035, 0.035)], m.n(8), front=(0, 0, 1)),
              c['dark'], label='cannon', tags=tags)
        hoof = vertical_loft(m.n(10), [(0.0, 0.050, 0.060, 0.042), (0.035, 0.046, 0.055, 0.040), (0.072, 0.036, 0.040, 0.034)], cx=x, cz=0.615)
        m.add('horseShin_F' + side, hoof, c['hoof'], label='hoof', tags=tags)
        # hind: gaskin + hock
        m.add('horseLeg_H' + side, path_loft([(sx * 0.16, 1.12, -0.50), (sx * 0.165, 0.95, -0.56), (sx * 0.17, 0.76, -0.62), (sx * 0.17, 0.60, -0.65), (sx * 0.17, 0.54, -0.655)],
                                              [(0.11, 0.13, 0.13), (0.085, 0.10, 0.11), (0.055, 0.06, 0.07), (0.042, 0.045, 0.055), (0.035, 0.035, 0.035)], m.n(10), front=(0, 0, 1)),
              c['coat'], label='gaskin', tags=tags)
        lower_h = [(sx * 0.17, 0.60, -0.655), (sx * 0.17, 0.54, -0.645), (sx * 0.17, 0.34, -0.625), (sx * 0.17, 0.19, -0.62), (sx * 0.17, 0.15, -0.61), (sx * 0.17, 0.09, -0.585), (sx * 0.17, 0.06, -0.57)]
        m.add('horseShin_H' + side, path_loft(lower_h, [(0.042, 0.05, 0.055), (0.034, 0.038, 0.045), (0.028, 0.026, 0.034), (0.038, 0.042, 0.040), (0.033, 0.034, 0.034), (0.030, 0.030, 0.030), (0.035, 0.035, 0.035)], m.n(8), front=(0, 0, 1)),
              c['dark'], label='hind_cannon', tags=tags)
        hoof = vertical_loft(m.n(10), [(0.0, 0.050, 0.060, 0.042), (0.035, 0.046, 0.055, 0.040), (0.072, 0.036, 0.040, 0.034)], cx=sx * 0.17, cz=-0.555)
        m.add('horseShin_H' + side, hoof, c['hoof'], label='hoof', tags=tags)
    # tail
    tail = [(0, 1.36, -0.78), (0, 1.30, -0.88), (0, 1.12, -0.93), (0, 0.90, -0.92), (0, 0.66, -0.88)]
    m.add('horseTail', path_loft(tail, [(0.035, 0.035), (0.05, 0.05), (0.07, 0.055), (0.07, 0.05), (0.02, 0.015)], m.n(8), front=(0, 0, -1)), c['dark'], label='tail', tags=tags)
    build_tack(m, saddle_cloth, barding, tags)


def build_tack(m, cloth, barding, tags):
    st = SADDLE_TOP
    z = SADDLE_Z
    # saddle cloth (team colour) and leather saddle with pommel and cantle
    m.add('horse', path_loft([(0, st - 0.10, z - 0.30), (0, st - 0.075, z - 0.05), (0, st - 0.065, z + 0.17), (0, st - 0.08, z + 0.32)],
                             [(0.27, 0.03, 0.03), (0.30, 0.03, 0.03), (0.30, 0.03, 0.03), (0.26, 0.03, 0.03)], m.n(10), front=(0, 1, 0), p=5),
          cloth, label='saddle_cloth', tags=tags + ('tack',))
    # drape of the cloth down the flanks
    for s in (1, -1):
        rows = []
        for yy in (st - 0.09, st - 0.33):
            rows.append([(s * (0.26 + (st - yy) * 0.12), yy, z + dz) for dz in (-0.30, 0.30)] +
                        [(s * (0.245 + (st - yy) * 0.12), yy, z + dz) for dz in (0.30, -0.30)])
        m.add('horse', ring_loft(rows), cloth, label='saddle_drape', tags=tags + ('tack',))
    m.add('horse', path_loft([(0, st - 0.05, z - 0.20), (0, st - 0.035, z), (0, st - 0.04, z + 0.20)],
                             [(0.17, 0.035, 0.03), (0.15, 0.03, 0.03), (0.16, 0.035, 0.03)], m.n(10), front=(0, 1, 0), p=3), '#5a3b26', label='saddle', tags=tags + ('tack',))
    m.add('horse', ellipsoid(m.n(8), 4, 0.10, 0.06, 0.04), '#5a3b26', m=mat_t(0, st + 0.02, z - 0.22), label='cantle', tags=tags + ('tack',))
    m.add('horse', ellipsoid(m.n(8), 4, 0.08, 0.06, 0.04), '#5a3b26', m=mat_t(0, st + 0.01, z + 0.22), label='pommel', tags=tags + ('tack',))
    # girth
    m.add('horse', path_loft([(0.25, st - 0.12, z + 0.12), (0.30, 1.10, z + 0.14), (0.24, 0.90, z + 0.16), (0, 0.85, z + 0.16), (-0.24, 0.90, z + 0.16), (-0.30, 1.10, z + 0.14), (-0.25, st - 0.12, z + 0.12)],
                             [(0.035, 0.006)] * 7, 4, front=(0, 0, 1), p=6), '#3d2a1c', label='girth', tags=tags + ('tack',))
    # stirrup leathers + irons
    for s in (1, -1):
        m.add('horse', path_loft([(s * 0.17, st - 0.02, z + 0.06), (s * 0.29, 1.20, z + 0.10), (s * 0.31, 0.98, z + 0.12)], [(0.016, 0.004)] * 3, 4, front=(1, 0, 0), p=6), '#3d2a1c', label='stirrup_leather', tags=tags + ('tack',))
        ring = [[(s * 0.31 + math.cos(a) * r, 0.93 + math.sin(a) * r * 0.9, z + 0.12 + dz) for a in np.linspace(0, 2 * math.pi, 9)[:-1]] for r, dz in ((0.05, -0.012), (0.05, 0.012), (0.04, 0.012), (0.04, -0.012))]
        m.add('horse', torus_loft([np.array(r)[:, [0, 1, 2]] for r in ring]), '#4d5054', 'metal', m=None, label='stirrup', tags=tags + ('tack',))
    # bridle on head, reins to the saddle front
    m.add('horseHead', path_loft([(0.075, 1.80, 0.94), (0.07, 1.62, 1.16), (0.06, 1.48, 1.28), (-0.06, 1.48, 1.28), (-0.07, 1.62, 1.16), (-0.075, 1.80, 0.94)],
                                 [(0.008, 0.012)] * 6, 4, front=(0, 0, 1), p=6), '#2e2118', label='bridle', tags=tags + ('tack',))
    m.add('horseHead', path_loft([(0.08, 1.88, 0.92), (0, 1.93, 0.91), (-0.08, 1.88, 0.92)], [(0.008, 0.012)] * 3, 4, front=(0, 0, 1), p=6), '#2e2118', label='headstall', tags=tags + ('tack',))
    for s in (1, -1):
        m.add('horseNeck', path_loft([(s * 0.065, 1.47, 1.26), (s * 0.10, 1.48, 0.95), (s * 0.10, 1.48, 0.62), (s * 0.08, st + 0.04, z + 0.33)],
                                     [(0.005, 0.009)] * 4, 4, front=(0, 1, 0), p=6), '#2e2118', label='rein', tags=tags + ('tack',))
    if barding:
        # caparison: cloth that follows the back and croup and hangs to just below the belly.
        # Each ring is a thin closed shell: outer arc over the back, sides dropping to the hem,
        # then the same path back on the inside (hidden inside the horse).
        hem, g, th = 0.80, 0.035, 0.015
        rings = []
        arc = 10 if m.lod == 0 else 6
        for z0, yc, rx, top, bot in BODY[1:-1]:
            W, H = rx + g, top + g
            outer = [(W, hem)] + [(W, yc)] + [(W * math.cos(math.pi * k / arc), yc + H * math.sin(math.pi * k / arc)) for k in range(1, arc)] + [(-W, yc), (-W, hem)]
            inner = [(x * (W - th) / W, hem if y == hem else yc + (y - yc) * (H - th) / H) for x, y in outer[::-1]]
            rings.append([(x, y, z0) for x, y in outer + inner])
        m.add('horse', ring_loft(rings), barding, label='caparison', tags=tags + ('tack', 'barding'))
        m.add('horseHead', path_loft([(0, 1.88, 0.95), (0, 1.74, 1.09), (0, 1.58, 1.21)], [(0.085, 0.03, 0.02), (0.08, 0.03, 0.02), (0.065, 0.03, 0.02)], m.n(8), front=(0, 0.6, 0.8), p=3), '#9ca3a8', 'metal', label='chanfron', tags=tags + ('tack', 'barding'))
