from pathlib import Path
import math,re,json
root=Path(__file__).resolve().parents[1]
main=(root/'scripts/main.gd').read_text()
layout=(root/'scripts/core/city_layout_port.gd').read_text()
nav=(root/'scripts/adapters/local_street_nav.gd').read_text()
stress=(root/'scripts/core/city_stress_port.gd').read_text()
detail=(root/'scripts/adapters/native_detail_tile.gd').read_text()
tests=(root/'tests/port_checks.gd').read_text()
assert 'CityLayout.position(city,index)' in (root/'scripts/core/cargo_port.gd').read_text()
assert 'CityLayout.footprint(' in nav
assert 'CityLayout.ensure_positions(city)' in nav
assert 'Cargo.building_position(town,i)' in detail
assert 'city_to_detail(town,Cargo.building_position(town,i))' in detail
assert 'var body_mesh := BoxMesh.new()' in detail and '_add_multi(body_mesh' in detail
assert 'func _start_city_stress' in main and 'func _stop_city_stress' in main
assert '"stress_reset": _stop_city_stress()' in main
assert 'func _preview_save() -> void:' in main and 'if city_stress_index >= 0:' in main
assert ('v131_godot_measurements_v22.csv' in main or 'v131_godot_measurements_v23.csv' in main or 'v131_godot_measurements_v24.csv' in main or 'v131_godot_measurements_v33.csv' in main)
assert 'synthetic_walkers,walker_arrivals,local_route_failures' in main
assert 'CityStress.advance(' in main
assert '_run_rule_checks()' not in main.split('func _ready() -> void:',1)[1].split('func _setup_lighting()',1)[0]
assert len(re.findall(r'^    _check\(',tests,re.M))>=389
# Independently check a reproduction of the deterministic lot rules with more than
# one class of footprint and both main cross-streets reserved. This is NOT a
# Godot execution test; a cross-check against expected algorithm semantics.
sizes={'hall':(1.2,1.05),'house':(.75,.65),'market':(1.8,1.4),'farm':(1.1,1.2),'lumber':(.85,.85)}
used=[((0.,0.),'hall')]
for i in range(1,160):
    kind='house'
    if i%24==0:kind='market'
    elif i%13==0:kind='lumber'
    elif i%17==0:kind='farm'
    found=None
    for ring in range(1,16):
        candidates=[]
        for gz in range(-ring,ring+1):
            for gx in range(-ring,ring+1):
                if max(abs(gx),abs(gz))!=ring or gx==0 or gz==0:continue
                x=gx*.88+(.28 if gx>0 else -.28)
                z=gz*.88+(.28 if gz>0 else -.28)
                if abs(x)+sizes[kind][0]/2>10.65 or abs(z)+sizes[kind][1]/2>9.10:continue
                candidates.append((x*x+z*z,(x,z)))
        for _,p in sorted(candidates):
            if all(abs(p[0]-q[0]) >= (sizes[kind][0]+sizes[k][0])*.5+.16 or abs(p[1]-q[1]) >= (sizes[kind][1]+sizes[k][1])*.5+.16 for q,k in used):
                found=p;break
        if found is not None:break
    assert found is not None, f'crowding prevented placement {i} of 160'
    used.append((found,kind))
assert len(used)==160
for i,(p,k) in enumerate(used):
    assert abs(p[0])+sizes[k][0]*.5<=10.65 and abs(p[1])+sizes[k][1]*.5<=9.1
    for q,o in used[:i]:
        assert abs(p[0]-q[0]) >= (sizes[k][0]+sizes[o][0])*.5+.16 or abs(p[1]-q[1]) >= (sizes[k][1]+sizes[o][1])*.5+.16
print('PASS: independent 160-lot geometry, overlap, tile-edge, and 2.1 wiring checks (NOT Godot engine)')
