# Kuningriigid V167 — kiviaja kindlustamise tasakaalustus

**Staatus: märgatav paranemine, ent kõik müüriringid ei sulgu endiselt täielikult.**

## Muudatused
- AI valib pärast kindlustamistehnoloogia avastamist eelistatult päriselt ehitatava puidust kaitseringi.
- Pikkade palisaadilõikude 3D-mudelid ja navigeerimise tõkestused vastavad samale pikkusele.
- 7+ elanikuga kiviaja AI-linn saab teise päris ehitaja, kes teeb kaitseehitust; esimene jätkab majandust ja elamuid.
- Uued majad ei blokeeri enam juba planeeritud müürikoridori.
- Ajutine rahvaarvu kõikumine ei lõpeta alustatud kindlustamist.
- AI ootab vajadusel pronksiaega jõudmisega kuni kindlustuse valmimiseni, kuid maksimaalselt 110 mängukäiku.
- Ehitused maksavad päris materjale ja tööaega; tasuta kaitserajatisi pole. Olemasolevad salvestused ja pronksiaja kivimüürid säilivad.

## 3 maailma / 9 AI pealinna / 125-käiguline simulatsioon

| Seeme | Linn | Viimane kiviaja käik | Valmis / plaanis | Valmidus |
|---:|---|---:|---:|---:|
| 142023 | Sampola | 112 | 21/22 | 95% |
| 142023 | Vendel | 112 | 21/22 | 95% |
| 142023 | Sogn | 119 | 20/22 | 91% |
| 31757 | Ahtola | 112 | 20/22 | 91% |
| 31757 | Svea | 112 | 21/22 | 95% |
| 31757 | Kaupang | 112 | 21/22 | 95% |
| 81311 | Hiitola | 111 | 20/22 | 91% |
| 81311 | Järnsida | 112 | 20/22 | 91% |
| 81311 | Hrafnista | 112 | 20/22 | 91% |

Võrdlus: V166 keskmine 14%, V167 keskmine 93%. Kõigis 9 linnas oli valmis 2 puitväravat ja valdavalt 4 torni.
**Täit ringi saavutas siiski 0/9 linnast.** Vanas versioonis oli see samuti 0/9.

## Veel lahendamata
Viimased 1–2 müürilõiku blokeerib sageli juba rajatud põld või elamu, vahel puidupuudus.
Sognil kattusid kaks müürikohta põlluga, Sampolal üks müürikoht põlluga, Vendelil üks müürikoht elamuga.
Neid ei saa lugeda valminuks ega tasuta ümber paigutada. Järgmine parandus peab reserveerima põllutsooni enne asula arendust või viima konfliktse põllu/hoone päriselt tasutud ehitusega uude kohta.

## Kontrollid
- stone-village-defenses-v166.js — V167 planeering ja ajastupiir
- builders.js — kaitseehitiste tööjaotus
- civilization-core.js — AI ehituskrundi reserveerimine, ehitaja ja ajastu
- civilization.js — õigete mõõtudega 3D-palisaad
- TEST_V166_STONE_FORTS.mjs — reeglite ja tegeliku AI kontroll
- scripts/stone-fort-balance-v167.mjs — 3-seemne võrdlus ja raport
- .github/workflows/stone-forts-v167.yml — automaattestid ning varasemad regressioonid
