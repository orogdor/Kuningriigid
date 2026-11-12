# V347 Gemini spatial-batches katse – 2026-11-12

## Katse eesmärk ja ulatus
Isolatsioonis muudetud ainult `spatial-batches-v86.js`. Main põhiharu jäi muutmata.
- Numbriline binaarne ruudustikuotsing (`Map<number,Map<number,...>>`) ainult instantside ehitamisel; säilitatud esimese esinemise järjestus ja `userData.spatialCell`.
- Tüki keskpunktid eelnevalt arvutatud, igal kaadril pole `split(':').map(Number)`.
- Instantside maatriksi- ja värvipuhvrite otsekopeerimine ilma `getMatrixAt`/`setMatrixAt` tsüklita. Järjestikused vahemikud kasutavad `TypedArray.set`; üksikud kirjed otsest elementkopeerimist, et vältida iga kirje `subarray` objekti.
- Geomeetria piire kordusarvutatakse üksnes geomeetria objekti või `trellisV327` oleku muutumisel.
- LOD kauguse võrdlemine ruutkaugusega; väga lähedal lävele kasutatakse algset `Math.hypot` otsust.

## Kontrollid
`node tests/spatial-batches-v347.mjs`: läbitud. Lisaks brauserivälised A/B testid 31, 32, 512, 4000, 5000 ja 24 000 instantsiga: maatriksite, värvide, chunki järjekorra ja LOD viidete võrdlus; kõik läbisid. See ei tõesta matemaatiliselt kõigi võimalike sisendite 100% samasust.

## Sünteetiline funktsiooni mõõtmine
Windows Node.js V8, sama masin. Viimane kordus (läve kontrolli lisamise järel):

| Mõõdik | V346f originaal | V347 katse |
|---|---:|---:|
| 24 000 instantsi, 7712 chunki loomine | 40,50 ms | 43,39 ms |
| 300 `updateSpatialBatches` kutset, zoom 500 | 2119,70 ms | 81,16 ms |
| 300 kutset, zoom 3000 | 2093,93 ms | 34,07 ms |

Kuumal funktsioonil ~26,1× kiirem. **See ei tähenda, et kogu mäng muutuks 26× kiiremaks.** Loomise kulu tõusis selles stsenaariumis umbes 7%. Väiksematel instantsihulkadel oli loomise tulemus varieeruv, mõnes katses aeglasem.

## Päris veebimängu A/B
Chrome WebGL NVIDIA RTX 2080 Super (D3D11), 1600×900, `?demo=stonetown&gpu=0&v=346`, keskmine graafikakvaliteet, fpsLimit unlimited. Eraldi käivitused: avalik V346f veebimäng; ainult `spatial-batches-v86.js` vastus asendati brauseris täpse baseline/katsefailiga. Mõlemad läbistasid ühe asendamise, JS vigu 0. Iga vaate juures mõõdeti 5 kaadrit ja seejärel 120 esitatud kaadrit.

| Vaade / 120 kaadrit | V346f algne | V347 katse | Tähelepanek |
|---|---:|---:|---|
| Detail CPU keskmine | 21,335 ms | 18,969 ms | -11,1%, aga vanal jooksus 241,3 ms üksikpiik |
| Detail CPU mediaan | 18,8 ms | 18,2 ms | -3,2% |
| Detail CPU p95 | 27,2 ms | 26,3 ms | -3,3% |
| Detail kaadrite ajavahemikust hinnatud FPS | 44,6 | 50,3 | Kaadrite laadimisseis ei olnud täielikult identne |
| Detail render() CPU keskmine | 15,19 ms | 14,70 ms | -3,2% |
| Maailm CPU keskmine | 11,551 ms | 11,573 ms | +0,2% = praktiliselt sama |
| Maailm CPU mediaan | 11,5 ms | 11,6 ms | praktiliselt sama |
| Maailm render() CPU keskmine | 9,74 ms | 10,05 ms | väike mõõtmise varieerumine |
| Maailm joonistuskäsud | 494 | 494 | samad |
| Maailm kaadrite ajavahemikust hinnatud FPS | 83,0 | 82,5 | praktiliselt sama |

5 kaadri lühivõrdlus sõltus oluliselt juhuslikest raamipiikidest: detail 22,10 ms vs 27,18 ms, maailm 12,12 ms vs 18,24 ms. Kummagi põhjal ei tohi teha lõplikku FPS-järeldust. Detaili 120-kaadrises profiilis oli ~1060 WebGL draw calli, ning mõlemal juhul 31 detailvoo kirjest ainult 9 täielikult valmis, s.t täislaadimise sõltumatu mõõtmine on veel vajalik.

**Järeldus:** Sisemise funktsiooni märkimisväärne kiirendus ei translateeru automaatselt suureks FPS kasvuks, sest maailmakaardi kogukulust moodustasid suurema osa Three.js maatriksid, puude LOD, renderdus ja GPU. V347 jääb katseharusse, kuni mõõdetud on pikem täielikult stabiliseerunud detailkaart, liikuva kaameraga suur maailm ja vähemalt teine graafikaseade.

## Kohaliku testi materjalid
Kood ja katseskriptid: `E:\KuningriigidTest\bench-five-frames\`.
A/B JSON: `2026-11-12-spatial-gemini-comparison.json` ja `2026-11-12-spatial-gemini-baseline/summary.json` ning `...-optimized/summary.json`. CPU profilerid: samades kaustades `detail-five.cpuprofile`, `world-five.cpuprofile`, `detail-steady-five.cpuprofile`, `world-steady-five.cpuprofile`.
