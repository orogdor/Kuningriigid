#!/usr/bin/env python3
"""Static audit for the new native adapter's connections; not a GDScript compiler."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
m=(root/'scripts/main.gd').read_text()
r=(root/'scripts/adapters/v131_native_renderer.gd').read_text()
g=(root/'scripts/adapters/native_grid_path.gd').read_text()
for needle in ('_setup_native_renderer()', 'native_renderer.configure_actors(actors)',
               'native_renderer.sync_actor(i,here,facing)', '_toggle_models()',
               '_toggle_path_algorithm()', 'CampaignPort.find_path(walkable,src,dst)',
               'native_path.route(src,dst)', 'native_renderer.has_actors()'):
    assert needle in m, needle
for needle in ('MeshAdapter.compile_batches', 'MeshAdapter.place', 'library.model_ready.connect', 'library.load_original_models()'):
    assert needle in r, needle
for needle in ('AStarGrid2D.new()', 'DIAGONAL_MODE_NEVER', 'HEURISTIC_MANHATTAN'):
    assert needle in g, needle
print('PASS: Native GLB and MultiMesh adapter wires into scene, model/proxy toggle, optional native AStar; original BFS is retained')
