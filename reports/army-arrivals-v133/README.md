# V133 army arrivals and fast feedback

The reproduced V132 failure: several friendly formations receive the same city destination. The first occupies it; the others keep trying to reach an occupied point. A second real-city failure occurs when two formations approach a single-file gate together. A clipped gatepost corner could also be skipped by sampled visibility checks, repeatedly generating the same blocked move.

Changes:

- Allocate stable, reachable, size-aware arrival positions near the requested area. Respect parked units and buildings, and keep the gate mouth clear. Preserve the original order in V4 saves; transient reservations rebuild after loading.
- Apply arrival allocation to local deployment and explicit individual-battle movement orders. Automatic attack goals are unchanged.
- Serialize local formations through actual gatehouses. Keep waiting orders, let the next formation enter once the previous clears, and let opposing traffic near the mouth yield into accessible space.
- Check military detour segments against every crossed navigation cell. Keep swept physical collisions authoritative. Civilian route learning is unchanged.
- Add deterministic start fixtures and a headless runner with completion, progress, overlap, wall/house and actual gate-crossing checks. Full regressions run in isolated parallel processes. Desktop/mobile traffic and interface browser jobs run independently; publication waits for all jobs.

`before-v132.json` reproduces failures in all eight cases against the unchanged previous campaign/collision modules. `after-v133.json` records the same cases succeeding. `measurements.json` records measured local runtimes; these are simulation/test times, not FPS claims. The focused command additionally exercises the real city, mid-march save restoration, a tiny gate-corner regression and four individual battle formations sharing an arrival area.

The interactive fixture is `?demo=army-traffic`, starts paused and never overwrites existing player saves. Browser screenshots/results are uploaded by the Fast Game Validation workflow.

See TESTING.md for commands and release ordering.
