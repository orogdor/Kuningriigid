# V348 – FPS: vähem joonistustööd, pilt sama

Kasutaja palus 94. käigu salvestuse (`Kuningriigid_V82_kaik_94.json`, Kalevila) põhjal tõsta FPS-i vähemalt 60-ni nii, et graafika ei halveneks. Kõik muudatused vähendavad ainult GPU-le saadetavat tööd. Mudelid, varjud, resolutsioon ja graafikaseaded jäid samaks.

## Muudatused

1. **Meri ja jõed joonistatakse ühe korraga** (`forceSinglePass:true`).
   Läbipaistev `DoubleSide` materjal tähendab Three.js-is kahte joonistuskorda: tagakülg ja esikülg. Meri ja jõed on ülalt vaadatav kõrgusväli, nii et teist korda ei olnud vaja.
   Failid: `landscape-v149.js` (`waterMaterial`), `water-style-v326.js` (WebGPU), `continuous-landscape-visual.js` (jõe kaldad ja õlad), `civilization.js` (lahingu meri), `detail-landscape.js`.
2. **Maailmakaardi merevõrgust jäetakse välja maismaa kolmnurgad** (`atlas-sea-v326.js`, `dropDryTrianglesV348`).
   Merevõrk on maastikuvõrgu (2,29 M kolmnurka) täielik koopia. Shader viskab ära iga piksli, kus `smoothstep(-.12,.20,depth) < .008`. Kolmnurk, mille kõik kolm tippu on sügavusel ≤ −0,12, ei joonista seega ühtegi pikslit ja jäetakse indeksist välja. Rannajoone kolmnurgad ja normaalid jäävad samaks.
3. **Tõrvikute animeeritud osad joonistatakse instantsidena** (uus `torch-batches-v348.js`, ühendatud `daynight-v235.js`-iga).
   Leek (3×3 tasapinda), sädemed, suits, kuma ja valguslaik olid igal tõrvikul eraldi objektid, kokku umbes 20 draw call'i tõrviku kohta. Nüüd on igal geomeetria ja materjali paaril üks InstancedMesh. Animatsioon liigutab edasi algseid objekte ning nende maatriksid kopeeritakse igal kaadril instantsidesse. Leegi shader loeb instantsimaatriksit, nii et `vSeed` jääb samaks. Sprite'id kasutavad sama sprite-shaderit `instanceMatrix`-iga. Muudatus kehtib ainult WebGL-is; WebGPU kasutab vana teed.
4. **Maailmakaardi kauged puud (far-impostorid) joonistatakse sektorite kaupa** (`sapling-trees-v328.js`).
   Enne oli igal 600 m lahtril ja variandil oma InstancedMesh, kokku ligi 7900 mesh'i. Nüüd jagavad far-tasemel lahtrid ühte InstancedMesh'i 6×6 lahtri sektori ja variandi kohta. Mid ja near jäävad lahtripõhiseks nagu enne. Sektor täidetakse uuesti ainult siis, kui mõni selle lahter liigub far- ja lähema taseme vahel. Maatriksid ja toonid on samad.

## Mõõtmine (sama salvestus, 1600×900, Chrome SwiftShader)

Arvud saadi `renderer.info`-st ühe kaadri renderdamisel. SwiftShader on tarkvaraline renderdaja, seega need ei ole riistvara FPS. Kolmnurkade ja draw call'ide arv on aga sama, mis päris GPU-l.

| Vaade | Enne (V347) | Pärast (V348) |
|---|---:|---:|
| Maailmakaart, puud laaditud: kolmnurki | 10,25 M | 6,43 M |
| Maailmakaart, puud laaditud: draw call'e | 1239 | 657 |
| Maailmakaart, enne puude laadimist: kolmnurki | 16,18 M | 11,11 M |
| Detailkaart, Kalevila öösel: draw call'e | 1111–1165 | 662–755 |

Ekraanipiltide võrdlus: maailmakaardil erines üle 24 värvitaseme 222 pikslit 1,44 miljonist. Seda põhjustab vee animatsiooni ajastus; ilma ühegi V348 muudatuseta tehtud kordusel oli erinevus samas suurusjärgus. Detailkaardi tõrvikud, kumad ja valguslaigud on silmaga võrreldes samad.

Mäng oli selle salvestusega juba langetanud resolutsiooni 72% peale (adaptive resolution). Kui FPS jääb nüüd üle piiri, tõstab mäng resolutsiooni ise tagasi 100% peale ja pilt muutub teravamaks.

## Testid
- Uus `tests/torch-batches-v348.mjs` kontrollib, et iga nähtav leegiosa on identse maatriksiga instants, päeval instantse pole, algsed osad ei jõua renderdajani ja `dispose` eemaldab partiid. Lisatud kiirkontrolli (`v128.yml`).
- `tests/shared-water-v326.mjs`: rannajoone kolmnurgad peavad olema identsed ja ainult täiesti kuivad kolmnurgad jäetakse välja.
- `tests/sapling-trees/live-integration.mjs`: far-tasemel puud tulevad sektori mesh'ist. Maatriksite hulk on sama, LOD-tasemed far/mid/near toimivad endiselt.
- `tests/world-assets-v327.mjs` oli V347-s katki: V347 nimetas piiride vahemälu võtme ümber (`boundsGeometryV347`/`boundsTrellisV347`). Test kontrollib nüüd uut võtit ja V348 importmap'i versiooni.
- `torch-batches-v348.js` loob sprite'i geomeetria alles esimesel kasutusel. Muidu kulutaks moodul laadimisel Three.js objektide ID-de jaoks `Math.random` väärtusi, seemnega testi maailm muutuks ja V341 brauseritest satuks teisele kaardile. Sama kaardiga on tulemus V347-ga sama (outerCompleteAvg 15,06 vs 15,1).
- Kiirkontrolli 118 käsku läbisid kohapeal. `tests/adaptive-atlas-v327.mjs` kontrollib nüüd sama reeglit: jagatud võrk, kuivad kolmnurgad välja.

## Tegemata
- **Maastiku kauguse-LOD** (2,29 M kolmnurka). Maastik on kohanduv atlasevõrk, mille kõrgused on seotud mere, jõgede ja metsa paigutusega. Tükeldatud LOD vajab õmbluste käsitlemist ja eraldi visuaalset kontrolli. Jäi järgmiseks sammuks.
- Riistvara FPS tuleb mõõta kasutaja seadmel sama salvestusega (graafikaseaded → „FPS ja renderdusstatistika“).
