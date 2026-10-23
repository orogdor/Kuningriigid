# Fast reproducible game testing (V134)

Start with the bug, then validate the release:

```sh
node scripts/test.mjs traffic
node scripts/test.mjs rules --jobs 2
node scripts/test.mjs full --jobs 2
```

`traffic` runs saved deterministic city scenarios without rendering, using the actual `tickDeployments`, movement, collision and Navigation code with the normal 0.05s step. It stops each case as soon as all orders finish. It never increases dt to fake a faster simulation. `TEST_V133` additionally restores a mid-march V4 save in the real city and checks four shared movement orders in the individual battle engine. The focused command fails before slower checks start.

`rules` runs the existing current and release regressions in isolated Node processes, up to two at once. `full` runs focused checks first, then the rules. Reports contain per-check elapsed times and captured failure output under `artifacts-tests/`. Failed traffic reports include the exact fixture, remaining orders, and positions. No tests write a player's save.

Run one case during a fix:

```sh
node tests/traffic-v133/run.mjs --case city-gate --report /tmp/gate.json
node tests/traffic-v133/run.mjs --case gate-counterflow
```

Fixtures live in `tests/traffic-v133/cases.json`: shared city arrival, narrow city gate, houses along a street, already occupied destination, mounted formations, and opposing gate traffic. Checks cover actual completion of **every** order, progress/oscillation, terrain and formation collisions, actual gate crossings, and giving way. A stalled queue is a failure even when some formations arrive. The old V132 behavior can be compared with `--source /path/to/v132 --expect-failure`.

For visual testing open `?demo=army-traffic`. It starts paused with four formations approaching a real gatehouse, walls and city buildings. Press ▶. The fixture uses the normal game movement and keeps the player's autosave and backup unchanged. Refresh to reset it.

Automatic release order:

1. Focused traffic checks.
2. In parallel: full rule regressions; desktop/mobile city-gate playtest; desktop/mobile general UI/save playtest.
3. Publish only after all three branches pass.

The browser gate test issues a movement command through the actual command controls, exercises real-time movement, then advances the same movement engine without frame waits. Before/after screenshots and JSON evidence are uploaded separately from the UI evidence. Browser rendering is checked at the end instead of slowing every numerical test. Pages reuses this validation result instead of running the same suites again.

Historical version-specific workflows remain available through workflow_dispatch, rather than launching dozens of duplicate browser checks on every current-source edit. Their scripts and manual campaign/archive workflows are retained. The current automatic suite above includes the existing release regressions.

V134 additionally checks that all formations advance before the first reaches the gate, wait near the entrance behind a slower leader, and only reserve the nearest gate on a route containing two gates.
