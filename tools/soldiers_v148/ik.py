"""Arm inverse kinematics (shoulder 3 DOF, elbow hinge, wrist 3 DOF).

Targets are given in the CHEST bone frame, expressed as rest-pose world
coordinates of a standing man (the chest pivot at (0, 1.12, 0) is subtracted),
so a weapon pose stays attached to the torso when the torso twists or leans.
"""
import math
import numpy as np
from scipy.optimize import least_squares
from geom import mat_t, mat_euler, mat_rx, apply, norm

CHEST_PIVOT = np.array([0.0, 1.12, 0.0])
GRIP_L = np.array([0.004, -0.056, 0.014])

# anatomical limits: (lo, hi) for x, y, z of each joint; right side mirrors y/z
LIM = {
    'upperArm': [(-3.0, 0.9), (-1.3, 1.3), (-0.5, 1.75)],
    'forearm': [(-2.45, 0.0), (0.0, 0.0), (0.0, 0.0)],
    'hand': [(-1.15, 1.15), (-1.65, 1.65), (-0.45, 0.6)],
}


def limits(side):
    lo, hi = [], []
    for j in ('upperArm', 'forearm', 'hand'):
        for k, (a, b) in enumerate(LIM[j]):
            if j == 'forearm' and k > 0:
                continue
            if side == 'R' and k == 2:
                a, b = -b, -a
            lo.append(a)
            hi.append(b)
    return np.array(lo), np.array(hi)


def grip_frame(side):
    g = GRIP_L * np.array([1 if side == 'L' else -1, 1, 1])
    return mat_t(*g) @ mat_rx(math.pi / 2)


def chain(m, side, p):
    """Grip-frame transform in chest-local space for parameters p (7 values)."""
    u = m.local_offset('upperArm_' + side)
    f = m.local_offset('forearm_' + side)
    h = m.local_offset('hand_' + side)
    M = mat_t(*u) @ mat_euler(p[0], p[1], p[2]) @ mat_t(*f) @ mat_euler(p[3], 0, 0) @ mat_t(*h) @ mat_euler(p[4], p[5], p[6])
    return M @ grip_frame(side)


def to_chest(world_rest_M):
    M = np.array(world_rest_M, float)
    M = M.copy()
    M[:3, 3] -= CHEST_PIVOT
    return M


def frame(origin, shaft, distal):
    """Grip-space frame: +Y along the shaft (thumb side), +Z distal (knuckles)."""
    y = norm(shaft)
    z = np.asarray(distal, float)
    z = norm(z - np.dot(z, y) * y)
    x = np.cross(y, z)
    M = np.eye(4)
    M[:3, 0], M[:3, 1], M[:3, 2], M[:3, 3] = x, y, z, origin
    return M


PREFER = {'L': np.array([0.0, 0.0, 0.12, -0.5, 0.0, 0.0, 0.0]), 'R': np.array([0.0, 0.0, -0.12, -0.5, 0.0, 0.0, 0.0])}


def solve(m, side, target=None, point=None, axis=None, init=None, w_rot=1.0, prefer=None, elbow_out=0.0, main='Y', w_roll=0.45):
    """target: 4x4 grip frame (chest-local); or point (+ optional axis = desired grip +Y)."""
    lo, hi = limits(side)
    pref = PREFER[side] if prefer is None else np.asarray(prefer, float)
    x0s = []
    if init is not None:
        x0s.append(np.clip(np.asarray(init, float), lo + 1e-6, hi - 1e-6))
    x0s += [np.clip(pref, lo + 1e-6, hi - 1e-6),
            np.clip(np.array([-1.0, 0.0, 0.3 if side == 'L' else -0.3, -1.2, 0, 0, 0]), lo + 1e-6, hi - 1e-6),
            np.clip(np.array([-0.4, -0.6 if side == 'L' else 0.6, 0.4 if side == 'L' else -0.4, -1.6, 0, 0.5, 0]), lo + 1e-6, hi - 1e-6)]
    rng = np.random.default_rng(7)
    for _ in range(6):
        x0s.append(lo + (hi - lo) * rng.uniform(0.15, 0.85, len(lo)))
    tp = target[:3, 3] if target is not None else np.asarray(point, float)

    def res(p):
        G = chain(m, side, p)
        r = list((G[:3, 3] - tp) * 25.0)
        if target is not None:
            a, b = (1, 2) if main == 'Y' else (2, 1)
            r += list((G[:3, a] - target[:3, a]) * 1.6 * w_rot)
            r += list((G[:3, b] - target[:3, b]) * w_roll * w_rot)
        elif axis is not None:
            r += list((G[:3, 1] - norm(axis)) * 1.5 * w_rot)
        r += list((p - pref) * 0.05)
        if elbow_out:
            # keep the elbow away from the ribs
            E = mat_t(*m.local_offset('upperArm_' + side)) @ mat_euler(p[0], p[1], p[2]) @ mat_t(*m.local_offset('forearm_' + side))
            ex = E[0, 3] * (1 if side == 'L' else -1)
            r.append(max(0.0, 0.20 - ex) * elbow_out)
        return np.array(r)
    best = None
    for k, x0 in enumerate(x0s):
        s = least_squares(res, x0, bounds=(lo, hi), xtol=1e-9, ftol=1e-9, max_nfev=300)
        # prefer continuity with the previous frame unless another start is clearly better
        cost = s.cost + (0.0 if (k == 0 and init is not None) else 0.02)
        if best is None or cost < best_cost:
            best, best_cost = s, cost
    p = best.x
    G = chain(m, side, p)
    err = float(np.linalg.norm(G[:3, 3] - tp))
    ang = 0.0
    if target is not None:
        a = 1 if main == 'Y' else 2
        ang = math.degrees(math.acos(max(-1, min(1, float(np.dot(G[:3, a], target[:3, a]))))))
    elif axis is not None:
        ang = math.degrees(math.acos(max(-1, min(1, float(np.dot(G[:3, 1], norm(axis)))))))
    out = {'upperArm_' + side: (p[0], p[1], p[2]), 'forearm_' + side: (p[3], 0.0, 0.0), 'hand_' + side: (p[4], p[5], p[6])}
    return out, p, err, ang
