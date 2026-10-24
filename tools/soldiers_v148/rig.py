"""Skeleton, rest poses and the Model container for V148 soldiers.

Units are metres, +Y up, the figure faces +Z (glTF convention), so the
character's LEFT side is +X. Bone names match the game rig sections.
Adult male, 1.76 m, classical 7.5-head proportions.
"""
import math
import numpy as np
from geom import Part, apply, mat_t, mat_euler, ring_loft

HEIGHT = 1.76

# name, parent, pivot in bind (model) space
HUMAN_BONES = [
    ('root', None, (0, 0, 0)),
    ('body', 'root', (0, 0.960, 0)),          # pelvis / hips
    ('chest', 'body', (0, 1.120, 0)),         # lumbar-thoracic twist point
    ('head', 'chest', (0, 1.520, 0)),         # atlas / base of skull
    ('upperArm_L', 'chest', (0.186, 1.436, -0.004)),
    ('forearm_L', 'upperArm_L', (0.193, 1.140, -0.010)),
    ('hand_L', 'forearm_L', (0.193, 0.878, -0.006)),
    ('upperArm_R', 'chest', (-0.186, 1.436, -0.004)),
    ('forearm_R', 'upperArm_R', (-0.193, 1.140, -0.010)),
    ('hand_R', 'forearm_R', (-0.193, 0.878, -0.006)),
    ('thigh_L', 'body', (0.090, 0.925, 0.004)),
    ('shin_L', 'thigh_L', (0.097, 0.490, 0.010)),
    ('thigh_R', 'body', (-0.090, 0.925, 0.004)),
    ('shin_R', 'thigh_R', (-0.097, 0.490, 0.010)),
]

# Riding horse, 1.55 m at the withers, facing +Z.
HORSE_BONES = [
    ('horse', 'root', (0, 1.150, 0.0)),
    ('horseNeck', 'horse', (0, 1.330, 0.560)),
    ('horseHead', 'horseNeck', (0, 1.780, 0.900)),
    ('horseTail', 'horse', (0, 1.330, -0.760)),
    ('horseLeg_FL', 'horse', (0.165, 1.000, 0.520)),
    ('horseShin_FL', 'horseLeg_FL', (0.165, 0.520, 0.540)),
    ('horseLeg_FR', 'horse', (-0.165, 1.000, 0.520)),
    ('horseShin_FR', 'horseLeg_FR', (-0.165, 0.520, 0.540)),
    ('horseLeg_HL', 'horse', (0.170, 1.040, -0.560)),
    ('horseShin_HL', 'horseLeg_HL', (0.170, 0.560, -0.640)),
    ('horseLeg_HR', 'horse', (-0.170, 1.040, -0.560)),
    ('horseShin_HR', 'horseLeg_HR', (-0.170, 0.560, -0.640)),
]

SADDLE_TOP = 1.505     # seat height of the saddle on the horse's back
SADDLE_Z = 0.08


class Model:
    def __init__(self, kind, lod, mounted=False):
        self.kind, self.lod, self.mounted = kind, lod, mounted
        bones = HUMAN_BONES + (HORSE_BONES if mounted else [])
        self.order = [b[0] for b in bones]
        self.parent = {b[0]: b[1] for b in bones}
        self.pivot = {b[0]: np.array(b[2], float) for b in bones}
        self.rest = {b: (0.0, 0.0, 0.0) for b in self.order}
        self.rest_pos = {}      # optional translation overrides (body for riders)
        self.parts = []
        self.meta = {}

    # n segments scaled by LOD
    def n(self, base):
        if self.lod == 0:
            return base
        return max(4, int(round(base * 0.6 / 2)) * 2)

    def local_offset(self, bone):
        p = self.parent[bone]
        return self.pivot[bone] - (self.pivot[p] if p else 0)

    def rest_world(self, bone, pose=None, pos=None):
        pose = pose or self.rest
        pos = pos or self.rest_pos
        chain = []
        b = bone
        while b:
            chain.append(b)
            b = self.parent[b]
        m = np.eye(4)
        for b in reversed(chain):
            off = pos.get(b, self.local_offset(b)) if b in pos else self.local_offset(b)
            m = m @ mat_t(*off) @ mat_euler(*pose.get(b, (0, 0, 0)))
        return m

    def bind_world(self, bone):
        return mat_t(*self.pivot[bone])

    def posed_to_bind(self, bone):
        return self.bind_world(bone) @ np.linalg.inv(self.rest_world(bone))

    def point(self, bone, local):
        """A point given in the bone's bind-local frame, in posed world space."""
        return apply(self.rest_world(bone), [local])[0]

    def add(self, bone, vq, color, mat='cloth', group=None, tags=(), label='', space='bind', m=None, qcolor=None):
        """space='bind'  : verts are bind-pose model space
           space='local' : verts are relative to the bone pivot (bind orientation)
           space='posed' : verts are authored in the rest (hold) pose world space"""
        verts, quads = vq
        verts = np.asarray(verts, float)
        if m is not None:
            verts = apply(m, verts)
            if np.linalg.det(m[:3, :3]) < 0:
                quads = [(a, d, c, b) for a, b, c, d in quads]
        if space == 'local':
            verts = verts + self.pivot[bone]
        elif space == 'posed':
            verts = apply(self.posed_to_bind(bone), verts)
        p = Part(bone, color, mat, group, tags, label)
        p.v = verts
        p.q = list(quads)
        p.qcolor = qcolor
        p.orient_outward()
        self.parts.append(p)
        return p

    def quad_count(self, tags_filter=None):
        return sum(len(p.q) for p in self.parts if tags_filter is None or tags_filter(p))
