# Kuningriigid V49 — paremad 3D inimesed

## Uued tegelased

- Seitse uut siluetilt paremini eristatavat inimest: elanik, tööline, ehitaja, turulkäija, sõdalane, moodne sõdur ja õpetlane.
- Näo kuju, kõrvad, silmad, juuksed/kiiver, küünarvarred, käed, jalad, puusad, saapad ja riietuse detailid on päris 3D-geomeetria, mitte kastidest kokkupandud keha.
- Igal algsel tegelasmudelil on 896–980 nelinurka (eraldiseisvad tööriistad ja sõidukid lisanduvad mängus väljaspool seda arvu).
- Mudelite algandmed on 6 rig-sektsioonis. Animatsioonid kasutavad samu lugeja mängutööde ja üksuste liigutusnuppe, millega töötas V48. Pea liigub õrnalt iseseisvalt.
- Sama geomeetria tarnitakse GLB-failina ja Three.js puhvrina, seega mäng ei laadi töö ajal samade inimeste jaoks eraldi GLB-võrku.
- Jagatud geomeetriate vahemälu aitab suurtel üksuserühmadel mälu säästa.
- Mängu menüü lingilt avatakse `MUDELID_V49.html` (pööra, suumi, kõnni, tööta, ründa, GLB allalaadimine).

## Mudelitehase töövoo täpsustus

Mudelitehas 0.1.2 töövoog leiti kasutaja avalikust GitHubist `orogdor/blender-cloud-test` ning uuriti selle 1000-quad / kvaliteeditase 2 ootusi. Nende mängumudelite tegemiseks kasutati eraldi käsitsi kujundatud anatoomiliste ristlõigetega retsepti, mille punktid dokumenteeriti eest-, küljelt- ja pealtvaates. See **ei ole** täielik Mudelitehase sertifitseeritud pildipõhise 3D-punktipilve rekonstruktsiooniprotsess: sõltumatuid 2D-fotoreferentse ega allikapiltidelt mõõdetud residuaale ei olnud. Väidet täieliku töövoo läbimise kohta ei tehta.

## Ühilduvus ja kontrollid

- Ei muudetud AI, teaduse, majanduse, salvestuste ega ajalooliste ajastute reegleid.
- `TEST_V49.mjs` kontrollib iga variandi geomeetriat, rig'i, olemasolevaid tööanimatsioone ning maailmakaardi üksusi.
- `models-v49/manifest.json` sisaldab GLB-de nelinurkade ja kolmnurkade arvusid; `models-v49/landmarks-three-views.json` mudelite proportsioonide allikapunkte.
- Läbikukkunud või puuduv 3D-brauseritest tuleb dokumenteerida eraldi.
