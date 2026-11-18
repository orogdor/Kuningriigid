# V359 – kivimüüride, kivitorni ja kivivärava ümberehitus

## Ulatus
- `stonewall` ja `stonewall@2`: madal kivimüür, ühtne kivitihend, selgelt eristuv kattekivide rida ja seotud otsapostid.
- `reinforced_wall` ja `reinforced_wall@2`: 2,22 m kõrgusele viidud käigutee (varem 1,52 m), tugev kivivundament, müüri tugipiilarid, kattekivid, vahelduvad hambad, parapetid.
- Mitme müürilõigu nurgad: ümarad ühendustornikud/kivibastionid, käiguteede ühendus säilib.
- `stonetower`, `gatehouse`: uus kivitorni väline kaitsekest koos nurgapiilarite, ukse-/aknaavade kivipiitade, siseplatvormi, piirdehammaste ja parapeti tugikividega. Rauaaja `stonetower@2` senine detailne hellenistlik torn säilitab oma eri siseplaani ja katuse, kuid kasutab sama uuendatud kivimüüri käiguteed.
- Värav: massiivsed kivisambad, kaare võlvikivid, ülemine kaitseplatvorm, vahelduvad hambad ja eristuv tammine väravaleht. `lintel` pronksiaja ja `arch` rauaaja värav on eraldi lahendused.
- Avatud väravaleht ei registreeri enam ületamatut kokkupõrketõket; suletud värava tõke säilib.
- Kõrgema müüri jaoks käigutee külgmised trepid on pikemad ja astmete arv kasvab.

## Lähtekood ja genereerimine
- Ainuke muudetav 3D-hoonete geomeetria lähtekood: `majaehitaja/index.html`.
- `house-builder-v355.js` genereeritakse tööriistaga `node tools/house-builder-v355/build.mjs`.
- Muudatuse retseptid on `tools/stone-fortifications-v359/patch-v359.mjs` ja `patch-v359-extra.mjs`.
- Mängumudelite IndexedDB vahemälu versioon uuendatakse `358a` → `359a`.
- Teisi majade geomeetriaid ega mängu majandust ei muudeta.

## Katsekoopias läbitud kontroll
- `node --check house-builder-v355.js`.
- `node tests/house-builder-v355.mjs` (pärast vahemälutesti uuendamist).
- Chromiumi mudeliekspordi võrdlus: `stonewall`, `stonewall@2`, `reinforced_wall`, `reinforced_wall@2`, `stonetower`, `stonetower@2`, `gatehouse`, `gatehouse@2` – 8/8 kattusid, kaasaarvatud LOD, materjalid ja kokkupõrkeandmete arv.
- Testkoopias puudusid välistes kaustades paiknevad tekstuurifailid, mistõttu see katse ei kinnita täistekstuuridega lõplikku välimust.
- Kogu mängu ja NativeThreeBridge EXE FPS-/läbipääsutest on veel vaja teha.

## Kontroll enne peaharusse liitmist
Vaata päris mängus pronksi- ja rauaaja linnavärava avatust/suletust, nurkade kokkupuuteid, mäe/kalju lähedasi müürilõike ja teelt väravasse minevat üksuse rada. Võrdle detailkaardi FPS-i V358-ga.