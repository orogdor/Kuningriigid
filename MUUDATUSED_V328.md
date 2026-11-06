# V328 — Sapling puud päris mängus

Kasutaja andis loa puude mängu viimiseks. Kuus liiki × viis varianti on nüüd ühendatud:

- Maailmakaardi biome-puud: `atlas-biomes-v47.js`.
- Maailma täiendavad metsatukad: `civilization.js`.
- Raiutavad, kasvavad ja naaberruutude detailpuud: `visuals.js` ning mõlemad detaili loomiskohad `civilization.js` failis.

`sapling-trees-v328.js` laadib samu päris near/mid/far GLB-sid. Viis varianti valitakse deterministlikult; algsed paigutusmaatriksid, maapinna kontakt, puude ressursi-ID-d ja metsade ühine alusväli säilivad. Detailis valitakse liik tegeliku biomi järgi (taiga okaspuud/kask; lehtmets tamm/pärn/kask; džungel ja oaas palm).

Maailmas on ruumilised instantsrühmad. Lähedal/keskel/kaugel otsustatakse nähtava suuruse järgi; madal kvaliteet hoiab maailma kaugel LOD-il. Nähtaval on üks detailsusaste, ootamise või laadimisvea korral senine varumudel. Lähimudelid tulevad alles vajaduse korral. Liigi ühine võrdluskõrgus säilitab ka viie mudeli tegelikud kõrguserinevused.

Detaili puud kasutavad stseeni jagatud InstancedMesh puhvreid, sealhulgas lähivaates. Iga tegeliku renderduse alguses tühjendatakse loendurid. Puude kasv ja raiumine jäävad olemasoleva objekti nähtavuse ning teisenduste juhtida. 64→128 mahukasv kopeerib varasemad maatriksid, kaardilt lahkunud puud ei jää vanasse puhvrisse.

## Kontrollid

- `tests/sapling-trees/live-integration.mjs`: 120 puu algsed maatriksid/maapind, kõik viis varianti, kolm teineteist välistavat LOD-i, 100 detaili instantsi, mahukasv, peitmine ja eemaldamine, eelmise stseeni renderduskäsitleja säilimine.
- `tests/sapling-trees/existing-placement.mjs`: tegelikud paigutusfunktsioonid, 2617 maailma instantsi ja 24853 detailressurssi; x/z 4.5/3.9 teisendus ja muutmata maatriksid.
- Kõik 23 nõutud CI kiirkontrolli gruppi läbisid: `reports/sapling-v328-regression.json`.
- Päris mängu WebGL käivitus, maailm/detail/maailm ja pildid: `.github/workflows/sapling-live-check.yml`, raport `reports/sapling-v328-browser.json` pärast töö edukat lõppu.

Versioonisilt ja laadimisvõtmed V328. Avaldamine toimub main-haru integreerimisel. Pagesi paketist jäetakse välja `.blend`/`.blend1` lähtefailid; GLB-d ja tekstuurid säilivad.

Varasem tarkvaraline FPS-katse ei tõenda telefoni ega RTX-i jõudlust. Uue ühenduse GPU-pilti ja jõudlust hinnatakse eraldi.
