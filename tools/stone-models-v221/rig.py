"""Skin the simplified Stone Age human: a 17-bone humanoid skeleton placed from the mesh proportions
(A-pose, facing +Z, character's left = +X), weights from distance to bone segments within body regions."""
import sys, numpy as np
import os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from glb import load
from writer import write
Z = (sys.argv[1] if len(sys.argv) > 1 else 'models-v221') + '/'
m = load(Z + 'human.glb')
P = m['pos'].copy(); UV = m['uv']; F = m['idx']
# normals from the file
import json, struct
ymin = P[:, 1].min(); H = P[:, 1].max() - ymin
P[:, 1] -= ymin; P[:, 0] -= (P[:, 0].max() + P[:, 0].min()) / 2; P[:, 2] -= np.median(P[:, 2])
P /= H  # height 1, feet at 0
def J(x, f, z=0.0): return np.array([x, f, z])
bones = [  # name, parent, head position, tail position (segment used for weights)
 ('hips', -1, J(0, .50), J(0, .58)),
 ('spine', 0, J(0, .58), J(0, .70)),
 ('chest', 1, J(0, .70), J(0, .84)),
 ('neck', 2, J(0, .84), J(0, .89)),
 ('head', 3, J(0, .89, .01), J(0, 1.0, .01)),
 ('upperArm_L', 2, J(.135, .80), J(.175, .62)),
 ('forearm_L', 5, J(.175, .62), J(.198, .47)),
 ('hand_L', 6, J(.198, .47), J(.205, .40)),
 ('upperArm_R', 2, J(-.135, .80), J(-.175, .62)),
 ('forearm_R', 8, J(-.175, .62), J(-.198, .47)),
 ('hand_R', 9, J(-.198, .47), J(-.205, .40)),
 ('thigh_L', 0, J(.065, .47), J(.075, .27)),
 ('shin_L', 11, J(.075, .27), J(.08, .055)),
 ('foot_L', 12, J(.08, .055), J(.08, .01, .07)),
 ('thigh_R', 0, J(-.065, .47), J(-.075, .27)),
 ('shin_R', 14, J(-.075, .27), J(-.08, .055)),
 ('foot_R', 15, J(-.08, .055), J(-.08, .01, .07)),
]
idx = {b[0]: i for i, b in enumerate(bones)}
def segdist(p, a, b):
    ab = b - a; t = np.clip(((p - a) @ ab) / (ab @ ab), 0, 1)
    q = a + t[:, None] * ab
    return np.linalg.norm(p - q, axis=1)
D = np.stack([segdist(P, b[2], b[3]) for b in bones], 1)  # n x 17
x, f = P[:, 0], P[:, 1]
side = np.where(x >= 0, 'L', 'R')
allow = np.zeros_like(D, bool)
# arms hang apart from the body: per-height threshold in the gap between torso/skirt and arm
thr = np.interp(f, [.36, .46, .54, .58, .66, .72, .78, .84], [.160, .152, .147, .128, .122, .136, .125, .125])
arm = (f > .37) & (f < .84) & (np.abs(x) > thr)
leg = (f < .44) & ~arm
torso = ~arm & ~leg
for i, (s_) in enumerate(side):
    if arm[i]:
        for n in ('upperArm_', 'forearm_', 'hand_'):
            allow[i, idx[n + s_]] = True
        if f[i] > .72: allow[i, idx['chest']] = True
    elif leg[i]:
        for n in ('thigh_', 'shin_', 'foot_'):
            allow[i, idx[n + s_]] = True
        if abs(x[i]) < .035:  # skirt between the legs follows both thighs
            o = 'R' if s_ == 'L' else 'L'; allow[i, idx['thigh_' + o]] = True
        if f[i] > .36: allow[i, idx['hips']] = True
    else:
        for n in ('hips', 'spine', 'chest', 'neck', 'head'):
            allow[i, idx[n]] = True
        if f[i] > .40 and f[i] < .5:
            allow[i, idx['thigh_' + s_]] = True
        if f[i] > .74 and abs(x[i]) > .085:
            allow[i, idx['upperArm_' + s_]] = True
w = np.where(allow, 1.0 / (D ** 2 + 1e-4) ** 2, 0)
top = np.argsort(-w, axis=1)[:, :4]
tw = np.take_along_axis(w, top, 1)
tw[:, 3] = 0
tw /= tw.sum(1, keepdims=True)
joints = top.astype(np.uint8)
# glTF bone nodes: translation relative to parent head
out = []
for i, (n, par, head, tail) in enumerate(bones):
    t = head - (bones[par][2] if par >= 0 else np.zeros(3))
    out.append({'name': n, 't': t, 'children': [k for k, b in enumerate(bones) if b[1] == i]})
ibm = []
for n, par, head, tail in bones:
    M = np.eye(4); M[:3, 3] = -head
    ibm.extend(M.T.ravel().tolist())  # column-major
# normals: recompute smooth by welded position
key = np.round(P * 1e5).astype(np.int64); _, inv = np.unique(key, axis=0, return_inverse=True); inv = inv.ravel()
cr = np.cross(P[F[:, 1]] - P[F[:, 0]], P[F[:, 2]] - P[F[:, 0]])
nw = np.zeros((inv.max() + 1, 3))
for k in range(3): np.add.at(nw, inv[F[:, k]], cr)
N = nw[inv]; N /= np.maximum(1e-20, np.linalg.norm(N, axis=1))[:, None]
write(Z + 'human_rigged.glb', P, N, UV, F, m['images']['base'], skin={'bones': out, 'ibm': ibm, 'joints': joints, 'weights': tw},
      extras={'height': 1.0, 'forward': '+z', 'left': '+x'}, roughness=.95)
print('ok', len(P), len(F), 'arm', arm.sum(), 'leg', leg.sum(), 'torso', torso.sum())
