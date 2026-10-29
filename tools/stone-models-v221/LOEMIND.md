# Kiviaja mudelite teisendus (V221)

Mängija tegi esimesed kiviaja mudelid AI 3D-generaatoriga: igaüks umbes 100 000 kolmnurka ja 2048 px tekstuur.
Mängu jaoks on need vähendatud ja uuesti tekstureeritud. Vajalikud on ainult Python 3, numpy, scipy ja Pillow.

1. `build_static.py <nimi> <kolmnurki> <tekstuur_px> [allikakaust] [väljundkaust]`
   - Liidab tipud asukoha järgi.
   - Lihtsustab mudeli quadric edge-collapse meetodiga (`qem.py`): servad on kaitstud ja tahkude ümberpööramine on keelatud.
   - Paigutab kolmnurgapaarid uude atlasesse ja küpsetab igasse tekslisse algse mudeli lähima punkti värvi (`bake.py`).
   - Kasutatud: peamaja 8000 / 1024, maja1 ja maja2 6000 / 1024, woodcuter 6000 / 1024, kiviraidur 5000 / 1024, human 3000 / 512.
2. `rig.py [kaust]`
   - Lisab inimesele 17 luuga luustiku: puusad, selg, rind, kael, pea, mõlema poole õlavars, küünarvars ja käsi, reis, säär ja jalalaba.
   - Kaalud arvutatakse kauguse järgi luusegmentideni, piirkondade kaupa: käed, jalad, kere. Käte lävi sõltub kõrgusest, et seelik ei liiguks käega kaasa.
   - Tulemus on `human_rigged.glb`.
3. Mudelid lähevad kausta `models-v221/`. Mängu moodul `stone-age-models-v221.js` laeb need, kasutades `glb-lite-v221.js`.

Uue kiviaja mudeli lisamiseks tee GLB (kõrgus või pikkus 1, uks +Z suunas), jooksuta `build_static.py`,
ja lisa see `stone-age-models-v221.js` tabelisse `BUILDINGS`.
