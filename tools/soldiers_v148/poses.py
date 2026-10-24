"""Weapon-driven poses: every key pose says WHERE the weapon is; the arms are
solved by inverse kinematics so both hands really hold it (two-handed
polearms, guns, crossbows, bows, shields, reins).

Positions are rest-pose world coordinates of a man standing with his hips at
(0, 0.96, 0) facing +Z; riders are shifted onto the saddle automatically."""
import math
import numpy as np
from scipy.spatial.transform import Rotation, Slerp
import ik
import anim
from geom import norm, apply, mat_t

LEGS_REST = {'thigh_L': (0.0, 0, 0.035), 'thigh_R': (0.0, 0, -0.035), 'shin_L': (0.04, 0, 0), 'shin_R': (0.04, 0, 0)}
STANCE = anim.STANCE
LUNGE = anim.LUNGE
RELAX = {'L': {'upperArm_L': (0.03, 0.0, 0.10), 'forearm_L': (-0.30, 0, 0), 'hand_L': (0.1, 0.0, 0.0)},
         'R': {'upperArm_R': (0.03, 0.0, -0.10), 'forearm_R': (-0.30, 0, 0), 'hand_R': (0.1, 0.0, 0.0)}}


def W(origin, shaft, distal):
    return ('W', np.asarray(origin, float), np.asarray(shaft, float), np.asarray(distal, float))


SHIELD = W((0.05, 1.10, 0.30), (0, 1, 0), (-1, 0, 0.45))
SHIELD_UP = W((0.03, 1.30, 0.34), (0, 1, 0), (-1, 0.1, 0.25))
REINS = ('P', np.array([0.07, 1.00, 0.30]), np.array([0.25, 0.4, 1.0]))


def key(t, R=None, L=None, body=(0, 0, 0), chest=(0, 0, 0), head=(0, 0, 0), legs=None):
    return dict(t=t, R=R, L=L, body=body, chest=chest, head=head, legs=legs)


# ------------------------------------------------------------------ style library
def style_keys(style, wkind='Y'):
    """Returns dict with 'hold' key and 'attack' key list (times 0..1) and optional 'brace'."""
    S = {}
    if style == 'thrust':          # one-handed spear (+ shield or free arm)
        hold = W((-0.24, 0.98, 0.20), (0.0, 1, 0.16), (0.12, -0.15, 1))
        ready = W((-0.30, 1.02, -0.08), (0.04, 0.22, 1), (0.0, -1, 0.2))
        hit = W((-0.12, 1.00, 0.40), (0.06, 0.06, 1), (0.0, -1, 0.1))
        S['hold'] = key(0, R=hold)
        S['attack'] = [key(0, R=hold, legs=STANCE), key(0.30, R=ready, chest=(0, -0.30, 0), body=(0.04, -0.10, 0), legs=STANCE),
                       key(0.48, R=hit, chest=(0.10, 0.25, 0), body=(0.10, 0.12, 0), legs=LUNGE),
                       key(0.62, R=hit, chest=(0.10, 0.25, 0), body=(0.10, 0.12, 0), legs=LUNGE), key(1.0, R=hold, legs=STANCE)]
        S['brace'] = key(0, R=W((-0.22, 1.00, 0.12), (0.05, -0.02, 1), (0, -1, 0)), chest=(0.08, -0.08, 0), legs=STANCE)
    elif style == 'swing':          # one-handed axe / sword / mace / club
        hold = W((-0.25, 0.94, 0.14), (0.08, 0.55, 0.85), (0.05, -0.85, 0.55))
        up = W((-0.28, 1.72, -0.10), (0.20, 0.35, -0.92), (0.05, 0.92, 0.35))
        hit = W((-0.06, 1.05, 0.42), (0.25, 0.25, 0.93), (0.0, -0.93, 0.25))
        S['hold'] = key(0, R=hold)
        S['attack'] = [key(0, R=hold, legs=STANCE), key(0.34, R=up, chest=(-0.10, -0.40, 0.04), body=(0, -0.14, 0), legs=STANCE),
                       key(0.52, R=hit, chest=(0.22, 0.38, -0.04), body=(0.10, 0.15, 0), legs=LUNGE),
                       key(0.64, R=hit, chest=(0.22, 0.38, -0.04), body=(0.10, 0.15, 0), legs=LUNGE), key(1.0, R=hold, legs=STANCE)]
    elif style == 'chop':           # two-handed halberd
        hold = W((-0.16, 0.96, 0.20), (0.03, 1, 0.10), (0.1, 0, 1))
        up = W((-0.22, 1.40, 0.02), (0.15, 0.75, -0.65), (0.1, 0.65, 0.75))
        hit = W((-0.14, 1.06, 0.16), (0.18, 0.10, 1), (0.0, -1, 0.12))
        on = ('ON', np.array([0, 0.40, 0]))
        S['hold'] = key(0, R=hold, L=on)
        S['attack'] = [key(0, R=hold, L=on, legs=STANCE), key(0.36, R=up, L=('ON', np.array([0, -0.30, 0])), chest=(-0.10, -0.35, 0), legs=STANCE),
                       key(0.54, R=hit, L=('ON', np.array([0, -0.28, 0])), chest=(0.20, 0.20, 0), body=(0.10, 0.10, 0), legs=LUNGE),
                       key(0.66, R=hit, L=('ON', np.array([0, -0.28, 0])), chest=(0.20, 0.20, 0), body=(0.10, 0.10, 0), legs=LUNGE),
                       key(1.0, R=hold, L=on, legs=STANCE)]
        S['brace'] = key(0, R=W((-0.18, 1.00, -0.10), (0.15, 0.08, 1), (0, -1, 0.1)), L=('ON', np.array([0, 0.40, 0])), chest=(0.06, -0.10, 0), legs=STANCE)
    elif style == 'pike':
        hold = W((-0.15, 0.97, 0.17), (0.0, 1, 0.06), (0.1, 0, 1))
        on = ('ON', np.array([0, 0.36, 0]))
        level = W((-0.18, 1.00, -0.10), (0.15, 0.06, 1), (0, -1, 0.1))
        thrust = W((-0.16, 1.02, 0.02), (0.13, 0.04, 1), (0, -1, 0.1))
        on2 = ('ON', np.array([0, 0.38, 0]))
        S['hold'] = key(0, R=hold, L=on)
        S['attack'] = [key(0, R=level, L=on2, legs=STANCE, chest=(0.06, -0.10, 0)), key(0.30, R=level, L=on2, chest=(0.0, -0.16, 0), legs=STANCE),
                       key(0.50, R=thrust, L=on2, chest=(0.12, 0.05, 0), body=(0.08, 0.0, 0), legs=LUNGE),
                       key(0.64, R=thrust, L=on2, chest=(0.12, 0.05, 0), body=(0.08, 0.0, 0), legs=LUNGE),
                       key(1.0, R=level, L=on2, legs=STANCE, chest=(0.06, -0.10, 0))]
        S['brace'] = key(0, R=level, L=on2, chest=(0.06, -0.10, 0), legs=STANCE)
    elif style == 'bow':            # bow in the LEFT hand
        hold = W((0.23, 0.90, 0.22), (0.05, 0.75, 0.66), (0.0, -0.66, 0.75))
        S['hold'] = key(0, L=hold)
        turn = dict(body=(0, -0.40, 0), chest=(0, -0.55, 0), head=(-0.04, 0.85, 0.0))
        aim = W((0.08, 1.45, 0.66), (0.12, 1, 0), (0, 0, 1))
        nock = ('P', np.array([-0.07, 1.45, 0.24]), None)
        draw = ('P', np.array([-0.06, 1.55, 0.04]), None)
        loose = ('P', np.array([-0.16, 1.58, -0.10]), None)
        S['attack'] = [key(0, L=hold, legs=STANCE), key(0.20, L=aim, R=nock, legs=STANCE, **turn), key(0.55, L=aim, R=draw, legs=STANCE, **turn),
                       key(0.64, L=aim, R=loose, legs=STANCE, **turn), key(0.80, L=aim, R=loose, legs=STANCE, **turn), key(1.0, L=hold, legs=STANCE)]
    elif style in ('crossbow', 'gun'):   # weapons lying along +Z (distal) in the RIGHT hand
        if style == 'crossbow':
            hold = W((-0.10, 1.00, 0.14), (0, 1, -0.1), (0.45, 0.10, 1))
            aim = W((-0.08, 1.40, 0.12), (0, 1, 0), (0.04, 0, 1))
            on_hold, on_aim = ('ON', np.array([0, -0.01, 0.22])), ('ONP', np.array([0, -0.045, 0.25]))
        else:
            hold = W((-0.13, 1.02, 0.19), (-0.15, 0.25, 1), (0.50, 0.80, 0.30))
            aim = W((-0.165, 1.38, 0.15), (0, 1, 0), (0.03, 0, 1))
            on_hold, on_aim = ('ON', np.array([0, 0.005, 0.40])), ('ON', np.array([0, 0.005, 0.42]))
        turn = dict(body=(0, -0.20, 0), chest=(0, -0.25, 0), head=(0.06, 0.32, 0.10))
        kick = dict(body=(0, -0.20, 0), chest=(-0.06, -0.23, 0), head=(0.02, 0.32, 0.10))
        S['hold'] = key(0, R=hold, L=on_hold)
        S['attack'] = [key(0, R=hold, L=on_hold, legs=STANCE), key(0.30, R=aim, L=on_aim, legs=STANCE, **turn), key(0.55, R=aim, L=on_aim, legs=STANCE, **turn),
                       key(0.60, R=aim, L=on_aim, legs=STANCE, **kick), key(0.72, R=aim, L=on_aim, legs=STANCE, **turn), key(1.0, R=hold, L=on_hold, legs=STANCE)]
    elif style == 'pistol':          # one-handed firearm along +Z
        hold = W((-0.25, 0.94, 0.14), (0.0, 1, 0.2), (0.05, -0.2, 1))
        aim = W((-0.16, 1.40, 0.50), (0, 1, 0), (0.08, 0.02, 1))
        kick = W((-0.16, 1.46, 0.46), (0, 1, -0.3), (0.08, 0.3, 1))
        S['hold'] = key(0, R=hold)
        S['attack'] = [key(0, R=hold), key(0.30, R=aim, head=(0, 0.1, 0)), key(0.55, R=aim, head=(0, 0.1, 0)), key(0.60, R=kick, head=(0, 0.1, 0)),
                       key(0.72, R=aim, head=(0, 0.1, 0)), key(1.0, R=hold)]
    elif style == 'javelin':
        hold = W((-0.24, 0.98, 0.20), (0.0, 1, 0.16), (0.12, -0.15, 1))
        back = W((-0.30, 1.66, -0.22), (0.0, 0.22, 1), (0.0, 1, -0.2))
        throw = W((-0.12, 1.55, 0.04), (0.0, 0.6, 0.8), (0.0, -1, 0.0))
        S['hold'] = key(0, R=hold)
        S['attack'] = [key(0, R=hold, legs=STANCE), key(0.38, R=back, chest=(-0.08, -0.50, 0), body=(-0.04, -0.20, 0), legs=STANCE),
                       key(0.52, R=throw, chest=(0.22, 0.38, 0), body=(0.10, 0.16, 0), legs=LUNGE),
                       key(0.66, R=throw, chest=(0.22, 0.38, 0), body=(0.10, 0.16, 0), legs=LUNGE), key(1.0, R=hold, legs=STANCE)]
        S['brace'] = key(0, R=W((-0.22, 1.00, 0.12), (0.05, -0.02, 1), (0, -1, 0)), chest=(0.08, -0.08, 0), legs=STANCE)
    elif style == 'lance':
        hold = W((-0.24, 0.98, 0.22), (0.0, 1, 0.12), (0.1, -0.1, 1))
        couch = W((-0.20, 1.04, 0.10), (0.10, 0.06, 1), (0, -1, 0.06))
        hit = W((-0.18, 1.06, 0.22), (0.10, 0.03, 1), (0, -1, 0.06))
        S['hold'] = key(0, R=hold)
        S['attack'] = [key(0, R=hold), key(0.30, R=couch, chest=(0.15, -0.08, 0)), key(0.50, R=hit, chest=(0.25, -0.15, 0)),
                       key(0.70, R=couch, chest=(0.15, -0.08, 0)), key(1.0, R=hold)]
    elif style == 'sling':
        S['hold'] = key(0, R=('A', RELAX['R']))
        whirl = []
        for k in range(4):
            a = k * math.tau / 4
            whirl.append(key(0.08 + 0.10 * k, R=('A', {'upperArm_R': (-2.6 + 0.25 * math.cos(a), 0.0, -0.35 + 0.25 * math.sin(a)), 'forearm_R': (-0.25, 0, 0), 'hand_R': (0.3, 0, 0)}),
                             chest=(0, -0.25, 0), legs=STANCE))
        rel = key(0.55, R=('A', {'upperArm_R': (-1.25, -0.2, -0.15), 'forearm_R': (-0.10, 0, 0), 'hand_R': (-0.2, 0, 0)}), chest=(0.15, 0.35, 0), body=(0.08, 0.12, 0), legs=LUNGE)
        S['attack'] = [key(0, R=('A', RELAX['R']), legs=STANCE)] + whirl + [rel, dict(rel, t=0.68), key(1.0, R=('A', RELAX['R']), legs=STANCE)]
    elif style == 'launcher':
        S['hold'] = key(0)
        S['attack'] = [key(0, legs=STANCE), key(0.45, legs=STANCE), key(0.52, chest=(-0.08, 0, 0), head=(-0.06, 0, 0), legs=STANCE), key(0.70, legs=STANCE), key(1.0, legs=STANCE)]
    else:
        raise ValueError(style)
    return S


# ------------------------------------------------------------------ solving
def base_pose(m, k, riding):
    p = {'body': tuple(k['body']), 'chest': tuple(k['chest']), 'head': tuple(k['head'])}
    if riding:
        p.update(anim.RIDE_LEGS)
        p['body'] = (0, 0, 0)
    else:
        p.update(k['legs'] or LEGS_REST)
    return p


def chest_world(m, pose):
    return m.rest_world('chest', pose)


def to_world(m, Wstd):
    """Standing-man coordinates -> actual world (riders sit higher on the saddle)."""
    body = m.rest_world('body', {}, m.rest_pos)[:3, 3]
    M = np.array(Wstd, float).copy()
    M[:3, 3] += body - np.array([0, 0.96, 0])
    return M


def spec_frame(spec):
    _, o, shaft, distal = spec
    return ik.frame(o, shaft, distal)


class Solver:
    def __init__(self, m, riding, free_side_relax=True):
        self.m, self.riding = m, riding
        self.prev = {'L': None, 'R': None}
        self.report = []

    def arms(self, pose, k, primary, extra_L=None, extra_R=None, weapon_axis='Y', tag=''):
        """Fill arm angles into pose for key k."""
        m = self.m
        Cw = chest_world(m, pose)
        Ci = np.linalg.inv(Cw)
        Wgrip = {}
        order = [primary, 'L' if primary == 'R' else 'R']
        for side in order:
            spec = k.get(side)
            if spec is None:
                spec = extra_L if side == 'L' else extra_R
            if spec is None:
                pose.update(RELAX[side])
                continue
            if spec[0] == 'A':
                pose.update(spec[1])
                continue
            if spec[0] == 'W':
                T = Ci @ to_world(m, spec_frame(spec))
                sol, p, err, ang = ik.solve(m, side, target=T, init=self.prev[side], elbow_out=3.0, main='Y' if (side != primary or weapon_axis == 'Y') else 'Z')
            elif spec[0] == 'P':
                P = Ci @ np.r_[to_world(m, ik.frame(spec[1], (0, 1, 0), (0, 0, 1)))[:3, 3], 1]
                ax = Ci[:3, :3] @ norm(spec[2]) if spec[2] is not None else None
                sol, p, err, ang = ik.solve(m, side, point=P[:3], axis=ax, init=self.prev[side], w_rot=0.5, elbow_out=3.0)
            elif spec[0] in ('ON', 'ONP'):
                G = Wgrip[primary]                       # weapon (grip frame) in chest-local
                P = (G @ np.r_[spec[1], 1])[:3]
                ax = (G[:3, 1] if weapon_axis == 'Y' else G[:3, 2]) if spec[0] == 'ON' else None
                sol, p, err, ang = ik.solve(m, side, point=P, axis=ax, init=self.prev[side], w_rot=1.0, elbow_out=3.0)
            else:
                raise ValueError(spec)
            self.prev[side] = p
            pose.update(sol)
            Wgrip[side] = ik.chain(m, side, p)
            self.report.append((tag, side, spec[0], err, ang))
        return pose


def solve_rest(m, style_spec, primary, extra_L=None, extra_R=None, weapon_axis='Y'):
    riding = m.meta.get('riding', False)
    sv = Solver(m, riding)
    k = style_spec['hold']
    pose = base_pose(m, k, riding)
    sv.arms(pose, k, primary, extra_L, extra_R, weapon_axis, 'hold')
    return pose, sv


def interp_keys(keys, t):
    if t <= keys[0]['t']:
        return keys[0], keys[0], 0.0
    for a, b in zip(keys, keys[1:]):
        if a['t'] <= t <= b['t']:
            return a, b, anim.ease((t - a['t']) / max(1e-9, b['t'] - a['t']))
    return keys[-1], keys[-1], 0.0


def blend_spec(sa, sb, u):
    if sa is None or sb is None:
        return sa if u < 0.5 else sb
    if sa[0] == 'W' and sb[0] == 'W':
        Fa, Fb = spec_frame(sa), spec_frame(sb)
        o = Fa[:3, 3] + (Fb[:3, 3] - Fa[:3, 3]) * u
        R = Slerp([0, 1], Rotation.from_matrix([Fa[:3, :3], Fb[:3, :3]]))([u]).as_matrix()[0]
        return ('W', o, R[:, 1], R[:, 2])
    if sa[0] == 'P' and sb[0] == 'P':
        ax = None if sa[2] is None or sb[2] is None else norm(sa[2] + (sb[2] - sa[2]) * u)
        return ('P', sa[1] + (sb[1] - sa[1]) * u, ax)
    if sa[0] in ('ON', 'ONP') and sb[0] in ('ON', 'ONP'):
        return ('ON' if (sa[0] == 'ON' and sb[0] == 'ON') else 'ONP', sa[1] + (sb[1] - sa[1]) * u)
    if sa[0] == 'A' and sb[0] == 'A':
        return ('A', anim.lerp_pose(sa[1], sb[1], u))
    return sa if u < 0.5 else sb


def lerp3(a, b, u):
    return tuple(a[i] + (b[i] - a[i]) * u for i in range(3))


def solve_clip(m, keys, primary, extra_L, extra_R, weapon_axis, frames, sv):
    """Solve every frame by IK on interpolated weapon targets. If an in-between
    frame is unreachable, fall back to joint-space interpolation of the two
    neighbouring (exactly solved) key poses."""
    riding = m.meta.get('riding', False)

    def build(k):
        return base_pose(m, k, riding)
    key_poses = []
    for kk in keys:
        k = dict(kk)
        k['legs'] = kk['legs'] or LEGS_REST
        pose = build(k)
        sv.arms(pose, k, primary, extra_L, extra_R, weapon_axis, 'key%.2f' % kk['t'])
        key_poses.append(pose)
    out = []
    for i in range(frames):
        t = i / (frames - 1)
        a, b, u = interp_keys(keys, t)
        k = {'t': t, 'body': lerp3(a['body'], b['body'], u), 'chest': lerp3(a['chest'], b['chest'], u), 'head': lerp3(a['head'], b['head'], u),
             'legs': anim.lerp_pose(a['legs'] or LEGS_REST, b['legs'] or LEGS_REST, u)}
        for side in 'LR':
            k[side] = blend_spec(a.get(side), b.get(side), u)
        pose = build(k)
        n0 = len(sv.report)
        sv.arms(pose, k, primary, extra_L, extra_R, weapon_axis, 'f%d' % i)
        new = sv.report[n0:]
        if any(r[3] > 0.03 or r[4] > (35 if r[2] == 'ON' else 16) for r in new):
            ia, ib = keys.index(a), keys.index(b)
            jp = anim.lerp_pose(key_poses[ia], key_poses[ib], u)
            for bone in jp:
                if bone.startswith(('upperArm', 'forearm', 'hand')):
                    pose[bone] = jp[bone]
            del sv.report[n0:]
            sv.report.append(('f%d' % i, '-', 'lerp', 0.0, 0.0))
        out.append(pose)
    return out
