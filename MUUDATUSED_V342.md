# V342: sujuvam detailkaart, graafika muutmata

V342 teeb `RAPORT_FPS_V341.md` soovituste punktid 1–3. Kõik kolm muudavad ainult seda, **millal** tööd tehakse, mitte seda, mida joonistatakse. Simulatsioon ja salvestused jäid muutmata.

## 1. Keskruudu kihid ainult võimalikule järgmisele keskruudule
Horisont (9×9 kauge maa), jõed, kaljud, navigatsioon, teed ja piirid on nähtavad või kasutusel ainult keskruudul. V342 ehitab need ainult kesk- või sihtruudu kõrval olevatele ruutudele. Kaugemal oleva ruudu ehitus peatub pärast nähtavaid etappe (maastik, puud, taimkate, meri, hooned) ja jätkub samast kohast, kui ruut jõuab kesk- või sihtruudu kõrvale. Etapivahetusel on yield, et peatus toimuks täpselt seal. Naaberruutude hoonete ja ressursside värskendus kasutab uut `visualReady` lippu.

## 2. Ükski laadimissamm ei blokeeri kaadrit kauaks
Uus `frame-slice-v342.js`: laadija alustab iga sammu 4 ms ajalõiguga. Pikad tsüklid annavad lisaks senisele kindlale yield'ile (iga 192 tipu järel) aja ka siis, kui ajalõik saab täis. Ühekordsete raskete arvutuste vahel on samuti katkestuskohad: normaalid, reljeef, horisondi indeksi filtreerimine ja jõevõrgu keevitus. Muudetud on maastik, horisont, ressursid, meri, jõed (`continuous-landscape-visual.js`) ja navigatsioon (`navigation.js`). Katkestamine jagab tööd ainult osadeks, tulemus on täpselt sama.

## 3. FPS-piirangu vahele jäetud kaadrid
Kaamera akna valik ja naaberruutude visuaalne värskendus tehakse ainult joonistatavatel kaadritel. Joonistamata kaadritel laadimine jätkub, aga kõige rohkem poole kaadri pikkuse jooksul. Nii ei lükka see järgmist joonistatavat kaadrit edasi. Naaberruutude hoonete otsing on `Set`, mitte `Array.includes`.

Jäeti teadlikult muutmata:
- `syncLocal` kasutab kaadri ajavahet animatsioonideks.
- Iga 4 sekundi järel jooksev `applyMaterialEngine` võib mõjutada ehituse eelvaate materjale.

Nende muutmine võiks pilti muuta.

## Kontrollid
- **Graafika on sama** (`tests/visual-identity-v342.cjs`, `reports/visual-identity-v342.json`): sama seeme ja sama kaamera. Võrreldi iga nähtava detailruudu maastikku, merd, taimkatet, hooneid ja ressursse, keskruudu horisonti, jõgesid, kaljusid, teid, piire ja navigatsiooni. V341 vs V342: 197/197 identsed, pärast kahe ruudu ületamist 219/220. Ainsad erinevused (horisondi augu hetk ja ühe hoone animatsioon) erinevad samamoodi ka kahe V342 käivituse vahel, sest need sõltuvad mänguajast.
- **Uus test `tests/detail-stream-v342.mjs`**, mis kontrollib:
  - kaugemad ruudud ei ehita keskruudu kihte, kuid näitavad kogu nähtavat sisu;
  - peatatud ehitus jätkub sihtruudu kõrval;
  - uus naabrus on pärast ületamist valmis;
  - `tick(eelarve)` peab eelarvest kinni;
  - aeglase mere ja navigatsiooni puhul jäävad sammud alla 12 ms ning tulemus on identne.
- **Kiirkontroll:** kõik 112 kohalikku käsku läbisid.
- **Päris mäng, liikumine Shift-kiirusel, sama seeme, mõõdetud üksinda** (`reports/detail-stream-v342-browser.json` ja `reports/detail-stream-v341-solo-baseline.json`):

| | V341 | V342 |
|---|---|---|
| esialgne 5×5 aken valmis | 7,7 s | 5,8 s |
| laadimise CPU-aeg kokku | 13,1 s | 9,1 s (−31%) |
| täielikult nähtavad välisruudud | 15,2/16 | 15,2/16 |
| pikim laadimissamm | 14 ms | 16 ms |

Selles keskkonnas olid sammud mõlemas versioonis lühikesed. Punkt 2 hoiab need lühikesena ka aeglasemal protsessoril. SwiftShader on tarkvararenderdaja, seega see ei ole riistvara FPS-test.
