"""V148 soldier roster – every model is built from the unit's DESCRIPTION
(name, era, weapon, role in the game rules), not from the old geometry.

Descriptions used (Estonian names from civilization-core.js, medieval-v62.js,
military-v88.js) are recorded in DESCRIPTIONS and copied into the manifest."""
import math
import numpy as np
from rig import Model, SADDLE_TOP, SADDLE_Z
from body import build_human, build_belt, build_cape, prof, PELVIS, CHEST, UPPER_ARM, FOREARM, THIGH, SHIN
from gear import (helmet, torso_shell, limb_shell, pauldron, skirt_shell, coat_tails, crossbelt, strap, quiver, backpack,
                  pouch, canteen, scabbard, weapon, grip, place_shield, plume, coif, head_shell, qcolor3,
                  WOOD, WOOD_D, LEATHER, LEATHER_D, BRONZE, BRONZE_D, IRON, IRON_D, STEEL, BRASS, ROPE, LINEN)
from geom import mat_t, mat_rx, mat_ry, mat_rz, mat_s, box, ellipsoid, cylinder, vertical_loft, norm, path_loft
from horse import build_horse
import anim

DESCRIPTIONS = {
    'scout': ('Avastaja', 0, 'Kerge varustusega maadeavastaja: kapuutsiga keep, kepp-oda, nahkkott.'),
    'militia': ('Linna kaitsjad', 0, 'Linnakaitsjad: polsterdatud rüü, puust kilp ja lihtne oda.'),
    'slinger': ('Kiviviskajad', 0, 'Kiviaja linguheitja: nahkrõivad, lingunöör ja kivikott.'),
    'spearman': ('Puuodamehed', 0, 'Kiviaja puuodamees: tulega karastatud puuots, karusnahk.'),
    'axeman': ('Kivikirvemehed', 0, 'Kiviaja kirvemees: lihvitud kivikirves vartega, karusnahkne keep.'),
    'archer': ('Vibukütid', 0, 'Vibukütt: puuvibu, nooletupp, pistoda/mõõk lähivõitluseks.'),
    'bronze_spearman': ('Pronksodamees', 1, 'Pronksiaja odamees: kaheksakujuline nahkkilp, pronksotsaga oda, kooniline pronkskiiver põsekaitsetega, säärised.'),
    'bronze_axeman': ('Pronkskirvemees', 1, 'Pronksiaja kirvemees: pronkskirves, väike ümar kilp, linane kilt, pronkskiiver.'),
    'bronze_archer': ('Pronksiaja vibukütt', 1, 'Liitvibu, nooletupp ja pronksmõõk; soomusteta.'),
    'bronze_cavalry': ('Varajane ratsavägi', 2, 'Varajane ratsanik hobusel: oda, väike kilp, pronkskiiver.'),
    'infantry': ('Raudmõõgamehed', 2, 'Rauaaja jalaväelane: raudmõõk, ovaalne kilp kilbinabaga, rõngassärk, raudkiiver.'),
    'cavalry': ('Ratsavägi', 2, 'Rauaaja ratsanik: raudotsaga oda, ümar kilp, kiiver, sadul.'),
    'iron_archer': ('Rauaaja vibukütt', 2, 'Polsterdatud kuub, nahkmüts, vibu ja raudmõõk.'),
    'javelinman': ('Heiteodamees', 2, 'Kerge jalaväelane heiteodadega ja väikese ümara kilbiga.'),
    'man_at_arms': ('Soomustatud jalaväelane', 3, 'Keskaja raskejalaväelane: rõngasrüü, vapikuub, ninakaitsega kiiver, kolmnurkkilp, mõõk.'),
    'halberdier': ('Hellebardimees', 3, 'Polsterdatud kuub, rauast kübarkiiver (chapel de fer), hellebard.'),
    'crossbowman': ('Ristvibumees', 3, 'Ristvibu, poldikott, kübarkiiver, polsterdatud kuub, mõõk.'),
    'knight': ('Rüütel', 3, 'Raudrüüs rüütel suurkiivriga, vapikuub ja -kilp, piik; kaparisooniga sõjaratsu.'),
    'heavy_cavalry': ('Raskeratsavägi', 3, 'Rõngasrüüs ratsanik bascinet-kiivriga, nui ja kilp.'),
    'pikeman': ('Piigimees', 4, 'Renessansiaegne piigimees: moorion, rinnaturvis, pikk piik, mõõk.'),
    'arquebusier': ('Arkebuusimees', 4, 'Arkebuus, moorion, kamisool, laengute bandoleer.'),
    'musketeer': ('Musketärid', 4, 'Laia äärega viltkübar sulega, kamisool, musket, bandoleer, rapiir.'),
    'cuirassier': ('Kürassiir', 4, 'Kolmveerandrüü ja burgoneti-kiiver, püstol ja mõõk, ratsu.'),
    'rifleman': ('Püssimehed', 5, 'Tööstusajastu püssimees: kepi, mundrikuub, tääkpüss, ristrihmad, seljakott.'),
    'line_infantry': ('Rivijalavägi', 5, 'Šakoo, frakk-mundri, valged ristrihmad, tääkpüss.'),
    'dragoon': ('Ratsalaskur', 5, 'Harjaga kiiver hobusejõhviga, mundrikuub, karabiin ja saabel; võib hobuselt maha tulla.'),
    'modern_infantry': ('Moodne jalavägi', 6, 'Kamuflaaživorm, lahingukiiver, kuulivest taskutega, automaatrelv.'),
    'rocket_team': ('Tankitõrjerühm', 6, 'Moodne sõdur õlal kantava tankitõrjegranaadiheitjaga.'),
}

SKIN = ['#c99a77', '#b88663', '#a77553', '#d2a685']
HAIRS = ['#3a2a1e', '#5a3f28', '#2a2420', '#7a5a34']


def heads(hair_style='short', beards=('full', 'short', 'none'), hairs=None):
    hairs = hairs or HAIRS
    return [{'beard': b, 'hair': hairs[k % len(hairs)], 'hair_style': hair_style} for k, b in enumerate(beards)]


# ------------------------------------------------------------------ pose specs (solved by IK)
import poses
from poses import SHIELD, SHIELD_UP, REINS, RELAX


def spec(m, style, primary='R', L=None, R=None, axis='Y'):
    """Declare how the weapon is held; the rest pose is solved immediately."""
    m.meta['spec'] = dict(style=style, primary=primary, L=L, R=R, axis=axis)
    keys = poses.style_keys(style)
    m.meta['keys'] = keys
    pose, sv = poses.solve_rest(m, keys, primary, L, R, axis)
    for k in ('body', 'chest', 'head'):
        pose.setdefault(k, (0, 0, 0))
    m.rest = pose
    m.meta['ik_report'] = sv.report
    free = tuple(s for s in 'LR' if keys['hold'].get(s) is None and (L if s == 'L' else R) is None)
    m.meta.update(style=style, free_arms=free, riding=m.meta.get('riding', False))
    return pose


# ------------------------------------------------------------------ outfit presets
def outfit(**k):
    o = dict(skin=SKIN[0], hair=HAIRS[0], hair_style='short', beard='none',
             pelvis_bands=[(0.0, 9, '#7a6448')], chest_bands=[(0.0, 9, '#7a6448')],
             sleeve=('none', '#7a6448'), legwear=('bare', '#6b5a45'), foot=('bare', LEATHER, 0.0),
             skirt=None, belt=None)
    o.update(k)
    return o


def tunic(color, trousers=None, hem=0.66, sleeve='short', flare=0.07, belt=LEATHER, trim=None, foot=('shoe', LEATHER, 0.05), skin=SKIN[0], **k):
    legs = ('trousers', trousers) if trousers else ('bare', '#000')
    return outfit(skin=skin, pelvis_bands=[(0.0, 9, color)], chest_bands=[(0.0, 9, color)], sleeve=(sleeve, color),
                  legwear=legs, foot=foot, skirt=(hem, color, flare, 1.00, trim), belt=belt, **k)


# ------------------------------------------------------------------ builders
def finish(m, *a, **k):
    return m


def build(kind, lod):
    fn = BUILDERS[kind]
    return fn(lod)


def _shield(m, kind, lift=0.0, out=0.075, yaw=0.30, team='TEAM'):
    c = m.point('forearm_L', (0.0, -0.15, 0.0))
    nrm = norm((math.sin(yaw), 0.0, math.cos(yaw)))
    place_shield(m, kind, c + nrm * out + np.array([0, lift, 0]), nrm, lod=m.lod, team=team)


def _std(m, hold):
    pass


# ---------- Stone Age
def b_spearman(lod):
    m = Model('spearman', lod)
    spec(m, 'thrust')
    o = outfit(skin=SKIN[1], hair='#3a2a1e', hair_style='long', pelvis_bands=[(0, 9, '#8a6a46')], chest_bands=[(0, 1.30, '#8a6a46'), (1.30, 9, '#6e5236')],
               sleeve=('none', '#8a6a46'), legwear=('bare', '#000'), foot=('wrap', '#7d6447', 0.10), leg_wrap='#7a6145',
               skirt=(0.70, '#7d5f3e', 0.06, 1.0, None), belt=ROPE)
    build_human(m, o, heads('long', ('full', 'short', 'full'), ['#3a2a1e', '#4d3622', '#2b211b']))
    build_cape(m, '#6b5034', top=1.47, hem=1.02, width=0.21)
    grip(m, 'R', weapon('wood_spear', lod))
    pouch(m, LEATHER, 0.15, 0.97, 0.06)
    return m


def b_axeman(lod):
    m = Model('axeman', lod)
    spec(m, 'swing')
    o = outfit(skin=SKIN[2], hair='#2b211b', hair_style='tied', pelvis_bands=[(0, 9, '#7e6142')], chest_bands=[(0, 9, '#7e6142')],
               sleeve=('none', '#000'), legwear=('wrapped', '#6d563c'), foot=('wrap', '#7d6447', 0.12),
               skirt=(0.72, '#7a5c3a', 0.05, 1.0, None), belt=ROPE)
    build_human(m, o, heads('tied', ('full', 'full', 'short'), ['#2b211b', '#3a2a1e', '#4a3826']))
    build_cape(m, '#5f4a33', top=1.48, hem=0.95, width=0.23)
    pauldron(m, 'L', '#6b5338', 1.05)   # fur shoulder wrap
    grip(m, 'R', weapon('stone_axe', lod))
    return m


def b_slinger(lod):
    m = Model('slinger', lod)
    spec(m, 'sling', L=('A', {'upperArm_L': (-0.10, 0, 0.12), 'forearm_L': (-0.90, 0, 0), 'hand_L': (0.2, 0, 0)}))
    o = outfit(skin=SKIN[1], hair='#4d3622', hair_style='short', pelvis_bands=[(0, 9, '#8d7150')], chest_bands=[(0, 9, '#8d7150')],
               sleeve=('none', '#000'), legwear=('bare', '#000'), foot=('bare', '#000', 0), skirt=(0.74, '#86684a', 0.05, 1.0, None), belt=ROPE)
    build_human(m, o, heads('short', ('short', 'none', 'full')))
    grip(m, 'R', weapon('sling', lod), m_extra=mat_rx(-math.pi / 2))
    pouch(m, '#8a6b47', -0.16, 0.95, 0.07, 0.10, 0.09, 0.06)
    m.add('hand_L', ellipsoid(m.n(6), 3, 0.025, 0.025, 0.025), '#9a978a', space='local', m=mat_t(0.004, -0.068, 0.034), label='stone')
    return m


def b_archer(lod, kind='archer', era=0):
    m = Model(kind, lod)
    spec(m, 'bow', primary='L')
    if era == 0:
        o = outfit(skin=SKIN[1], hair='#3a2a1e', hair_style='long', pelvis_bands=[(0, 9, '#866847')], chest_bands=[(0, 9, '#866847')],
                   sleeve=('short', '#866847'), legwear=('wrapped', '#6f583e'), foot=('wrap', '#7d6447', 0.10),
                   skirt=(0.74, '#7f6243', 0.05, 1.0, None), belt=ROPE)
        hv = heads('long', ('short', 'none', 'full'))
        bowname, fl, sword = 'self_bow', '#d9d2c0', 'bronze_sword'
    elif era == 1:
        o = tunic(LINEN, hem=0.70, sleeve='short', belt='TEAM', trim='TEAM', foot=('sandal', LEATHER, 0), skin=SKIN[0])
        hv = heads('short', ('short', 'none', 'full'))
        bowname, fl, sword = 'composite_bow', '#c9b48a', 'bronze_sword'
    else:
        o = tunic('#7b6a4f', trousers='#4f5446', hem=0.74, sleeve='long', belt=LEATHER_D, foot=('boot', LEATHER_D, 0.16), skin=SKIN[3])
        hv = heads('short', ('full', 'short', 'none'), ['#5a3f28', '#7a5a34', '#3a2a1e'])
        bowname, fl, sword = 'self_bow', '#e0dccf', 'gladius'
    build_human(m, o, hv)
    if era == 2:
        torso_shell(m, 0.98, 1.44, 0.024, '#8d7b5c', qfn=lambda x, y, z: '#8d7b5c' if int((math.atan2(z, x) + 4) * 5) % 2 else '#7f6e52', label='quilted_jerkin')
        helmet(m, 'leather_cap', {'cap_col': '#5e4630'})
        build_belt(m, {'belt': LEATHER_D}, 1.0)
    elif era == 1:
        helmet(m, 'headband', {'band_col': 'TEAM'})
    else:
        helmet(m, 'headband', {'band_col': '#7d5b36', 'feather': '#e2ddd2'})
    grip(m, 'L', weapon(bowname, lod), group='bowWeapon')
    grip(m, 'R', weapon(sword, lod), group='swordWeapon')
    scabbard(m, LEATHER_D if era else '#6b5034', BRONZE if era < 2 else IRON_D, length=0.58 if era < 2 else 0.52, group='swordSheath')
    quiver(m, LEATHER if era else '#7a5b3a', fletch=fl)
    return m


def b_scout(lod):
    m = Model('scout', lod)
    spec(m, 'thrust')
    o = tunic('#6f6a4c', trousers='#5d5240', hem=0.80, sleeve='long', belt=LEATHER, foot=('boot', LEATHER, 0.14), skin=SKIN[0], hood_col='#5b5a40', hide_hair=True)
    build_human(m, o, heads('short', ('short', 'none', 'full')))
    helmet(m, 'hood', o)
    build_cape(m, '#5b5a40', top=1.48, hem=0.80, width=0.24)
    grip(m, 'R', weapon('flint_spear', lod))
    pouch(m, LEATHER, 0.17, 0.96, 0.03, 0.10, 0.10, 0.06)
    m.add('chest', box(0.20, 0.24, 0.10, 0.03), '#6b5236', m=mat_t(0, 1.28, -0.16), label='bedroll_pack')
    return m


def b_militia(lod):
    m = Model('militia', lod)
    spec(m, 'thrust', L=SHIELD)
    o = tunic('#8a7a5c', trousers='#5e5445', hem=0.70, sleeve='long', belt=LEATHER_D, foot=('shoe', LEATHER_D, 0.06), skin=SKIN[0])
    build_human(m, o, heads('short', ('short', 'none', 'full')))
    torso_shell(m, 0.95, 1.44, 0.022, '#a49371', qfn=lambda x, y, z: '#a49371' if int((y - 0.9) / 0.05) % 2 else '#958564', label='padded_jack')
    helmet(m, 'leather_cap', {'cap_col': '#5e4630'})
    grip(m, 'R', weapon('wood_spear', lod))
    _shield(m, 'round_wicker')
    return m


# ---------- Bronze Age
def b_bronze_spearman(lod):
    m = Model('bronze_spearman', lod)
    spec(m, 'thrust', L=SHIELD)
    o = tunic(LINEN, hem=0.70, sleeve='short', belt=BRONZE_D, trim='TEAM', foot=('sandal', LEATHER, 0), skin=SKIN[0])
    build_human(m, o, heads('long', ('full', 'short', 'full'), ['#2b211b', '#3a2a1e', '#1f1915']))
    torso_shell(m, 1.02, 1.44, 0.026, BRONZE, 'metal', label='bronze_corslet', tags=('armor',))
    for s in 'LR':
        limb_shell(m, 'shin_' + s, SHIN, -0.36, -0.02, 0.010, BRONZE, 'metal', front_only=True, label='greave', tags=('armor',))
    helmet(m, 'bronze_cone', {'crest': 'TEAM'}, tags=('helm_std',))
    helmet(m, 'boar_tusk', {}, tags=('elite',))
    grip(m, 'R', weapon('bronze_spear', lod))
    _shield(m, 'figure_eight', lift=0.05, out=0.08, yaw=0.15)
    return m


def b_bronze_axeman(lod):
    m = Model('bronze_axeman', lod)
    spec(m, 'swing', L=SHIELD)
    o = tunic('#d6c49a', hem=0.72, sleeve='none', belt='TEAM', trim='TEAM', foot=('sandal', LEATHER, 0), skin=SKIN[1])
    o['chest_bands'] = [(0, 9, '#d6c49a')]
    build_human(m, o, heads('long', ('full', 'full', 'short'), ['#2b211b', '#3a2a1e', '#1f1915']))
    strap(m, 'chest', [(-0.13, 1.44, 0.10), (0.02, 1.25, 0.125), (0.15, 1.04, 0.11)], 0.05, 0.008, LEATHER_D, label='baldric')
    for s in 'LR':
        limb_shell(m, 'shin_' + s, SHIN, -0.36, -0.02, 0.010, BRONZE, 'metal', front_only=True, label='greave', tags=('armor',))
    helmet(m, 'bronze_cone', {'crest': None}, tags=('helm_std',))
    grip(m, 'R', weapon('bronze_axe', lod))
    _shield(m, 'round_small')
    return m


def b_bronze_archer(lod):
    return b_archer(lod, 'bronze_archer', 1)


def rider(m, style, L, o, hv, coat='bay', barding=None, cloth='TEAM', axis='Y'):
    m.rest_pos['body'] = (0, SADDLE_TOP + 0.115, SADDLE_Z)
    m.meta['riding'] = True
    hoofs = {'FL': (0.165, 0.615), 'FR': (-0.165, 0.615), 'HL': (0.17, -0.555), 'HR': (-0.17, -0.555)}
    m.meta['hoof_pts'] = {}
    for leg, (x, z) in hoofs.items():
        piv = m.pivot['horseShin_' + leg]
        m.meta['hoof_pts'][leg] = [(x - piv[0], -piv[1], z + dz - piv[2]) for dz in (-0.045, 0.0, 0.055)]
    spec(m, style, L=L, axis=axis)
    build_human(m, o, hv)
    build_horse(m, coat, barding, cloth)
    return m.rest


def b_bronze_cavalry(lod):
    m = Model('bronze_cavalry', lod, mounted=True)
    o = tunic(LINEN, hem=0.74, sleeve='short', belt=BRONZE_D, trim='TEAM', foot=('sandal', LEATHER, 0), skin=SKIN[0])
    rider(m, 'thrust', SHIELD, o, heads('long', ('full', 'short', 'none'), ['#2b211b', '#3a2a1e', '#1f1915']), 'chestnut')
    helmet(m, 'bronze_cone', {'crest': 'TEAM'})
    grip(m, 'R', weapon('bronze_spear', lod))
    _shield(m, 'round_small')
    return m


# ---------- Iron Age
def b_infantry(lod):
    m = Model('infantry', lod)
    spec(m, 'swing', L=SHIELD)
    o = tunic('TEAM_D', trousers='#5c5446', hem=0.74, sleeve='short', belt=LEATHER_D, foot=('boot', LEATHER_D, 0.12), skin=SKIN[3], buckle=BRONZE)
    build_human(m, o, heads('short', ('short', 'full', 'none'), ['#5a3f28', '#7a5a34', '#3a2a1e']))
    torso_shell(m, 0.88, 1.445, 0.024, '#7c8287', 'metal', label='mail_shirt', tags=('armor',),
                qfn=lambda x, y, z: '#7c8287' if int((y - 0.8) / 0.02) % 2 else '#6c7277')
    for s in 'LR':
        limb_shell(m, 'upperArm_' + s, UPPER_ARM, -0.13, 0.05, 0.012, '#7c8287', 'metal', label='mail_sleeve', tags=('armor',))
    build_belt(m, {'belt': LEATHER_D, 'buckle': BRONZE}, 0.99)
    helmet(m, 'montefortino', {'helm_col': '#8a8f8f', 'crest': 'TEAM'})
    grip(m, 'R', weapon('gladius', lod))
    scabbard(m, LEATHER_D, BRONZE, 0.52)
    _shield(m, 'oval', lift=0.03, yaw=0.18)
    return m


def b_cavalry(lod):
    m = Model('cavalry', lod, mounted=True)
    o = tunic('TEAM_D', trousers='#4f4a3f', hem=0.76, sleeve='long', belt=LEATHER_D, foot=('boot', LEATHER_D, 0.20), skin=SKIN[3])
    rider(m, 'thrust', SHIELD, o, heads('short', ('full', 'short', 'none'), ['#5a3f28', '#7a5a34', '#3a2a1e']), 'bay')
    torso_shell(m, 0.92, 1.445, 0.024, '#7c8287', 'metal', label='mail_shirt', tags=('armor',),
                qfn=lambda x, y, z: '#7c8287' if int((y - 0.8) / 0.02) % 2 else '#6c7277')
    helmet(m, 'montefortino', {'helm_col': '#8a8f8f'})
    grip(m, 'R', weapon('iron_spear', lod))
    _shield(m, 'round_boss')
    return m


def b_iron_archer(lod):
    return b_archer(lod, 'iron_archer', 2)


def b_javelinman(lod):
    m = Model('javelinman', lod)
    spec(m, 'javelin', L=SHIELD)
    o = tunic('TEAM', hem=0.72, sleeve='short', belt=LEATHER, foot=('sandal', LEATHER, 0), skin=SKIN[1], trim='#e4dcc4')
    build_human(m, o, heads('short', ('short', 'full', 'none')))
    helmet(m, 'leather_cap', {'cap_col': '#6a4e33'})
    grip(m, 'R', weapon('javelin', lod))
    _shield(m, 'round_small', yaw=0.35)
    for k in range(2):
        grip(m, 'L', weapon('javelin', lod), m_extra=mat_t(0.02 + 0.015 * k, -0.06, -0.03 - 0.02 * k) @ mat_rx(0.08 + 0.05 * k), label='spare_javelin')
    return m


# ---------- Medieval
def surcoat(m, color, hem=0.62, trim=None, tags=()):
    torso_shell(m, 0.94, 1.45, 0.040, color, label='surcoat', tags=tags)
    skirt_shell(m, 1.00, hem, color, 0.10, grow=0.045, label='surcoat_skirt', tags=tags,
                qfn=(lambda x, y, z: trim if y < hem + 0.035 else color) if trim else None)


def mail_body(m, hem=0.70, sleeves='long'):
    col = '#7d8286'
    qfn = lambda x, y, z: col if int((y - 0.7) / 0.018) % 2 else '#6f7477'
    torso_shell(m, 0.90, 1.445, 0.022, col, 'metal', label='hauberk', tags=('armor',), qfn=qfn)
    skirt_shell(m, 1.0, hem, col, 0.07, 'metal', grow=0.03, label='hauberk_skirt', tags=('armor',), qfn=qfn)
    for s in 'LR':
        limb_shell(m, 'upperArm_' + s, UPPER_ARM, -0.31, 0.05, 0.011, col, 'metal', label='mail_sleeve', tags=('armor',))
        if sleeves == 'long':
            limb_shell(m, 'forearm_' + s, FOREARM, -0.25, 0.02, 0.009, col, 'metal', label='mail_sleeve', tags=('armor',))


def b_man_at_arms(lod):
    m = Model('man_at_arms', lod)
    spec(m, 'swing', L=SHIELD)
    o = outfit(skin=SKIN[0], pelvis_bands=[(0, 9, '#6b604d')], chest_bands=[(0, 9, '#6b604d')], sleeve=('long', '#6b604d'),
               legwear=('hose', '#585246'), foot=('boot', LEATHER_D, 0.16), gloves=LEATHER_D, hide_hair=True)
    build_human(m, o, heads('short', ('full', 'short', 'none')))
    mail_body(m, 0.62)
    surcoat(m, 'TEAM', 0.66, trim='TEAM_D')
    build_belt(m, {'belt': LEATHER_D, 'buckle': IRON}, 1.0)
    helmet(m, 'nasal_coif', {'helm_col': '#8e9498'})
    grip(m, 'R', weapon('arming_sword', lod))
    scabbard(m, LEATHER_D, IRON_D, 0.78)
    _shield(m, 'heater', lift=0.04, yaw=0.20)
    return m


def b_halberdier(lod):
    m = Model('halberdier', lod)
    spec(m, 'chop')
    o = outfit(skin=SKIN[3], pelvis_bands=[(0, 9, '#6b604d')], chest_bands=[(0, 9, '#6b604d')], sleeve=('long', '#9a8a6a'),
               legwear=('hose', 'TEAM_D'), foot=('boot', LEATHER_D, 0.10), hide_hair=True)
    build_human(m, o, heads('short', ('short', 'full', 'none'), ['#5a3f28', '#7a5a34', '#3a2a1e']))
    qfn = lambda x, y, z: '#a39374' if int((math.atan2(z, x) + 4) * 6) % 2 else '#948566'
    torso_shell(m, 0.92, 1.45, 0.030, '#a39374', label='gambeson', qfn=qfn, tags=('armor',))
    skirt_shell(m, 1.0, 0.70, '#a39374', 0.06, grow=0.035, label='gambeson_skirt', qfn=qfn, tags=('armor',))
    for s in 'LR':
        limb_shell(m, 'upperArm_' + s, UPPER_ARM, -0.30, 0.05, 0.016, '#a39374', 'cloth', label='gambeson_sleeve', tags=('armor',))
    torso_shell(m, 1.10, 1.43, 0.046, 'TEAM', label='tabard')
    helmet(m, 'kettle_coif', {'helm_col': '#8e9498'})
    grip(m, 'R', weapon('halberd', lod))
    return m


def b_crossbowman(lod):
    m = Model('crossbowman', lod)
    spec(m, 'crossbow', axis='Z')
    o = outfit(skin=SKIN[0], pelvis_bands=[(0, 9, '#6b604d')], chest_bands=[(0, 9, '#6b604d')], sleeve=('long', '#8f7f60'),
               legwear=('hose', '#5a5346'), foot=('boot', LEATHER_D, 0.10))
    build_human(m, o, heads('short', ('short', 'none', 'full')))
    qfn = lambda x, y, z: 'TEAM' if int((math.atan2(z, x) + 4) * 6) % 2 else 'TEAM_D'
    torso_shell(m, 0.92, 1.45, 0.030, 'TEAM', label='gambeson', qfn=qfn)
    skirt_shell(m, 1.0, 0.72, 'TEAM_D', 0.06, grow=0.035, label='gambeson_skirt')
    build_belt(m, {'belt': LEATHER_D, 'buckle': IRON}, 1.0)
    helmet(m, 'kettle', {'helm_col': '#8e9498'})
    grip(m, 'R', weapon('crossbow', lod), group='bowWeapon')
    grip(m, 'R', weapon('arming_sword', lod), group='swordWeapon')
    scabbard(m, LEATHER_D, IRON_D, 0.72, group='swordSheath')
    m.add('body', box(0.07, 0.24, 0.07, 0.015), LEATHER, m=mat_t(-0.18, 0.92, -0.04) @ mat_rz(-0.1), label='bolt_case')
    return m


def plate_limbs(m, col=STEEL):
    for s in 'LR':
        limb_shell(m, 'thigh_' + s, THIGH, -0.40, 0.02, 0.012, col, 'metal', label='cuisse', tags=('armor',))
        limb_shell(m, 'shin_' + s, SHIN, -0.40, 0.02, 0.012, col, 'metal', label='greave', tags=('armor',))
        limb_shell(m, 'forearm_' + s, FOREARM, -0.24, -0.02, 0.012, col, 'metal', label='vambrace', tags=('armor',))
        limb_shell(m, 'upperArm_' + s, UPPER_ARM, -0.28, -0.06, 0.013, col, 'metal', label='rerebrace', tags=('armor',))
        pauldron(m, s, col, 1.0, tags=('armor',), lames=1)
        m.add('shin_' + s, ellipsoid(m.n(8), 4, 0.06, 0.05, 0.05, lat0=-0.2), col, 'metal', space='local', m=mat_t(0, 0.015, 0.03), label='poleyn', tags=('armor',))


def b_knight(lod):
    m = Model('knight', lod, mounted=True)
    o = outfit(skin=SKIN[0], pelvis_bands=[(0, 9, '#6b604d')], chest_bands=[(0, 9, '#6b604d')], sleeve=('long', '#7d8286'),
               legwear=('hose', '#7d8286'), foot=('boot', STEEL, 0.0), gloves='#6f7477', hide_hair=True)
    rider(m, 'lance', SHIELD, o, heads('short', ('short',)), 'grey', barding='TEAM', cloth='TEAM')
    mail_body(m, 0.70)
    plate_limbs(m)
    surcoat(m, 'TEAM', 0.68, trim='#e8e0cc')
    helmet(m, 'great_helm', {'crest': 'TEAM_D'})
    grip(m, 'R', weapon('lance', lod))
    _shield(m, 'heater', lift=0.02, yaw=0.35)
    scabbard(m, LEATHER_D, IRON_D, 0.80)
    return m


def b_heavy_cavalry(lod):
    m = Model('heavy_cavalry', lod, mounted=True)
    o = outfit(skin=SKIN[3], pelvis_bands=[(0, 9, '#6b604d')], chest_bands=[(0, 9, '#6b604d')], sleeve=('long', '#7d8286'),
               legwear=('hose', '#585246'), foot=('boot', LEATHER_D, 0.24), gloves=LEATHER_D, hide_hair=True)
    rider(m, 'swing', SHIELD, o, heads('short', ('full', 'short')), 'black', cloth='TEAM')
    mail_body(m, 0.70)
    surcoat(m, 'TEAM_D', 0.70, trim='TEAM')
    helmet(m, 'bascinet', {'helm_col': '#959ba0'})
    grip(m, 'R', weapon('mace', lod))
    _shield(m, 'heater', yaw=0.35)
    return m


# ---------- Renaissance
def doublet(color, hose, slashes='#e3d6b5', skin=SKIN[0], **k):
    return outfit(skin=skin, pelvis_bands=[(0.0, 0.93, hose), (0.93, 9, color)], chest_bands=[(0, 9, color)],
                  sleeve=('long', color), legwear=('hose', hose), foot=('shoe', '#2f2621', 0.04), belt=LEATHER_D, **k)


def breastplate(m, col='#9aa1a6', tassets=True):
    torso_shell(m, 1.00, 1.44, 0.030, col, 'metal', label='breastplate', front_ridge=0.012, tags=('armor',))
    if tassets:
        skirt_shell(m, 1.02, 0.84, col, 0.03, 'metal', grow=0.04, label='tassets', tags=('armor',),
                    qfn=lambda x, y, z: col if int((y - 0.8) / 0.045) % 2 else '#878e93')


def b_pikeman(lod):
    m = Model('pikeman', lod)
    spec(m, 'pike')
    o = doublet('TEAM', '#5a5346')
    build_human(m, o, heads('short', ('full', 'short', 'none')))
    breastplate(m)
    helmet(m, 'morion', {'crest': 'TEAM'})
    grip(m, 'R', weapon('pike', lod))
    scabbard(m, LEATHER_D, BRASS, 0.75)
    return m


def b_arquebusier(lod):
    m = Model('arquebusier', lod)
    spec(m, 'gun', axis='Z')
    o = doublet('TEAM_D', '#4f4a40', skin=SKIN[3])
    build_human(m, o, heads('short', ('short', 'full', 'none'), ['#5a3f28', '#7a5a34', '#3a2a1e']))
    helmet(m, 'morion', {'helm_col': '#8f969b'})
    crossbelt(m, LEATHER_D, side=1)
    grip(m, 'R', weapon('arquebus', lod))
    pouch(m, LEATHER, -0.16, 0.95, 0.06)
    return m


def b_musketeer(lod):
    m = Model('musketeer', lod)
    spec(m, 'gun', axis='Z')
    o = doublet('TEAM', '#4c463d', cuff='#e8e0cc')
    o['foot'] = ('tallboot', '#3a2c22', 0.30)
    build_human(m, o, heads('long', ('moustache', 'short', 'moustache'), ['#3a2a1e', '#5a3f28', '#2a2420']))
    torso_shell(m, 1.38, 1.47, 0.034, '#e8e0cc', label='falling_collar')
    helmet(m, 'felt_hat', {'crest': 'TEAM'})
    crossbelt(m, '#6b4a2c', side=1)
    for k in range(5):     # 'twelve apostles' powder charges on the bandolier
        t = 0.2 + k * 0.13
        m.add('chest', cylinder(m.n(6), 0.012, 0.055), '#3a3028', m=mat_t(0.13 - t * 0.28, 1.44 - t * 0.46, 0.150 - abs(t - 0.5) * 0.03), label='charge')
    grip(m, 'R', weapon('musket', lod))
    scabbard(m, '#3a2c22', BRASS, 0.90)
    return m


def b_cuirassier(lod):
    m = Model('cuirassier', lod, mounted=True)
    o = doublet('#6b5a46', '#4c463d', gloves=LEATHER, hide_hair=True)
    o['foot'] = ('tallboot', '#2d241e', 0.40)
    rider(m, 'swing', REINS, o, heads('short', ('moustache', 'short')), 'black', cloth='TEAM')
    breastplate(m, '#5d6266')
    plate_limbs(m, '#5d6266')
    torso_shell(m, 0.98, 1.06, 0.048, 'TEAM', label='sash')
    helmet(m, 'burgonet', {'helm_col': '#5d6266'})
    grip(m, 'R', weapon('sabre', lod), group='sideWeapon')
    grip(m, 'R', weapon('pistol', lod), group='mountedGun')
    return m


# ---------- Industrial
def uniform(coat, trousers, facing, skin=SKIN[0], **k):
    return outfit(skin=skin, pelvis_bands=[(0.0, 0.97, trousers), (0.97, 9, coat)], chest_bands=[(0, 9, coat)],
                  sleeve=('long', coat), legwear=('trousers', trousers), foot=('boot', '#1e1b19', 0.12), cuff=facing, belt=None, **k)


def b_rifleman(lod):
    m = Model('rifleman', lod)
    spec(m, 'gun', axis='Z')
    o = uniform('TEAM_D', '#3d4048', '#b8312a')
    build_human(m, o, heads('short', ('moustache', 'none', 'short')))
    skirt_shell(m, 1.0, 0.70, 'TEAM_D', 0.06, grow=0.03, label='frock_coat')
    torso_shell(m, 1.415, 1.49, 0.032, '#b8312a', label='collar')
    build_belt(m, {'belt': '#262220', 'buckle': BRASS}, 1.0)
    for x in (-0.03, 0.03):
        for y in (1.10, 1.20, 1.30):
            m.add('chest', ellipsoid(m.n(6), 3, 0.008, 0.008, 0.005), BRASS, 'metal', m=mat_t(x, y, prof(CHEST, y)[2] + 0.017), label='button')
    helmet(m, 'kepi', {'hat_col': 'TEAM_D'})
    backpack(m, '#4a3b2a', roll='#5a5e55')
    pouch(m, '#262220', 0.10, 1.0, 0.10)
    grip(m, 'R', weapon('rifle', lod))
    return m


def b_line_infantry(lod):
    m = Model('line_infantry', lod)
    spec(m, 'gun', axis='Z')
    o = uniform('TEAM', '#e6e0d2', '#f0ece2')
    o['foot'] = ('boot', '#1e1b19', 0.20)
    build_human(m, o, heads('short', ('none', 'moustache', 'none')))
    coat_tails(m, 'TEAM', lining='#f0ece2')
    torso_shell(m, 1.10, 1.40, 0.026, 'TEAM', label='lapels', qfn=lambda x, y, z: '#f0ece2' if 0.035 < abs(x) < 0.075 and z > 0 else 'TEAM')
    crossbelt(m, '#f0ece2', 1)
    crossbelt(m, '#f0ece2', -1)
    helmet(m, 'shako', {'crest': 'TEAM'})
    backpack(m, '#2b2a28')
    grip(m, 'R', weapon('rifle', lod))
    return m


def b_dragoon(lod):
    m = Model('dragoon', lod, mounted=True)
    o = uniform('TEAM', '#e1d9c6', '#e6d7a8', gloves='#e8e0cc')
    o['foot'] = ('tallboot', '#1e1b19', 0.40)
    rider(m, 'swing', REINS, o, heads('short', ('moustache', 'none')), 'bay', cloth='TEAM_D')
    coat_tails(m, 'TEAM')
    crossbelt(m, '#f0ece2', 1)
    helmet(m, 'dragoon_helmet', {})
    grip(m, 'R', weapon('sabre', lod), group='sideWeapon')
    grip(m, 'R', weapon('carbine', lod), group='mountedGun')
    scabbard(m, '#a8adb1', BRASS, 0.85)
    return m


# ---------- Modern
CAMO = ['#5d6646', '#4a5238', '#6e6b4c', '#3f4532']


def camo_fn(base):
    def f(x, y, z):
        h = math.sin(x * 37 + y * 23) + math.sin(z * 41 - y * 29) + math.sin((x + z) * 19 + y * 11)
        return CAMO[int((h + 3) * 1.3) % 4]
    return f


def modern_body(m, rocket=False):
    o = outfit(skin=SKIN[0], pelvis_bands=[(0, 9, CAMO[0])], chest_bands=[(0, 9, CAMO[0])], sleeve=('long', CAMO[0]),
               legwear=('trousers', CAMO[1]), foot=('modernboot', '#2c2a26', 0.17), gloves='#2e302b')
    build_human(m, o, heads('short', ('none', 'stubble', 'none'), ['#3a2a1e', '#2a2420', '#5a3f28']))
    for p in m.parts:     # apply the camouflage pattern to the uniform cloth
        if p.color in (CAMO[0], CAMO[1]) or (p.qcolor and CAMO[0] in p.qcolor):
            p.qcolor = [camo_fn(0)(*np.mean([p.v[i] for i in set(f)], axis=0)) if (p.qcolor[k] if p.qcolor else p.color) in (CAMO[0], CAMO[1]) else p.qcolor[k]
                        for k, f in enumerate(p.q)]
    torso_shell(m, 0.98, 1.43, 0.045, '#4f5640', label='plate_carrier', p=4.0)
    for x in (-0.09, 0.0, 0.09):
        pouch(m, '#454b37', x, 1.13, 0.165, 0.075, 0.10, 0.05, bone='chest')
    build_belt(m, {'belt': '#3b3f31'}, 0.99)
    pouch(m, '#454b37', -0.17, 0.95, -0.02, 0.06, 0.09, 0.07)
    helmet(m, 'modern_helmet', {'helm_col': '#56603f'})


def b_modern_infantry(lod):
    m = Model('modern_infantry', lod)
    spec(m, 'gun', axis='Z')
    modern_body(m)
    grip(m, 'R', weapon('assault_rifle', lod))
    backpack(m, '#4a5139')
    return m


def b_rocket_team(lod):
    m = Model('rocket_team', lod)
    spec(m, 'launcher', R=('P', np.array([-0.19, 1.43, 0.22]), np.array([0.0, 1.0, 0.25])), L=('P', np.array([-0.17, 1.46, 0.46]), None))
    modern_body(m, rocket=True)
    # launcher tube resting on the right shoulder (chest bone)
    tube = cylinder(m.n(12), 0.055, 1.10, 0.055)
    mm = mat_t(-0.20, 1.53, 0.06) @ mat_rx(math.pi / 2)
    m.add('chest', tube, '#5a6447', m=mm, label='launcher_tube')
    m.add('chest', cylinder(m.n(10), 0.075, 0.30, 0.04), '#4b5340', m=mat_t(-0.20, 1.53, 0.70) @ mat_rx(math.pi / 2), label='warhead')
    m.add('chest', box(0.05, 0.10, 0.05, 0.01), '#2c2f2a', m=mat_t(-0.20, 1.45, 0.20), label='launcher_grip')
    m.add('chest', box(0.04, 0.06, 0.10, 0.01), '#2c2f2a', m=mat_t(-0.14, 1.59, 0.12), label='sight')
    return m


BUILDERS = {
    'scout': b_scout, 'militia': b_militia, 'slinger': b_slinger, 'spearman': b_spearman, 'axeman': b_axeman, 'archer': b_archer,
    'bronze_spearman': b_bronze_spearman, 'bronze_axeman': b_bronze_axeman, 'bronze_archer': b_bronze_archer, 'bronze_cavalry': b_bronze_cavalry,
    'infantry': b_infantry, 'cavalry': b_cavalry, 'iron_archer': b_iron_archer, 'javelinman': b_javelinman,
    'man_at_arms': b_man_at_arms, 'halberdier': b_halberdier, 'crossbowman': b_crossbowman, 'knight': b_knight, 'heavy_cavalry': b_heavy_cavalry,
    'pikeman': b_pikeman, 'arquebusier': b_arquebusier, 'musketeer': b_musketeer, 'cuirassier': b_cuirassier,
    'rifleman': b_rifleman, 'line_infantry': b_line_infantry, 'dragoon': b_dragoon,
    'modern_infantry': b_modern_infantry, 'rocket_team': b_rocket_team,
}


def _clip(m, name, duration, plist, loop=False, riding=False):
    out = []
    for i, p in enumerate(plist):
        if riding:
            t = i / max(1, len(plist) - 1)
            hp, bob = anim.horse_gait(t, 'idle')
            p = dict(p)
            p.update(hp)
            lift = -anim.horse_ground(m, p)
            out.append((p, {'horse': (0, lift, 0), 'body': (0, lift, 0)}))
        else:
            out.append((p, {'body': (0, anim.ground(m, p) - 0.96, 0)}))
    c = anim.Clip(name, duration, loop, out)
    c.horse = riding
    return c


def clips_for(m):
    sp = m.meta['spec']
    keys = m.meta['keys']
    hold, riding = m.rest, m.meta['riding']
    free = m.meta['free_arms']
    sv = poses.Solver(m, riding)
    out = []

    def solved(klist, frames=21):
        return poses.solve_clip(m, klist, sp['primary'], sp['L'], sp['R'], sp['axis'], frames, sv)
    if riding:
        out.append(anim.clip_ride(m, 'idle', hold, 'idle', 3.0, 24))
        out.append(anim.clip_ride(m, 'walk', hold, 'walk', 1.10, 16))
        out.append(anim.clip_ride(m, 'run', hold, 'gallop', 0.56, 16))
        out.append(_clip(m, 'attack', 0.7, solved(keys['attack']), riding=True))
        m.meta['clip_ik_report'] = list(sv.report)
        if any(p.group == 'mountedGun' for p in m.parts):
            gstyle = 'pistol' if m.kind == 'cuirassier' else 'gun'
            gk = poses.style_keys(gstyle)
            sv3 = poses.Solver(m, True)
            gkeys = [k for k in gk['attack'] if abs(k['t'] - 0.60) > 1e-6]   # no torso recoil in the saddle
            plist = poses.solve_clip(m, gkeys, 'R', sp['L'], None, 'Z', 21, sv3)
            out.append(_clip(m, 'attack_gun', 0.7, plist, riding=True))
            m.meta['clip_ik_report'] += sv3.report
        out.append(_clip(m, 'hit', 0.28, [anim.keyed([(0, hold), (0.3, anim.add_pose(hold, {'chest': (-0.22, 0.12, 0.04), 'head': (-0.25, 0.1, 0)})), (1, hold)], i / 8) for i in range(9)], riding=True))
        if m.kind == 'dragoon':
            # dismounted: the dragoon stands beside the horse and fires the carbine
            ks = poses.style_keys('gun')
            sv2 = poses.Solver(m, False)
            m.meta['riding'] = False
            saved = dict(m.rest_pos)
            m.rest_pos.pop('body')
            stand = solved_stand = poses.solve_clip(m, [ks['hold'], dict(ks['hold'], t=1.0)], 'R', None, None, 'Z', 2, sv2)
            att = poses.solve_clip(m, ks['attack'], 'R', None, None, 'Z', 21, sv2)
            m.rest_pos.update(saved)
            m.meta['riding'] = True
            for name, plist, loop in (('dismounted', stand, True), ('dismounted_attack', att, False)):
                frames = []
                for p in plist:
                    hp, _ = anim.horse_gait(0, 'idle')
                    p = dict(p)
                    p.update(hp)
                    p['body'] = p.get('body', (0, 0, 0))
                    lift = -anim.horse_ground(m, p)
                    gy = anim.ground(m, {k: v for k, v in p.items() if not k.startswith('horse')}) - 0.96
                    frames.append((p, {'horse': (0, lift, 0), 'body': (0.85, 0.96 + gy - (SADDLE_TOP + 0.115), -SADDLE_Z)}))
                out.append(anim.Clip(name, 0.7 if not loop else 1.0, loop, frames))
        return out
    out.append(anim.clip_idle(m, hold))
    out.append(anim.clip_walk(m, hold, free))
    out.append(anim.clip_walk(m, hold, free, run=True))
    out.append(_clip(m, 'attack', 0.7, solved(keys['attack'])))
    if sp['style'] in ('bow', 'crossbow'):
        sk = poses.style_keys('swing')
        ks = [dict(k) for k in sk['attack']]
        for k in ks:
            k['L'] = ('A', RELAX['L'])
        out.append(_clip(m, 'attack_sword', 0.7, poses.solve_clip(m, ks, 'R', None, None, 'Y', 21, poses.Solver(m, False))))
    out.append(anim.clip_hit(m, hold))
    out.append(anim.clip_death(m, hold))
    if 'brace' in keys:
        out.append(_clip(m, 'brace', 1.0, solved([keys['brace'], dict(keys['brace'], t=1.0)], 2), loop=True))
    m.meta['clip_ik_report'] = sv.report
    if sp['L'] is SHIELD:
        k = dict(keys['hold'])
        k['L'] = SHIELD_UP
        k['legs'] = anim.STANCE
        out.append(_clip(m, 'shield_wall', 1.0, poses.solve_clip(m, [k, dict(k, t=1.0)], sp['primary'], SHIELD_UP, sp['R'], sp['axis'], 2, sv), loop=True))
    return out
