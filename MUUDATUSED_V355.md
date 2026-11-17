# V355 – majaehitaja hooned mängu enda koodiga (ilma peidetud leheta)

## Miks

V354-s ehitas kõik kiviaja–rauaaja hooned peidetud majaehitaja leht (`majaehitaja/index.html?embed=1&worker=1`, iframe), mis saatis mudelid `postMessage` kaudu mängule. NativeThreeBridge'is iframe'e pole: majaehitaja ei käivitunud, hoonete kohal oli 60 s tühi koht ja alles siis tulid vanad mudelid.

## Mis muutus

- **`house-builder-v355.js`** (uus, genereeritud) – majaehitaja enda hoonete ehitamise kood ES-moodulina: kataloog, näidisdisainid, plaani geomeetria ja 3D-ehitaja (`createHutView`, `exportModel`). Kasutab mängu `vendor/three.module.js`. UI-d, WebGL-rendererit ega iframe'i pole. Ekspordib `buildHouseModelV355({id,design,segment})`, mis annab sama paketi, mille majaehitaja leht varem saatis.
- **`tools/house-builder-v355/build.mjs`** – teeb mooduli failist `majaehitaja/index.html`. Majaehitaja jääb hoonete ainsaks allikaks. **Pärast iga majaehitaja muudatust:** `node tools/house-builder-v355/build.mjs` (vajab `acorn` ja `eslint-scope`, nt `npm i --no-save acorn eslint-scope`). Mooduli päises on majaehitaja faili sha256; `tests/house-builder-v355.mjs` (ka CI kiirkontrollis) kukub läbi, kui moodul on vanem kui majaehitaja.
- Generaator valib majaehitaja 1. skriptist ainult hoonete andmed ja funktsioonid (228 lauset, kontrollitakse et lehte/DOM-i ei kasutata) ning kopeerib `createHutView` kahe muudatusega: tekstuurifailide tee on `majaehitaja/textures/` mooduli asukoha järgi; lõuendtekstuurid lõigatakse lõuendile (`createImageBitmap` lõikamist NativeThreeBridge ei toeta). Renderer on ainult küsimustele vastav asendaja. Kolm sisseehitatud pilti (atlas, maastik, variatsioon) jäävad data-URL-ideks.
- **`house-designs-v354.js`** – iframe, `postMessage`, südamelöögi valvur ja 60 s ootamine on eemaldatud. Moodul laaditakse esimese hoone ajal (`import('./house-builder-v355.js?v=355a')`); mudelid tehakse järjest. Vahemälu (IndexedDB, `354g`), detailitasemed, instantsid ja varjud on samad. Viga → vana mudel nagu enne.
- Mängu import `house-designs-v354.js?v=355a` (oli `354f`).
- Mängusisene majaehitaja aken (✎ kujundamine) on endiselt iframe – brauseris töötab, NativeThreeBridge'is see veel ei avane. Salvestatud disainid ehitatakse ja joonistatakse ka seal.

## Kontrollid

- `tests/house-builder-v355-browser.cjs` (Chromium): kõik 107 majaehitaja ID-d ehitati nii vanalt majaehitaja lehelt kui ka moodulist – osad, kolmnurgad kolmel tasemel, tippude summa, materjalid, tekstuurid, lõuendtekstuuride pikslid, jalajälg ja seinad on **identsed**. Näiteks elamu 102 359 / 37 142 / 14 962 kolmnurka.
- `tests/house-designs-v354-browser.cjs` (päris mäng, stonetown): 19 mudelit valmis, 0 viga, linnas ühtegi vana mudelit, kõndija seinad, ehitusmenüü kujundamine ja peamaja oma disain töötavad, lehevigu pole.
- NativeThreeBridge v0.32.26 Node-testihostis (sama shim ja renderer, three r187): elamu mudel valmis ~7 s pärast, sama kolmnurkade arv, joonistatakse (12 joonistust, 8 tekstuuri). Päris exe-s kontrollimata.
- `tests/house-builder-v355.mjs`, `tests/house-designs-v354.mjs` läbisid.
