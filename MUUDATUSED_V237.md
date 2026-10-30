# Kuningriigid V237 — farm, field and green preview fix

- Stone Age `farm` / homestead now routes through `createTownModelV154`,
  which loads the 4k-triangle hosted TRELLIS.2 `models-v2233/farm.glb` and
  asynchronously replaces it with the detailed `models-stone-near/farm.glb`.
  Old V158 farm geometry is only the failure fallback or later-age building.
- The Stone Age field draws the same procedurally modelled furrows and wheat
  near/far, with a reduced stalk count at distance. Its 8×8 crop rows and
  soil use consistent materials, so LOD no longer swaps back to V158 blocks.
  The crop is procedural and NOT claimed to be a new hosted AI-generated GLB.
- Prevents green construction ghost material from leaking into real GLB
  buildings: each preview mesh gets isolated cloned materials, including any
  near/far GLB asynchronously loaded after the preview is created.
- Cache-busted imports, new regression tests and GitHub Actions coverage.
