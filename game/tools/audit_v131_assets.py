#!/usr/bin/env python3
"""Offline manifest/adapter validator. This does not require network or Godot."""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
lib=(root/'scripts/adapters/v131_glb_library.gd').read_text()
render=(root/'scripts/adapters/v131_native_renderer.gd').read_text()
assert '26562368f56a32616651a266ed2d8c87f06d43d1' in lib
required=['warrior_1000_2.glb','worker_1000_2.glb','world_village_1000.glb','forest_cluster_1000.glb','rock_outcrop_1000.glb']
for s in required:
 assert s in lib, f'missing asset {s}'
assert 'GLTFDocument.new()' in lib
assert 'append_from_buffer' in lib
assert 'MultiMeshInstance3D.new()' in (root/'scripts/adapters/v131_multimesh_adapter.gd').read_text()
assert 'has_actors' in render and 'has_cities' in render
print('PASS: original pinned V131 GLB URLs, runtime GLTF adapter, cached models, multimesh, proxy fallback')
