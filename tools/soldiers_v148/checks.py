"""Automatic quality checks: closed meshes, anatomy, joint limits, ground
contact, rider seat, and a strict structural glTF 2.0 validator."""
import json
import math
import struct
from collections import Counter
import numpy as np
from geom import apply
import anim
from export import standard_filter


def check_geometry(m):
    errs = []
    for p in m.parts:
        if p.bone not in m.parent:
            errs.append(f'{p.label}: unknown bone {p.bone}')
        if not np.isfinite(p.v).all():
            errs.append(f'{p.label}: non-finite vertices')
        edges = Counter()
        for a, b, c in p.triangles():
            for e in ((a, b), (b, c), (c, a)):
                edges[e] += 1
        bad = 0
        for (a, b), k in edges.items():
            if k != 1 or edges.get((b, a), 0) != 1:
                bad += 1
        if bad:
            errs.append(f'{p.label}@{p.bone}: {bad} open/inconsistent edges')
        if p.signed_volume() <= 0:
            errs.append(f'{p.label}@{p.bone}: inward facing (volume {p.signed_volume():.2e})')
    return errs


def instance_quads(m):
    return sum(len(p.q) for p in m.parts if standard_filter(p))


def posed_parts(m, labels, pose=None, pos=None):
    pts = []
    for p in m.parts:
        if p.label in labels and standard_filter(p):
            mm = m.rest_world(p.bone, pose, pos) @ np.linalg.inv(m.bind_world(p.bone))
            pts.append(apply(mm, p.v))
    return np.concatenate(pts) if pts else np.zeros((0, 3))


def check_model(m, clips):
    errs = check_geometry(m)
    riding = m.meta['riding']
    # ---- bind pose anatomy (independent of the hold pose)
    def bind_pts(labels):
        a = [p.v for p in m.parts if p.label in labels and standard_filter(p)]
        return np.concatenate(a) if a else np.zeros((0, 3))
    skull = bind_pts({'skull'})
    top, chin = skull[:, 1].max(), skull[:, 1].min()
    feet = bind_pts({'foot'})
    if abs(feet[:, 1].min()) > 0.004:
        errs.append(f'feet not on ground in bind pose ({feet[:, 1].min():.3f})')
    stature = top - feet[:, 1].min()
    if not 1.72 <= stature <= 1.80:
        errs.append(f'stature {stature:.3f} m outside 1.72-1.80')
    heads = stature / (top - chin + 0.02)    # +2 cm chin soft tissue/hair line
    if not 7.0 <= heads <= 8.0:
        errs.append(f'{heads:.2f} heads tall (expected 7-8)')
    fist = bind_pts({'fist'})
    if not 0.72 <= fist[:, 1].min() <= 0.82:
        errs.append(f'fist reaches {fist[:, 1].min():.3f} m (expected mid-thigh 0.72-0.82)')
    for b in m.order:
        if b.endswith('_L'):
            r = b[:-2] + '_R'
            pl, pr = m.pivot[b], m.pivot[r]
            if not np.allclose(pl * [-1, 1, 1], pr, atol=1e-6):
                errs.append(f'asymmetric pivots {b}/{r}')
    # ---- joint limits on every animation frame
    for clip in clips:
        for fi, (pose, tr) in enumerate(clip.frames):
            for b, (x, y, z) in pose.items():
                if b.startswith('shin_'):
                    if not (-1e-6 <= x <= 2.45) or abs(y) > 1e-6 or abs(z) > 0.12:
                        errs.append(f'{clip.name}[{fi}] knee {b} out of range ({x:.2f},{y:.2f},{z:.2f})')
                        break
                if b.startswith('forearm_'):
                    if not (-2.55 <= x <= 1e-6) or abs(y) > 0.5 or abs(z) > 1e-6:
                        errs.append(f'{clip.name}[{fi}] elbow {b} out of range ({x:.2f},{y:.2f},{z:.2f})')
                        break
                if b.startswith('thigh_'):
                    if not (-1.6 <= x <= 0.75) or abs(z) > 0.7:
                        errs.append(f'{clip.name}[{fi}] hip {b} out of range ({x:.2f},{z:.2f})')
                        break
                if b.startswith('upperArm_'):
                    if not (-3.0 <= x <= 0.9):
                        errs.append(f'{clip.name}[{fi}] shoulder {b} out of range ({x:.2f})')
                        break
                if b.startswith('hand_'):
                    zl = (-0.46, 0.61) if b.endswith('_L') else (-0.61, 0.46)
                    if not (-1.16 <= x <= 1.16) or abs(y) > 1.66 or not (zl[0] <= z <= zl[1]):
                        errs.append(f'{clip.name}[{fi}] wrist {b} out of range ({x:.2f},{y:.2f},{z:.2f})')
                        break
                if b == 'head' and (abs(x) > 0.7 or abs(y) > 1.2):
                    errs.append(f'{clip.name}[{fi}] neck out of range')
                    break
    # ---- ground contact
    for clip in clips:
        if clip.name in ('death',) or clip.name.startswith('dismounted'):
            continue
        lows = []
        for pose, tr in clip.frames:
            pos = {}
            for b, d in tr.items():
                base = np.array(m.rest_pos.get(b, m.local_offset(b)))
                pos[b] = tuple(base + np.array(d))
            if riding:
                low = 9
                for leg in ('FL', 'FR', 'HL', 'HR'):
                    mm = m.rest_world('horseShin_' + leg, pose, pos)
                    low = min(low, apply(mm, m.meta['hoof_pts'][leg])[:, 1].min())
            else:
                low = 9
                for s in 'LR':
                    mm = m.rest_world('shin_' + s, pose, pos)
                    low = min(low, apply(mm, anim.FOOT_PTS)[:, 1].min())
            lows.append(low)
        lo, hi = min(lows), max(lows)
        lim = 0.06 if clip.name == 'run' else 0.012
        if lo < -0.003 or hi > lim:
            errs.append(f'{clip.name}: ground contact {lo:.3f}..{hi:.3f}')
    # ---- rider seat
    if riding:
        seat = posed_parts(m, {'pelvis'})
        saddle = [p for p in m.parts if p.label == 'saddle'][0]
        st = saddle.v[:, 1].max()
        if not -0.03 <= seat[:, 1].min() - st <= 0.045:
            errs.append(f'rider seat {seat[:, 1].min() - st:+.3f} m from saddle')
        ft = posed_parts(m, {'foot'})
        if ft[:, 1].min() < 0.80 or ft[:, 1].min() > 1.05:
            errs.append(f'rider feet at {ft[:, 1].min():.2f} m (stirrups ~0.93)')
        if np.abs(ft[:, 0]).min() < 0.24:
            errs.append('rider feet inside the horse')
    # ---- inverse kinematics accuracy (hands really on the weapon)
    rep = list(m.meta.get('ik_report', [])) + list(m.meta.get('clip_ik_report', []))
    bad = [r for r in rep if r[3] > 0.03 or r[4] > (35 if r[2] == 'ON' else 16)]
    if bad:
        worst = max(bad, key=lambda r: r[3] * 30 + r[4] / 10)
        errs.append(f'IK: {len(bad)} of {len(rep)} hand targets missed (worst {worst[0]} {worst[1]} {worst[2]}: {worst[3] * 100:.1f} cm, {worst[4]:.0f} deg)')
    return errs


# ------------------------------------------------------------------ glTF validator
COMP = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4}
NCOMP = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}
NP = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}


def validate_glb(path):
    e = []
    data = open(path, 'rb').read()
    magic, ver, length = struct.unpack_from('<III', data, 0)
    if magic != 0x46546C67 or ver != 2 or length != len(data):
        return ['bad GLB header']
    jl, jt = struct.unpack_from('<II', data, 12)
    if jt != 0x4E4F534A or jl % 4:
        e.append('JSON chunk invalid/unaligned')
    g = json.loads(data[20:20 + jl])
    off = 20 + jl
    bl, bt = struct.unpack_from('<II', data, off)
    if bt != 0x004E4942 or bl % 4:
        e.append('BIN chunk invalid/unaligned')
    binb = data[off + 8: off + 8 + bl]
    if g['asset'].get('version') != '2.0':
        e.append('asset.version')
    if g['buffers'][0]['byteLength'] > len(binb):
        e.append('buffer larger than BIN chunk')

    def acc(i):
        a = g['accessors'][i]
        v = g['bufferViews'][a['bufferView']]
        size = COMP[a['componentType']] * NCOMP[a['type']]
        start = v['byteOffset'] + a.get('byteOffset', 0)
        if start % COMP[a['componentType']]:
            e.append(f'accessor {i} misaligned')
        if a['count'] * size > v['byteLength']:
            e.append(f'accessor {i} overruns its bufferView')
        if v['byteOffset'] + v['byteLength'] > g['buffers'][0]['byteLength']:
            e.append(f'bufferView of accessor {i} overruns buffer')
        arr = np.frombuffer(binb, NP[a['componentType']], a['count'] * NCOMP[a['type']], start).reshape(a['count'], NCOMP[a['type']])
        return a, arr
    # hierarchy
    parents = {}
    for i, n in enumerate(g['nodes']):
        for c in n.get('children', []):
            if c in parents:
                e.append(f'node {c} has two parents')
            parents[c] = i
        if 'rotation' in n and abs(np.linalg.norm(n['rotation']) - 1) > 1e-4:
            e.append(f'node {i} rotation not unit')
    for i in parents:
        seen = set()
        j = i
        while j in parents:
            if j in seen:
                e.append('node cycle')
                break
            seen.add(j)
            j = parents[j]
    skin = g['skins'][0]
    joints = skin['joints']
    ibm_a, ibm = acc(skin['inverseBindMatrices'])
    if ibm_a['count'] != len(joints):
        e.append('inverseBindMatrices count != joints')
    for mi, mesh in enumerate(g['meshes']):
        for pr in mesh['primitives']:
            at = pr['attributes']
            pa, pos = acc(at['POSITION'])
            if 'min' not in pa or 'max' not in pa:
                e.append('POSITION min/max missing')
            elif not (np.allclose(pos.min(0), pa['min'], atol=1e-6) and np.allclose(pos.max(0), pa['max'], atol=1e-6)):
                e.append('POSITION min/max wrong')
            na, nrm = acc(at['NORMAL'])
            ln = np.linalg.norm(nrm, axis=1)
            if np.abs(ln - 1).max() > 1e-3:
                e.append(f'mesh {mi}: normals not unit ({np.abs(ln - 1).max():.4f})')
            ca, col = acc(at['COLOR_0'])
            if col.min() < 0 or col.max() > 1:
                e.append('COLOR_0 out of 0..1')
            ja, jn = acc(at['JOINTS_0'])
            wa, wt = acc(at['WEIGHTS_0'])
            if jn.max() >= len(joints):
                e.append('JOINTS_0 index out of range')
            if np.abs(wt.sum(1) - 1).max() > 2e-3:
                e.append('WEIGHTS_0 do not sum to 1')
            for a2 in (na, ca, ja, wa):
                if a2['count'] != pa['count']:
                    e.append('attribute count mismatch')
            ia, ind = acc(pr['indices'])
            if ind.max() >= pa['count']:
                e.append('index out of range')
            if ia['count'] % 3:
                e.append('index count not multiple of 3')
            tri = ind.reshape(-1, 3)
            if (tri[:, 0] == tri[:, 1]).any() or (tri[:, 1] == tri[:, 2]).any() or (tri[:, 0] == tri[:, 2]).any():
                e.append('degenerate triangle')
            if pr.get('material', 0) >= len(g['materials']):
                e.append('material index')
    for an in g.get('animations', []):
        for s in an['samplers']:
            ta, t = acc(s['input'])
            oa, o = acc(s['output'])
            if 'min' not in ta or 'max' not in ta:
                e.append(f"{an['name']}: sampler input min/max missing")
            if (np.diff(t[:, 0]) <= 0).any():
                e.append(f"{an['name']}: times not strictly increasing")
            if oa['count'] != ta['count']:
                e.append(f"{an['name']}: output/input count mismatch")
            if oa['type'] == 'VEC4' and np.abs(np.linalg.norm(o, axis=1) - 1).max() > 1e-4:
                e.append(f"{an['name']}: non-unit quaternion")
        targets = [(c['target']['node'], c['target']['path']) for c in an['channels']]
        if len(targets) != len(set(targets)):
            e.append(f"{an['name']}: duplicate channel targets")
    for n in g['nodes']:
        if 'skin' in n and n.get('mesh') is None:
            e.append('skin without mesh')
    scene_nodes = set(g['scenes'][0]['nodes'])
    for i, n in enumerate(g['nodes']):
        if 'mesh' in n and i in parents:
            e.append('skinned mesh node parented under a joint')
    return sorted(set(e))
