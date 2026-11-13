# V349 – FPS: mudelite joonistamine maailma- ja detailkaardil, pilt sama

Kasutaja palus üle vaadata, kuidas mudelid maailmakaardil ja detailkaardil laaditakse ja joonistatakse, nii et graafika ei väheneks, aga FPS tõuseks. Mõõtsin päris mängus (`?demo=stonetown`, kõrge graafikaseade), mis objektirühmad kaadris draw call'e tekitavad. Kaks rühma andsid ligi poole kogu tööst:

- **Maailmakaart:** 398 draw call'ist 234 olid kauged puud (far-kaardid). Igal puuvariandil oli kaks primitiivi (küljevaade ja pealtvaade), kummalgi oma tekstuur.
- **Detailkaart:** 449 värvikäigu draw call'ist 222 olid väikesed jäigad osad: lammaste kehaosad, tööriistad, korvid, vöörihmad, koer. Igaüks neist oli eraldi mesh ja varjukäigus veel teine draw call.

## Muudatused

1. **Väikesed animeeritud osad joonistatakse ühiste instantsidena** (uus `rigid-part-batches-v349.js`).
   Märgitud on lamba osad (`herding-v255.js`), kiviaja tööriistad ja kandamid (`stone-equipment-v234.js`), vöörihm (`stone-age-models-v221.js`) ning koer ja oda (`scout-dog-v274.js`). Algsed mesh'id jäävad puusse: animatsioon, nähtavus ja hiirega valimine töötavad nendega edasi. Renderdaja küsib stseeni läbi käies igalt mesh'ilt, kas see on vaates (`intersectsFrustum`). Märgitud osa vastab „ei“ ja annab oma maailmamaatriksi partiile. Partii on stseeni viimane objekt, seega laaditakse ja joonistatakse see sama kaadri maatriksitega. Geomeetria, materjal, varjulipud ja `renderOrder` on samad.
   Osa joonistatakse vanal viisil, kui instantsimine ei annaks täpselt sama tulemust: peegeldatud või nihkes (shear) teisendus, läbipaistev materjal, `onBeforeCompile`, morph-sihtmärgid. Kehtib ainult WebGL-is; WebGPU kasutab vana teed.
2. **Puu tüvi ja lehestik on üks draw call** (`sapling-trees-v328.js`, `mergeSameTextureV349`).
   near- ja mid-taseme tüvi ja lehestik kasutavad sama tekstuuri ning laadija andis neile juba varem identse materjali. Nüüd liidetakse sama tekstuuri ja värviga primitiivid üheks geomeetriaks. Kolmnurgad on samad.
3. **Kaugel puul on üks tekstuur ja üks primitiiv** (`tools/forest-trees-v349/atlas_far.py`, 30 × `far.glb`).
   Küljevaade (512×512) ja pealtvaade (256×256) on pakitud ühte 1024×512 atlasesse. Mõlemad asuvad 128 px võrgul läbipaistvate vaheribadega, nii et mipmap'id kuni 8×4 tasemeni sisaldavad samu keskmisi mis eraldi tekstuurid. `manifest.json` baidid ja räsid on uuendatud. Pärast `make_far.py` tuleb käivitada `atlas_far.py`; juba teisendatud failid jätab see puutumata.

## Mõõtmine (`?demo=stonetown`, kõrge seade, Chrome SwiftShader)

Draw call'id on loetud `renderBufferDirect` kutsetest nelja kaadri keskmisena (värvikäik + varjukäik). SwiftShader on tarkvaraline renderdaja, seega need ei ole riistvara FPS. Draw call'ide ja kolmnurkade arv on sama mis päris GPU-l.

| Vaade | Enne (V348) | Pärast (V349) | Kolmnurki |
|---|---:|---:|---|
| Maailmakaart, kauge suum | 398 | 270 | 4,26 M, muutmata |
| Maailmakaart, lähisuum (330) | 406 | 275 | 4,40 M, muutmata |
| Detailkaart, suum 180 | 550 | 248 | 1,12 M, muutmata |
| Detailkaart, suum 60 | 550 | 268 | 1,78 M, +0,5% |

Detailkaardi lähivaates on kolmnurki 0,5% rohkem, sest partii joonistab ka vaatest väljas olevad väikesed osad (lammas on umbes 300 kolmnurka).

## Pildi kontroll

Tehtud külmutatud simulatsiooni, virtuaalse kella ja seemnega `Math.random`-iga.
- **Partiid sees ja väljas samas kaadris** (`gameDebug.rigidPartBatchingV349(false)`): maailmakaardi lähivaates ning detailkaardil suumiga 60 ja 24 (inimesed, odad ja koer lähedalt; 192 osa 38 partiis) erines 0 pikslit. Maailmakaardi kauges vaates erines 1 piksel 921 600-st (6 värvitaset). Detailkaardi suumi 180 võrdlus ei ole arvesse võetud: puude laadimine oli piltide vahel veel pooleli.
- **V348 vs V349 eraldi laadimistel:** kauged puud olid kontrollitud kastides piksel-piksli samad. Lähipuude kastides erines 8–34 pikslit tuhandetest. Ülejäänud erinevused olid linnud, merevirvendus ja põõsad, mis erinevad ka sama versiooni kahel laadimisel.
- **Atlas:** kõigi 30 puu tipud, indeksid ja tekslid on võrreldud eelmise `far.glb`-ga ning on identsed.

## Testid
- Uus `tests/render-batches-v349.mjs`: 509 osa 35 draw call'iga, maatriksid, varjukäik, nähtavuse muutus, hiirega valimine, peegeldatud/nihkes/läbipaistvad osad vanal teel, WebGPU ja partiideta stseen; puude liitmine ei kaota kolmnurki; 30 far-kaarti ühel atlasel. Lisatud kiirkontrolli (`v128.yml`).
- `tests/sapling-trees/live-integration.mjs`: puul on nüüd üks osa (120 instantsi 240 asemel).
- Kiirkontrolli 119 käsku läbisid kohapeal.

## Tegemata
- **Kasutaja 94. käigu salvestust** ei olnud hoidlas; mõõdetud on näidislinnaga. Suuremas linnas on inimesi ja tööriistu rohkem, seega peaks võit seal olema suurem, aga seda ei ole mõõdetud.
- **Riistvara FPS** tuleb mõõta kasutaja seadmel (graafikaseaded → „FPS ja renderdusstatistika“).
- Maailmakaardi linnad (üks InstancedMesh linna ja majatüübi kohta), varemed (6 mesh'i vareme kohta) ja kaktus (246 kolmnurka igal suumil) on järgmised kandidaadid.
- Hilisemate ajastute V50-inimesed (6 jäika osa inimese kohta) sobiksid sama partiisüsteemiga; vajab eraldi kontrolli.
- Maastiku kauguse-LOD (2,29 M kolmnurka) on endiselt tegemata.
