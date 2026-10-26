# Kuningriigid V175.1 — kiviaja müüride füüsika ja liikluse kiirparandus

26. oktoober 2026. **Etapp 1 valmis.** Kumerad/ümarad lõigud ning lohistamisega ehitamine kuuluvad V175.2–V175.3 töödesse, mitte siia.

## Põhjus: miks V174 müüridest läbi mindi

- `fortifications.js` asendas pikkade 14–42 m palisaadilõikude `navWidth/navDepth` väärtused ehitamisel 7 m lühisegmendi väärtustega. Mõnede sõdurite jaoks olid müüri otsad seetõttu läbipääsetavad.
- `civilization.js` `plotRects()` jättis kõik palisaadid maailmakaardi teevõrgu detailkaardil takistuste loendist välja. Nii võis tee visuaalselt jätkuda läbi olemasoleva müürilõigu.
- `bronze-city-v111.js` kiviaja palisaadimudel kasutas kahte paralleelset eraldatud puittara ning palkide otsad ei olnud iga pika lõigu mõõtudega täpselt joondatud.
- Lahingu `battle-navigation-v88.js` käsitles varem isegi avatud puitväravat tugeva läbimatu ristkülikuna.
- Naaber-detailruutude `loadNeighbours()` ei venitanud/pööranud pika müüri 3D-mudelit samamoodi nagu aktiivsel ruudul.

## V175.1 parandused

1. `fortifications.js`: säilitab uuel müüril tegeliku makstud segmendi pikkuse.
2. `navigation.js`: `buildingClearance` arvutab vana V4 salvestuse pikkade palisaadide navigeerimispiirkonna salvestatud `palisadeSpanV167` põhjal isegi siis, kui vana `navWidth/navDepth` on vale. Ristisuunalised puitväravapostid korrigeeritud ning navigatsioonivõrgu signatuur reageerib müüripikkuse muutustele.
3. `battle-navigation-v88.js`: avatud puitväraval blokeerivad ainult postid, mitte kogu läbipääsu ristkülik. Suletud kiviväravate senist lahingutõket ei muudetud.
4. `bronze-city-v111.js`: päriselt kasutatav kiviaja palisaad muutus üheks ühtlaseks teritatud palgireaks, tugevdatud otsapostide ja tagumiste põikpuudega. Lõigu mõlemad otsad ulatuvad modelleerimisruumi otspunktideni.
5. `buildings.js`: parandatud ka ehitusmudelite varu-palisaadi otsad ja väravatiivade ühendused.
6. `civilization.js`: detailkaardi `plotRects` sisaldab nüüd pikki müüre. Puitvärava sissepääs jääb päriselt lahti, ainult kaks väravaposti on takistused. Hävitatud hooneid ei hoita liikluspiiranguna ja naaberruutude müürid kasutavad õiget skaleeringut ning orientatsiooni.
7. `continuous-landscape-visual.js`: kontrollib teekolmnurga nähtavate servade tegelikke geomeetrilisi koordinaate, et tee ei kataks müüri/ehitise takistusalasid. Kui sobivat teekulgu pole, ei maalita seda läbi müüri. See kiirparandus ei lahenda veel kõiki tulevasi tee-värava suunamise variante.
8. Veebirakenduse importide vahemälu uuendatud: `index.html`, `boot-v83.js`, `civilization-core.js`, `civilization.js`, `buildings.js`, `battle-navigation-v88.js` jne.

## Liiklusest ise tekkivad teed jäävad alles

**Ei muudetud** `roads.js` maailmakaardi kulumist/teetasemeid ega `navigation.js` `recordTraffic` liiklusest tekkimist või `town-streets-v80.js` loomulikke käike. Tee tugevneb kasutusest, kulub kasutuseta; uus kohalik graafika ei tekitada tasuta teid.

## Tegelikud automaattestid

- [V175.1 lõppkontroll füüsikale #40318281801](https://github.com/orogdor/Kuningriigid/actions/runs/40318281801): **PASS**. `TEST_V1751_WALL_ROADS.mjs` kontrollib pikkade müüride mitut punkti, värava läbimist, täiesti suletud müüriringi tõkestamist, 90-kraadise puitvärava orientatsiooni, teekolmnurga konfliktikatset, olemasoleva V4 Sogni reaalset kaitseringi, 3D-mudeli geomeetriat ja liiklusest tekkivat maailmateed.
- Samas töövoos: `TEST_V59` (teede teke/kulumine), `TEST_V80` (linnatänavate geomeetria), `TEST_V168_RING_CORRIDOR`, `TEST_V173_STREETS`, `TEST_V174_STREETFRONT`, `TEST_V73` (salvestused), `TEST_V154 --node-only` (mudelid), `TEST_V163_STONE_CITY` (AI kasv): **PASS**.
- [V175.1 päris WebGL-brauseritest #40318886008](https://github.com/orogdor/Kuningriigid/actions/runs/40318886008): **desktop ja mobiil mõlemad PASS**. Uuendatud Sogni kiviaja linn avanes olemasolevast V174 salvestusest, pika müüri kõigist testpunktidest puudus läbipääs, vähemalt üks puitvärav jäi avatuks, tegelikud sissekäidud rajad olid nähtavad ja ▶ jätkas mängu.
- Automaatsed ekraanid: `stone-takeover-desktop.png`, `stone-takeover-mobile.png`; tulemused JSON-failina GitHub Actionsi artefaktis.

## Mängi

[**Ava V175.1 ja võta üle V174 Sogni testküla parandatud müüridega**](https://orogdor.github.io/Kuningriigid/?v=1751-20261026&demo=ai-stone-v174)

See on **uue V175.1 mängumootoriga avatud V174 AI testsalvestus**, mitte kunstlikult ehitatud uus küla. Testdemo ei kirjuta kasutaja eelmist tavasalvestust üle.

## Järg: V175.2–V175.3

- V175.2: uue serv- ja nurgaühenduste geomeetria süsteem, kumerad/ümarad palisaadid, nurgamudelite viimistlus ning AI ümardatud kaitsering.
- V175.3: puute- ja hiirelohistusega müüriraja joonistamine, sirgjoonest kõrvalekalde põhjal kaare loomine, automaatsed ühenduspostid ja väravate valik.
- V175.1 ei sisalda veel uute ümarate müüride ehitusrežiimi. Päris füüsilise Androidi GPU FPS ei ole mõõdetud.
