# Kuningriigid V174 — etapp 3.2c: teedeäärsed elamud ja väiksed õued

26. oktoober 2026.

## Tehtud

- `streetfront-v174.js`: uus puhas/deterministlik krundiskoor, mis eelistab olemasolevaid päriselt sissekäidud radu umbes **7–13 meetri** kaugusel. Kasutab 12-meetriseid ruumilisi lahtrid, et sadu rajarakke ei kulutaks AI mõtlemisele liigselt aega.
- `historic-urban-v138.js`: kiviaja elamute järjestuses lisandus mõõdukas eelistus päris tänavaäärsele majakrundile ning 2–3 majaga väikesele ühisele õueruumile. Ükski eelistus ei tühista V173 hoonete ja käiguradade kattumiskontrolli ega navigeerimist. Kivimurrud, mets ja põllud säilitavad senise paiknemisloogika.
- `town-models-v154.js`: kõigile 12 kiviaegse maja variandile väikesed õueelemendid — madalad vitstarad, aiamaad, korvid/kastid, puuriidad ja tööpinnad. Jäävad olemasoleva maja mudelialasse. Tänavapoolne sissepääs **ei saa ette tara**. Mudelite uuesti koostamine toimub ainult ühe korra variandi kohta ja kasutab senist ühte ühitatud värvigeomeetriat.
- V174 brauseri cache-bust: `civilization-core.js`, `historic-urban-v138.js`, `farm-visuals-v127.js`, `town-models-v154.js`, `detail-roads.js` ja `index.html` võtavad uue versiooni korrektsema tulemuse kuvamiseks.
- Kiviaja lõpu AI testsalvestus V4 skeemis; vana tavaline autosalvestus jääb testmängu avades alles.

### Automaatsed teed jäävad alles

`navigation.js`, `town-streets-v80.js`, `roads.js`: **ei muudeta nende liiklusest tulenevat teeloomise, tugevdamise, kiirusboonuse ega kulumise loogikat**. Uus `streetfront-v174.js` loeb ainult eelnevast päris liiklusest tekkinud V4 `heat` andmeid ja soovitab ohutuid ehituskohti. Ei tekita ette valmistatud teekatet, ei kirjuta salvestuse liiklust üle ega suru majasid olemasolevasse rada.

## Päris AI simulatsioon

Seeme **142023**, `scripts/make-ai-stone-v174.mjs`:
- Ülevõetav küla **Sogn**, kiviaja **107. käigu lõpp** (ekraani nurgas käik 108).
- AI jõudis oma mänguga pronksiaega **108. käigul**, kuid mängija alustab kiviajas pausil ja valib ise jätkamise.
- **11 elanikku, 11 elumaja, 42/42 valmis ehitist**.
- **20/20 valmis puitkaitserajatist**.
- Keskmine elamu kaugus peamajast **35,62 m** (V173 sama küla sama 107. käigu seisus oli 34,88 m; uue tänavaserva ja õueskoori tõttu veidi hõredam, kuid jätkuvalt kompaktsem kui V171 41,47 m).
- V174 mänguseisus **172 nähtavat, läbitavat liiklusest tekkinud detailteerakku** ja **22 maailmakaardi kasutatud teeühendust**.
- `scenarios/ai-stone-v174.manifest.json`: väljaande number **174**, V4 salvestus muutmata.

## GitHub Actions kontrollid

- [V174 tänavaäärse krundivaliku, õuede ja teede regressioon #40314787235](https://github.com/orogdor/Kuningriigid/actions/runs/40314787235) — **PASS**.
- `TEST_V174_STREETFRONT.mjs`: **PASS**, aktiivne õue- ja teedeäärne paigutus, asulate determinism, hooneümbruse piirid, salvestuse teeandmete muutmatus; 172 aktiivset teerakku ja 22 maailmaühendust päris V174 näites.
- `TEST_V173_STREETS.mjs`: **PASS**, detailteed tekivad päris jalakäijatest, kuluvad ära ja ei peitu hoonete alla.
- `TEST_V59.mjs`: **PASS**, maailmakaardi ja detailkaardi teede loomise reeglid, kasutusest tingitud kiirusboonus ja kulumine.
- `TEST_V80.mjs`: **PASS**, teeribade ja olemasolevate hoonete kokkupõrgete kontroll 1203 liiklusrakuga pronksiaja stseenis.
- `TEST_V154.mjs --node-only`: **PASS**, 551 3D-mudelit, 66 hoonetüüpi, 12 kiviaegset elamuvarianti, geomeetria piirid.
- `TEST_V172_LAYOUT.mjs`, `TEST_V168_RING_CORRIDOR.mjs`, `TEST_V169_FOUNDING.mjs`, `TEST_V73.mjs`: **PASS** (linnad, aiakaitsed, linnakoha valik, vanad salvestused).
- Päris 48 käigu AI majanduse ja kiviaja linnade areng: **PASS**.
- [V174 päris AI-stsenaariumi genereerimine](https://github.com/orogdor/Kuningriigid/actions/runs/40314610154) — **PASS** pärast manifesti numbriparandust.
- [V174 arvuti ja mobiili WebGL-testi jooks #40314213145](https://github.com/orogdor/Kuningriigid/actions/runs/40314213145) — **2/2 PASS**. Sogn avanes, mängija omas linna, pausilt jätkamine toimis, vana autosalvestus jäi alles, JavaScripti käitusvead puudusid.

## Mängi

[**Ava Kuningriigid V174: Sogn vahetult enne pronksiaega**](https://orogdor.github.io/Kuningriigid/?v=174-20261026&demo=ai-stone-v174)

Mäng algab detailkaardil pausil. Vajuta ▶, et teid edasi sisse käia ja küla juhtida.

## Piirangud

- Kahel Chromiumi emuleeritud kuvasuurusel kontrollitud, mitte füüsilise Androidi FPS-testiga.
- Õuedetailid asuvad üksikute majade mudelialas. Tervet kvartalit hõlmavat ühtset õueaiaplaneerimist ja ehitiste suuremat pööramist veel ei tehtud, sest pööratud ehitistega tuleks navigeerimise kokkupõrkekaste eraldi uuendada.
- V174 peamiselt parandab olemasoleva liikluse ja majade koostoimet; ei taga tingimata suuremat AI elanike arvu kui V173.
