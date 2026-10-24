# Kuningriigid V131 → Godot 4, port 2.2: Territory and Counties

Source snapshot: `orogdor/Kuningriigid@26562368f56a32616651a266ed2d8c87f06d43d1` (V131).

## Ported / added

- `counties-v126.js` basis for county tile limit `3×urban area`, land-connected footprint, and up to 3 local countryside buildings per tile.
- 14 sampled cities now hold deterministic, mutually exclusive territory ownership, not fixed radius=1 overlay. City cores are protected; higher-population cities prevail on contested non-core tiles. If the smaller town loses too many tiles, closest available land gets claimed as fallback.
- Urban area scales at populations 3/6/14/32/48: side length 3/5/7/9/11 tiles. This growth policy follows recent project requirements; it is a modification to baseline V131, not an exact source-code copy. Maximum is under 12×12.
- Bold world map national/city boundary strokes, transparent urban vs rural fill. Rebuild on population changes and load.
- Countryside worksite preview: lumber, farm, quarry, mine, tech/resource validation, deterministic proxy deposits; 3 sites/tile max; limited staffing, production and distance loss. When borders change, automatically relocate to a suitable owned tile or suspend.
- Worksites have simple native 3D detail-tile boxes, separate from center-city building arrays. Persistence in new versioned preview save `user://v131_godot_preview_v22.json`; loads previous v14/v13 etc.
- Mobile buttons under `Linn ja ehitus` for county jobs, plus `Linna maa-ala info` and reversible `Piiride demo: 32 elanikku` under `Testid`.
- CSV benchmark extended with selected urban/county area, countryside worksite count and production cycles, under `user://v131_godot_measurements_v22.csv`.

## Explicit limitations

- Worksite deposits are deterministic Godot test proxies, **not** V131 mineral strata, hydrology or biome data.
- Rural worksite deliveries and workers are simplified resource/time calculations; **no physical multi-tile worker/caravan movement** yet.
- City center detail buildings still use V2.1 proxy geometry and city layout. County sites do not yet partake in the full V131 3×3 continuous city/road footprint.
- The surrounding country outline in this port displays city-owner claims tinted by country. It is not a complete diplomatic-border engine.
- Neither the V131 AI nor all local resources, city expansion and combat systems are fully ported.
- The package was verified structurally and with Python semantic cross-checks. **No Godot engine compiler / Android device test was possible here.** GDScript tests are prepared and must be run in Godot by using MENU → Reeglitest.

## How to test on Android (Godot Editor)

1. Unzip to a fresh folder and import `project.godot` in Godot 4.x.
2. Press Play. Under Testid choose `Piiride demo: 32 elanikku`. On world map, selected city expands. Choose `Taasta piiride demo` to restore original population; this demo pauses economy and cannot be saved.
3. Under Linn ja ehitus choose `Linna maa-ala info`. Build `Maakonna mets/põld/kivimurd/kaevandus` once prerequisites and resources allow. If you are on the detail view, the nearest suitable site should open.
4. Use +10 min simulated time to observe the countryside building progress and low-yield production. Preview outputs are recorded in saved game data.
5. Choose MENU → Reeglitest. Failure lists are **actual Godot results**, not asserted by static checks in this package.
6. Use 20s performance benchmark to export `v131_godot_measurements_v22.csv` for comparison with V2.1 results.
