# V1.6 implementation scope
Commit `26562368f56a32616651a266ed2d8c87f06d43d1`. Added `scripts/core/siege_port_v131.gd`, modified `individual_battle_port.gd`, `native_individual_battle_view.gd`, `main.gd`, and `tests/port_checks.gd`.

State `individual_battle.siege` serializes all walls/guards/works. Wall cross-sections use axis-aligned approximate footprints for collisions and visibility. Guard routing uses adjacent wall sections and simple local threat-sector allocation; no separate high-resolution elevated navmesh. Siege works use real-seconds durations, but positioning and climbing animation are simplified. The **Värava lõhkumise test** explicitly injects an exaggerated wall hit; it should never be mistaken for calibrated combat damage.

Validation: static package/ref checks only, 334 prepared assertions. Parser/runtime execution unavailable.
