# V299 – pildinuppude tegelik koordinaatide audit

Alus: kasutaja V298 kuvatõmmis 1883×1239 ja juba kinnitatud V291 pildifailid. Kontrolliti iga HUD-i tegevuspiirkonda pildi algse väljalõike koordinaatidega, mitte uute ümardatud keskpunktidega.

## Kontroll ja parandused

| UI piirkond | Pildinupp | V298 vale asukoht pildis | V299 algpildi õige asukoht |
| --- | --- | --- | --- |
| Minikaart (311×238) | Suurenda | 211,39,61,62 | 203,22,68,71 |
| Minikaart | Kaamera keskpunkt | 234,88,67,59 | 237,64,69,74 |
| Minikaart | Kaardikihid | 232,144,70,67 | 230,125,78,80 |
| Valitud üksus (379×234) | Ründa | 20,64,68,68 | −9,46,86,84 |
| Valitud üksus | Liigu | 83,24,69,69 | 62,10,74,81 |
| Valitud üksus | Peata | 20,129,68,68 | −9,111,80,83 |
| Valitud üksus | Linn | 82,128,71,69 | 71,118,67,67 |
| Valitud üksus | Kõik käsud | 142,12,44,43 | 138,6,40,48 |

- Avastuse põhinupu ning viie järjekorraringi positsioonid kontrolliti üle: vastavad originaalsetele V291 väljalõigetele, neid ei nihutatud.
- Kuue alumise menüükaardi nimed, järjestus ja algse V291 pildis olevad väljalõikekoordinaadid säilitati, sest nad olid kuvatõmmisel õiges rivis.
- Ülariba vapil, ressurssidel ja maailmakaardi vahetusel säilitati pildikoordinaadid; kuupäev/kellaaeg muudetud lühemaks, et ei kattuks pausinupuga.
- Paus ja jätka joonistatakse ainult **ühe** aktiivse nupuna samas kohas, välja lülitatud kasututu kiirema mängu nupp peidetakse.
- Eraldi `zoom-out` ei asu enam minikaardi `zoom-in` pildinupu peal, vaid väljaspool minikaardi raami.
- V297 peitis minikaardi ja üksuse ringnuppude päris pildid, mistõttu kuvatõmmisel olid nende piirkonnas sinakad augud. Need originaalsed pildisprited on nüüd nähtavad ning asetatud täpselt algsete väljalõigete peale; klõpsud käivitavad samu mängukäske.
- Kogu geomeetriat juhib jätkuvalt **üks** `hud-v298-layout.js` mootor. Eraldi lisakihti ei loodud.
- Mängu loogikat, salvestusi, minimapi canvas't ega tehnoloogiapuu andmeid ei muudetud.

## Test

`tests/ui-v299-buttons.mjs` kontrollib 5 uurimisringi, 3 minikaardi nuppu, 4 üksuse käsku, 6 menüükaarti, lisasuumi, pausi/jätkamist ja kuupäeva. Nuppude asukohad võrreldakse päris V291 originaalsete pildilõigetega. 1883×1239 kuvatõmmise põhjal on kõikide elementide ekraanipiirid arvutatud. Test lisatud GitHub Actionsisse.

Päris Androidis ja avalikus veebimängus visuaalselt kontrollimata, kuni uus väljalase avaldatakse ja kasutaja saab esitada V299 kuvatõmmise.

Link: https://orogdor.github.io/Kuningriigid/?ui=art&v=299
