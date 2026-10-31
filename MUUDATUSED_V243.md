# V243 – ehitiste pööramine ja müüriühendused

- Ehitamisel pöörab **Ctrl + hiireratas** eelvaadet kahe kraadi kaupa.
  Nurk saab liikuda üle täisringi ja kuvatakse koos juhisega ekraanil.
- Nurk säilib ehitamisel ja salvestuses; põllul arvestavad töölised ja
  paigutuskontroll pööratud kujuga. Pööratud värava läbipääs jääb avatuks.
- Müürijoone ots haakub lähedal oleva torni külje või väravaposti külge.
  Värava keskele ega läbi torni müüri tõmmata ei lubata.
- Rannahoone sissepääs pöördub koos hoonega ja peab jääma kuivale maale.
  Silla saab paigutada siis, kui see ulatub mõlemale kaldale.

Kontrollid: `node scripts/test-build-v243.mjs`, `node TEST_V1754_GATES.mjs`,
`node TEST_V1758_TERRAIN_ENDS.mjs`, `node scripts/test-stream-v242.mjs` ja
`node scripts/test.mjs traffic`. Brauseris kontrollib pööramist, juhist ja
ehituse salvestatavat nurka `scripts/qa-build-v243.cjs`.

Kohalik eelvaade: http://127.0.0.1:8789/?v=243
