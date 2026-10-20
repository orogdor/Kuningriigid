# Kuningriigid V77 – kiviaja majade uued 3D-mudelid

**Tavaline mäng:** https://orogdor.github.io/Kuningriigid/?v=77-20261020

**Kiviaja näidislinn (kohe detailvaates):** https://orogdor.github.io/Kuningriigid/?v=77-20261020&demo=stone

## 13 eriotstarbelist kiviaja mudelit

Kõik mudelid on uue kujuga (mitte ainult teise värviga), nende materjalidel on protseduurilised puidu, kivi ja õlgkatuse tekstuurid. Sama materjaliga detailid liidetakse üheks 3D-joonistuskutseks, korduvad majad kasutavad ühiseid geomeetriaandmeid.

| Hoone | Kiviaja eristav välimus | Kolmnurki | Joonistuskutseid |
|---|---|---:|---:|
| Peamaja `hall` | suur ovaalne rookatusega peahoone, kiviring, hõimulipp, lõkkease | 1864 | 12 |
| Elamu `house` | väiksem ümmargune onn, korv ja puuriit | 1252 | 9 |
| Ladu `warehouse` | madal lai pikahoone, kõrge viilkatus, kaubaastjad ja palgivirnad | 1900 | 10 |
| Kelder `cellar` | madal muruküngas, kivist portaal, madal sissekäik | 952 | 7 |
| Turg `market` | kaks avatud letti, erinevat värvi varikatused, kaubakorvid | 1304 | 6 |
| Õpikoda `study` | õlgkatusega tarkuseonn, kivirida ja õppetahvlid | 1172 | 11 |
| Puuraidur `lumber` | avatud puidust töötelk, palkide virn, raiumiskänd | 1084 | 8 |
| Kivimurd `quarry` | kiviplokid, töövarjualune, käsitsi tõstevints | 864 | 6 |
| Jahimees `hunter` | nahakuivatusraam, jahiodad, jahimehe väike onn | 1240 | 9 |
| Kalamees `fisher` | kaiala, võrk, kalade kuivatusrest ja väike onn | 1742 | 9 |
| Talu `farm` | külvivaod, noored viljataimed, varikatus, viljakorvid | 1640 | 7 |
| Kaev `well` | kivine kaev, tõsterõhtpuu, väike rookatus | 708 | 7 |
| Sõdalaste laager `barracks` | sõdalaste onn, odade rida, treeningala ja tähis | 1180 | 10 |

Kõik mudelid jäävad alla 2000 kolmnurga ja 12 3D-joonistuskutse. Need ei vaja väliseid GLB-allalaadimisi.

## Ajastupõhisus

`createAgeBuilding(type,team,age)` kasutab uut kiviaja komplekti, kui hoone välimuse ajastu on 0. Pronksi- ja hilisemate ajastute olemasolevad mudelid jäävad alles.

**Mängureegleid ei muudeta:** laod, keldrid ja turud on tavaliselt pronksiaja hooned, mistõttu neid ei avata tavapärases kiviajamängus varasemaks. Näidislinnas kasutatakse nende juures **ainult visuaalseks võrdluseks** kiviaja makette. Näidissalvestus sisaldab neile hoonetele valikulist `previewAge: 0` märget: ka JSON-import säilitab kiviaja välimuse, kuni mängija jõuab pronksiaega. Tavalised salvestused ja hoonete avamise reeglid ei muutu.

## Näidislinna salvestus

`?demo=stone` avab otse **Kivimetsa küla** detailkaardi koos 15 valmis hoonega, mis näitavad kõiki 13 kiviaja hoonetüüpi. Linnal on ressursid ja kuus elanikku, vanus jääb 0 (kiviaeg).

Näidismäng **ei kirjuta üle sinu praegust automaatsalvestust ega salvestuskohti**. Kui tahad selle päris salvestusfailina alla laadida, ava näidismängus **Menüü → Ekspordi salvestus**. Faili nimi on `Kuningriigid_V77_Kivimetsa_testlinn.json`. Võid selle hiljem tavalises mängus impordiga avada (imporditav fail võib seal oma automaatsalvestuse asendada; eelnevalt ekspordi enda salvestus).

Sama JSON väljastatakse ka GitHub Actionsi V77 töövoo artefaktina koos ekraanipiltide ja hoonemõõtmetega.

## Testid
- `TEST_V77.mjs` kinnitab kõigi 13 mudeli eristatavuse, mõõdud, tri- ja draw-call arvu, kiviajast sõltuva näitamise, geomeetria taaskasutuse ja V4 testsalvestuse taastamise.
- `TEST_V77_UI.mjs` avab näidislinna telefonis püsti, telefonis rõhtsalt ja arvutis, kontrollib päris 3D-stseeni ning JSON-i eksporti.
- `TEST_V73.mjs`, `TEST_V75.mjs` ja `TEST_V76.mjs` kontrollivad vanu salvestusi, maailmakaardi vastavust ja külaelu.

**Piirang:** Playwrighti tarkvaralise WebGL-ga brauseritest ei asenda füüsilise Androidi jõudlusmõõtmist.
