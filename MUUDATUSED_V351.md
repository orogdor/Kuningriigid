# V351 – maailmakaardi sünkroonimine ainult muutuse korral (1. osa: territooriumid, nähtavus, teed, ressursid, põllumaa)

Alus: kasutaja plaan "sündmuspõhine maailmakaardi sünkroonimine". See on plaani esimene osa. Haru `feature/world-sync-v351`, peaharusse ühendamata. NativeThreeBridge'i ei muudetud. Mudelite välimust, shader'eid ja UI-d ei muudetud.

## Mis leiti

Mõõdetud päris mängus Chrome'is (`tests/world-sync-v351-browser.cjs`): mäng keritakse 1200 s edasi (4 linna, 300 territooriumiruutu), seejärel 40 avastaja sammu `game.reveal()` kaudu. 3D-joonistamine on mõõtmise ajal välja lülitatud, et näha ainult loogika kulu.

- `atlas-style.js` `territory()` ehitas iga avastatud ruudu **ja iga territooriumi versioonimuutuse** (ka linna elanike arvu muutus) järel kogu maailma territooriumid ja piirid uuesti. Sujuv piirjoon arvutati iga riigi kogu ümbritseva ristküliku ulatuses, seega kasvas kulu riigi laiuse, mitte ruutude arvuga.
- "Näita kogu kaarti" (`KINGDOMS_REVEAL_V248`) on mängus vaikimisi sees. Selles olekus ei muuda avastamine pildil midagi, aga `visionRevision` kasvas ikka ja kogu ümberehitus tehti tühja.
- `VisionDelta` (`fog-delta-v88.js`) ehitas iga avastuse järel kõigi avastatud ruutude hulga uuesti (kogu kaardi puhul 36 300 võtit).
- `refreshCultivation()` käis iga avastuse järel läbi kõik 36 300 ruutu ja laadis tekstuuri uuesti.
- `roads()` ehitas teedevõrgu uuesti iga avastatud ruudu järel; `refreshResourceArea()` eemaldas ja lõi ikoonid uuesti.

## Mis muudeti

1. **Territooriumid tükkidena** – uus `territory-chunks-v351.js`. Kaart on jagatud 8×8 ruudu tükkideks. Sujuv väli sõltub punktis ainult neljast ümbritsevast ruudust, seega sõltub tüki geomeetria ainult tüki ja ühe ruudu laiuse ääre nähtavatest territooriumiruutudest. Tükk arvutatakse uuesti ainult siis, kui need ruudud muutusid. Mesh'e, nimesid, materjale ja joonistusjärjekorda ei muudetud; tükkide summa on sama kolmnurkade ja joonte hulk mis varem.
   - Avastus: uued ruudud tulevad `game.reveal()` logist; puudutatakse ainult neid tükke, kus äsja nähtavaks saanud ruut on kellegi territoorium. Tühermaa avastamine ei arvuta midagi.
   - Territooriumi muutus (linn kasvab, vallutatakse, hävib): üks läbikäik territooriumiruutudest, uuesti arvutatakse ainult muutunud tükid.
   - Esimene ehitus (uus mäng, laaditud salvestus) tehakse korraga; hilisemad muutused 5 ms kaadrieelarvega, suur järjekord avaldatakse kuni iga 200 ms tagant.
   - Avastamata territoorium jääb peidetuks: geomeetriasse lähevad endiselt ainult nähtud ruudud.
2. **Avastuste logi** – `civilization-core.js` `reveal()` kirjutab mängija iga uue ruudu logisse (`noteDiscoveredV351`, ei lähe salvestusse). `VisionDelta` võtab muutuse logist; kui logi ei klapi (laaditud salvestus, vana demo, kogu kaardi lüliti), tehakse vana täisvõrdlus. Kui kogu kaart on nähtav, ei tehta midagi.
3. **Teed** – võrk ehitatakse uuesti, kui tee/raudtee muutus või mõne lõigu otspunktid said nähtavaks, mitte iga ruudu peale.
4. **Ressursiikoonid** – ikoonid jäävad alles, kui fookuse ümbruse ruutude nähtavus, tehnoloogia ja kiht on samad.
5. **Põllumaa** – käiakse läbi ainult territooriumiruudud; tekstuur laaditakse ainult siis, kui väärtused muutusid.
6. Versioon V351, vahemälu võtmed `index.html`-is ja `boot-v83.js`-is.

## Mõõtmine (Chrome, see masin, 40 avastaja sammu, põhilõime aeg kokku)

| | Enne (main, V350) | Pärast (V351) |
|---|---|---|
| Kogu kaart nähtav (vaikimisi): `worldSync()` | 4600 ms | 240 ms |
| – `territory()` | 3837 ms | 3,8 ms |
| – `VisionDelta.update()` | 470 ms | alla 1 ms |
| – `refreshCultivation()` | 93 ms | 17 ms |
| – halvim kaader sammu kohta | 83–233 ms | 17–117 ms |
| – kaadreid üle 100 ms | 23 | 1 |
| Päris udu (`kingdoms-reveal-v248=0`): `worldSync()` | 2728 ms | 234 ms |
| – `territory()` | 2242 ms | 3,7 ms |
| – `VisionDelta.update()` | 174 ms | alla 1 ms |
| – kaadreid üle 100 ms | 8 | 0 |

Sünteetiline hilise mängu suurus (Node, 60 linna, 5111 territooriumiruutu, kogu kaart nähtav): esimene täisehitus umbes 400 ms, territooriumi muutuse läbikäik umbes 4 ms, üks avastaja samm kuni 12 tükki (umbes 0,5 ms tükk). Sama maailma vana täisläbikäik võttis testis umbes 4,5 s korra kohta.

## Kontroll

- `tests/territory-chunks-v351.mjs`: tükkide geomeetria on float32 täpsusega sama mis vana kogu maailma läbikäik (täide, linnapiirid, riigipiir, kuma, alusjoon) – esimene ehitus, avastaja teekond, logist mööda avastatud ruut, peidetud linna avastamine, vallutus, uus linn, hävitatud linnad, kadunud riik, kogu kaart nähtav.
- `tests/vision-delta-v351.mjs`: logitee annab sama tulemuse mis täisvõrdlus.
- `tests/world-sync-v351.mjs`: ühendused ja vahemälu võtmed.
- Kiirkontroll: 126 käsku, 125 läbis. `tests/detail-stream-v342.mjs` on kellaajast sõltuv ja kukub selles masinas vahel läbi ka peaharul (2/5 ja 3/5 läbis); see ei puuduta muudetud koodi.
- Ekraanipildid enne/pärast (Chrome, sama seis): algseis identne; pärast 40 sammu erineb 0,02–0,1 % pikslitest (liikuvad loomad ja lained), piirid ja täide on samad.

## Tegemata

- 94. käigu salvestust hoidlas pole; mõõdetud on uue mängu ja sünteetilise suure maailmaga.
- NativeThreeBridge'is ja päris videokaardiga testimata; FPS, 1% low ja P95/P99 riistvaral mõõtmata.
- Plaani punkt 6 (majad, linnamudelid, linnamarkerid) ja metsad: muutmata ja läbi vaatamata.
- Detailkaardi piirid (`civilization.js` read ~823, ~1143) sõltuvad endiselt `visionRevision`-ist.
- `refreshTerritory()` → `allocateTerritory()` mängutuumas arvutab territooriumi endiselt tervikuna iga versioonimuutuse järel.
- Hilises mängus teeb iga territooriumi versioonimuutus (ka elanike arvu muutus) ühe läbikäigu territooriumiruutudest (umbes 4 ms 5000 ruudu juures).
