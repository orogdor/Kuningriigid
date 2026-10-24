"""V148 quad geometry kernel for soldier models.

Every surface is authored as rings of points that are joined with quads
(the same "quad workflow" as the V48-V50 models). Each Part is a closed,
consistently wound volume; caps are quad fans whose last vertex repeats
(degenerate quads become single triangles on export).
"""
import math
import numpy as np


def v3(*a):
    return np.array(a if len(a) == 3 else a[0], dtype=float)


def norm(a):
    a = np.asarray(a, dtype=float)
    n = np.linalg.norm(a)
    return a / n if n > 1e-12 else a


def smoothstep(e0, e1, x):
    t = min(1.0, max(0.0, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


def lerp(a, b, t):
    return a + (b - a) * t


# ---------------------------------------------------------------- matrices
def mat_t(x, y, z):
    m = np.eye(4)
    m[:3, 3] = (x, y, z)
    return m


def mat_rx(a):
    c, s = math.cos(a), math.sin(a)
    m = np.eye(4)
    m[1, 1], m[1, 2], m[2, 1], m[2, 2] = c, -s, s, c
    return m


def mat_ry(a):
    c, s = math.cos(a), math.sin(a)
    m = np.eye(4)
    m[0, 0], m[0, 2], m[2, 0], m[2, 2] = c, s, -s, c
    return m


def mat_rz(a):
    c, s = math.cos(a), math.sin(a)
    m = np.eye(4)
    m[0, 0], m[0, 1], m[1, 0], m[1, 1] = c, -s, s, c
    return m


def mat_euler(x, y, z):
    """three.js default Euler order 'XYZ': M = Rx * Ry * Rz."""
    return mat_rx(x) @ mat_ry(y) @ mat_rz(z)


def mat_s(x, y=None, z=None):
    m = np.eye(4)
    m[0, 0] = x
    m[1, 1] = x if y is None else y
    m[2, 2] = x if z is None else z
    return m


def quat_from_euler(x, y, z):
    """Identical to THREE.Quaternion.setFromEuler for order XYZ."""
    c1, c2, c3 = math.cos(x / 2), math.cos(y / 2), math.cos(z / 2)
    s1, s2, s3 = math.sin(x / 2), math.sin(y / 2), math.sin(z / 2)
    return (s1 * c2 * c3 + c1 * s2 * s3,
            c1 * s2 * c3 - s1 * c2 * s3,
            c1 * c2 * s3 + s1 * s2 * c3,
            c1 * c2 * c3 - s1 * s2 * s3)


def look_frame(direction, up=(0, 1, 0)):
    """Matrix whose local +Y axis points along `direction` (used to orient
    lofts that are authored along +Y)."""
    d = norm(direction)
    u = np.asarray(up, float)
    if abs(np.dot(d, norm(u))) > 0.98:
        u = np.array([0, 0, 1.0]) if abs(d[2]) < 0.9 else np.array([1.0, 0, 0])
    x = norm(np.cross(d, u))
    z = np.cross(x, d)
    m = np.eye(4)
    m[:3, 0], m[:3, 1], m[:3, 2] = x, d, z
    return m


def apply(m, pts):
    p = np.asarray(pts, dtype=float)
    return (np.c_[p, np.ones(len(p))] @ m.T)[:, :3]


# ---------------------------------------------------------------- parts
class Part:
    """A closed quad volume, owned by one bone section."""

    def __init__(self, bone, color, mat='cloth', group=None, tags=(), label=''):
        self.bone, self.color, self.mat, self.group = bone, color, mat, group
        self.tags = tuple(tags)
        self.label = label
        self.v = np.zeros((0, 3))
        self.q = []

    def triangles(self):
        tris = []
        for a, b, c, d in self.q:
            if len({a, b, c}) == 3:
                tris.append((a, b, c))
            if len({a, c, d}) == 3:
                tris.append((a, c, d))
        return tris

    def signed_volume(self):
        v = self.v
        vol = 0.0
        for a, b, c in self.triangles():
            vol += np.dot(v[a], np.cross(v[b], v[c]))
        return vol / 6.0

    def flip(self):
        self.q = [(a, d, c, b) for a, b, c, d in self.q]

    def orient_outward(self):
        if self.signed_volume() < 0:
            self.flip()

    def transform(self, m):
        self.v = apply(m, self.v)
        if np.linalg.det(m[:3, :3]) < 0:
            self.flip()
        return self


def ring_loft(rings, cap_start=True, cap_end=True):
    """rings: list of (n,3) point arrays with identical n. Returns (verts, quads).
    Side quads use order (j,i),(j+1,i),(j+1,i+1),(j,i+1). Caps are fans."""
    rings = [np.asarray(r, float) for r in rings]
    n = len(rings[0])
    verts = np.concatenate(rings)
    quads = []
    for j in range(len(rings) - 1):
        for i in range(n):
            i2 = (i + 1) % n
            quads.append((j * n + i, (j + 1) * n + i, (j + 1) * n + i2, j * n + i2))
    extra = []
    if cap_start:
        c = len(verts) + len(extra)
        extra.append(rings[0].mean(axis=0))
        for i in range(n):
            quads.append((c, i, (i + 1) % n, (i + 1) % n))
    if cap_end:
        c = len(verts) + len(extra)
        extra.append(rings[-1].mean(axis=0))
        base = (len(rings) - 1) * n
        for i in range(n):
            quads.append((c, base + (i + 1) % n, base + i, base + i))
    if extra:
        verts = np.vstack([verts, np.array(extra)])
    return verts, quads


def section_ring(n, rx, rzf, rzb=None, p=2.0, phase=0.0, rxl=None):
    """Closed superellipse ring in the local XZ plane. rzf = front (+Z) depth,
    rzb = back depth, rx = half width (+X side), rxl = -X side half width."""
    rzb = rzf if rzb is None else rzb
    rxl = rx if rxl is None else rxl
    e = 2.0 / p
    out = []
    for i in range(n):
        a = 2 * math.pi * i / n + phase
        c, s = math.cos(a), math.sin(a)
        x = math.copysign(abs(c) ** e, c) * (rx if c >= 0 else rxl)
        z = math.copysign(abs(s) ** e, s) * (rzf if s >= 0 else rzb)
        out.append((x, 0.0, z))
    return np.array(out)


def vertical_loft(n, spec, p=2.0, cap_start=True, cap_end=True, cx=0.0, cz=0.0):
    """spec rows: (y, rx, rzf, rzb[, dx, dz[, p]]). Builds a loft along Y."""
    rings = []
    for row in spec:
        y, rx, rzf, rzb = row[:4]
        dx = row[4] if len(row) > 4 else 0.0
        dz = row[5] if len(row) > 5 else 0.0
        pp = row[6] if len(row) > 6 else p
        r = section_ring(n, rx, rzf, rzb, pp)
        r[:, 0] += cx + dx
        r[:, 1] = y
        r[:, 2] += cz + dz
        rings.append(r)
    return ring_loft(rings, cap_start, cap_end)


def path_loft(points, radii, n, front=(0, 0, 1), p=2.0, cap_start=True, cap_end=True):
    """Loft along an arbitrary polyline. radii rows: (rx, rzf[, rzb]).
    'front' picks the ring orientation (local +Z of every ring)."""
    pts = [np.asarray(x, float) for x in points]
    rings = []
    F = norm(front)
    for k, P in enumerate(pts):
        if k == 0:
            T = pts[1] - pts[0]
        elif k == len(pts) - 1:
            T = pts[-1] - pts[-2]
        else:
            T = pts[k + 1] - pts[k - 1]
        T = norm(T)
        U = F - np.dot(F, T) * T
        if np.linalg.norm(U) < 1e-6:
            U = np.array([1.0, 0, 0]) - T[0] * T
        U = norm(U)
        S = np.cross(T, U)
        rr = radii[k]
        rx, rzf = rr[0], rr[1]
        rzb = rr[2] if len(rr) > 2 else rzf
        loc = section_ring(n, rx, rzf, rzb, p)
        ring = P + np.outer(loc[:, 0], S) + np.outer(loc[:, 2], U)
        rings.append(ring)
    return ring_loft(rings, cap_start, cap_end)


def ellipsoid(n, rings, rx, ry, rz, deform=None, lat0=-math.pi / 2, lat1=math.pi / 2):
    """Ellipsoid built from latitude rings (poles closed by tiny fans)."""
    rr = []
    for j in range(rings + 1):
        lat = lat0 + (lat1 - lat0) * (0.03 + 0.94 * j / rings)
        ring = []
        for i in range(n):
            a = 2 * math.pi * i / n
            x = rx * math.cos(lat) * math.cos(a)
            y = ry * math.sin(lat)
            z = rz * math.cos(lat) * math.sin(a)
            if deform:
                x, y, z = deform(x, y, z, lat, a)
            ring.append((x, y, z))
        rr.append(ring)
    return ring_loft(rr)


def box(w, h, d, bevel=0.0, n_round=None):
    """Axis-aligned box centred at the origin. With bevel>0 a softened
    superellipse loft is used (reads better than sharp boxes)."""
    if bevel <= 0:
        x, y, z = w / 2, h / 2, d / 2
        v = np.array([(-x, -y, -z), (x, -y, -z), (x, y, -z), (-x, y, -z),
                      (-x, -y, z), (x, -y, z), (x, y, z), (-x, y, z)])
        q = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 4, 7, 3), (1, 2, 6, 5), (0, 1, 5, 4), (3, 7, 6, 2)]
        return v, q
    n = n_round or 8
    hb = min(bevel, h / 2 * 0.9)
    spec = [(-h / 2, w / 2 - hb, d / 2 - hb, d / 2 - hb),
            (-h / 2 + hb * 0.35, w / 2 - hb * 0.25, d / 2 - hb * 0.25, d / 2 - hb * 0.25),
            (h / 2 - hb * 0.35, w / 2 - hb * 0.25, d / 2 - hb * 0.25, d / 2 - hb * 0.25),
            (h / 2, w / 2 - hb, d / 2 - hb, d / 2 - hb)]
    return vertical_loft(n, spec, p=5.0)


def cylinder(n, r, h, r2=None, segs=1):
    r2 = r if r2 is None else r2
    spec = [(-h / 2 + h * k / segs, lerp(r, r2, k / segs), lerp(r, r2, k / segs), lerp(r, r2, k / segs)) for k in range(segs + 1)]
    return vertical_loft(n, spec)


def arc_points(radius, a0, a1, segs, plane='xy', center=(0, 0, 0)):
    out = []
    for k in range(segs + 1):
        a = a0 + (a1 - a0) * k / segs
        c, s = math.cos(a) * radius, math.sin(a) * radius
        if plane == 'xy':
            out.append((center[0] + c, center[1] + s, center[2]))
        elif plane == 'zy':
            out.append((center[0], center[1] + s, center[2] + c))
        else:
            out.append((center[0] + c, center[1], center[2] + s))
    return out


def outline_extrude(outline, depth_layers):
    """Extrude a closed 2D outline (list of (x,y)) along Z.
    depth_layers: list of (z, scale, dz_dome) – a dome bulges the layer."""
    outline = np.asarray(outline, float)
    rings = []
    for z, s, dome in depth_layers:
        r = np.c_[outline[:, 0] * s, outline[:, 1] * s, np.full(len(outline), z + dome)]
        rings.append(r)
    return ring_loft(rings)


def superellipse_outline(n, w, h, p=2.0, taper=0.0, point=0.0):
    """Outline for shields: taper narrows the bottom, point sharpens it."""
    out = []
    e = 2.0 / p
    for i in range(n):
        a = 2 * math.pi * i / n
        c, s = math.cos(a), math.sin(a)
        x = math.copysign(abs(c) ** e, c) * w / 2
        y = math.copysign(abs(s) ** e, s) * h / 2
        if y < 0:
            x *= 1 - taper * (-y / (h / 2))
            if point:
                x *= 1 - point * (-y / (h / 2)) ** 2
        out.append((x, y))
    return out


def torus_loft(rings):
    """Rings joined periodically in both directions (a closed band, e.g. a brim)."""
    rings = [np.asarray(r, float) for r in rings]
    n, K = len(rings[0]), len(rings)
    verts = np.concatenate(rings)
    quads = []
    for j in range(K):
        j2 = (j + 1) % K
        for i in range(n):
            i2 = (i + 1) % n
            quads.append((j * n + i, j2 * n + i, j2 * n + i2, j * n + i2))
    return verts, quads


def merge(*vqs):
    verts, quads, off = [], [], 0
    for v, q in vqs:
        verts.append(np.asarray(v, float))
        quads += [tuple(i + off for i in f) for f in q]
        off += len(v)
    return np.concatenate(verts), quads


def transform_vq(vq, m):
    v, q = vq
    v = apply(m, v)
    if np.linalg.det(m[:3, :3]) < 0:
        q = [(a, d, c, b) for a, b, c, d in q]
    return v, q


def oriented(vq):
    v, q = vq
    p = Part('x', '#000')
    p.v, p.q = np.asarray(v, float), list(q)
    p.orient_outward()
    return p.v, p.q
