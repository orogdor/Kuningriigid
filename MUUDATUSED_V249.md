# Kuningriigid V249 – jõesuudmed ja allavoolu laienevad jõed

## Mis oli katki
- **Detailkaart:** jõesäng lõppes enne merd järsu seinaga. Jõe ja mere vahele jäi U-kujuline liivavall.
- **Maailmakaart:** jõe veepind lõppes rannajoonel kastina, mis oli merepinnast kõrgemal. Suudme kohal oli hele ristkülik.

Põhjused:
1. Joonistusmaastik tõstis jõe kõrval kaldavalle ja kaldaid veepinnast kõrgemale ka ranna ja mere kohal (`worldElevation(..., visual)`).
2. Jõe veepind lõigati ära täpselt rannajoonel (`atlasHeight .30`) ega jätkunud merre.
3. Rannajoone joon jooksis ka üle jõesuudme.
4. Madalad rannalahtrid (h < 1,5) ei saanud olla jõed. Seetõttu lõppesid mõned jõed rannaliival ega jõudnud merre (5–15 jõge kaardi kohta).

## Parandus: suudmete süsteem
**Kõigil kaartidel, ka vanades salvestustes. Ainult joonistus, mängu maastik ja salvestused ei muutu.**
- `landnessV249` (0 rannal ja meres, 1 kuival maal): kaldavallid ja tõstetud kaldad tekivad ainult maal. Suudmes laskub jõesäng merepõhja (`continuous-landscape.js`).
- Jõe veepind jätkub rannast merre, kuni sügavuseni -2,5. Selle läbipaistvus hajub rannavööndis nullini ja värv läheb üle mere tooniks (`continuous-landscape-visual.js`, vee materjal on nüüd läbipaistev, `landscape-v149.js`).
- Kaldamuda ja kruusariba hajuvad rannal, ilma teravate servadeta.
- Maailmakaardi rannajoont ei joonistata üle jõesuudme (`atlas-style.js`).

**Uutes „Loogilise maailma“ mängudes (`geographyVersion 6`). See muudab mängu maastikku.**
- **Laius sõltub vooluhulgast:** jõgi algab peenikese ojana (poollaius 1,3 m) ja laieneb kuni 16 m-ni (`1,3 + (vool − lävi)^0,62 · 0,4`).
- **Laevatatavad lõigud:** lõik, mille poollaius on vähemalt 6 m, saab märke `cell.riverNavigable`. See on hilisema jõelaevanduse jaoks; praegu ei muuda see mängureegleid.
- **Lehtrikujuline suue:** jõe viimane lõik laieneb mere poole kuni 2,5 korda (`estuaryV249`).
- **Jõgi jõuab alati merre:** ka madalad rannalahtrid võivad olla jõed. Suudmeid on 45–56 kaardi kohta, varem 23–27. Maal lõppevaid jõgesid on 0, varem 15.

**V248 mängud** (`geographyVersion 5`) jäävad oma jõgedega: uued reeglid kehtivad ainult uutele mängudele. Kaart luuakse laadimisel seemnest uuesti, seega muudaksid uued reeglid muidu juba alustatud mängude jõgesid.

Lisaks: `index.html` importmap suunab ka seni puudunud viited `continuous-landscape.js?v=2232`, `continuous-landscape-visual.js?v=2232`, `atlas-style.js?v=162a` ja `world-geography.js?v=65c` uuele versioonile. Varem laaditi neist teine koopia. Silumiseks on lisatud `gameDebug.lookAtV249(c,r,zoom)`, `gameDebug.openTileV249(c,r)` ja `gameDebug.gameV249()`.

## Kontrollid
- Brauser (WebGL), ekraanipildid enne ja pärast samast suudmest, maailma- ja detailkaardil:
  - uus maailm (seeme „kuningas“): suudmes pole enam valli ega kasti, jõgi avaneb lahena merre;
  - vana „continents“ kaart (seeme „vana“): jõgi voolab merre.
- Lahtrite räsi (kõrgus, maa, mägi, jõgi, laius, koolmed, biomid) on enne ja pärast sama: `continents` 5932019 ja 123, `inland` 77, V248 `tectonic` 42 (`geographyVersion 5`).
- `node tools/check-world-v248.mjs`: kaheksa uut maailma (versioon 6), kõik mängitavad.
- `node scripts/test.mjs traffic`: PASS. `node scripts/test-stream-v242.mjs`: PASS.
- `node scripts/test.mjs rules --jobs 2`: 20 testi 21-st läbisid. `TEST_V139.mjs` kukub läbi sama veaga ka muutmata V248 koodiga (`ai-defenses-v128.js:47`, `realms[team]` puudub). See on varasem viga ja ei ole seotud V249-ga.
