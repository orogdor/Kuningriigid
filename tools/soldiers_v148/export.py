"""GLB (glTF 2.0) and game-pack writers for V148 soldiers."""
import json
import math
import struct
import numpy as np
from geom import quat_from_euler

TEAM_TOKENS = {'TEAM': (1.0, 1.0, 1.0), 'TEAM_D': (0.56, 0.56, 0.56), 'TEAM_L': (1.0, 1.0, 1.0)}
DEFAULT_TEAM = '#276bd1'


def srgb_to_linear(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def lin(h):
    return tuple(srgb_to_linear(c) for c in hex_rgb(h))


def part_normals(p):
    v = p.v
    nrm = np.zeros_like(v)
    for a, b, c in p.triangles():
        f = np.cross(v[b] - v[a], v[c] - v[a])
        nrm[a] += f
        nrm[b] += f
        nrm[c] += f
    l = np.linalg.norm(nrm, axis=1, keepdims=True)
    l[l < 1e-12] = 1
    return nrm / l


def chunks(model, part_filter):
    """Split every part into single-colour chunks: (part, color, verts, normals, tris)."""
    out = []
    for p in model.parts:
        if not part_filter(p):
            continue
        nrm = part_normals(p)
        cols = p.qcolor or [p.color] * len(p.q)
        by = {}
        for f, c in zip(p.q, cols):
            by.setdefault(c, []).append(f)
        for c, faces in by.items():
            remap = {}
            tris = []
            for a, b, cc, d in faces:
                for tri in ((a, b, cc), (a, cc, d)):
                    if len(set(tri)) < 3:
                        continue
                    t2 = []
                    for i in tri:
                        if i not in remap:
                            remap[i] = len(remap)
                        t2.append(remap[i])
                    tris.append(t2)
            idx = sorted(remap, key=remap.get)
            out.append(dict(part=p, color=c, v=p.v[idx], n=nrm[idx], tris=np.array(tris, dtype=np.int64), quads=len(faces)))
    return out


def standard_filter(p):
    t = set(p.tags)
    if 'elite' in t or 'mobilized' in t:
        return False
    if any(x.startswith('v') and x[1:].isdigit() and x != 'v0' for x in t):
        return False
    return True


# ------------------------------------------------------------------ GLB
class Buf:
    def __init__(self):
        self.data = bytearray()
        self.views = []
        self.accessors = []

    def add(self, arr, ctype, atype, target=None, minmax=False, normalized=False):
        while len(self.data) % 4:
            self.data += b'\0'
        raw = arr.tobytes()
        view = {'buffer': 0, 'byteOffset': len(self.data), 'byteLength': len(raw)}
        if target:
            view['target'] = target
        self.data += raw
        self.views.append(view)
        acc = {'bufferView': len(self.views) - 1, 'componentType': ctype, 'count': int(arr.shape[0]), 'type': atype}
        if normalized:
            acc['normalized'] = True
        if minmax:
            a2 = arr.reshape(arr.shape[0], -1)
            acc['min'] = [float(x) for x in a2.min(axis=0)]
            acc['max'] = [float(x) for x in a2.max(axis=0)]
        self.accessors.append(acc)
        return len(self.accessors) - 1


def rest_local(model, bone):
    if bone in model.rest_pos:
        return np.array(model.rest_pos[bone], float)
    return model.local_offset(bone)


def write_glb(model, clips, path, team=DEFAULT_TEAM, extras=None):
    buf = Buf()
    bones = model.order
    bidx = {b: i for i, b in enumerate(bones)}
    nodes = []
    for b in bones:
        q = quat_from_euler(*model.rest.get(b, (0, 0, 0)))
        t = rest_local(model, b)
        node = {'name': b, 'translation': [round(float(x), 6) for x in t]}
        if any(abs(x) > 1e-9 for x in q[:3]):
            node['rotation'] = [float(x) for x in q]
        nodes.append(node)
    for b in bones:
        kids = [bidx[c] for c in bones if model.parent[c] == b]
        if kids:
            nodes[bidx[b]]['children'] = kids
    # skin
    ibm = []
    for b in bones:
        m = np.eye(4)
        m[:3, 3] = -model.pivot[b]
        ibm.append(m.T.reshape(-1))        # column-major
    ibm_acc = buf.add(np.array(ibm, dtype=np.float32), 5126, 'MAT4')
    skins = [{'name': model.kind + '_skeleton', 'joints': list(range(len(bones))), 'inverseBindMatrices': ibm_acc, 'skeleton': 0}]
    materials = [
        {'name': 'cloth', 'pbrMetallicRoughness': {'baseColorFactor': [1, 1, 1, 1], 'metallicFactor': 0.0, 'roughnessFactor': 0.86}},
        {'name': 'metal', 'pbrMetallicRoughness': {'baseColorFactor': [1, 1, 1, 1], 'metallicFactor': 0.6, 'roughnessFactor': 0.42}},
        {'name': 'team_color', 'pbrMetallicRoughness': {'baseColorFactor': list(lin(team)) + [1], 'metallicFactor': 0.0, 'roughnessFactor': 0.84},
         'extras': {'note': 'Recolour this material (baseColorFactor) to the faction colour; vertex colours hold the shade.'}},
    ]
    ch = chunks(model, standard_filter)
    groups = {}
    for c in ch:
        groups.setdefault(c['part'].group or 'body', []).append(c)
    meshes = []
    mesh_nodes = []
    for gname, items in groups.items():
        prims = {}
        for c in items:
            team_c = c['color'] in TEAM_TOKENS
            mat = 2 if team_c else (1 if c['part'].mat == 'metal' else 0)
            prims.setdefault(mat, []).append(c)
        prim_out = []
        for mat, cs in prims.items():
            pos, nrm, col, jnt, idx = [], [], [], [], []
            off = 0
            for c in cs:
                n = len(c['v'])
                pos.append(c['v'])
                nrm.append(c['n'])
                rgb = TEAM_TOKENS[c['color']] if c['color'] in TEAM_TOKENS else lin(c['color'])
                col.append(np.tile(rgb, (n, 1)))
                jnt.append(np.full((n, 4), 0))
                jnt[-1][:, 0] = bidx[c['part'].bone]
                idx.append(c['tris'] + off)
                off += n
            pos = np.concatenate(pos).astype(np.float32)
            nrm = np.concatenate(nrm).astype(np.float32)
            col = np.concatenate(col).astype(np.float32)
            jnt = np.concatenate(jnt).astype(np.uint8)
            wgt = np.zeros((len(pos), 4), np.float32)
            wgt[:, 0] = 1
            idx = np.concatenate(idx).reshape(-1)
            itype = 5123 if len(pos) < 65536 else 5125
            idx = idx.astype(np.uint16 if itype == 5123 else np.uint32)
            attrs = {'POSITION': buf.add(pos, 5126, 'VEC3', 34962, minmax=True),
                     'NORMAL': buf.add(nrm, 5126, 'VEC3', 34962),
                     'COLOR_0': buf.add(col, 5126, 'VEC3', 34962),
                     'JOINTS_0': buf.add(jnt, 5121, 'VEC4', 34962),
                     'WEIGHTS_0': buf.add(wgt, 5126, 'VEC4', 34962)}
            prim_out.append({'attributes': attrs, 'indices': buf.add(idx, itype, 'SCALAR', 34963), 'material': mat, 'mode': 4})
        meshes.append({'name': model.kind + '_' + gname, 'primitives': prim_out})
        nodes.append({'name': gname, 'mesh': len(meshes) - 1, 'skin': 0})
        mesh_nodes.append(len(nodes) - 1)
    # animations
    animations = []
    for clip in clips:
        n = len(clip.frames)
        times = [clip.duration * i / (n if clip.loop else (n - 1)) for i in range(n)]
        frames = list(clip.frames)
        if clip.loop:
            times.append(clip.duration)
            frames.append(frames[0])
        tacc = buf.add(np.array(times, np.float32).reshape(-1, 1), 5126, 'SCALAR', minmax=True)
        samplers, channels = [], []
        rot_bones = sorted({b for p, _ in frames for b in p if b in bidx})
        for b in rot_bones:
            qs = []
            prev = None
            for p, _ in frames:
                q = np.array(quat_from_euler(*p.get(b, model.rest.get(b, (0, 0, 0)))))
                if prev is not None and np.dot(prev, q) < 0:
                    q = -q
                qs.append(q)
                prev = q
            oacc = buf.add(np.array(qs, np.float32), 5126, 'VEC4')
            samplers.append({'input': tacc, 'output': oacc, 'interpolation': 'LINEAR'})
            channels.append({'sampler': len(samplers) - 1, 'target': {'node': bidx[b], 'path': 'rotation'}})
        tr_bones = sorted({b for _, tr in frames for b in tr if b in bidx})
        for b in tr_bones:
            base = rest_local(model, b)
            ts = [base + np.array(tr.get(b, (0, 0, 0))) for _, tr in frames]
            oacc = buf.add(np.array(ts, np.float32), 5126, 'VEC3')
            samplers.append({'input': tacc, 'output': oacc, 'interpolation': 'LINEAR'})
            channels.append({'sampler': len(samplers) - 1, 'target': {'node': bidx[b], 'path': 'translation'}})
        animations.append({'name': clip.name, 'samplers': samplers, 'channels': channels,
                           'extras': {'loop': clip.loop}})
    gltf = {
        'asset': {'version': '2.0', 'generator': 'Kuningriigid V148 soldier generator (tools/soldiers_v148)',
                  'extras': extras or {}},
        'scene': 0,
        'scenes': [{'name': model.kind, 'nodes': [0] + mesh_nodes}],
        'nodes': nodes, 'meshes': meshes, 'skins': skins, 'materials': materials, 'animations': animations,
        'accessors': buf.accessors, 'bufferViews': buf.views, 'buffers': [{'byteLength': len(buf.data)}],
    }
    js = json.dumps(gltf, separators=(',', ':')).encode()
    while len(js) % 4:
        js += b' '
    bin_ = bytes(buf.data)
    while len(bin_) % 4:
        bin_ += b'\0'
    total = 12 + 8 + len(js) + 8 + len(bin_)
    out = struct.pack('<III', 0x46546C67, 2, total) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(bin_), 0x004E4942) + bin_
    with open(path, 'wb') as f:
        f.write(out)
    return dict(size=len(out), triangles=int(sum(len(c['tris']) for c in ch)), vertices=int(sum(len(c['v']) for c in ch)),
                quads=int(sum(c['quads'] for c in ch)))


# ------------------------------------------------------------------ game pack
Q = 8000.0


def pack_model(model, clips, blob):
    """Append one model/LOD to the binary blob; returns its JSON description."""
    def align(n):
        while len(blob) % n:
            blob.extend(b'\0')
    out_chunks = []
    for c in chunks(model, lambda p: True):
        p = c['part']
        local = c['v'] - model.pivot[p.bone]
        qv = np.round(local * Q)
        assert np.abs(qv).max() < 32767, (model.kind, p.label)
        align(2)
        po = len(blob)
        blob.extend(qv.astype(np.int16).tobytes())
        no = len(blob)
        blob.extend(np.round(c['n'] * 127).astype(np.int8).tobytes())
        align(2)
        io = len(blob)
        blob.extend(c['tris'].reshape(-1).astype(np.uint16).tobytes())
        out_chunks.append([p.bone, p.group or '', ','.join(p.tags), p.mat, c['color'], po, no, len(local), io, int(c['tris'].size)])
    bones = [[b, model.parent[b] or '', [round(float(x), 5) for x in rest_local(model, b)]] for b in model.order]
    cl = {}
    for clip in clips:
        frames = []
        for p, tr in clip.frames:
            frames.append({'r': {b: [round(float(x), 4) for x in v] for b, v in p.items() if b in model.parent},
                           't': {b: [round(float(x), 4) for x in v] for b, v in tr.items()}})
        cl[clip.name] = {'d': clip.duration, 'loop': clip.loop, 'f': frames}
    return {'bones': bones, 'rest': {b: [round(float(x), 4) for x in v] for b, v in model.rest.items() if b in model.parent},
            'chunks': out_chunks, 'clips': cl, 'style': model.meta['style'], 'riding': model.meta['riding'],
            'freeArms': list(model.meta['free_arms'])}
