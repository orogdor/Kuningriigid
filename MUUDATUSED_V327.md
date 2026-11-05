# V327 – world nature and river terrain

User screenshots of V326 showed duplicate forest ground plates, low-detail tree
shapes, a square ruin plinth and rivers wider than the terrain grid could resolve.

The world now loads four actual Hugging Face TRELLIS.2 assets (oak, pine, palm,
rock), each with two local GLB LODs. Existing instanced geometry objects are
updated in place, including their culling bounds. A procedural fallback remains
available while loading. Sources, licenses and processing are recorded in
`assets/world-v327/SOURCE.md`; final counts are in `manifest.json`.

Direct decimation and voxel remeshing were rejected after inspecting broken
canopy previews. The final preparation reconstructs rounded canopy volumes and
connected trunk cross-sections from the generated geometry and samples its
albedo into vertex colours. These are derived overview assets, not the raw
50k-triangle output and not new high-detail hero models.

Duplicate old forest-cluster props are disabled, their footprint no longer
overlays the terrain, and the ruin earth slab is removed. Biome instances and
world props sample the displayed overview terrain for their ground height.

The overview terrain uses locally refined, conforming triangles along rivers
and coasts. Shared 2:1 boundaries have midpoint stitching; the sea copies the
same triangles. The ground sampler interpolates these exact triangles. The
detail map and simulation/save geography retain their existing paths. Regular
grid AO is skipped for this adaptive mesh because it assumes row-major vertices.

Medium quality, seed 77: 501,932 vertices / 1,001,552 triangles, 10.04 seconds
for geometry construction in this environment. This adds overview mesh cost;
low quality uses a smaller refinement depth. High quality refines further.

Validation: the workflow's 106 commands, including traffic, day/night, scout,
river/coast, save and UI regressions. The asset test validates the eight shipped
GLBs through the real loader, identity-preserving replacement, LOD bounds,
colours and budgets. The adaptive mesh test detects unpaired interior edges and
checks shared sea indices and triangle interpolation. See
`reports/world-nature-v327-ci.json` for individual results.

Blender CPU renders inspect the actual derived assets from three sides and a
river-mouth geometry patch. They do not reproduce the game's water shader or
prove visual acceptance on the user's existing save. The available browser
cannot create WebGL, so a full in-game GPU screenshot remains unverified.
All reported river defects are therefore not claimed resolved by these tests.
