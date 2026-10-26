# V171 — Kiviaja lõpu mängitav AI küla

## Eesmärk ja kontrollitud lähtepunkt
- Seeme: **142023**
- AI mängis reaalsete mängureeglitega **102 käiku**, kasutades 5 × 12 s simulaatori sammu iga käigu kohta.
- Valitud linn: **Sampola**, AI riik 1 → mängija riik 0.
- Valitud hetk: **102. käigu lõpp**, ikka kiviaeg (age 0).
- AI jõudis selle riigiga pronksiaega **103. käigul** (ilma mängija ülevõtmiseta). See on reaalne võrdlus, mitte mängija järgmise käigu garanteeritud tulemus.
- Tegelik valmisasula: 18 elanikku, 43 valmis ehitist, 14 elumaja, 1 peamaja, 1 talu, 1 põld, 2 metsatöölise hoonet.
- Kaitsering: **20/20 valmis**, 2 puitväravat, 4 vahitorni, 14 palisaadilõiku.
- Vahendeid ei süstitud. Salvestuse üleandmisel vahetati ainult mängija ja AI riigi omandiõigused, säilitades ressursid, teaduse, linnad, kaitsed ning väeüksused.
- Fail: `scenarios/ai-stone-v171.json` (V4 tavaline mängusalvestuse skeem).
- Metaandmed: `scenarios/ai-stone-v171.manifest.json`.

## Kuidas ise mängida
[**Ava V171, Sampola kiviaja lõpp**](https://orogdor.github.io/Kuningriigid/?v=171-20261026&demo=ai-stone-v171)

1. Mäng avab koheselt endise AI-linna **Sampola** detailkaardi.
2. Mäng on alguses pausil, et saaksid küla inspekteerida.
3. Vajuta ▶, kui soovid mänguga jätkata ja ise pronksiaega jõuda.
4. Maailmakaardile saab minna tavapärase mängunupu kaudu.
5. Tavalisel mängulehel olevat mängija olemasolevat autosalvestust teststsenaariumi avamisel üle ei kirjutata. Testmängust saad eraldi JSON-salvestuse eksportida.

## Testimismeetod
- `scripts/make-ai-stone-v171.mjs`: käivitab päris `Civilization` mängumootori seemnega 142023.
- Kõigepealt teeb AI ehtsa linnaplaneerimise ja kindlustamise. Alles täieliku kaitseringiga kiviaegsetest seisudest valitakse suurim sobiv asula.
- `takeOverAI` vahetab riikide omandiõigused ilma tasuta ressursside/hooneteta.
- Pärast üleandmist laetakse salvestus uuesti mängumootorisse ja simuleeritakse selle jätkumist.
- Github Action [V171 genereerimine](https://github.com/orogdor/Kuningriigid/actions/runs/40301825343) — **PASS**, 43/43 valmis hoonet ja 20/20 kaitserajatisi.
- Eraldi Chromium/WebGL mobiili- ja arvutitest: [V171 brauserikontroll](https://github.com/orogdor/Kuningriigid/actions/workflows/v171-stone-browser.yml).

## Piirangud
- Tegelik brauseri ja telefoni emulatsiooni test ei asenda katset sinu päris seadmel.
- AI omal ajal toimunud pronksiaja vahetus järgmisel käigul ei tähenda, et kasutaja peab täpselt samal mänguminutil uut ajastut alustama: otsuse teeb mängija.
