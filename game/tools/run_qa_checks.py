"""Run non-Godot structural checks; run the game to execute GDScript tests."""
from pathlib import Path
import subprocess, sys
base=Path(__file__).resolve().parent
for filename in ('check_gdscript_blocks.py','validate_package.py','check_city_v21.py','check_detail_v19.py','check_detail_v20.py','check_territory_v22.py','check_county_v23.py','check_county_v24.py','check_detail_nav_v25.py','check_atlas_v26.py','check_baked_v27.py','check_battle_terrain_v29.py','check_battlefield_v30.py','check_formations_v31.py','check_formation_layout_v31.py','check_morale_v32.py','check_campaign_retreat_v33.py'):
    print('RUNNING',filename,flush=True)
    subprocess.run([sys.executable,str(base/filename)],check=True)
print('PASS: static QA only, no Godot compilation.')
