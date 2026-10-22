# Kuningriigid RTS – automaatne 200 käigu regressioonitest

**Sihtprojekt:** https://github.com/orogdor/Kuningriigid  
**Lähteversioon:** V104 (`76a0760524bd6d2aeab1d6099b4a5b4479adcd67`)  
**Eelmise avaldatud versiooni võrdlus:** V103 (automaatselt leitav Giti ajaloost).

## Kasutus

Paki selle ZIP-i sisu **Kuningriigid hoidla juurkausta**. Jäta `.github/workflows/` alamkaust alles.

Vajalik: **Node.js 22** ja Giti hoidla koos ajalooliste commit'idega. Kood ei vaja npm-installi ega pildi-, graafika- või veebibrauseri sõltuvusi.

```bash
# Käivita Kuningriigid hoidla juurkaustas
node regression/selftest.mjs
node regression/compare.mjs --candidate . --base-ref auto --turns 200 --seed 8417
```

Teise maailmaga võrdlemiseks:

```bash
node regression/compare.mjs --candidate . --base-ref auto --turns 200 --seed 20261020 --output artifacts/regression-200-seed2
```

Kui soovid võrrelda **konkreetsete** Giti versioonidega:

```bash
node regression/compare.mjs --candidate . --base-ref d8c2711979 --turns 200
# Võid kasutada ka teist olemasolevat kausta:
node regression/compare.mjs --candidate ./uus --baseline ./vana --turns 200
```

**GitHub Actions:** Kui failid on GitHubi projekti lisatud, vali *Actions → Kuningriigid 200-turn regression → Run workflow*. Pull request'i korral käivitub kontroll asjakohaste koodimuudatuste puhul automaatselt. Arvuti asemel saab tulemusi vaadata telefoni brauseris, GitHubi *Actions → Artifacts* kaudu.

## Milliseid kontrolle teeb?

| Valdkond | Tegelik kontroll |
|---|---|
| 200 käiku | Iga käik = 60 simulatsioonisekundit, iga samm = 0,5 s. Kutsutakse päris `Civilization.tick()` 24 000 korda ühe 200 käigu mängu kohta. |
| 4 riiki / AI | Mängu AI juhib kolme vastast; mängija riiki juhitakse sama `aiTeam(0)` funktsiooniga 12-sekundilise intervalliga. Ei lisata tasuta ressursse ega hüpata ajastuid. |
| Majandus | Varud ei tohi olla negatiivsed, NaN ega Infinity; elanike arv, hoonete HP ja ajastud peavad kehtima. Mõõdetakse varud, rahvastik, hooned, tootmisprobleemid ning areng. |
| Teadus / AI | Ajastute üleminekud, linnade arv, tehnoloogiate arv, riikide aktiivne uurimine, ressursside kitsaskohad. Kui üks riik ei suuda 200 käiguga linna rajada ega pronksiaega jõuda, on test nurjunud. |
| Maailmakaardi rajaleidmine | Maailmas liikuva üksuse etteantud tee järjepidevus ja läbitavus; `landPath` leiab iga riigi jaoks reaalse naabersihtkoha tee. |
| Linna rajaleidmine | Valmis hoonete ja peamaja vaheline `Navigation.route()` ja `reachable()` valimik. Probleemsed sissepääsud lisatakse hoiatustena. |
| Salvestused | Käikudel 1/50/100/150/200 tehakse päris oleku JSON-serialiseerimine, taastatakse `Civilization` ning jätkatakse mängu. Kontrollitakse ka salvestuse varukoopiast taastamist. |
| Vana → uus | V103 100. käigu salvestus avatakse V104 mootoriga ja mängitakse täiendav üks käik. |
| Eelmise versiooniga võrdlus | Sama seeme, raskusaste ja samm; iga 10 käigu järel linnad, rahvastik, ajastud, tehnoloogiad, hooned, uuritud ruudud, teed. |

### Väljundid

Vaikimisi tekivad failihoidlasse järgmised raportid:

```text
artifacts/regression-200/
  baseline/report.json
  baseline/summary.md
  baseline/save-100.json
  baseline/save-200.json
  candidate/report.json
  candidate/summary.md
  candidate/save-100.json
  candidate/save-200.json
  comparison.json
  comparison.md
  timeline.csv
  cross-version-save.json
```

`comparison.md` on lihtne eestikeelne aruanne; `timeline.csv` sobib Excelisse või Google Sheetsi. JSON sisaldab üksikasju ja vigu. GitHub Actions salvestab tulemused allalaaditava artefaktina.

### Testi lävendid ja teadlikud piirangud

- Negatiivsed/mittearvulised ressursid, vigane maailma asukoht, vale rajajätk, katkenud salvestuse taastamine ja 200 käiguks kiviaega kinni jäänud riik on **ERROR** (CI nurjub).
- Suured erinevused V103-ga, seisma jäänud liikumine ja teatud ehitusplatside ligipääsetavuse probleemid on **WARNING**, sest näiteks tasakaalumuudatused võivad olla tahtlikud.
- Kui mäng võidetakse enne 200 käigu täitumist, märgitakse aruandes **tegelik lõppkäik**; test ei väljasta ekslikult 200 käigu läbimist.
- `Civilization.tick` ei käivita brauseri 3D-joonistamist ega `civilization.js` lahingukontrolli. Täielikud lahingu-, mobiililiidese- ja visuaalsed regressioonid vajavad eraldi olemasolevaid `TEST_V100_BATTLE.mjs` / Playwrighti teste.
- Testiraamistiku tehnilist käivitamist kontrolliti eraldi proovimootoril. V104 ja V103 täielikku pärismängu 200 käigu simulatsiooni **ei ole veel käivitatud**; GitHubi hoidla on praegu kontrollitud ainult lugemisõigusega. Seetõttu ei esita see pakett tõendamata väidet mängu veatuse kohta.

## Muutmiskindlus

Testide skriptid **ei kirjuta ega push'i** Kuningriigid algkoodi. Versioonivõrdlus kasutab ajutist `git worktree` kausta ning eemaldab selle pärast lõpetamist. Ainult testiraportid ja Giti ajutine worktree metaandmestik muutuvad kohalikus failisüsteemis.
