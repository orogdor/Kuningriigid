"""Animation clips for V148 soldiers.

Clips are sampled key poses (Euler XYZ radians per bone, three.js order) plus
a vertical/forward offset for the 'body' (hips) bone. The same clip tables are
written into the GLB files (as quaternion/translation channels) and into the
game pack, so the game and any other engine play identical motion.

Ground contact is solved, not guessed: for every walk/run frame the lowest
point of either foot is computed by forward kinematics and the hips are moved
so that the supporting foot rests exactly on the ground (y = 0).
"""
import math
import numpy as np
from geom import mat_euler, mat_t, apply

TAU = 2 * math.pi
FOOT_PTS = [(0, -0.490, -0.072), (0, -0.490, 0.000), (0, -0.490, 0.135), (0, -0.486, 0.205)]
# anatomical joint limits (radians) used by the checker
LIMITS = {
    'shin': (0.0, 2.45),          # knee only flexes backwards
    'forearm': (-2.55, 0.0),      # elbow only flexes forwards
}


def bump(g, c, w):
    d = min(abs(g - c), 1 - abs(g - c))
    return math.exp(-(d / w) ** 2)


def merge_pose(*poses):
    out = {}
    for p in poses:
        for k, v in p.items():
            out[k] = tuple(v)
    return out


def add_pose(a, b, k=1.0):
    out = dict(a)
    for bone, v in b.items():
        base = out.get(bone, (0, 0, 0))
        out[bone] = tuple(base[i] + v[i] * k for i in range(3))
    return out


def lerp_pose(a, b, t):
    out = {}
    for bone in set(a) | set(b):
        va, vb = a.get(bone, (0, 0, 0)), b.get(bone, (0, 0, 0))
        out[bone] = tuple(va[i] + (vb[i] - va[i]) * t for i in range(3))
    return out


def ease(t):
    t = min(1, max(0, t))
    return t * t * (3 - 2 * t)


def keyed(keys, t):
    """keys: list of (time, pose). Smoothly interpolated."""
    if t <= keys[0][0]:
        return dict(keys[0][1])
    for (t0, p0), (t1, p1) in zip(keys, keys[1:]):
        if t0 <= t <= t1:
            return lerp_pose(p0, p1, ease((t - t0) / (t1 - t0)))
    return dict(keys[-1][1])


class Clip:
    def __init__(self, name, duration, loop, frames):
        self.name, self.duration, self.loop = name, duration, loop
        self.frames = frames            # list of (pose dict, body offset (dy,dz))

    def times(self):
        n = len(self.frames)
        return [self.duration * i / (n - 1 if not self.loop else n) for i in range(n)]


# ------------------------------------------------------------------ helpers
def foot_low(model, pose, body_y):
    pos = {'body': (0, body_y, 0)}  # absolute local translation of the hips
    low = 9
    for side in 'LR':
        m = model.rest_world('shin_' + side, pose, pos)
        y = apply(m, FOOT_PTS)[:, 1].min()
        low = min(low, y)
    return low


def ground(model, pose, base_y=0.96):
    return base_y - foot_low(model, pose, base_y)


def walk_legs(g, amp=1.0, run=False):
    """Leg pose for gait phase g of the LEFT leg (right leg = g + 0.5)."""
    pose = {}
    for side, ph in (('L', g), ('R', (g + 0.5) % 1)):
        if run:
            hip = -0.30 - 0.55 * math.cos(TAU * ph) * amp
            knee = 0.25 + 0.55 * bump(ph, 0.15, 0.10) + 1.55 * bump(ph, 0.68, 0.16) * amp
        else:
            hip = -0.12 - 0.31 * math.cos(TAU * ph) * amp
            knee = 0.07 + 0.16 * bump(ph, 0.13, 0.07) + 1.02 * bump(ph, 0.71, 0.12) * amp
        z = (0.02 if side == 'L' else -0.02)
        pose['thigh_' + side] = (hip, 0.0, z)
        pose['shin_' + side] = (knee, 0.0, 0.0)
    return pose


def walk_upper(g, hold, free_arms=('L', 'R'), amp=1.0, run=False):
    pose = dict(hold)
    a = (0.42 if run else 0.26) * amp
    for side, ph in (('L', g), ('R', (g + 0.5) % 1)):
        if side in free_arms:
            # an arm swings with the opposite leg
            swing = a * math.cos(TAU * ph)
            ux, uy, uz = hold.get('upperArm_' + side, (0, 0, 0))
            fx, fy, fz = hold.get('forearm_' + side, (0, 0, 0))
            pose['upperArm_' + side] = (ux + swing, uy, uz)
            pose['forearm_' + side] = (min(0.0, fx - max(0, -swing) * 0.9 - (0.6 if run else 0.0)), fy, fz)
        else:
            ux, uy, uz = hold.get('upperArm_' + side, (0, 0, 0))
            pose['upperArm_' + side] = (ux + 0.05 * math.cos(TAU * ph), uy, uz)
    twist = 0.07 * math.sin(TAU * g) * amp
    cx, cy, cz = hold.get('chest', (0, 0, 0))
    pose['chest'] = (cx + (0.10 if run else 0.025), cy - twist, cz)
    bx, by, bz = hold.get('body', (0, 0, 0))
    pose['body'] = (bx + (0.12 if run else 0.0), by + twist * 0.8, bz + 0.025 * math.sin(TAU * g))
    hx, hy, hz = hold.get('head', (0, 0, 0))
    pose['head'] = (hx - (0.1 if run else 0.0) + 0.02 * math.sin(TAU * 2 * g), hy + twist * 0.6, hz)
    return pose


# ------------------------------------------------------------------ clip builders
def clip_idle(model, hold, frames=24):
    out = []
    for i in range(frames):
        t = i / frames
        p = dict(hold)
        br = math.sin(TAU * t)
        cx, cy, cz = hold.get('chest', (0, 0, 0))
        p['chest'] = (cx - 0.018 * br, cy, cz)
        hx, hy, hz = hold.get('head', (0, 0, 0))
        p['head'] = (hx + 0.02 * br, hy + 0.05 * math.sin(TAU * t + 1.3), hz)
        for side in 'LR':
            ux, uy, uz = hold.get('upperArm_' + side, (0, 0, 0))
            p['upperArm_' + side] = (ux + 0.015 * br, uy, uz)
        p.setdefault('thigh_L', (0, 0, 0.03))
        p.setdefault('thigh_R', (0, 0, -0.03))
        p.setdefault('shin_L', (0.04, 0, 0))
        p.setdefault('shin_R', (0.04, 0, 0))
        out.append((p, {'body': (0, ground(model, p) - 0.96, 0)}))
    return Clip('idle', 3.0, True, out)


def clip_walk(model, hold, free_arms, frames=16, run=False, name=None):
    out = []
    for i in range(frames):
        g = i / frames
        p = merge_pose(walk_upper(g, hold, free_arms, run=run), walk_legs(g, run=run))
        dy = ground(model, p) - 0.96
        if run:
            # flight phase: lift the whole body slightly between foot contacts
            dy += 0.035 * max(0, math.sin(TAU * 2 * g + 1.2))
        out.append((p, {'body': (0, dy, 0)}))
    return Clip(name or ('run' if run else 'walk'), 0.52 if run else 0.80, True, out)


def clip_from_keys(model, name, duration, keys, frames=21, legs=None, loop=False, plant=True):
    out = []
    for i in range(frames):
        t = i / (frames - 1)
        p = keyed(keys, t)
        if legs:
            for k, v in legs.items():
                p.setdefault(k, v)
        dy = ground(model, p) - 0.96 if plant else 0.0
        out.append((p, {'body': (0, dy, 0)}))
    return Clip(name, duration, loop, out)


STANCE = {'thigh_L': (-0.12, 0, 0.07), 'shin_L': (0.16, 0, 0), 'thigh_R': (0.18, 0, -0.05), 'shin_R': (0.10, 0, 0)}
LUNGE = {'thigh_L': (-0.42, 0, 0.08), 'shin_L': (0.45, 0, 0), 'thigh_R': (0.32, 0, -0.06), 'shin_R': (0.12, 0, 0)}


def attack_keys(style, hold):
    """Key poses (time 0..1) of the attack for each weapon style."""
    H = hold
    if style in ('thrust', 'pike'):
        low = 0.0 if style == 'thrust' else -0.15
        ready = add_pose(H, {'upperArm_R': (0.40 - H.get('upperArm_R', (0, 0, 0))[0], 0, 0), 'forearm_R': (-0.25 - H.get('forearm_R', (0, 0, 0))[0], 0, 0),
                             'chest': (0, 0.35, 0), 'body': (0.05, 0.10, 0)})
        strike = add_pose(H, {'upperArm_R': (-0.42 - H.get('upperArm_R', (0, 0, 0))[0], 0, 0), 'forearm_R': (low - H.get('forearm_R', (0, 0, 0))[0], 0, 0),
                              'chest': (0.12, -0.28, 0), 'body': (0.10, -0.12, 0)})
        if style == 'pike':
            ready['upperArm_L'] = (-0.95, -0.35, 0.25)
            ready['forearm_L'] = (-0.55, 0, 0)
            strike['upperArm_L'] = (-1.10, -0.40, 0.20)
            strike['forearm_L'] = (-0.25, 0, 0)
        ready.update(STANCE)
        strike.update(LUNGE)
        rec = dict(H)
        rec.update(STANCE)
        return [(0, rec), (0.30, ready), (0.48, strike), (0.62, strike), (1.0, rec)]
    if style in ('swing', 'chop'):
        two = style == 'chop'
        up = add_pose(H, {'chest': (-0.10, 0.45, 0.05), 'body': (0, 0.15, 0)})
        up['upperArm_R'] = (-2.55, 0.35, -0.30)
        up['forearm_R'] = (-1.45, 0, 0)
        hit = add_pose(H, {'chest': (0.22, -0.40, -0.05), 'body': (0.10, -0.15, 0)})
        hit['upperArm_R'] = (-0.75, -0.15, -0.10)
        hit['forearm_R'] = (-0.20, 0, 0)
        if two:
            up['upperArm_L'] = (-2.35, -0.50, 0.15)
            up['forearm_L'] = (-1.30, 0, 0)
            hit['upperArm_L'] = (-0.80, -0.55, 0.10)
            hit['forearm_L'] = (-0.45, 0, 0)
        up.update(STANCE)
        hit.update(LUNGE)
        rec = dict(H)
        rec.update(STANCE)
        return [(0, rec), (0.34, up), (0.52, hit), (0.64, hit), (1.0, rec)]
    if style == 'bow':
        aim = dict(H)
        aim.update({'chest': (0, 0.55, 0), 'body': (0, 0.35, 0), 'head': (-0.05, -0.80, 0.0),
                    'upperArm_L': (-1.52, -0.55, 0.0), 'forearm_L': (-0.05, 0, 0),
                    'upperArm_R': (-1.50, 0.50, -0.20), 'forearm_R': (-2.30, 0, 0)})
        nock = dict(aim)
        nock.update({'upperArm_R': (-1.35, -0.25, -0.10), 'forearm_R': (-1.20, 0, 0)})
        loose = dict(aim)
        loose.update({'upperArm_R': (-1.55, 0.75, -0.55), 'forearm_R': (-1.70, 0, 0)})
        for p in (aim, nock, loose):
            p.update(STANCE)
        rec = dict(H)
        rec.update(STANCE)
        return [(0, rec), (0.18, nock), (0.55, aim), (0.66, loose), (0.80, loose), (1.0, rec)]
    if style in ('crossbow', 'gun', 'musket'):
        aim = dict(H)
        aim.update({'chest': (0.0, 0.40, 0.0), 'body': (0, 0.30, 0), 'head': (0.08, -0.55, 0.12),
                    'upperArm_L': (-1.25, -0.55, 0.0), 'forearm_L': (-0.35, 0, 0),
                    'upperArm_R': (-0.75, 0.35, -0.55), 'forearm_R': (-1.55, 0, 0)})
        kick = add_pose(aim, {'chest': (-0.10, 0.04, 0), 'upperArm_L': (-0.12, 0, 0), 'head': (-0.06, 0, 0)})
        for p in (aim, kick):
            p.update(STANCE)
        rec = dict(H)
        rec.update(STANCE)
        return [(0, rec), (0.30, aim), (0.55, aim), (0.60, kick), (0.72, aim), (1.0, rec)]
    if style == 'sling':
        rec = dict(H)
        rec.update(STANCE)
        keys = [(0, rec)]
        for k in range(4):
            a = k * TAU / 4
            p = dict(rec)
            p.update({'upperArm_R': (-2.6 + 0.25 * math.cos(a), 0.0, -0.35 + 0.25 * math.sin(a)), 'forearm_R': (-0.25, 0, 0), 'chest': (0, 0.25, 0)})
            keys.append((0.08 + k * 0.10, p))
        rel = dict(rec)
        rel.update({'upperArm_R': (-1.25, -0.2, -0.15), 'forearm_R': (-0.10, 0, 0), 'chest': (0.15, -0.35, 0), 'body': (0.08, -0.12, 0)})
        rel.update(LUNGE)
        keys += [(0.55, rel), (0.68, rel), (1.0, rec)]
        return keys
    if style == 'javelin':
        rec = dict(H)
        rec.update(STANCE)
        back = dict(rec)
        back.update({'upperArm_R': (-2.30, 0.55, -0.25), 'forearm_R': (-0.95, 0, 0), 'chest': (-0.08, 0.55, 0), 'body': (-0.04, 0.2, 0),
                     'upperArm_L': (-1.35, -0.3, 0.2), 'forearm_L': (-0.3, 0, 0)})
        thr = dict(rec)
        thr.update({'upperArm_R': (-1.35, -0.25, -0.05), 'forearm_R': (-0.15, 0, 0), 'chest': (0.25, -0.40, 0), 'body': (0.12, -0.18, 0)})
        thr.update(LUNGE)
        return [(0, rec), (0.35, back), (0.52, thr), (0.66, thr), (1.0, rec)]
    if style == 'launcher':
        rec = dict(H)
        rec.update(STANCE)
        kick = add_pose(rec, {'chest': (-0.08, 0, 0), 'head': (-0.06, 0, 0)})
        return [(0, rec), (0.45, rec), (0.52, kick), (0.70, rec), (1.0, rec)]
    if style == 'lance':
        rec = dict(H)
        couch = dict(H)
        couch.update({'upperArm_R': (0.10, 0, -0.12), 'forearm_R': (-0.05, 0, 0), 'chest': (0.18, -0.1, 0)})
        hit = add_pose(couch, {'chest': (0.10, -0.15, 0), 'upperArm_R': (-0.15, 0, 0)})
        return [(0, rec), (0.30, couch), (0.50, hit), (0.70, couch), (1.0, rec)]
    raise ValueError(style)


def clip_attack(model, style, hold, riding=False):
    keys = attack_keys(style, hold)
    legs = None
    if riding:
        for _, p in keys:
            for k in list(p):
                if k.startswith('thigh') or k.startswith('shin') or k == 'body':
                    p[k] = hold[k]
        return clip_from_keys(model, 'attack', 0.7, keys, plant=False)
    return clip_from_keys(model, 'attack', 0.7, keys)


def clip_hit(model, hold, riding=False):
    flinch = add_pose(hold, {'chest': (-0.22, 0.12, 0.04), 'head': (-0.25, 0.1, 0), 'upperArm_L': (-0.3, 0, 0.1), 'upperArm_R': (-0.2, 0, -0.1)})
    keys = [(0, hold), (0.3, flinch), (1.0, hold)]
    if riding:
        return clip_from_keys(model, 'hit', 0.28, keys, frames=9, plant=False)
    return clip_from_keys(model, 'hit', 0.28, keys, frames=9)


def clip_death(model, hold):
    k1 = add_pose(hold, {'chest': (-0.35, 0.2, 0), 'head': (-0.4, 0, 0), 'thigh_L': (-0.2, 0, 0), 'shin_L': (0.6, 0, 0), 'shin_R': (0.9, 0, 0), 'thigh_R': (-0.5, 0, 0)})
    k2 = add_pose(hold, {'body': (-1.45, 0, 0.1), 'chest': (-0.15, 0.1, 0), 'head': (-0.2, 0.4, 0), 'upperArm_L': (-1.2, 0, 0.8), 'upperArm_R': (-1.0, 0, -0.9),
                         'thigh_L': (-0.6, 0, 0.1), 'shin_L': (0.5, 0, 0), 'thigh_R': (-0.1, 0, -0.1), 'shin_R': (0.2, 0, 0)})
    out = []
    frames = 25
    for i in range(frames):
        t = i / (frames - 1)
        p = keyed([(0, hold), (0.35, k1), (1.0, k2)], t)
        # lowered hips: knees buckle, then the body falls backward onto the ground
        dy = -0.30 * ease(t / 0.45) - 0.55 * ease((t - 0.45) / 0.55) if t > 0 else 0
        out.append((p, {'body': (0, dy, -0.15 * ease(t))}))
    return Clip('death', 1.3, False, out)


def clip_pose(model, name, pose, legs=None):
    p = dict(pose)
    if legs:
        p.update(legs)
    tr = {'body': (0, ground(model, p) - 0.96, 0)}
    return Clip(name, 1.0, True, [(p, tr), (p, tr)])


# ------------------------------------------------------------------ riders and horses
RIDE_LEGS = {'thigh_L': (-1.05, 0.0, 0.42), 'shin_L': (1.18, 0.0, -0.10), 'thigh_R': (-1.05, 0.0, -0.42), 'shin_R': (1.18, 0.0, 0.10)}


def horse_gait(g, kind):
    """Horse leg angles. kind: idle | walk | gallop."""
    p = {}
    if kind == 'idle':
        for leg in ('FL', 'FR', 'HL', 'HR'):
            p['horseLeg_' + leg] = (0, 0, 0)
            p['horseShin_' + leg] = (0, 0, 0)
        p['horseNeck'] = (0.05 * math.sin(TAU * g), 0.04 * math.sin(TAU * g * 0.5), 0)
        p['horseHead'] = (0.06 * math.sin(TAU * g + 0.7), 0, 0)
        p['horseTail'] = (0.05, 0.25 * math.sin(TAU * g), 0)
        p['horse'] = (0, 0, 0)
        return p, 0.0
    if kind == 'walk':
        offs = {'HL': 0.0, 'FL': 0.25, 'HR': 0.5, 'FR': 0.75}
        sw, kn = 0.30, 0.65
    else:  # transverse gallop
        offs = {'HL': 0.0, 'HR': 0.10, 'FL': 0.38, 'FR': 0.50}
        sw, kn = 0.62, 1.15
    for leg, o in offs.items():
        ph = (g + o) % 1
        front = leg[0] == 'F'
        a = -sw * math.cos(TAU * ph)                  # negative = reaching forward
        flex = kn * bump(ph, 0.60, 0.14 if kind == 'walk' else 0.12)
        if front:
            p['horseLeg_' + leg] = (a, 0, 0)
            p['horseShin_' + leg] = (flex, 0, 0)          # carpus folds the cannon backwards
        else:
            p['horseLeg_' + leg] = (a * 0.9, 0, 0)
            p['horseShin_' + leg] = (-flex * 0.9, 0, 0)   # hock folds the cannon forward
    if kind == 'walk':
        p['horseNeck'] = (0.07 * math.sin(TAU * g * 2), 0, 0)
        p['horseHead'] = (-0.04 * math.sin(TAU * g * 2), 0, 0)
        p['horse'] = (0.015 * math.sin(TAU * g * 2), 0, 0)
        p['horseTail'] = (0.1, 0.12 * math.sin(TAU * g), 0)
        bob = 0.02 * math.sin(TAU * g * 2)
    else:
        p['horseNeck'] = (-0.14 * math.sin(TAU * g + 0.4), 0, 0)
        p['horseHead'] = (0.08 * math.sin(TAU * g + 0.4), 0, 0)
        p['horse'] = (0.07 * math.sin(TAU * g + 2.0), 0, 0)
        p['horseTail'] = (-0.35, 0.08 * math.sin(TAU * g), 0)
        bob = 0.06 * math.sin(TAU * g + 2.0)
    return p, bob


def horse_ground(model, pose, base=1.15):
    pos = {'horse': (0, base, 0.0)}  # returns lowest hoof y (0 = touching ground)
    low = 9
    for leg in ('FL', 'FR', 'HL', 'HR'):
        m = model.rest_world('horseShin_' + leg, pose, pos)
        pts = model.meta['hoof_pts'][leg]
        low = min(low, apply(m, pts)[:, 1].min())
    return low


def clip_ride(model, name, hold, kind, duration, frames, attack_keys_=None):
    out = []
    for i in range(frames):
        g = i / frames
        hp, bob = horse_gait(g, kind)
        p = dict(hold)
        p.update(hp)
        lift = -horse_ground(model, p)
        # rider follows the saddle: hips bob with the horse, upper body absorbs it
        bx, by, bz = hold.get('chest', (0, 0, 0))
        p['chest'] = (bx + (0.10 if kind == 'gallop' else 0.02) - (0.08 if kind == 'gallop' else 0.02) * math.sin(TAU * g + 2.3), by, bz)
        hx, hy, hz = hold.get('head', (0, 0, 0))
        p['head'] = (hx + (0.06 * math.sin(TAU * g + 2.3) if kind == 'gallop' else 0), hy, hz)
        if kind == 'gallop':
            for side in 'LR':
                ux, uy, uz = hold['upperArm_' + side]
                p['upperArm_' + side] = (ux + 0.06 * math.sin(TAU * g + 2.3), uy, uz)
        out.append((p, {'horse': (0, lift, 0), 'body': (0, lift + bob * 0.5, 0)}))
    c = Clip(name, duration, True, out)
    c.horse = True
    return c


def clip_ride_attack(model, style, hold):
    keys = attack_keys(style, hold)
    out = []
    frames = 21
    for i in range(frames):
        t = i / (frames - 1)
        p = keyed(keys, t)
        for k in list(p):
            if k.startswith('thigh') or k.startswith('shin') or k == 'body':
                p[k] = hold[k]
        hp, bob = horse_gait(t, 'idle')
        p.update(hp)
        lift = -horse_ground(model, p)
        out.append((p, {'horse': (0, lift, 0), 'body': (0, lift, 0)}))
    c = Clip('attack', 0.7, False, out)
    c.horse = True
    return c
