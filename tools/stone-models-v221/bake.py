"""Re-texture a simplified mesh: pack triangle pairs into a square atlas and bake the colour of the
nearest point of the original high-poly mesh (its UV + texture) into every texel."""
import numpy as np, math
from scipy.spatial import cKDTree
from PIL import Image

def pair_faces(F):
    edge = {}
    for fi, f in enumerate(F):
        for k in range(3):
            a, b = int(f[k]), int(f[(k + 1) % 3])
            edge.setdefault((min(a, b), max(a, b)), []).append(fi)
    used = np.zeros(len(F), bool)
    pairs = []
    for fi, f in enumerate(F):
        if used[fi]:
            continue
        mate = None
        for k in range(3):
            a, b = int(f[k]), int(f[(k + 1) % 3])
            for g in edge[(min(a, b), max(a, b))]:
                if g != fi and not used[g]:
                    mate = (g, a, b)
                    break
            if mate:
                break
        used[fi] = True
        if mate:
            g, a, b = mate
            used[g] = True
            pairs.append((fi, g, a, b))
        else:
            pairs.append((fi, None, None, None))
    return pairs

def closest_on_tris(p, a, b, c):
    # vectorised closest point on triangle (Ericson); returns barycentrics (u,v,w) and point
    ab, ac, ap = b - a, c - a, p - a
    d1 = np.einsum('ij,ij->i', ab, ap); d2 = np.einsum('ij,ij->i', ac, ap)
    bp = p - b; d3 = np.einsum('ij,ij->i', ab, bp); d4 = np.einsum('ij,ij->i', ac, bp)
    cp = p - c; d5 = np.einsum('ij,ij->i', ab, cp); d6 = np.einsum('ij,ij->i', ac, cp)
    va = d3 * d6 - d5 * d4; vb = d5 * d2 - d1 * d6; vc = d1 * d4 - d3 * d2
    den = np.where(np.abs(va + vb + vc) < 1e-20, 1e-20, va + vb + vc)
    v = vb / den; w = vc / den; u = 1 - v - w
    bary = np.stack([u, v, w], 1)
    # regions
    def setb(mask, bu, bv, bw):
        bary[mask] = np.stack([bu[mask], bv[mask], bw[mask]], 1)
    one, zero = np.ones(len(p)), np.zeros(len(p))
    m = (d1 <= 0) & (d2 <= 0); setb(m, one, zero, zero)
    m = (d3 >= 0) & (d4 <= d3); setb(m, zero, one, zero)
    m = (d6 >= 0) & (d5 <= d6); setb(m, zero, zero, one)
    t = np.clip(d1 / np.where(np.abs(d1 - d3) < 1e-20, 1e-20, d1 - d3), 0, 1)
    m = (vc <= 0) & (d1 >= 0) & (d3 <= 0); setb(m, 1 - t, t, zero)
    t = np.clip(d2 / np.where(np.abs(d2 - d6) < 1e-20, 1e-20, d2 - d6), 0, 1)
    m = (vb <= 0) & (d2 >= 0) & (d6 <= 0); setb(m, 1 - t, zero, t)
    t = np.clip((d4 - d3) / np.where(np.abs((d4 - d3) + (d5 - d6)) < 1e-20, 1e-20, (d4 - d3) + (d5 - d6)), 0, 1)
    m = (va <= 0) & ((d4 - d3) >= 0) & ((d5 - d6) >= 0); setb(m, zero, 1 - t, t)
    q = a * bary[:, :1] + b * bary[:, 1:2] + c * bary[:, 2:3]
    return bary, q

def sample(img, uv):
    H, W = img.shape[:2]
    x = np.clip(uv[:, 0] * W - .5, 0, W - 1.001); y = np.clip(uv[:, 1] * H - .5, 0, H - 1.001)
    x0 = np.floor(x).astype(int); y0 = np.floor(y).astype(int); fx = (x - x0)[:, None]; fy = (y - y0)[:, None]
    c00 = img[y0, x0]; c10 = img[y0, x0 + 1]; c01 = img[y0 + 1, x0]; c11 = img[y0 + 1, x0 + 1]
    return (c00 * (1 - fx) + c10 * fx) * (1 - fy) + (c01 * (1 - fx) + c11 * fx) * fy

def bake(orig, P, F, size=1024, pad=1.5, chunk=60000):
    pairs = pair_faces(F)
    g = math.ceil(math.sqrt(len(pairs)))
    cell = size / g
    # output vertices: 3 per face corner (positions from P, uv per atlas)
    outP, outUV, outF, outSrc = [], [], [], []
    tex_pts, tex_px = [], []
    ys, xs = np.mgrid[0:size, 0:size]
    src_img = np.asarray(orig['images']['base'].convert('RGB'), np.float32)
    oP, oUV, oF = orig['pos'], orig['uv'], orig['idx']
    cent = (oP[oF[:, 0]] + oP[oF[:, 1]] + oP[oF[:, 2]]) / 3
    tree = cKDTree(cent)
    atlas = np.zeros((size, size, 3), np.float32)
    def emit(f, uvs):
        base = len(outP)
        for v, uv in zip(f, uvs):
            outP.append(P[v]); outUV.append(uv); outSrc.append(v)
        outF.append([base, base + 1, base + 2])
    for ci, (f1, f2, s0, s1) in enumerate(pairs):
        gx, gy = ci % g, ci // g
        x0, y0 = gx * cell + pad, gy * cell + pad
        w = cell - 2 * pad
        A = (x0, y0); B = (x0 + w, y0); C = (x0 + w, y0 + w); D = (x0, y0 + w)
        uvA, uvB, uvC, uvD = [np.array([p[0] / size, p[1] / size]) for p in (A, B, C, D)]
        t1 = F[f1]
        if f2 is None:
            o1, a1, b1 = t1
        else:
            o1 = [v for v in t1 if v not in (s0, s1)][0]
            # keep winding: rotate tri so it reads (o1, s0, s1) or (o1, s1, s0)
            k = list(t1).index(o1); a1, b1 = t1[(k + 1) % 3], t1[(k + 2) % 3]
        emit([o1, a1, b1], [uvA, uvB, uvD])
        # texels of the cell: local s,t in [0,1] (clamped -> dilation into the padding)
        px0, py0 = int(math.floor(gx * cell)), int(math.floor(gy * cell))
        px1, py1 = int(math.floor((gx + 1) * cell)), int(math.floor((gy + 1) * cell))
        X, Y = np.meshgrid(np.arange(px0, px1) + .5, np.arange(py0, py1) + .5)
        s = np.clip((X - x0) / w, 0, 1).ravel(); t = np.clip((Y - y0) / w, 0, 1).ravel()
        low = (s + t) <= 1 if f2 is not None else np.ones_like(s, bool)
        if f2 is None:
            # single triangle uses the lower-left half; fold the rest back onto it
            m = (s + t) > 1; s2 = np.where(m, 1 - t, s); t2 = np.where(m, 1 - s, t); s, t = s2, t2
        pts = np.zeros((len(s), 3))
        pa, pb, pd = P[o1], P[a1], P[b1]
        pts[low] = pa + s[low, None] * (pb - pa) + t[low, None] * (pd - pa)
        if f2 is not None:
            t2v = F[f2]; o2 = [v for v in t2v if v not in (s0, s1)][0]
            # B carries a1's position, D carries b1's -> second tri (o2 at C, b1 at D, a1 at B)
            k = list(t2v).index(o2); a2, b2 = t2v[(k + 1) % 3], t2v[(k + 2) % 3]
            uvmap = {a1: uvB, b1: uvD}
            emit([o2, a2, b2], [uvC, uvmap[a2], uvmap[b2]])
            hi = ~low; ss = 1 - s[hi]; tt = 1 - t[hi]
            pc = P[o2]
            pts[hi] = pc + ss[:, None] * (P[b1] - pc) + tt[:, None] * (P[a1] - pc)
        tex_pts.append(pts); tex_px.append(np.stack([Y.ravel().astype(int), X.ravel().astype(int)], 1))
    pts = np.vstack(tex_pts); pix = np.vstack(tex_px)
    for i in range(0, len(pts), chunk):
        p = pts[i:i + chunk]
        _, cand = tree.query(p, k=8)
        best_d = np.full(len(p), np.inf); best_uv = np.zeros((len(p), 2))
        for k in range(cand.shape[1]):
            fi = oF[cand[:, k]]
            bary, q = closest_on_tris(p, oP[fi[:, 0]], oP[fi[:, 1]], oP[fi[:, 2]])
            d = np.einsum('ij,ij->i', q - p, q - p)
            m = d < best_d
            uv = oUV[fi[:, 0]] * bary[:, :1] + oUV[fi[:, 1]] * bary[:, 1:2] + oUV[fi[:, 2]] * bary[:, 2:3]
            best_d[m] = d[m]; best_uv[m] = uv[m]
        atlas[pix[i:i + chunk, 0], pix[i:i + chunk, 1]] = sample(src_img, best_uv)
    return np.array(outP), np.array(outUV, np.float32), np.array(outF, np.int64), np.array(outSrc), Image.fromarray(np.clip(atlas, 0, 255).astype(np.uint8))

def smooth_normals(P, F, outP_index_map=None):
    n = np.zeros_like(P)
    cr = np.cross(P[F[:, 1]] - P[F[:, 0]], P[F[:, 2]] - P[F[:, 0]])
    for k in range(3):
        np.add.at(n, F[:, k], cr)
    return n / np.maximum(1e-20, np.linalg.norm(n, axis=1))[:, None]
