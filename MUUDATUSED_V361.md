# V361 – Mesopotaamia mõjutustega kivikindlustused

**Aluseks:** peaharu V358. Eelmised V359/V360 katsegeomeetriad ja kasutaja tagasilükatud kivimüüri kujundus ei ole selle töö lähteks.

## Kasutaja piltidest lähtuv disain
- Alt laiem, kergelt sissepoole kaldu, heledast liivakivist tahutud müürikeha.
- Värvilise kiviplokkide tekstuuri asemel päris geomeetriaga laotud, vahelduvate vuukidega kiviread.
- Hele krohvitud ülemine kaitsevöönd ja **sujuva lainelise profiiliga 3D-rinnatis** (müüril, tornidel ja värava peal).
- Väikesed väljaulatuvad puittalade otsad ülakrohviosa all.
- Kandilised tornid, ülakorrusel kitsad avad; pronksi- ja rauaaja variandid.
- Värava kaitsmass pealt krohvitud, süvendatud kahe poolega puidust värav ja tumedad metallkinnitused.

## Tehniline rakendus
- Üks lähtekood `majaehitaja/index.html`, millest genereeritakse `house-builder-v355.js`.
- Katseharu `feature/mesopotamian-fortifications-v361`.
- Uue mudeli vahemälutunnus `361a`; varasemad salvestatud ehitusandmed jäävad alles.
- `highStoneWall()`, `fortificationMasonry()`, `stoneTowerShell()`, `ironTowerModel()` krohvitud ülakorrus ja `gateModel()` kiviväravad kasutavad V361 abifunktsioone.
- Puidust väravate muud tüübid ja mängu majandusloogika jäävad muutmata.
- Avatud väravaleht ei lisa enam kokkupõrketõket; suletud väravaleht takistab käiku. Uue väravaava alla ei tehta täiskõrguses kiviplokki.
- Ülemine käigutee 2,22 m kõrgusel, kivist kaitserinnatise kõrgus kuni ~1,07 m; ümarad ristprofiilid on piisava segmentide arvuga.

## Tehtud kontrollid
- Windowsi eraldi katsekoopias `node --check house-builder-v355.js` ja `node tests/house-builder-v355.mjs`.
- Chromiumi kaks eksportijat (disainer/otse mängus): **8/8** kõrge kivimüüri, kivitorni, väravahoone ja madala kivimüüri ajastuvarianti vastasid üksteisele.
- Brauneri 3D vaade kontrollitud vähemalt pronksiaja kõrge müüri, kivitorni ja kahe torniga väravahoone puhul.
- Kivivärava ava, torni müüriühenduse ja mängija tegeliku liikumise test kogu mängus tuleb enne terviklikku heakskiitu veel teha.
- Kohaliku 3D-testi mudelid töötasid avaliku tekstuuripaketiga; tegelikus mängus FPS/NativeThreeBridge üle kontrollimata.

## Edasine
Vajadusel vähenda keskmise ja kaugema LOD-i geomeetriat, vaata eraldi värava avamist ja sulgemist, kontrolli külgnevate müüride ühendused ning sõdurite käigurajad.

## Taastootmine
1. `node tools/mesopotamian-v361/patch-v361.mjs` puhtal V358-l.
2. `node tools/house-builder-v355/build.mjs` (vajalik `acorn` + `eslint-scope`).
3. Kontrollid: `node tests/house-builder-v355.mjs`, `node tests/fortress-v361.mjs`.
