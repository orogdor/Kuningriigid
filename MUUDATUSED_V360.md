# V360 esimene etapp – kõrge kivimüüri sisemine rinnatis (2026-11-18)

## Miks
V359 kõrge müüri käigutee serval oli 0,21 m kõrgune sile hele riba ja selle kohal üksikud 0,44 m kõrgused kuubikud. Selle välimus oli ebarealistlik, eriti vaates käigutee pealt, ning tekstuur oli liiga suure kivimustriga.

## Muudatused
- Eemaldatud `highStoneWall()` vana 0,21 m madal sirge ääreosa ja selle peale lisatud lihtsad kivikuubikud.
- Uus `parapetMasonryV360()` ehitab kaitserinnatise geomeetriana: vahelduvate vuukidega kiviread, väljaulatuvad kivipinnad, süvistatud tumedam vuugitaust, eraldi tahutud kattekivid. Pikad siledad dekoratiivsed ribad puuduvad.
- Sisemine rinnatis on 0,88 m kõrge ning sellel on umbes 0,085 m paksused kattekivid.
- Välimine krenažeeritud rinnatis on 0,55 m kõrge, sellel paiknevad täiendavad umbes 0,40 m kõrged müürihambad ja eraldi kattekivid.
- Müüri käigutee põhikõrgus jääb 2,22 meetri peale, kasutatav laius on säilitatud.
- Varasemate treppide läbikäigu kohad jäävad avatuks; `walkBarrier` tõkked järgivad uut kõrgust.
- V359 kivitorni, värava ja madala kivimüüri geomeetriat selles etapis ei muudeta.
- Mängumudeli IndexedDB vahemälu versioon tõstetakse `360a` peale.

## Mõõdetud kontrollid (Windowsi eraldi katsekoopia)
- Uuesti genereeritud `house-builder-v355.js` läbis `node --check` ja `node tests/house-builder-v355.mjs`.
- Chromiumi kujundaja-mängu ekspordivõrdlus: `reinforced_wall`, `reinforced_wall@2`, `stonetower`, `gatehouse` – 4/4 mudelit kattusid.
- Kõrge pronksiaegse müüri lähimudel suurenes ligikaudu 1560 → 3950 kolmnurgani; rauaegse mudeli puhul 2300 → 5200. See on märkimisväärne kasv; kaugema LOD-i lihtsustus säilib. FPS tuleb mõõta pärismängus.
- Chrome'i kohalikust testist tehti 3D-vaated mõlemas ajastus. Keskmise kvaliteediga tekstuurid saadi avaldatud saidilt. Mudel on visuaalselt kõrgema ja selgema kivirinnatisega, kuid järgmise etapi tööks jääb alumise müürikeha ja kogu kindlustuse materjalide realistlikumaks tegemine.

## Töövoog
Kivikaitserajatiste lähtekood on `majaehitaja/index.html`. Muudatus on taasesitatav failidega:
`tools/stone-fortifications-v360/patch-v360-stage1.mjs` ja `highstone-v360.txt`.
Genereeritud mängumoodul tuleb ehitada käsuga `node tools/house-builder-v355/build.mjs`.

## Veel tegemata
- 2. etapp: kivimaterjalide / müürihammaste detailne ümbertegemine.
- 3. etapp: madal kivimüür.
- 4.–5. etapp: värav ja torn.
- Maastikuühendused, pärismängu FPS, üksuste navigatsioon ja NativeThreeBridge tuleb enne peaharusse liitmist kontrollida.
