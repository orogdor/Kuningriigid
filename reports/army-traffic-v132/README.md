# V132: armies passing occupied formations

Local military movement previously retried a perpendicular step every frame and immediately returned to the same blocked line. Navigation could also consume route nodes before collision-constrained movement actually reached them.

The fix adds short-lived military detours around occupied discs, retained between frames and re-evaluated when blocked or their destination changes. A bounded visibility graph uses terrain and unit clearance checks; swept collision remains authoritative. Unreachable occupied destinations and sealed passages remain blocked. The original terrain pathfinder continues to run for military movement; civilian route learning is unchanged. Peace-time formation displays and individual battle soldiers use the same detour helper. No state/save fields or geometry batching/pools were added.

Validation: TEST_V132 covers stationary and opposing traffic for infantry, cavalry, chariots and catapults; real Navigation; a queue; a wall beside the route; a passage too narrow to bypass; individual foot/mounted clearance; two friendly formations crossing in the real battle loop with no friendly damage; and displayed men following past a stationary formation. TEST_V132_BROWSER additionally exercises that battle in Chromium with real battle terrain navigation, screenshots before/after and no overlapping opposing friendly soldiers. Current V125–V131 regression suites remain enabled.

Old V90/V97 scripts contain obsolete twelve-man assertions (current infantry formations have twenty-four men); those historical expectations were not changed as part of this fix.
