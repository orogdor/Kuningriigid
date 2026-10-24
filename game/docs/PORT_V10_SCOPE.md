# V1.0 Market Households Port (V131)

Base: Kuningriigid V131 commit `26562368f56a32616651a266ed2d8c87f06d43d1`.

## Included
- `market_households_port.gd`: adapted from `builders.js` `tickMarketHouseholds()`; max 24 shoppers per town; requires staffed market; collect food & water at purchase, deliver to house on physically reaching the door.
- `citizen_agents_port.gd` exposes shared persistent citizen route/agent functions; shoppers follow the same 0.8 local Godot A* obstacle grid as workers and builders, storing waypoint and remaining food/water loads in JSON.
- `demographics_port.gd`: V131 `civilization-core.js` `consumeHouseholds()` split (hall capacity 4, house capacity 3); consume house-held stock first, city stock only for deficit.
- `native_citizen_view.gd`: pink shoppers via `MultiMeshInstance3D`; no separate scene node per shopper.
- AI building order includes market when technology `commerce` is unlocked and construction resources available. Manual `Turg` button and explicit `Turu demo` test fixture included.
- Counters for purchase/delivery and food/water picked up/delivered, plus 17 new executable-in-Godot tests. CSV now includes market purchases and deliveries.
- New preview save filename `v131_godot_preview_v10.json`; load older v09 ... v02 save.

## Important limitations
This is **not** V131 multi-district trade. Shopkeepers operate only inside a proxy city, with one market per shopper trip and simplified building positions. V131's 3D model/actual terrain geometry, original AI, battle engine, world-level civilian route, vehicle animations, and original V4 saves are still missing. Godot runtime tests must be executed on a system with Godot 4.

To test in headless Godot:
`godot --headless --path <unpacked-project-folder> --script res://tests/headless_test.gd`
