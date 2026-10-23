# V134: approach before queueing

Waiting formations previously stopped far from a gate as soon as another formation claimed it. They now immediately approach separate reachable waiting bays on their side of the next gate. Bays keep clear of the active formation's lane, other bays, buildings and parked formations. The original destination remains pending until the formation actually passes the gate and arrives.

Only the nearest gate remaining on a route is considered. A claim on a later gate cannot stop a formation before its first passage. Passage itself remains one formation at a time, and opposing traffic keeps its own approach side. Queue state stays transient and is rebuilt after loading.

An optional grid-snap recovery is used for deployment on maps containing gates, so a formation leaving its waiting bay does not alternate between a grid-centre snap and its forward route. Other maps retain their previous movement behavior.

TEST_V134 checks:

- All four formations move more than 10m in the first eight simulation seconds, before the first reaches the gate.
- All orders stay pending during approach and subsequently complete without overlap or wall crossing.
- Faster followers reach waiting bays within 30m of a gate even when the leader is deliberately slowed for the test; they then stand there instead of circling.
- With two successive gates, each formation considers its nearest gate rather than being held by a later gate.

The existing eight movement cases, real-city save/load test and individual-battle tests remain in the focused profile. The desktop/mobile browser test also asserts early approach and captures the actual city-gate scenario. See results.json for measured positions, and TESTING.md for test commands.
