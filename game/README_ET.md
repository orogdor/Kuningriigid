# Kuningriigid V131 — Godot 3.3 (kampaania taganemine)

Godot 4 projekti avamiseks kasuta juurkausta `project.godot`. See on osaline
port, mitte V131 valmismäng ega kontrollitud Androidi APK.

## 3.3 uuendused

- Sõdurite lahingust põgenemine säilitab nende allesjäänud HP ja armeesse
  kuuluvuse. Kampaania taganemine käivitub ainult lahingu lõpus.
- Kaotava või täielikult põgeneva armee jaoks valitakse lähim saavutatav
  ohutu maailmaruut. Marsruut leitakse piiratud 4-ruudulise BFS-ga (ühine
  läbitavus maailmakaardiga). Eelistatakse lahingust lahkumise suunda ning
  sõbralikku linna, välditakse elus vaenlaste armee- ja linnaruute.
- Kui tee puudub, ei tõsteta armeed läbi vee või mäe. Armee jääb oma ruudule
  ja 30 s vältel ei saa seda kohe uude automaatlahingusse tirida.
- Ülemineku ja viivituse olek salvestatakse olemasolevasse JSON salvestusse:
  `retreat_until`, `retreat_from`, `retreat_to`, `last_campaign_retreats`.
- Menüüs Testid → **Taganemine maailmakaardile: info** kuvatakse viimast
  lahingujärgset üleminekut.
- Pika 20 s CSV testi fail: `user://v131_godot_measurements_v33.csv`.
  Lisatud kaks statistikat: kampaaniataganemisi ja kinni jäänud armeesid.
- 647 GDScripti testväidet on ette valmistatud (23 uut).

## Piirangud

3.3 maailmakaardile taandumine järgib V131 `battlefield-v88.js` ideed, kuid
pole bititäpne koopia: määratakse kindel lähim turvaline ruut, mitte täielik
strateegiline AI. Maailmakaardi tõhusad valikud ei ole veel seotud diplomaatia,
territooriumi vallutamise ega kõigi mereväe juhtudega. Godoti mootori ja Androidi
tegelik käivitustest puudub; staatilised kontrollid ei ole samaväärsed
GDScripti kompileerimisega.

Käivita sõltumatud lähtekoodi kontrollid (mitte Godoti testid):
`python tools/run_qa_checks.py`

# Kuningriigid V131 → Godot 4 port 3.1 — formeeringud ja taktika

**Uus 3.1:** 120 sõduri taktikademo ning 500 sõduri 3×3 lahinguväli koos nelja ratsasalgaga. Salguautomaatika: kilbirivi, odarivi, hajurivi, vibuküttide taganemine ja ratsaväe ümberhaaramise siht. Tegevusmenüüs Armee → Rivistus / Automaatne rivistus / Lahingu taktika info.

**Kontroll:** `python tools/run_qa_checks.py` (staatilised ja sõltumatud arvutustestid). Godoti runtime ja Androidi käivitumine **ei ole testitud**. Üksikasjad: `docs/PORT_V31_SCOPE.md`.

---

# Kuningriigid V131 → Godot 4 port 2.9 (osaline)

**Uus:** 9×9 kõrgusproovidega reljeefne lahingukatse ja kuni 192 sõdurit, maastiku- ja sillarajaleidmine, mägede ning veetõkete kontroll, lihtne kõrgusest sõltuv liikumiskiirus ja tule nähtavuskontroll.

Telefonis: `MENÜÜ → Testid → Maastikulahing: 192 meest`. See avab valitud kuiva maailmaruudu, vee korral lähima olemasoleva katse-linna ruudu. 20s jõudlustest lisab CSV-sse maastikumarsruutide arvu ja blokeeritud sammud.

Paki ZIP eraldi kausta ja ava Godotis `project.godot`. Ära kirjuta eelmist versiooni üle.

Staatilised Python QA kontrollid ei kinnita Godoti parserit ega mobiilifunktsionaalsust. Uus lahingumaastik on osaline, piiramistest säilib eraldi tasase areenina.

Täpsem tööde ulatus: `docs/PORT_V29_SCOPE.md`.

# Kuningriigid – Godot 4 port 2.8 (osaline V131)

**Uus:** V131 9×9 detailmaastiku kõrgusproovid, ühine 3D- ja A*-kõrgus, vee/kalju/nõlva kontroll ehitamisel (mängija ja AI), linnatöötajate kohalikul rajaleidmisel. Vaata `docs/PORT_V28_SCOPE.md`.

**Test telefonis:** `MENÜÜ → Testid → 9x9 kõrguskaart: info`; ava mõni detailruut ja seejärel `Linn ja ehitus`. Regressioonid menüüs **Reeglitest**.

**Mitte valmis mäng:** V131 originaali üks-ühele ülekanne on endiselt osaline; parserit, reeglitestide tegelikku läbimist ja Androidi eksporti siin ei kontrollitud.

---

# Kuningriigid V131 → Godot 4 port 2.7 (osaline)

Paki ZIP **uude kausta**, ava `project.godot` Godot 4.2+ keskkonnas ja käivita. Tegemist on jätkuvalt **osaportimise ja teststseenidega**, mitte V131 valmis 1:1 mänguga.

## Uued süsteemid

- V131 `earthHeight`, seemnega `131` küpsetatud **36 300 maailmaruudu kõrgust**, originaalsete äravoolureeglite järgi **601 jõeruutu** ning **32 looduslikku ületuskohta**.
- Sama jõesegment maailmakaardil, detailkaardi 3D-s ja A*-rajaleidmise veetõkkena; teed on joonistatud V131 kanoonilise kõveruse järgi.
- Jõgede ja mägede taha ei tohi maismaakaravan otse läbi sõita. Ehitada saab 30 puidu ja 10 kivi eest **maanteesilla**, kui lähedal on kasutatud tee ja oma linn.
- Suletud sillast sõltuv kaubaveos jääb ootele või otsib uue marsruudi. Sillad salvestuvad ja taastuvad.
- Jõudlusraport `user://v131_godot_measurements_v27.csv` lisab atlase laadimisaja ja jõe/ületuskohtade mõõdikud.

**Telefonitest:** `MENÜÜ → Testid → Ühise atlase jõgi` (detailkaart), `Atlase sild: ava / sulge` (eraldi demotoiming), seejärel `MAAILM`. Ehituskatseks vali jõeruut ja `Linn ja ehitus → Ehita maanteesild (30 puit + 10 kivi)`; vaja on ka tee olemasolu ja materjale. `Reeglitest` käivitub ainult käsul. Võrdle FPS-i ja 20 sekundi koormusmõõtmise CSV-d versiooniga 2.6.

**Hoiatus:** algne 2.6 sünteetiline atlas on asendatud V131 algoritmist küpsetatud fikseeritud Maa-tüüpi kaardiga. 14 kunstliku katselinna asukohad on maismaana kaitstud. Kõik originaalsed maailmaseemned, mandrite tüübid ja detailkaardi 9×9 lähtekõrgused ei ole veel üle kantud. Täpne piirangute ning testide kirjeldus: `docs/PORT_V27_SCOPE.md`.

**Godot/Android käivitust pole siin kontrollitud.** Staatilised kontrollid: `python tools/run_qa_checks.py`. Androidi APK eksportimisel veendu, et ka `data/*.bin` liiguks ekspordipaketti; vajadusel lisa ekspordifiltrisse `*.bin`.


## V3.0 3x3 maastikulahing (OSALINE)

- Testid -> "Suur lahinguväli 3x3: 500 meest". Avamiseks peab valitud maailmaruut olema kaardi sisemuses ja kuiv.
- Üheksa detailruutu: 675 x 585 mänguühikut; iga ruut sisaldab 9x9 kõrgusproove.
- 500 katsevõitlejat, 250 kummalgi poolel (240 jalaväelast + 10 avastajat). Godoti MultiMesh vaade on suure lahinguvälja mõõtkavas eraldi.
- Jõgesid ja sildu kontrollitakse kõigil üheksal ruudul. Punane joon näitab taganemispiiri; välimise 5x5 vööndi täielik maastik/render ja sõdurite taganemise maailmakaardi lõppsiht on veel tegemata.
- Korraga kuni kaks suure lahingu BFS-teekonnaotsingut simuleerimissammul; lihtsustatud kokkupõrked ja AI. Kõiki V131 formeeringuid ei ole veel üle toodud.
- 2.9 väike maastikulahing ja vanad linnapiiramise demod jäävad alles.
- Pakett ei ole Androidis käivitatud. Godoti kompilaatori vigade puudumist EI OLE veel kinnitatud.


### V3.2 – moraal, väsimus ja takistusi arvestav taganemine
MENÜÜ → Testid → **Moraali ja taganemise katse** käivitab 120-mehelise demonstratsiooni. MENÜÜ → Armee → **Lahingu moraali info** näitab keskmist moraali, väsimust ja taganemisotsi.
