"""Independent structural and numeric checks; NOT a Godot/GDScript runtime."""
from pathlib import Path
import re, math, random, json
root=Path(__file__).resolve().parents[1]
src=(root/'scripts/core/battle_surface_v131.gd').read_text()
battle=(root/'scripts/core/individual_battle_port.gd').read_text()
view=(root/'scripts/adapters/native_individual_battle_view.gd').read_text()
main=(root/'scripts/main.gd').read_text()
checks=(root/'tests/port_checks.gd').read_text()
for name in ('absolute_height','height','ground_open','edge_open','river_blocked','route','line_of_sight','speed_factor'):
    assert re.search(r'^static func '+name+r'\(',src,re.M),name
assert 'terrain_search_budget: int = 2 if bool(battle.get("large_battle_test",false)) else 6' in battle
assert 'terrain_retry_at' in battle
assert 'BattleSurface.edge_open(surface' in battle
assert 'BattleSurface.route(surface' in battle
assert 'BattleSurface.line_of_sight' in battle
assert '_refresh_surface(surface)' in view and 'sculpt.generate_normals()' in view
assert 'var y_terrain: float = BattleSurface.height' in view
assert 'river_graphics' in view and 'bridge.get("open",false)' in view
assert '"terrain_battle": _terrain_battle_demo()' in main
assert 'for i in range(4):\n        Military.add_unit(preview_state,left' in main
assert 'for i in range(4):' in main and 'terrain_routes' in main and 'terrain_blocked' in main
assert len(re.findall(r'^\s+_check\(',checks,re.M))>=658
assert (root/'docs/PORT_V29_SCOPE.md').exists()
# 9x9 V131 interpolation in a 64x50 m battlefield, independent Python mirror.
def elev(grid,x,z):
    u=max(0,min(8,(x/64+.5)*8));v=max(0,min(8,(z/50+.5)*8));i=min(7,int(u));j=min(7,int(v));fx=u-i;fz=v-j
    return (grid[j*9+i]*(1-fx)+grid[j*9+i+1]*fx)*(1-fz)+(grid[(j+1)*9+i]*(1-fx)+grid[(j+1)*9+i+1]*fx)*fz
flat=[1]*81
for _ in range(1000):
    x=random.uniform(-32,32);z=random.uniform(-25,25)
    assert abs(elev(flat,x,z)-1)<1e-8
hill=[1+0.13*i+0.07*j for j in range(9) for i in range(9)]
for j in range(9):
    for i in range(9):
        assert abs(elev(hill,-32+i*8,-25+j*50/8)-hill[j*9+i])<1e-7
# River along x=0; only crossing at z=0 when open.
def river_blocked(x,z,bridge):
    hit=abs(x)<(2+.65) and -25<=z<=25
    if hit and bridge and math.hypot(x,z)<=3.5:
        return False
    return hit
assert river_blocked(0,0,False)
assert not river_blocked(0,0,True)
assert river_blocked(0,11,True)
# Archive should retain old v2.8 fixture data and new module.
assert (root/'data/v131_earth_seed131_atlas.bin').stat().st_size>400000
print('PASS v2.9: module/UI/render paths, bounded battlefield replan, 1000 flat samples, 81 grid nodes, bridge/river checks, 658+ GDScript checks PREPARED. No Godot runtime.')
