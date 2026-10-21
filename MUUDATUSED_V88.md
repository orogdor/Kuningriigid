# V88: rannajoon, maardlad ja riigi ressursid

Lähtekoht: puhas avalik V87, commit `3cb646b`. Varasemaid ebaõnnestunud tasakaalustamisharusid ei kasutata.

## Mängureeglid

- Kalameheonni ja sadama uus koht peab ületama tegeliku mereranna joone. Hoone maaosa, kuiv sissepääs ja mere kohal olev kai kontrollitakse eraldi. Jõekallas, sisemaa ja avameri ei sobi. Hoone pöördub automaatselt maa ja mere järgi; eelvaade kasutab sama kohta ja pööret kui ehitatud mudel.
- Rannahoone võib ulatuda rannaruudu kõrval olevasse merre. Tööliste liikumine arvestab ranniku tegelikku kuiva pinda ja maapoolset sissepääsu.
- Igal detailkaardil on iga seal leiduva mineraali kohta üks maardlakoht: kivi, rauamaak, vask, tina, savi, vääriskivid ja nafta. Kaevandus tuleb paigutada selle peale. Ühele maardlale saab rajada ühe uue kaevanduse.
- Maardlast päriselt võetud kogus väheneb. Materjal jõuab linna lattu kandja abil; maardla, veose ja lao kogused on kontrollitud. Vana salvestuse laiali paiknenud sama liiki kivide allesjäänud kogused liidetakse, mitte ei taastata algvaru.
- Varaste ajastute metallikaevandused on lahtised kaevamiskohad. Alates keskajast kasutatakse šahtiava, tõsteraami, vintsi, rööpaid ja vagonetti; tööstuslikus variandis lisanduvad masinad. Kivi ja savi jäävad ajalooliselt sobivalt pinnakarjäärideks.
- AI kontrollib puuduvaid ressursse kogu riigi linnades ja nende piirkondades. Uue linna asukohta eelistatakse selle järgi, milline uus ressurss riigile lisandub. Rauamaaki otsitakse juba pronksiajal ja naftat tööstusajal. Asunik vajab päris ressursse ning läbitavat teed; linnade vaheline tee peab sobima ka olemasoleva kaupmehesüsteemi ulatusega.
- Uus linn saab ressursispetsialiseerumise ning olemasolevad linnad selle tooraine impordivajaduse. Vask- ja tinakaevandus vajavad kohalikku algusmaja, mitte kohalikku kivimurdu: ehituskivi saab teisest linnast tuua. Kaubad liiguvad olemasolevate päris kaupmeeste kaudu.
- Avastused ja tootmisboonused loetakse riigi uurimisolekust. Sama avastus avab võimaluse kõigis olemasolevates ja hiljem asutatud sama riigi linnades. Menüüs on riigiülene mõju selgelt kirjas.

## V87 pealt alustatud tasakaalutöö

AI uurib pronksitööd kohe varase põhivarustuse järel. Peamaja juurest otsitava ehitaja alguspunkti raadiust suurendati 4-lt 9-le; kitsas otsing põhjustas muidu kasutatavate ehituskohtade tagasilükkamist.

## Kontrollid

- `TEST_V88_SITES.mjs`: kindlad maardlakohad, vale koha ja topeltkaevanduse keeld, kivi ja rauamaagi füüsiline tootmine, varude säilimine salvestamisel, rannahoone tegelik maa/meresuund ning töömeeste ligipääs, kõigi ajastute rannamudelid, varane ja hiline kaevandus, AI asuniku tegelik sihtruut, riigi piirkondade ressursid, rauamaagi kaupmehega kohaletoimetamine ning riigiülene uurimine.
- `TEST_V64.mjs`: kalavarud, rannapaigutus, päris saak ja kõikide ajastute püügikaugused kolmel seemnel. Varasem sisemaa ehituskoha eeldus asendati uue rannareegliga.
- `TEST_V87.mjs` ja `TEST_V86.mjs`: majandus, kaubandus, salvestused, vajadused ja tööjõud.
- `TEST_V88_BALANCE.mjs`: varasema V88 muudatuse ajalooline 36 minuti pronksiaja kontroll. Uute lisauurimuste järel asendab seda all kirjeldatud 100 käigu reegliga katse; vana kontrolli enam CI-s ei käivitata.
- `TEST_V88_UI.mjs`: eraldi visuaalne teststseen rannamudelite ning pronksiaja ja keskaja kaevanduste vaatamiseks arvuti- ja telefonivaates. See teststseen annab kontrolliks tehnoloogiaid ja materjale juurde ega tõenda kampaania edenemist.

Mudelite geomeetria vaadati kohalikult üle. Kohalikus keskkonnas puudub Chromium ja selle allalaadimine tagastas sobimatu faili; pilvebrauser ei pääse kohalikule testiserverile. Päris WebGL-i kuvatõmmiste kontroll on seetõttu eraldi GitHub Actionsi töös, mitte kohalikult kinnitatud.

## V88 toidu- ja kaevandustehnoloogiad

Igas seitsmes ajastus lisandub kaks toidu ja kaks kaevandamise tehnoloogiat: kokku 28. Iga uurimus maksab 20 teaduspunkti tavakiirusel ja annab vastavale tööle +25 protsendipunkti kiirust. Boonused liituvad, näiteks kaks sama sihtmärgiga uurimust annavad kordaja 1,50. Mõju rakendub riigi kõigis olemasolevates ja uutes linnades ning piirkondades. Uue ajastu uurimused eeldavad selle ajastu avamist.

Põllutehnoloogiad parandavad viljapõlde; püünised parandavad jahimehi ja kalamehi. Luhaniidud aitavad põlde ja karjamaid. Moodne automatiseerimine aitab põlde, jahimehi, kalamehi, karjamaid, veskeid ning pagaritöökodasid. Maavarade tööriistad mõjutavad kivimurdu, raua-, vase-, tina- ja vääriskivikaevandust, savivõtukohta, naftapuurauku ning käsitsi kivi kogumist. Need ei suurenda maardla varu ega muuda retsepti sisendeid, teaduse või ehitamise kiirust.

| Ajastu | Toit (2) | Kaevandamine (2) |
|---|---|---|
| Kiviaeg | Tulekivisirbid; püünised ja kalavõrgud | Sarvkirkad; kivikiilud |
| Pronksiaeg | Kanalniisutus; sõnnikuga väetamine | Pronkspeitlid; maagi tõstekorvid |
| Rauaaeg | Rauast adratera; raudvikatid | Raudkirkad; kuivenduskäigud |
| Keskaeg | Raske hõlmader; kolmeväljasüsteem | Hobujõul vints; šahtide toestus |
| Renessanss | Niisutatavad luhaniidud; süstemaatiline seemnevalik | Vesirattaga pumbad; mehhaniseeritud tõstukid |
| Tööstusajastu | Mehaaniline viljalõikaja; mineraalväetised | Suruõhupuurid; dünamiit |
| Moodne ajastu | Täppisviljelus ja tilkniisutus; toidutootmise automatiseerimine | Kaevanduskombainid; andurjuhtimine |

Ajastud kirjeldavad meetodite kasutuselevõttu mängus, mitte nende esmaavastamise täpset aastat. Niisutamist ja väetamist tunti enne pronksiaega; mängus on need pronksiaja korraldatud põllumajanduse täiustused. Samuti ei tähenda keskaja šahtitoestus väidet, et eelajaloolisi maa-aluseid kaevandusi ei olnud.

Ajaloolised võrdluskohad: [English Heritage: neoliitilised kaevandused ja sarvkirkad](https://www.english-heritage.org.uk/visit/places/grimes-graves-prehistoric-flint-mine/history/), [Deutsches Museum: kaevandamine ja 16. sajandi pumbad](https://www.deutsches-museum.de/en/museum-island/exhibitions/mine/mining-themes), [Science Museum: põllumajanduse ajalugu](https://www.sciencemuseum.org.uk/objects-and-stories/ecology-and-food-history-and-future-agriculture).

AI eelistab oma ajastus juba avatud eeldustega tootlikkusuurimusi; need ei muutu ajastuvahetuse uuteks kohustuslikeks eeldusteks.

### Kontroll

- `TEST_V88_PRODUCTIVITY.mjs`: igas ajastus täpselt 2 + 2 tehnoloogiat, ajastueeldused, boonuse tegelik rakendumine kahe linna tootmiskeskkonnas, teise riigi eraldatus ja liituvad kordajad.
- `TEST_V88_TO_MEDIEVAL.mjs`: üks deterministlik kampaania seemnega 8417. Kõik neli riiki on AI juhtimisel sama planeerimissammuga. Mõõdetakse iga riigi aega igas ajastus eraldi. Katse lõpeb esimese 100 käigu pikkuse edenemispeetuse korral või kõigi keskaega jõudmisel. Keskaega jõudnud riikide teadus pannakse ootele. Materjale, elanikke ega teadust ei kingita.
- Katse tulemus ja peatamise diagnostika: `V88_KESKAJA_TEST.md` ning `V88_KESKAJA_TEST.json`.

Katse tegelik tulemus: peatus käigul 133,317 riigi 2 pronksiaja 100 käigu piiri tõttu. Rauatöö teadus oli valmis; puudusid 88 lauda, 38 kivi ja 1,85 toiduühikut. Riigid 1 ja 4 olid rauaajas, riik 3 veel pronksiajas. Keskaega ei jõutud; katset ei jätkatud ega korratud.

## Ajastuvahetuse poole odavam hind (V88b)

Kõigi kuue ajastuvahetuse materjalikulu vähendati täpselt poole võrra. Teaduse hind, tootmiskiirus ja AI valikud jäid selle muudatuse käigus samaks. Murdarvud (17,5 ja 12,5) säilitatakse; materjalikulu tasutakse endiselt tervikuna ning riigi peale kokku.

| Uus ajastu | Materjalikulu |
|---|---|
| Pronksiaeg | 45 puitu, 35 kivi, 17,5 toiduühikut |
| Rauaaeg | 50 lauda, 50 kivi, 30 toiduühikut |
| Keskaeg | 20 rauda, 75 lauda, 50 toiduühikut |
| Renessanss | 35 rauda, 85 lauda |
| Tööstusajastu | 50 rauda, 95 lauda, 12,5 püssirohtu |
| Moodne ajastu | 35 terast, 17,5 masinat |

`TEST_V88_ERA_COST.mjs` kontrollib kõigi hindade täpset poolitamist, murdarvudega maksmist ja ebaõnnestunud makse terviklikkust. `TEST_V88_CAMPAIGN_LOG.mjs` kontrollib, et kaubaveo logi eristaks 5% peatumistasu tegelikult kohale toimetatud kaubast ka siis, kui veos samal sammul eemaldatakse.

Uue, sama seemnega katse raport: `V88_POOLHIND_TEST.md`. Täpne sündmuslogi ja lõppseis: `V88_POOLHIND_TEST.json`; iga käigu täielikum olekulogi: `V88_POOLHIND_TEST.jsonl.gz`. 100 käigu peatumisreegel ja keskaja eesmärk säilivad. Eelmine aruanne `V88_KESKAJA_TEST.md` säilib võrdluseks.

Uus katse lõppes käigul 137,15: riik 3 veetis pronksiajas 100 käiku ja jäi 50 laua puudumise taha. Kolm ülejäänud riiki jõudsid rauaaega, keskaega ei jõudnud ükski. Täpne logi tuvastas vähemalt 65. käigust seisva, 12 puitu kandva puuraiuja tagasitee tõrke ja saekoja puudumise. Katse peatati ja seda ei korratud; tootmis- ega liikumisloogikat pärast katset ei muudetud.

## V88c: avastaja jõnksumine ja AI põhiehitus

- Avastaja nähtavuse muutus uuendab ainult muutunud ruutude maastikuvärve. Esialgsed maastikuvärvid salvestatakse üks kord; iga sammu järel ei arvutata enam terve kaardi sadu tuhandeid värve uuesti. Udukatte ja kaardivisandite geomeetria püsib sama; muutuvad üksikute ruutude indeksid ja nähtavus. Maailma dekoratsioonide maatrikseid muudetakse ainult nähtavuse tegelikul muutumisel.
- AI põhikava: kaev, metsamaja, sobiv toiduallikas, kohalik kivimurd, esimene elamu, avatud puusepatöökoda/saekaatriks nimetatud lauatootja ning õpikoda. Rauaajal lisandub raua tootmisahel vastavalt toorainele ja tehnoloogiale. Elupäästev lisatoit ja vesi on endiselt kõige tähtsamad.
- Puusepatöö uuritakse varakult pärast pronksitööd. Esimese saekoja ja teiste puuduvate põhiehitiste jaoks hoitakse materjale; kõrvalharu või kaitseehitis ei või seda varu ära kulutada. Saekoja puiduvajadus arvestab nüüd ka metsamaja.
- Põhiehitised saavad AI tööjõu ja ehitajate järjekorras eelise. Valmis kõrvalehitised saavad ainult ülejäänud tööjõudu, täis laoga tootmishooned ei hõiva töölisi. AI saab vältimatu peatatud tootmise uuesti käivitada.
- Paigutuskontroll kasutab ehitiste tegelikke liikumistakistuse mõõtmeid, jätab majade vahele läbipääsu ning kaitseb olemasolevaid sissepääse ja kandjate tagasiteed. Vanas salvestuses kaetud välisuksega hoone saab ligipääsetava välimise teenindussissepääsu. Töölisi ja nende kandamit ei telepordita.
- `TEST_V88_RECOVERY.mjs` taastab eelmise testi kinni jäänud 12 puitu kandva puuraiuja, kontrollib tema päriselt kõndides tagasijõudmist ning kontrollib kõigi nelja riigi saekoja prioriteeti, materjalivaru, tööjõudu ja avastaja tegelikku liikumist.
- `TEST_V88_EXPLORATION_UI.mjs` kontrollib arvuti- ja telefonivaates 40 tegelikku avastaja liikumissammu, püsivaid udugeomeetriaid, muudetud ruutude arvu, veateateid ja nähtavuse uuendamise ajakulu.

### Kaevandaja toidukulu kontroll (V88d)

Pikema kontrolli käigus leiti, et tööjõujaotus nõudis kaevandajale sõna-sõnalt leiba, kuigi majanduse maksmisreegel lubab toidukulu katta teiste toitudega. Tööjõujaotus kasutab nüüd sama `canAfford` reeglit nagu päris tootmine: muu toit saab kaevandajat toita ja tootmisel võetakse see ka laost maha. Täis lao tõttu tööjõuta tootja näitab olekus lao täitumist. Taastamiskontroll katab nii töötajate määramise kui toidu tegeliku kulumise ja maagi saabumise.

Kampaania `V88_PARANDUSED_TEST` käivitati enne seda viimast toidukulu parandust. Kõigil 17 linnal oli katse lõpus valmis saekoda; kõik riigid jõudsid rauaaega ning kolm keskaega. Riik 3 täitis rauaajas 100 käigu piiri ja test peatus käigul 189,6583, puudu 20 rauda. See paljastaski toidukulu kontrolli vea. Viimane parandus läbis eraldi taastamis- ja majanduskontrollid; kampaaniat pärast stoppi uuesti ei käivitatud.
