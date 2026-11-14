# V352 – maailmakaardi meri: lame pind ja sügavuskaart

Alus: FPS-analüüs (allpool) ja kasutaja küsimus, kas meri ja jõed saaksid kasutada sügavuskaardiga animatsiooni. See on esimene osa: **meri**. Jõed on veel muutmata. Haru `feature/sea-depth-v352`, kasutaja palvel peaharusse ühendatud.

## Mis muutus

- Maailmakaardi meri oli maastikuvõrgu koopia (985 000 tippu, V348 järel 589 000 kolmnurka), mille ainus ülesanne oli kanda iga tipu sügavust.
- Nüüd on meri **üks lame pind (864 kolmnurka)**. Sügavus ja kaldategur tulevad RG half-float tekstuurist (2750 × 2063, 4 m piksel, umbes 23 MB graafikamälu).
- Tekstuur küpsetatakse samadest väärtustest mis varem. Sügavus arvutatakse maastikutippudes V326 valemiga ja maastiku kolmnurgad rasterdatakse tekstuuri sama lineaarse interpolatsiooniga, mida vana võrk kasutas. Ka kaldategur (`1-smoothstep(0,3.6,sügavus)`) arvutatakse tippudes ja interpoleeritakse nagu varem.
- Aeglane "loomuliku kõrguse" arvutus tehakse ainult tippudes, mille mõni kolmnurk võib olla märg. Seetõttu läks laadimine kiiremaks.
- Shader (`landscape-v149.js` `waterMaterial`, valik `depthMap`) loeb sügavust tekstuurist. Värv, lained, sädemed, vaht, Fresneli peegeldus ja kuivade kohtade peitmine (`discard`) on samad.
- Rannajoon tuleb endiselt sellest, kus maastik varjab lameda vee.
- WebGPU-režiim kasutab vana võrku edasi, sest selle sõlmmaterjal loeb sügavust tipust.
- Detailkaardi meri on muutmata.

## Mõõtmine (Chrome, tarkvaraline graafika, high-seade 50% eraldusvõimega)

| | main (V351) | V352 |
|---|---|---|
| Mere kolmnurgad | 589 128 | 864 |
| Kolmnurki kaadris, rannik, suum 900 | 4,54–4,57 milj. | 3,76–3,83 milj. |
| Kolmnurki kaadris, kogu kaart, suum 6000 | 12,25 milj. | 11,37 milj. |
| Kaadri mediaan, rannik (2 kordust) | 2017 / 1967 ms | 1817 / 1717 ms |
| Kaadri mediaan, kogu kaart (2 kordust) | 11 550 / 10 683 ms | 9 400 / 9 883 ms |
| Mere ehitamine laadimisel | 3,2 s | 1,0–1,2 s |

Tarkvaraline graafika on palju aeglasem kui päris kaart: kaadriaegade suhe näitab suunda (umbes −10%), mitte päris FPS-i.

## Pilt

`tests/sea-depth-v352-browser.cjs` pildistab 4 rannikukohta 3 suumiga, külmutatud veekellaga. Vana versioon annab kaks korda järjest identse pildi.

- Lähedal (suum 260) erineb 0,02–0,26% pikslitest.
- Kaugel (suum 3000) erineb 0,36–0,59% pikslitest. Need on ainult sädemete asukohad: sädemete müra on kaugelt peenem kui piksel ja muster nihkub, kui kolmnurgad muutuvad. Tihedus ja välimus on samad.
- Rannajoon, värvid ja jõesuudmed on samad.

## Kontroll

- `tests/sea-depth-v352.mjs`:
  - tekstuuri sügavus ja kaldategur on vana võrgu interpolatsiooniga võrdsed (281 kolmnurka, viga alla 1e-4);
  - kaetud on täpselt need kolmnurgad, mille V348 meri alles jättis;
  - sisemaa kraav jääb kuivaks;
  - shader loeb tekstuuri, mitte `aDepth`-i;
  - WebGPU kasutab vana teed.
- Kiirkontroll: 127 käsku. `tests/world-assets-v327.mjs` oodatud vahemälu võti uuendati. Versioonikontrollid `tests/ui-writes-v350.mjs` ja `tests/world-sync-v351.mjs` kontrollivad nüüd kooskõla, mitte kindlat versiooninumbrit, et need järgmise versiooniga katki ei läheks.

## Tegemata

- **Jõed** (umbes 690 000 kolmnurka: veepind, kaldad, õlad). Need järgivad maastiku kõrgust ja voolusuunda, seega lame pind sinna ei sobi; variandid on kirjas allpool.
- **Maastik ise** (2 milj. kolmnurka): tükkideks jagamine ja kauguse-LOD.
- Mõõtmata: NativeThreeBridge'is (vajab RG half-float tekstuuri lineaarse filtreerimisega), päris graafikakaardiga ja 94. käigu salvestusega.

## FPS-analüüs (V351 seis, `tests/fps-analysis-v352-browser.cjs`)

Chrome, high-seade, simulatsioon jooksis:

1. **Maailmakaart: geomeetria.** 4,1 milj. kolmnurka kaadris, ka linna kohal suumituna; kogu kaart korraga suumituna 12 milj. Maastik on üks 2 milj. kolmnurgaga mesh kogu kaardi ulatuses, meri oli 0,6 milj., jõed 0,7 milj. Varjamistest (tarkvaraline graafika): maastik ~39%, jõed ~18%, puud ja kivid ~18%, meri ~14% kaadrist. Eraldusvõime vähendamine 10%-le andis −17%, seega piirab geomeetria.
2. **Detailkaardi tükkide ehitamine.** Linna sisenemisel umbes 20 s ja ~7 s CPU-d, kaadrid kuni 217 ms. Lauaarvutis võib ehitamine võtta kuni 11 ms igast kaadrist (`budget:11`).
3. **Uue maailma pakkimine** (`generated-world-v331.js`, pako gzip): umbes 4,5 s põhilõimel ~30 ms tükkidena pärast uut mängu.
4. **three.js joonistamise CPU-osa** maailmakaardil: umbes 6–9 ms kaadris (3770 nähtavat objekti, 925 instantsitud mesh'i).

Ei pidurda: simulatsioon (~1,8 ms kaadris), ülejäänud kaadri loogika (~2,6–2,9 ms), UI, `worldSync()`.
