# V117 — tower garrisons and patrols

Each completed wooden or stone tower supplies five persistent individuals. They use bows at range and swords against boarders. Old decorative window guards and automatic tower arrow damage are replaced by these actual combatants; researched roof ballistas remain separate and require their worker.

In peace, sentries stagger their departures, walk along the connected curtain to the next reachable tower, and return. Towers and wall walks form an elevated graph. Guards move continuously at 2 metres per simulation second, avoid other soldiers, and cannot cross a destroyed segment. Disconnected towers retain local patrols.

In battle, active hostile squads determine the approach weights. Largest-remainder allocation divides each tower's surviving guards among reachable threatened sectors: four northern squads and one eastern squad receive four northern guards and one eastern guard from each full tower. Destinations concentrate around the actual approaches and respect eight individual slots per wall section. Plans refresh every four simulation seconds; movement remains physical. New threats interrupt peaceful patrols.

Guard health, positions and arrows are saved with their tower. Reopening the city does not refill arrows or resurrect casualties. A new owner receives its own garrison. The peaceful display cache is invalidated after combat. Existing siege saves migrate to the new garrison; the 500-person admission cap still applies.

The demo reduces the manually stationed wall archers from 128 to 112 to keep all tower guards active under the cap: Bronze 216 attackers / 270 defenders (486 total), Iron 218 / 270 (488). There are 36 curtain/gate sections plus 10 tower platforms.

Test URLs:
- `?demo=bronze-patrol&v=117` — peaceful individual patrols, running immediately.
- `?demo=bronze-siege&v=117` — Bronze siege, initially paused.
- `?demo=iron-siege&v=117` — Iron siege with mechanical artillery, initially paused.

Validation: TEST_V117 covers all 50 individuals, exact per-tower 4:1 allocation, reachable routes, continuous movement of all 50 sentries, casualty/ammunition persistence, renewed threat response, and actual bow/sword combat. Browser coverage checks desktop Bronze, phone-width Iron, real peace-city integration and the dedicated patrol entry point. Existing era and siege checks remain in the CI workflow.
