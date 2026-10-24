# Kuningriigid → Godot 4: pordi seis (2026-10-24)

## V3.5 / mitme detailruuduga linn (2026-10-24)

- Hooneid paigutatakse esmalt olemasolevasse linnasüdame detailruutu; kui seal pole ruumi, otsib linn järgmise sobiva vaba krundi enda `territory_urban` ruutudelt.
- Salvestatud `site_x/site_z` väljad säilivad. `CityLayout.site_tile`, `site_in_tile` ja `site_on_atlas` teisendavad samu krundiasukohti maailma- ja detailkaardil.
- `native_detail_tile.gd` kuvab linnahooned nüüd ka linnasüdamest väljapoole jääval linnaruudul; tootmis- ja maakonnahoonete pildikiht säilib.
- `native_city_buildings.gd` kasutab sama kaardiprojektsiooni.
- `district_street_nav.gd` loob ruudupõhised AStarGrid2D tänavakaardid ja ühendab need omavahel tänavaportaalide kaudu. Selle kaudu saavad `local_street_nav.gd` töötajad ja veosed liikuda ka naaberruudu majani.
- Uutes linnaruuduosades joonistatakse kaks peateed; jõest blokeeritud lõik jäetakse sillata katmata.
- Regressioonitestid: `666/666`; Godoti skriptide import, PCK smoke-käivitus ja Androidi debug APK eksport õnnestusid GitHub Actionsis.
- Kinnitatud väljalase: https://github.com/orogdor/Kuningriigid/releases/tag/godot-dev-45
- **Kogupordi hinnanguline valmidus: ligikaudu 38%**, võrreldes veebimängu V153 kõigi süsteemidega. Tegemist on projekti ulatuse hinnanguga, mitte automaatse mõõdikuga.

**Piirangud:** Mitme ruuduga linna mudel on praegu funktsionaalne osaport. Ajalooliselt täpne krunditüüpide tsoonide planeerimine, terviklik tänavavõrgustiku kujunemine kasutusest, mitme ruudu linnamüürid ja V153 täis-AI vajavad edasist portimist. Telefonis automaatse `.pck` uuendamise toimimine ja jõudlus on jätkuvalt kasutajapoolse testi ootel.

## V3.4 / V153 linnapiirkond (2026-10-24)

- V153 `city-area-v142.js` mudeli järgi kasvab linnapiirkonna raadius rahvaarvu ruutjuurega: 3 elanikku → 3×3; 9 → 7×7; 16 → 9×9; 25 → 11×11; 36+ → maksimaalselt 12×12.
- Linnapiirkonna tegelik bounding box ei tohi ületada rahvaarvu järgi lubatud külgede pikkust isegi nihkunud või vaidlustatud maakonna korral.
- Maakonna täiendavad ruudud leitakse mööda maismaad. Otsing võib liikuda läbi naaberriigi maad, kuid ei võta juba omatud ruute üle ega ületa vett.
- Linnasüda säilib ka siis, kui suurem naaberlinn ümbruskonna hõivab.
- Mobiilimenüü Testid sisaldab `Piiride demo: 36 elanikku (12×12)` valikut.
- GitHubi automaattest: `657/657`, GDScripti import ja PCK smoke test OK; Androidi APK ja PCK avaldatud.
- Avaldatud väljalase: https://github.com/orogdor/Kuningriigid/releases/tag/godot-dev-34
- Selle tööetapi lõpus on **kogupordi hinnanguline valmidus umbes 35%**, arvestades veebiversiooni V153 kogu mänguloogikat, mitte ainult projekti kompileeritavust. See hinnang ei ole automaatselt mõõdetud töömahu protsent.

**Oluline piirang:** V153 linnapiirkonna loogika on osaliselt porditud. Linna hoonete täielik ruutudevaheline paigutamine ning uus AI linnaplaneering ei ole veel üks-ühele üle kantud. Telefonis toimivat OTA uuenduse läbiviimist ei ole siin seadmes kontrollitud.

## Lähtekood ja ehitamine

- Godoti aktiivne arendusharu: `godot-port-development`.
- Godoti mänguprojekt: `game/` (Godot 4); Androidi APK ja PCK-käivitaja: `bootstrap/`.
- Varasemad `godot-upload/v33/*.txt` osad jäävad arhiiviks, kuid uus CI ehitab **päris, muudetavatest failidest**.
- Androidi CI: `.github/workflows/godot-apk-test.yml`.
- Viimane kontrollitud CI: https://github.com/orogdor/Kuningriigid/actions/runs/40095058141
- Viimane avaldatud APK/PCK: https://github.com/orogdor/Kuningriigid/releases/tag/godot-dev-45
- Väljalasked luuakse `godot-dev-<workflow run number>` märgendiga *prerelease* ainult siis, kui regressioonitestid läbivad kontrolli.

## Kontrollitud (Godot 4.7.2 CI konteiner)

- Pythoni staatilised testid ja GDScripti impordikontroll läbitud.
- `V131_REGRESSION: 666/666` läbitud 2026-10-24.
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
