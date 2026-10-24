# Kuningriigid → Godot 4: pordi seis (2026-10-24)

## V3.9 / alati nähtav versioon ja reaalajas uuenduse kontroll (2026-10-24)

- GitHub Actions kirjutab **iga PCK sisse reaalse koostu numbri** `game/data/build_info.json`: `godot-dev-<run_number>`, commit ja koostamise aja; sama mängupakett lisatakse uude Androidi APK-sse.
- APK käivitaja näitab paigaldatud versiooni ja viimast GitHubis kinnitatud versiooni. Uuenduse leidmisel jätkub senine SHA-256 kontrolliga PCK laadimine; võrguta kuvatakse **KONTROLLIMATA**, mitte tõendamata "uusim".
- Godoti mängu ülaribal on alati nähtav versioonitunnus, olek `UUSIM KONTROLLIMISE HETKEL`, `UUENDUS SAADAVAL` või `KONTROLLIMATA`. Mäng ise kontrollib versiooni GitHubist ka siis, kui Androidi käivitaja on vana, ning kontrollib uuesti iga 15 minuti järel.
- Uusim kontrollitud väljaanne: https://github.com/orogdor/Kuningriigid/releases/tag/godot-dev-74
- GitHub Actions CI: https://github.com/orogdor/Kuningriigid/actions/runs/40104187846
- **741/741** regressioonitesti; test APK/PCK eksporditud ja bootstrap-suitsutest kinnitab `BOOTSTRAP_PACK_VERSION: godot-dev-74`.

### Esimese mängitava kampaania eesmärk (enne kogu V153 porti)

1. **Uus mäng**: riigi valimine ning algse linna/üksuste ja piiride järjepidev salvestatav loomine.
2. **Ühtne majandus**: elamud, tööjõud, toidu/vee tarneahel, uued linnad, ehitus- ja avastamisjärjekorrad, tõelised kulud.
3. **Riiklik strateegiline AI**: mitme linna rajamine, kaubandus, tehnoloogia, kaitse ning rünnakuotsused ühe pideva mängu sees.
4. **Lahingu ja maailmakaardi sünkroniseerimine**: üksuste kaod, ressursid, linnade vallutamine ning kaitserajatiste kahjustused jäävad püsima.
5. **100–150 käigu kampaaniatest**: mäng algab kiviajast ja jõuab pronksiajani ilma eraldi demo käivitamata; salvestuse uuesti laadimine töötab, võidu/kaotuse tingimus on määratud.

Esimese mängitava versiooni kuupäev ei ole kinnitatud. Käesolev **47% kogu V153 pordi hinnang** ei ole võrdne 47% valmis kampaaniamänguga. Godoti mobiiliversiooni tegelik toimimine tuleb endiselt kasutaja seadmes üle kontrollida.

## V3.8 / ühine kaitseperimeeter ja linna vallutamine (2026-10-24)

- `city_fortification_port.gd` sisaldab deterministlikku `perimeter_edges` loogikat: iga kindlustatud linnaruudu neli külge võrreldakse naaberruutudega; ühisel sisepiiril ei teki tarbetut müüri.
- `exposed_corner` väldib kõrvutiste linnaruudu piiride sisemisi topelttorne. Üksiku ruudu neli välist nurgatorni säilivad.
- `native_detail_tile.gd` joonistab välispiiri müürid ja ainult tegelikud välised nurgatornid, kasutades kahjustustega salvestatud müürilõike.
- `siege_port_v131.gd` arvestab, millised välisseinad on valitud detailruudul olemas; sisemised tänavaühendused on avatud. Piiramislahingul on `city_home_c/r` tunnused, et kaitstud ruut võib olla ka linnasüdame naaberruut.
- `city_capture_port.gd` muudab pärast *päriselt lõpetatud ja linnaga seotud hõivamist* linna riiki; tavaline välilahing või isoleeritud näidislinnus ei saa riigipiire ümber tõsta. Ehitised, linnavaru ja kindlustused säilivad; eelmise omaniku treeningjärjekord tühjeneb, teadusajastu joondatakse uue riigiga.
- Vallutuse tulemus märgitakse `conquests`, `city_captures`, `captured_at` ning lahingulogisse. Vanad piiriallokatsioonid märgitakse aegunuks, et `Territory.rebuild` arvutaks uue riigi piirid.
- Lahingu lõpetamisel salvestatakse müürikahjustused just kaitsjariigi linna, mitte samade koordinaatidega juhuslikku teist katse-linna. Vallutus ei saa topelt arvestust.
- **GitHub Actionsi regressioonitestid: 724/724**, Godoti skriptide import, PCK-käivitus ja Android APK eksport: edukad.
- Kontrollitud CI: https://github.com/orogdor/Kuningriigid/actions/runs/40101999186
- Avaldatud APK/PCK: https://github.com/orogdor/Kuningriigid/releases/tag/godot-dev-69
- **Hinnanguline V153 Godoti pordi valmidus: 47%**, töömahu üldine hinnang, mitte automaatmõõtmine.

**Järgmised piirangud:** linnaruudud moodustavad ühise nähtava välisperimeetri, kuid tervel maksimaalselt 12×12 linnapiirkonnal ei ole veel ühist suurt 3D lahinguvälja. Linna vallutuse järel vajab tööjõu, kaubanduse, sõjagarnisoni ja UI värvide täielik kooskõlastamine täiendavat tööd. Android-telefoni tegelikku OTA uuendamist ei ole kaugelt kinnitatud.

## V3.7 / ehitatud linnamüürist päris piiramislahing (2026-10-24)

- `Siege.from_city(city,tile,attacker,defender)` loeb ainult **päriselt ehitatud ja makstud puitvalli** ning loob sellele vastavad V131 piiramislahingu sektsioonid: 4 nurgatorni, läänevärav, välismüürid, 420 HP puitmüüri lõigud, 500 HP värav ja 520 HP puitkaitsetornid.
- `IndividualBattle.start` tuvastab automaatselt linnakeskuse ruudul kaitsjariigile kuuluva kindlustatud linna, loob piiramislahingu ja paigutab kaitsjad müüride sisse. Tornide juurde lisatakse kuni 5 kaitsjat torni kohta, arvestades lahingu 500 mehe piirangut.
- Piiramislahing kasutab juba olemasolevaid kokkupõrke-, nooleliikumise, redeli-, rammi- ja katapuldikahjustuste reegleid. Suletud värav blokeerib, avatud värav lubab läbipääsu ega takista nooli.
- `CityFortifications.apply_siege_damage` talletab pärast lahingut iga müürilõigu ja värava HP linna `fortification.integrity` väljal, salvestades ka lahingu viimase tulemuse. Uus lahing ei taasta automaatselt katkisi müüre.
- Detailkaardil loetakse samade sektsioonide HP ja näidatakse murdunud lõike, nurgatornide purunemist ning avatud või purustatud väravat.
- Telefoni linnamenüü **Ava / sulge linnavärav** juhib linna püsivalt salvestatud väravaseisundit. Hävinud väravat ei saa remondita sulgeda.
- Telefoni varasem **Pronkslinna vallide demo** ja **Pronkslinna piiramine** on nüüd ühendatavad: kõigepealt ajutine ehitatud linnavall, seejärel lahing.
- CI tulemused: **699/699** Godoti regressioonitesti, parser, bootstrap PCK smoke-test ja Androidi debug APK edukad.
- Valideeritud GitHub Actions: https://github.com/orogdor/Kuningriigid/actions/runs/40100370121
- Avaldatud APK/PCK: https://github.com/orogdor/Kuningriigid/releases/tag/godot-dev-62
- Hinnanguline V153 kogupordi valmidus: **44%** (subjektiivne funktsionaalsuse ja töömahu hinnang).

**Järgmised piirangud:** see on linna *keskruudu* lahingumudel, mitte veel kõigi 12×12 linnaruudu ümber ühtse vallipiiri piiramine. Linna omaniku muutmine pärast vallutamist ja garnisoni täielik rahuaegne simulatsioon ei ole veel seotud. Valli mobiili 3D-jõudlust ja OTA-paigaldust ei ole pärisseadmel eraldi kontrollitud.

## V3.6 / AI linnaplaneering ja pronkslinna puitvallid (2026-10-24)

- `city_planning_port.gd`: deterministlik ajaloolisest V135 planeeringust inspireeritud linnakruntide paigutus. Eraldi tsiviilkeskus, elamukrundid, maa-tootmine, tööstus ja sõjaväehooned. Kõik varasemad maastiku, hoone mõõtude ja kattumise piirangud kehtivad edasi.
- `CityPlanning.housing_target` eemaldab AI senise viie elamu piiri. Vajalik arv sõltub elanikest ja hoonete mahutavusest; ühtki maja ei looda ilma tegeliku ehituskulu ja ehitusprotsessita.
- `city_fortification_port.gd`: pronksiajal ja vähemalt 14 elanikuga linnas saab arendatud linnaruudu piirata puitvalliga. Esimese ruudu hind 65 puitu + 20 kivi, järgneva arendatud ruudu hind 35 puitu + 12 kivi. Ressursid arvatakse maha, vallide asukohad salvestatakse; topeltehitamise eest uuesti ei maksta.
- `native_detail_tile.gd`: ehitatud piirderuudul kuvatakse puitvallid, kesksed väravaavad ja nurgatornid. Ühise müüriga külg külgneva kindlustatud ruudu vahel jäetakse vabaks.
- `preview_ai_port.gd` võib sobiva vanuse, rahvaarvu, varude ja põhivajaduste puhul valliruute ehitada. See on Godoti *preview AI*, mitte veel V153 tegelik strateegiline linnaplaneerija.
- Telefoni menüüs **Linn ja ehitus → Ehita puitvall (pronks)**. **Testid → Pronkslinna vallide demo** näitab valli ajutises pronksilinnas ning **Taasta vallide demo** tagastab algse oleku; testimise ajal ei saa ajutist seisu salvestada.
- Godot 4 skriptikompileerimine, `681/681` regressioonitesti, PCK smoke-testi ja Androidi debug APK eksport on GitHub Actionsis läbitud.
- Tõend: https://github.com/orogdor/Kuningriigid/actions/runs/40097084516
- Avaldatud APK/PCK: https://github.com/orogdor/Kuningriigid/releases/tag/godot-dev-54
- **Kogu V153 pordi töömahu hinnanguline valmidus: 41%** (subjektiivne töömahu hinnang, mitte automaatmõõtmine).

**Lahendamata:** puitvallidel puuduvad veel toimivad lahingukokkupõrked, purustatavus ja päriselt avatavad väravad. Hoonete paigutus on ajaloolisest linnamorfoloogiast inspireeritud lähendus, mitte veebiversiooni kõigi era/maardla/ajaloolise planeeringu reeglite täielik port. Telefoni tegelik OTA-uuendus ja jõudlus tuleb kontrollida seadmes.

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
- Viimane kontrollitud CI: https://github.com/orogdor/Kuningriigid/actions/runs/40104187846
- Viimane avaldatud APK/PCK: https://github.com/orogdor/Kuningriigid/releases/tag/godot-dev-74
- Väljalasked luuakse `godot-dev-<workflow run number>` märgendiga *prerelease* ainult siis, kui regressioonitestid läbivad kontrolli.

## Kontrollitud (Godot 4.7.2 CI konteiner)

- Pythoni staatilised testid ja GDScripti impordikontroll läbitud.
- `V131_REGRESSION: 741/741` läbitud 2026-10-24.
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
