# Kuningriigid V253 – elavad külaelanikud, kiviaja tõrvikud väljaspool maju, parandatud poosid

Muudatused puudutavad ainult kiviaega. Pronksiaeg jäi samaks.

## Kiviaja tõrvik (`daynight-v235.js`)
- Kiviajal ei olnud rauda. Uks tõrvik (`stone_torch`) on nüüd viltu maasse löödud puukepp, mille otsas on kasetohukimp kahe sidemega ja vaigutükk.
- Leek on umbes 40% väiksem kui raudkorviga tõrvikul. Valgus on oranžim ja väiksem: tugevus 1,5, ulatus 15 m, varem 1,94 ja 20 m. Valguslaik ja kuma on samuti väiksemad.
- Käes kantav tõrvik (`people-life-v252.js`) on nüüd lühike kepp kasetohukimbuga ja väikese leegiga, varem oli see suurem.
- Pronksi- kuni keskajal jääb raudkorviga tõrvik.

## Tõrvikud ei ole majade sees
- `townBuildingModel` salvestab iga hoonemudeli tegelikud mõõdud (`boundsV253`).
- Ukse tõrvik pannakse mudeli esiservast (koos räästaga) 0,6 ühikut väljapoole ja mitte kaugemale küljele kui 60% hoone poollaiusest (`torchLocationsV235(buildings, boundsOf)`).
- Varem kasutati kõikide ajastute jaoks sama kindlat nihet (näiteks maja puhul 3,5), mis jäi kiviaja ümarmajade ja peamaja räästa alla või seina sisse.
- Kontroll `gameDebug.torchesInsideV253()` leidis stone-demos 15 tõrvikust ja ai-stone-v174-s 22 tõrvikust 0 hoone sees.

## Külaelanikud sama elavaks (`village-life-v76.js`)
Neutraalsete külade ja linnade dekoratiivsed elanikud kasutavad nüüd sama elukihti nagu töötajad:
- **Teekond ümber hoonete:** liigutakse linna teekonnaotsingu (`nav.route`) järgi, mitte läbi majade. See on ainult päring, teeliiklust ega teede kulumist ei salvestata.
- **Kodu:** linnades on kodu päris maja uks, varem oli see kindlate koordinaatidega punkt.
- **Isiklik ruum:** inimesed ei kattu ega käi üksteisest läbi.
- **Jutuajamine:** vestlejad pööravad end ringis üksteise poole, varem pöörati ±90°.
- **Öösel:** õues olijatel on käes tõrvik, magajad on majas.
- **Päris poosid** kiviaja luustikuga elanikele, varem need lihtsalt seisid:

| Tegevus | Poos |
|---|---|
| istumine ja puhkamine | istub maas, jalad ees |
| söömine | istub ja tõstab käe suu juurde |
| mäng (lapsed) | hüppab ja lehvitab |
| valve | raskus ühel jalal, odakäsi üleval, vaatab ringi |
| jutuajamine | žestid ja noogutused |
| töö | ehitamine |
| kandmine | kannab koormat |

## Animatsioonide parandused (`stone-motion-v222.js`)
- **Potivalmistamine ja kiviraidumine:** varem jalad vajusid kükitamisel maa sisse. Nüüd põlvitab inimene õigesti: üks põlv on maas ja teine jalg ees maas (`KNEEL_DROP`).
- **Istumine ja söömine:** varem istuti õhus nagu toolil ja jalad ulatusid maa sisse. Nüüd on istmik maas ja jalad ees (`SIT_DROP`).
- **Isiklik ruum** on nüüd püsiv nihe, mis sumbub aeglaselt. Varem tühistas järele jõudmine selle suure ajasammu korral.

Eelvaade: `preview-motions-v253.html` näitab kõiki kiviaja töö- ja külaliigutusi kõrvuti.

## Kontrollid
- `node tests/village-v253/run.mjs` (uus, terve päev külaelu): kattumist ei ole (väikseim vahe 0,93), öösel on õues olijatel tõrvik, vestlejad vaatavad üksteise poole, kõik tegevused toimuvad: PASS.
- `node tests/people-v252/run.mjs`: PASS.
- Brauser: kiviaja tõrvik öösel lähedalt, tõrvikute kontroll kahes linnas, liigutuste eelvaade enne ja pärast parandust.
- CI kiirkontrolli kõik sammud ja `traffic`: PASS. `rules`: 20 testi 21-st läbisid, `TEST_V139` kukub nagu varem.
- `TEST_V76.mjs` kukub läbi („evening gathering place has a lit fire“) samamoodi ka V252 koodiga, sest küla lõkkekoht on eemaldatud juba varem. Seda testi CI-s ei ole.
