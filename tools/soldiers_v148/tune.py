"""Quick IK reachability report per style (no geometry)."""
import sys
import numpy as np
import poses, anim
from rig import Model, SADDLE_TOP, SADDLE_Z
from poses import SHIELD, SHIELD_UP, REINS

def run(style, primary='R', L=None, R=None, axis='Y', riding=False):
    m = Model('t', 0, mounted=riding)
    if riding:
        m.rest_pos['body'] = (0, SADDLE_TOP + 0.115, SADDLE_Z)
    m.meta['riding'] = riding
    keys = poses.style_keys(style)
    sv = poses.Solver(m, riding)
    seq = [('hold', keys['hold'])] + [('a%.2f' % k['t'], k) for k in keys['attack']] + ([('brace', keys['brace'])] if 'brace' in keys else [])
    for name, k in seq:
        pose = poses.base_pose(m, k, riding)
        sv.report = []
        sv.arms(pose, k, primary, L, R, axis, name)
        for r in sv.report:
            flag = '  <<<' if r[3] > 0.03 or r[4] > (35 if r[2] == 'ON' else 16) else ''
            print(f'{style:9s} {name:6s} {r[1]} {r[2]:2s} {r[3]*100:5.1f} cm {r[4]:5.1f} deg{flag}')

if __name__ == '__main__':
    args = sys.argv[1:]
    for st in args:
        if st == 'gun': run('gun', axis='Z')
        elif st == 'crossbow': run('crossbow', axis='Z')
        elif st == 'bow': run('bow', primary='L')
        elif st == 'shieldthrust': run('thrust', L=SHIELD)
        elif st == 'launcher': run('launcher', R=('P', np.array([-0.19, 1.43, 0.22]), np.array([0.0, 1.0, 0.25])), L=('P', np.array([-0.17, 1.46, 0.46]), None))
        elif st == 'lance': run('lance', L=SHIELD, riding=True)
        elif st == 'pistol': run('pistol', L=REINS, riding=True, axis='Z')
        elif st == 'ridegun': run('gun', L=REINS, riding=True, axis='Z')
        else: run(st)
