# Kuningriigid V131 → Godot 4: 2.7 maastiku- ja transpordietapp

**Allika fikseeritud commit:** `26562368f56a32616651a266ed2d8c87f06d43d1` repo `orogdor/Kuningriigid`.

## V2.7 tegelikult tehtud

1. Küpsetatud V131 Maa-tüüpi kõrguskaardi **36 300 ruudusüdame kõrgust** seemnega `131`. Algvalemid: `civilization-core.js` (seeded noise/smooth), `earth-map.js` (`earthHeight`), `campaign.js` (`makeGrid`). Pakk sisaldab genereerimiskoodi `tools/bake_v131_geography.py`, `data/v131_earth_seed131_atlas.bin` ja JSON-metaandmeid koos SHA-256-ga.
2. V131 `world-geography.js` äravoolu *priority flood* ja voolukoguse reeglite järgi genereeritud **601 jõeruutu**, **32 madalat ford'i/koolmekohta**. Jõe laiused on V131 natural profiiliga 2.2–9.0 maailmameetrit. Sihtruut ja laius salvestatakse binaarfaili ning kontrollitakse.
3. V131 `landscape-shared.js` kõverad jõesegmendid ja teekõverad genereeritakse *kanoonilise maailmaruudu* järgi. Sama jõesegmendi punktidest joonistatakse maailmakaart ning detailruudu jõesäng. Detailnavigeerimine laiendab veetõkke maski 2,6 meetri võrra, et 5-meetrises A*-võrgus ei tekiks valesid kuivi lõike.
4. Maailmakaardi maanteede läbitavus sõltub nüüd mägedest, merest, V131 jõeruudust, koolmest ja ehitatud sillast. Maanteesilla ehitus maksab **30 puitu + 10 kivi**, vajab lähedal nähtavat teed ning oma linna kuni 24 ruudu kaugusel. Sild joonistatakse ka maailmakaardile.
5. Sillamuutus invalidiseerib maailmakaardi kaubateede BFS-vahemälu ja detailkaartide A*-vahemälu. Kui aktiivse karavani järgmine samm sulgub, proovib karavan uusmarsruuti; kaupa ei kustutata ega saabumiskohta teleportita.
6. JSON-katsesalvestus säilitab `atlas_bridges`; vana salvestus laaditakse ilma selle väljata (migratsioon vaikimisi tühjaks). Sillad taastatakse koos rajaleidmise graafiga.
7. FPS CSV uus nimi: `user://v131_godot_measurements_v27.csv`. Lisaveerud: atlase olemasolu, jõe joonesegmentide arv, ületuskohad, atlase/binaarfaili + maailmameshi esialgne laadimisaeg.

## Teadlikud piirangud

- **See pole üks-ühele kogu V131 maailmaseis.** Maastik on fikseeritud `earth`-tüüpi seemne `131` väljund. Originaalmängus on ka 2–4 kontinendi ja muu seemnega kaardid. Maastiku generaatori põhivalem pärineb V131-st, kuid kõiki võimalikke maailmu Godot praegu reaalajas ei genereeri.
- 14 varasemast Godoti katsestsenaariumist pärineva linna ümbrust kaitstakse V131 alguslinnade maismaale paigutamise loogikaga. **Algne V131 mäng ei kasutanud neid 14 linna koordinaate.** See on teadlik ühilduvuserand: katseid ei uputata uue Maa-kaardi merre.
- Godoti detailkaardi kõrgusproov võtab 220×165 küpsetatud keskpunkti väärtused ja interpoleerib neid. Originaali 9×9 detailkõrguste *bakeDetails* ning mikroreljeef ei ole veel üle toodud. Jõgede asukohad ja suurused on sama allikafaili järgi, kuid 3D mudelid on lihtsad.
- Teid tõstetakse visuaalselt maapinna kohal ning projitseeritakse V131 kanoonilisele kõverale; täielikku teede/bridge objektide 3D-topoloogiat pole veel.
- Maanteekaravanid kasutavad BFS-maailmakaarditeid. Maakonna liiklus kasutab detail A*; linna-, maakonna- ja riiklik transpordipoliitika ei ole veel V131 üks-ühele.
- Androidi ekspordil **lisa `.bin` fail eksporditavate mitte-ressursifailide filtrisse** (`*.bin`), kui Godoti eksport seda automaatselt ei kaasa. Projektis `FileAccess` loeb `res://data/v131_earth_seed131_atlas.bin`.
- **Godoti mootori ja Androidi päris käivitamist ei saanud selles keskkonnas proovida.** QA-skriptid teevad staatilisi ning eraldi Pythonis käivitatavaid arvulisi kontrolle, mitte GDScripti kompilatsiooni.

## Kontrollimine

Godot 4.2+: ava `project.godot`, proovi **MAAILM → vali jõeruut → AVA RUUT**, lisaks `MENÜÜ → Testid → Ühise atlase jõgi` ning `MENÜÜ → Testid → Atlase sild: ava / sulge`. Ehitustesti jaoks on `MENÜÜ → Linn ja ehitus → Ehita maanteesild (30 puit + 10 kivi)`, mis kontrollib ressursse ja läheduses kasutatud teid. `MENÜÜ → Reeglitest` käivitab Godotisse ettevalmistatud testid. `MENÜÜ → Testid → 20s jõudlustest` (teistes menüügruppides võib testil olla muu nimi) kirjutab CSV.

Staatiline / Pythoniga reprodutseeritav kontroll: `python tools/run_qa_checks.py` ja originaalvalemi genereerimine `python tools/bake_v131_geography.py`.
