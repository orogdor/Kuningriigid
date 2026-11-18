# V357 – ehitusmenüü pildid ei vilgu (NativeThreeBridge)

## Miks
NativeThreeBridge'is vilkusid ehitusmenüü kaartide pildid.

## Põhjus
`renderUI()` ehitab menüü igal värskendusel uuesti eraldi koopiasse ja paikab elava menüü selle järgi (`patchMenu`). UI-nahad (`ui-v310.js` kaardid ja `ui-art-v263.js` ikoonid) muudavad aga elavat menüüd pärast värskendust:
- pilt ja tekst pannakse eraldi `v310-visual` ja `v310-caption` sisse;
- kaardile lisatakse klassid ja `title`.

Värske koopia neid muudatusi ei sisaldanud. Seetõttu eemaldas iga värskendus (umbes kolm korda 10 sekundi jooksul) kõik need muudatused ja nahk lisas need MutationObserveriga uuesti. Iga kaardi pilt eemaldati ja lisati tagasi. Brauser joonistab alles pärast mõlemat sammu. NativeThreeBridge joonistas vahepealse kaunistamata seisu ja see oligi vilkumine.

## Mis muutus
- `civilization.js`: enne `patchMenu` käivitatakse `prepareMenuV357(värske juur)`. See kutsub UI-nahkade registreeritud funktsioone (`globalThis.KuningriigidMenuPrepareV357`).
- `ui-v310.js`: registreerib sama `paint()`-i värskele juurele.
- `ui-art-v263.js`: kaardi ikooniklass on funktsioonis `icons(root)`, mis on registreeritud samale konksule.
- Kui menüü pole muutunud, paigatakse see nüüd ilma ühegi muudatuseta.
- Vahemälu võtmed: `ui-v310.js?v=357a`, `ui-art-v263.js?v=357a`, `boot-v83.js?v=357a` ja `civilization.js?v=357a`. `tests/ui-writes-v350.mjs` lubab uuemat `ui-art-v263` võtit.

## Kontroll
Chrome, stonetown, ehitusmenüü lahti, 10 s MutationObserver kogu lehel:
- enne: kaartidesse lisati 57 pilti ja 345 spani, kaartide `title`'it muudeti 114 korda;
- pärast: kaartides 0 muudatust.

Menüü näeb välja sama. Läbisid `ui-writes-v350`, `ui-reference-v288`, `ui-painted-v287`, `ui-v290` ja `node scripts/test.mjs traffic`. Päris NativeThreeBridge'i exe-s kontrollimata.
