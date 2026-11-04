# V293 – avastuste pildid ja viie ringi uurimisjärjekord

Tehtud ainult avastuste kasutajaliideses. Maailmakaarti, linnade paneele, armeed, tootmist, salvestusi ega muude menüüde paigutust ei muudetud.

## Viis alumist ringi
- Esimene ring näitab üht aktiivset uurimust koos pildi ja edenemisprotsendiga (pausil II).
- Järgmised neli ringi näitavad mängu `research[0].queue` kuni nelja järgmist avastust õiges järjestuses.
- Tühi koht näitab tumedat plussiga ringi, mitte varasemaid suvalisi kompassi/veski/laeva/linnuse pilte.
- Ringile vajutamine avab tehnoloogiapuu vastava avastuse juures. Järjekorrast eemaldamine toimub menüü järjekorrareal oleva × abil.
- Need ei ole graafika- või mänguseaded. Järjekorda lisamine järgib vana `queueResearch` kontrolli (eeltingimused, max 4), aktiivne uuring vana `startResearch` loogikat.

## Iga avastuse pilt
- `research-art-v293.js`: iga TECHS-ID jaoks oma animeerimata ajaloolises stiilis kullatud, tumesinine SVG-portree (`data:image/svg+xml`).
- Teema ja ajastu määravad keskse motiivi ning värvipaleti, avastuse ID määrab ornamentdetailid. Iga avastus saab oma pildiallika.
- Pilt on iga tehnoloogiapuu nupu sees ja valitud avastuse suures detailvaates. Järjekorranupud kasutavad samu pilte.
- V293 ikonograafia on mängu sisene esmase pildikomplekti teostus; foto-/maalikvaliteediga iga avastuse eraldi illustratsioonid saab hiljem asendada sama andmesidumist muutmata.

## Ühendamine ja test
- `civilization.js` avaldab read-only `researchActiveId`, `researchActiveAge`, `researchQueue` ja `researchPaused`, muutmata salvestusformaati.
- `hud-v293-research.js` uuendab olemasolevate viie ringi keskel ainult pilte/olekut; vana eksitav klikipõhine uuringunupp asendatakse capture-klõpsuga.
- `research-tree-v119.js` ja `research-ui.js` kasutavad samu SVG-pilte.
- `research-art-v293.css` sisaldab ainult avastuse UI stiile, mobiili paigutusega ühilduv.
- `tests/ui-research-v293.mjs` kontrollib iga TECHS-ID pildi, viie ringi semantika ja V293 failiviited. GitHub CI käivitab testi.

Proovimiseks pärast avaldamist: `https://orogdor.github.io/Kuningriigid/?ui=art&v=293`.
Vana pildipõhine variant jääb saadaval `?ui=art&v=292` ainult niikaua kui brauseril on vana fail vahemälus; versiooniparameeter ei ole rollback-mehhanism. Turvaliseks tagasivõtmiseks jääb koodi kaudu `?ui=classic`.

Piirang: enne avaldamist ei kinnitata mobiili/Three.js live brauseritesti; automaattest ja pärismängu seadmetest kontroll tuleb eraldi jälgida.