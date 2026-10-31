"""Quadric edge-collapse simplification (Garland & Heckbert) on a position-welded mesh.
Boundary edges get extra perpendicular planes so silhouettes and open borders survive.
Collapses that would flip a face normal are rejected."""
import numpy as np, heapq

def weld(pos, idx, eps=1e-5):
    key = np.round(pos / eps).astype(np.int64)
    uniq, first, inv = np.unique(key, axis=0, return_index=True, return_inverse=True)
    inv = inv.ravel()
    P = pos[first]
    F = inv[idx]
    ok = (F[:, 0] != F[:, 1]) & (F[:, 1] != F[:, 2]) & (F[:, 0] != F[:, 2])
    F = F[ok]
    # drop exact duplicate faces
    s = np.sort(F, axis=1)
    _, keep = np.unique(s, axis=0, return_index=True)
    return P, F[np.sort(keep)]

def plane_quadric(n, d, w):
    v = np.concatenate([n, [d]])
    return w * np.outer(v, v)

def simplify(P, F, target, boundary_weight=8.0, verbose=False, uv=None):
    # V244: with uv (per-vertex, mesh welded by position+uv so seams are borders) vertices only move
    # onto an existing endpoint and take its uv, so the ORIGINAL texture atlas stays valid.
    P = P.astype(np.float64).copy()
    nV = len(P)
    a, b, c = P[F[:, 0]], P[F[:, 1]], P[F[:, 2]]
    cr = np.cross(b - a, c - a)
    area = np.linalg.norm(cr, axis=1) / 2
    n = cr / np.maximum(1e-20, np.linalg.norm(cr, axis=1))[:, None]
    d = -np.einsum('ij,ij->i', n, a)
    nd = np.hstack([n, d[:, None]])
    Kf = area[:, None, None] * np.einsum('ij,ik->ijk', nd, nd)
    Q = np.zeros((nV, 4, 4))
    for k in range(3):
        np.add.at(Q, F[:, k], Kf)
    # boundary edges
    E = np.vstack([F[:, [0, 1]], F[:, [1, 2]], F[:, [2, 0]]])
    fid = np.concatenate([np.arange(len(F))] * 3)
    Es = np.sort(E, axis=1)
    ue, inv, cnt = np.unique(Es, axis=0, return_inverse=True, return_counts=True)
    inv = inv.ravel()
    bmask = cnt[inv] == 1
    for (i, j), f in zip(E[bmask], fid[bmask]):
        e = P[j] - P[i]
        pn = np.cross(e, n[f])
        L = np.linalg.norm(pn)
        if L < 1e-20:
            continue
        pn /= L
        w = boundary_weight * max(1e-12, np.dot(e, e))
        K = plane_quadric(pn, -np.dot(pn, P[i]), w)
        Q[i] += K
        Q[j] += K
    faces = [list(f) for f in F]
    alive_f = np.ones(len(F), bool)
    vf = [set() for _ in range(nV)]
    for fi, f in enumerate(F):
        for v in f:
            vf[v].add(fi)
    alive_v = np.ones(nV, bool)
    ver = np.zeros(nV, np.int64)

    def best(i, j):
        Qs = Q[i] + Q[j]
        A = Qs.copy(); A[3] = [0, 0, 0, 1]
        cands = [P[i], P[j], (P[i] + P[j]) / 2]
        if uv is not None:
            cands = [P[i], P[j]]
        try:
            if uv is not None: raise np.linalg.LinAlgError
            if abs(np.linalg.det(A)) > 1e-12:
                x = np.linalg.solve(A, [0, 0, 0, 1])[:3]
                # keep the optimum near the edge (avoid spikes)
                if np.linalg.norm(x - (P[i] + P[j]) / 2) < 2 * np.linalg.norm(P[i] - P[j]) + 1e-9:
                    cands.append(x)
        except np.linalg.LinAlgError:
            pass
        bc, bp = None, None
        for p in cands:
            v4 = np.append(p, 1.0)
            cost = v4 @ Qs @ v4
            if bc is None or cost < bc:
                bc, bp = cost, p
        return max(bc, 0.0), bp

    heap = []
    for i, j in ue:
        cost, _ = best(i, j)
        heap.append((cost, int(i), int(j), 0, 0, 0))
    heapq.heapify(heap)
    nF = int(alive_f.sum())
    while nF > target and heap:
        cost, i, j, vi, vj, tries = heapq.heappop(heap)
        if not (alive_v[i] and alive_v[j]) or ver[i] != vi or ver[j] != vj:
            continue
        cost, p = best(i, j)
        shared = vf[i] & vf[j]
        if not shared:
            continue
        # flip test
        bad = False
        for f in (vf[i] | vf[j]) - shared:
            fv = faces[f]
            q = [P[x] if x not in (i, j) else p for x in fv]
            n0 = np.cross(P[fv[1]] - P[fv[0]], P[fv[2]] - P[fv[0]])
            n1 = np.cross(q[1] - q[0], q[2] - q[0])
            l0, l1 = np.linalg.norm(n0), np.linalg.norm(n1)
            if l1 < 1e-14 or np.dot(n0, n1) < 0.25 * l0 * l1:
                bad = True
                break
        if bad:
            if tries < 3:  # re-queue later with a penalty
                heapq.heappush(heap, (cost * 4 + 1e-9, i, j, vi, vj, tries + 1))
            continue
        for f in shared:
            alive_f[f] = False
            nF -= 1
            for x in faces[f]:
                if x != i and x != j:
                    vf[x].discard(f)
        for f in vf[j] - shared:
            faces[f] = [i if x == j else x for x in faces[f]]
            vf[i].add(f)
        vf[i] -= shared
        vf[j] = set()
        alive_v[j] = False
        if uv is not None and np.array_equal(p, P[j]):
            uv[i] = uv[j]
        P[i] = p
        Q[i] += Q[j]
        ver[i] += 1
        nb = set()
        for f in vf[i]:
            nb.update(faces[f])
        nb.discard(i)
        for k in nb:
            c2, _ = best(i, k)
            heapq.heappush(heap, (c2, i, k, ver[i], ver[k], 0) if i < k else (c2, k, i, ver[k], ver[i], 0))
    Fo = np.array([faces[f] for f in range(len(faces)) if alive_f[f]], np.int64)
    used = np.unique(Fo)
    remap = -np.ones(nV, np.int64); remap[used] = np.arange(len(used))
    if uv is not None:
        return P[used], remap[Fo], uv[used]
    return P[used], remap[Fo]
