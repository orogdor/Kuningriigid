# Kuningriigid → Godot 4: pordi seis (2026-10-24)

## Lähtekood ja ehitamine

- Godoti aktiivne arendusharu: `godot-port-development`.
- Godoti mänguprojekt: `game/` (Godot 4); Androidi APK ja PCK-käivitaja: `bootstrap/`.
- Varasemad `godot-upload/v33/*.txt` osad jäävad arhiiviks, kuid uus CI ehitab **päris, muudetavatest failidest**.
- Androidi CI: `.github/workflows/godot-apk-test.yml`.
- Viimane kontrollitud CI: https://github.com/orogdor/Kuningriigid/actions/runs/40092076015
- Viimane avaldatud APK/PCK: https://github.com/orogdor/Kuningriigid/releases/tag/godot-dev-23
- Väljalasked luuakse `godot-dev-<workflow run number>` märgendiga *prerelease* ainult siis, kui regressioonitestid läbivad kontrolli.

## Kontrollitud (Godot 4.7.2 CI konteiner)

- Pythoni staatilised testid ja GDScripti impordikontroll läbitud.
- `V131_REGRESSION: 646/646` läbitud 2026-10-24.
- `game.pck` loomine ja `BOOTSTRAP_SMOKE_PASS` läbitud.
- Androidi debug-APK edukalt eksporditud ja GitHubi avaldatud.
- **Mitte kontrollitud:** päris Android-telefoni FPS, puutejuhtimine, seadmesse paigaldamine, võrgust PCK allalaadimine ja taaskäivituse andmete ühilduvus.

## Selles jätkamises tehtud parandused

1. Godot 3.3 lähtekood lahti pakitud, eraldi muudetavate failidena arendusharru.
2. Maailmakaardi marsruudikontrollis võimaldatud atlasetaseme läbitavuskontroll enne detailnavigeerimise laadimist. Kui detailkaart on seadistatud, jääb selle rangem kontroll kehtima.
3. Võrdse puudujäägiga kaubavoogude deterministlik prioritiseerimine: esmatarbe toit/vesi enne materjale.
4. Linnaplaneeringu ja kõrguskaardi aegunud test-fixture'ite parandamine.
5. Varem ainult CI-s `sed` abil parandatud GDScripti vead parandatud otse lähtefailis.
6. ETC2/ASTC Androidi eksport salvestatud käivitaja projekti.
7. APK käivitaja loeb nüüd `orogdor/Kuningriigid` `godot-dev-*` eelväljalaskeid, kontrollib `game.pck` SHA-256 ja salvestab uuenduse `user://ota`.

## Järgmise pordietapi prioriteedid

1. **Telefonitesti tulemused:** APK install, turvaline ühenduseta käivitus, Godot GL Compatibility, puutemenüüd ja PCK OTA kontroll.
2. **V153 veebimängu võrdlus V131 Godoti osapordiga:** kaart, linnade/maakondade laienemine, AI, ajastud, kaubandus, lahingsüsteem; koostada puuduva funktsionaalsuse pariteeditabel.
3. Porditud mängureeglite API-ga seotud pikk kampaaniatest, sh vähemalt 200 käiku ja salvestuse taastamine.
4. Püsiv Androidi allkirjastusvõti ametlike APK uuenduste jaoks; praegu on kasutusel test-APK.
5. Võimalusel omaette `Kuningriigid-Godot` hoidla; GitHubi liidesega eraldi repositooriumi loomine vajab veel lahendamist.

**NB!** V131 reeglitestide 646/646 edu ei tähenda, et veebimängu V153 oleks täielikult Godotisse porditud.
