# Kuningriigid – ühine tööjärg

Viimati kokku lepitud seis: **V248**, GitHubi `main`-harus. Enne töö alustamist kontrolli alati GitHubi tegelikku viimast seisu; seda faili ei uuendata automaatselt.

- Mäng ja avalik eelvaade: https://orogdor.github.io/Kuningriigid/
- Lähtekood: https://github.com/orogdor/Kuningriigid
- V241: mängumudelid laaditakse vajaduse järgi; sõduritüübid on eraldi failides.
- V242: detailkaardi naaberalad valmistatakse ette ja taaskasutatakse. Üleminekul säilivad ühine maastik ja kaamera asukoht.
- V243: müüri saab ühendada torni või väravapostiga. Ehitamisel pöörab Ctrl + hiireratas eelvaadet 2° kaupa; juhis on ekraanil. Silla paigutus peab ühendama kaldad.
- V244 (Claude): jõudlus ilma graafikat halvendamata. Puud ja põõsad joonistatakse instancing'uga, kiviaja hoonetel on kolm detailsuse astet (`models-stone-lod-v244/`), WebGPU varulahendus on rangem. Üksikasjad: `MUUDATUSED_V244.md`.
- V245 (Claude): WebGPU must ekraan parandatud. Põhjus oli three r170 instancing'u uniform-puhvri viga (`vendor/three.webgpu.js` patch). Üksikasjad: `MUUDATUSED_V245.md`.
- V246 (Claude): WebGPU maailmakaardil oli näha ainult udu. Udu kate ja meri on nüüd TSL-is, sest WebGPU eirab `onBeforeCompile`-t. Kontroll: `tests/webgpu-v246/sea.html?gpu=0|1`. Üksikasjad: `MUUDATUSED_V246.md`.
- V248 (Claude): uus kaarditüüp „Loogiline maailm“ (`world-tectonic-v248.js`, `geographyVersion:5`): laamad, mäeahelikud laamapiiridel, erosioon, tuulte ja vihmavarjuga kliima. See on uue mängu vaikevalik; vanad kaardid ja salvestused ei muutunud. Ajutine menüünupp „Kogu kaart“ (vaikimisi sees) eemaldab udu. Üksikasjad: `MUUDATUSED_V248.md`.
- V247 (Claude): Deno ja Chrome'i kiirtest (`tests/deno-bench-v247/`): sama three.js WebGPU stseen brauseris ja Denos ilma brauserita. Pilvekonteineris (SwiftShader) töötavad mõlemad ja annavad sama 1 767 joonistuskäsku. Päris mõõtmine on veel tegemata ja tuleb teha kasutaja arvutis. Mäng ise ei muutunud.
- V243 muudatuste ja kontrollide üksikasjad: `MUUDATUSED_V243.md`; eelmised versioonid: `MUUDATUSED_V241.md` ja `MUUDATUSED_V242.md`.

## Koostöö

1. Enne muudatusi kontrolli GitHubi `main`-haru viimast versiooni ja töökoopia seisu. Ära kirjuta teise töö tegija pooleliolevaid muudatusi üle.
2. Samaaegseks tööks kasuta eraldi harusid või töökoopiaid; ühenda muudatused pärast kontrollimist.
3. Pärast sisulist muudatust uuenda seda faili: märgi tulemus, versioon, kontrollid ja järgmine teadaolev töö. Ära kirjuta oletusi lõpetatud töö pähe.
4. Avalik versioon ja kohalik pooleliolev töö võivad erineda. Märgi see selgelt; GitHubi üleslaadimine või avaldamine toimub kasutaja juhiste järgi.

## Kontrollimine

Käivita muudatusele vastavad testid. Näiteks V243 ehitusmuudatuste puhul `node scripts/test-build-v243.mjs`, müüride puhul `node TEST_V1754_GATES.mjs` ja detailalade puhul `node scripts/test-stream-v242.mjs`. Mängu põhikontroll on `node scripts/test.mjs traffic`. Brauseritestide käivitamiseks on vaja Puppeteeri ja sobivat brauserit.

## Järgmine töö

- V248 maailmakaart: kasutaja vaatab uued kaardid üle. Seejärel tuleb ajutine „Kogu kaart“ nupp eemaldada (`index.html` `#reveal-v248`, `civilization-core.js` `seen()`, `fog-delta-v88.js`). Võimalik täpsustus: stepi osakaal (26–31% maast).
- V247 mõõtmine kasutaja arvutis: Chrome 100,8 fps, Deno 51,2 fps (sama stseen). Brauserita lahendus ei ole kiirem; rakenduseks sobib Tauri/Electron + Capacitor.

- Tõrvikud (225 eraldi tükki) ja varustus tuleb liita. Kasutaja soovis selle hilisemaks eraldi ja põhjalikumaks läbivaatuseks.
- WebGPU töötab kasutaja NVIDIA kaardil. Kaadrisagedust WebGPU ja WebGL-i vahel pole veel võrreldud. Udu kate ja meri on V246-s TSL-is. Maastiku sujuvad üleminekud, pilvede varjud ja tuul puuduvad WebGPU-s endiselt ja tuleb ümber kirjutada TSL-i.
- WebGPU udu on WebGL-ist hallim, sest three r170 WebGPU rakendab ACES-toonivastenduse kogu kaadrile ja eirab `toneMapped:false`.
