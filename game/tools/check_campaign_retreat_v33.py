"""V3.3 independent miniature route fixtures + code wiring checks (NOT Godot runtime)."""
from pathlib import Path
from collections import deque
import re
root=Path(__file__).resolve().parents[1]
a=(root/'scripts/core/campaign_retreat_v131.gd').read_text()
b=(root/'scripts/core/individual_battle_port.gd').read_text()
m=(root/'scripts/core/military_port.gd').read_text()
s=(root/'scripts/core/preview_sim_port.gd').read_text()
u=(root/'scripts/main.gd').read_text()
t=(root/'tests/port_checks.gd').read_text()
for name in ('choose_destination','preferred_offset','apply_after_battle','_needs_retreat','_enemy_occupied','_enemy_city'):
 assert f'static func {name}(' in a
assert 'world_nav.is_open(next)' in a
assert 'queue.append({"p":next,"path":following})' in a
assert 'if not moved:' in a
assert '"retreat_until"' in a
assert 'CampaignRetreat.apply_after_battle(state,battle,winner,world_nav)' in b
assert 'IndividualBattle.tick(state,step,world_nav)' in s
assert 'BattlePreview.detect_encounter(state)' in s
assert 'float(state.get("seconds",0.0))' in m
assert '"campaign_retreat_info": _campaign_retreat_info()' in u
assert 'v131_godot_measurements_v33.csv' in u
assert 'campaign_retreats,campaign_retreats_trapped' in u
assert len(re.findall(r'^\s+_check\(',t,re.M))==647
assert len(re.findall(r'_check\(results,"v33-',t))==23
# Independent reachability fixture: 3-tile dry passage, sea to the west and a hostile tile east.
dry={(50,50),(49,50),(48,50),(50,49)}
enemy={(50,49)}
origin=(50,50)
q=deque([(origin,[])])
seen={origin};routes={}
while q:
 (x,y),steps=q.popleft()
 if steps: routes[(x,y)]=steps
 if len(steps)>=4:continue
 for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)]:
  p=(x+dx,y+dy)
  if p not in dry or p in enemy or p in seen:continue
  seen.add(p);q.append((p,steps+[p]))
assert routes[(49,50)]==[(49,50)]
assert routes[(48,50)]==[(49,50),(48,50)]
assert (51,50) not in routes and (50,49) not in routes
print('PASS 3.3: 647 prepared assertions, bounded safe retreat, no teleport, recovery and CSV wiring. Godot parser NOT run.')
