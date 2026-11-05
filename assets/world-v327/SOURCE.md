# V327 world nature

These eight GLBs are processed outputs of actual Hugging Face TRELLIS.2 jobs,
not downloaded stock models or a runtime AI dependency.

- Generator: https://huggingface.co/spaces/prithivMLmods/TRELLIS.2-Text-to-3D
- 3D model: https://huggingface.co/microsoft/TRELLIS.2-4B (MIT)
- Space application: Apache-2.0; its text-to-image endpoint supplied the initial
  individual oak, pine, palm and rock reference images.
- Jobs: 512 resolution, seed 42, 50,000 face request, 1024 albedo.
- Date: 2026-11-06 UTC. Actual source meshes: approximately 46–50k triangles.

Inputs were white-matted locally and composited onto black, without invoking the
Space's optional background-removal model. The resulting images were uploaded
to Gradio and passed to the 3D endpoint. A second generation replaced the first
white-background meshes after floor plates were found during visual inspection.

The Blender preparation script removes low floor fragments, preserves the
generated trunk cross-sections with connected branch rings and reconstructs solid canopy volumes from spatial clusters of
the generated canopy vertices. This avoids shredded disconnected AI leaf sheets
when reducing to overview budgets. The rock uses the outer hull of sampled generated vertices to remove fragile loose chips. Nearest
source-triangle albedo is baked into linear vertex colours. Geometry is centered,
Y-up and grounded at zero, with identity node transforms for the existing loader.
`manifest.json` records the final counts, rather than promising exact target counts.

No external service is called by the game: the GLBs ship locally, share instanced
geometry and have low/high versions. Medium and high graphics use the higher LOD;
distant/low graphics use the lower LOD. Oak/lime share the oak asset; pine/spruce
share the pine asset. Birch, cactus, shrub and settlement models retain their
existing generators.

To rebuild: place the four raw outputs as `<kind>-source.glb` under a
`trellis-v327` directory beside the checkout, then run:

```
blender -b -t 4 --python scripts/prepare-trellis-nature-v327.py
blender -b -t 4 --python scripts/render-world-assets-v327.py
node tests/world-assets-v327.mjs
```
