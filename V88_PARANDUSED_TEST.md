# V88 paranduste kampaaniatest – saekojad ja põhiehitised

Seeme: 8417. Koodi revisjon: a02549f14d026587a926237fbd3ff4b2be49869c. Üks käik = 60 mängusekundit.
Kõiki nelja riiki juhib AI sama 12-sekundilise planeerimissammuga; simulatsioonisamm 0,5 sekundit. Tavalised raskusastme kordajad säilivad. Materjale ega teadust juurde ei anta.

**STOP_100_TURNS**, peatumine käigul **189.6583**.
100 käigu piir täitus riigil: 3. Katse peatati kohe.

## Paranduste kontrolli kokkuvõte

- **Saekoja ehitamata jätmine on selles katses lahendatud:** kõigil neljal riigil oli saekoda ning katse lõpus olid saekojad valmis kõigis **17 linnas** (riikidel vastavalt 5, 4, 4 ja 4).
- Kõik riigid jõudsid rauaaega **53,85–59,97 pronksiaja käiguga**. Varasemas katses jäi üks riik 50 laua puudumisel pronksiaega.
- Riigid 1, 2 ja 4 jõudsid keskaega vastavalt käikudel **127,26; 139,48; 143,81**.
- **Test peatati käigul 189,6583:** riik 3 veetis rauaajas 100 käiku ja ootas 20 rauda. Tal olid saekojad, söepõletajad, kaevandused ja sulatusahjud olemas, kuid maagi tootmine jäi toidukontrolli tõttu seisma.
- Test tõi välja eraldi vea: tööjõujaotus luges kaevanduse toidusisendiks ainult leiba, tootmise maksmisreegel lubab kasutada ka muud toitu. **See viga parandati pärast selle kampaania käivitamist.** Eraldi kontroll tõendab nüüd töötajate määramist marjatoidu olemasolul, marjade tegelikku kulumist ja maagi saabumist. Kampaaniat pärast 100 käigu stoppi ei korratud; kõigi riikide keskaega jõudmine viimase parandusega ei ole selle aruandega tõendatud.

### Avastaja liikumise brauserikontroll

[GitHubi V88 loogika- ja brauseritestid läbisid kontrolli](https://github.com/orogdor/Kuningriigid/actions/runs/39580819255). Avastaja tegi kummaski vaates 40 tegelikku maailmaruudul liikumise sammu.

| Kontroll | Arvutivaade | Telefonivaade |
|---|---:|---:|
| Nähtavuse uuenduse suurim CPU-aeg | 3,0 ms | 6,3 ms |
| Nähtavuse uuenduse 95. protsentiil | 2,1 ms | 4,5 ms |
| Ühe sammu suurim muudetud ruutude arv | 5 | 5 |
| Udukatte ja visandite geomeetria püsis sama | jah | jah |
| JavaScripti veateated | 0 | 0 |

Mõõdeti GitHubi testbrauseri `worldSync` CPU-aega, mitte Samsungi telefoni üldist kaadrisagedust ega võrgu laadimisaega. Kaardi maastikul oli 327 856 tippu; liikumisel ei värvita neid enam kõiki üle. Vana salvestuse kinni jäänud 12 puitu kandev puuraiuja jõudis taastamiskontrollis koormaga füüsiliselt tagasi, ilma töölist või ressursse teleportimata.

### Prioriteedid

AI hoiab põhiehitiste materjalivaru, uurib puusepatööd varakult ja ehitab puuduvad vee-, toidu-, puidu-, kivi- ning lauatootjad enne kõrvalharusid. Raiutud puidu ja kaubaveo tagasiteed kaitstakse uue paigutuse juures; vanad kaetud sissepääsud saavad ligipääsetava välise teeninduskoha. Vältimatu elupäästev toit ja vesi jäävad kõige ette.

## Ajastuvahetused

| Riik | Ajastu | Mängu käik | Eelmises ajastus käike |
|---|---|---:|---:|
| 4 | Pronksiaeg | 30.1917 | 30.1917 |
| 2 | Pronksiaeg | 30.3333 | 30.3333 |
| 3 | Pronksiaeg | 34.2083 | 34.2083 |
| 1 | Pronksiaeg | 35.1917 | 35.1917 |
| 2 | Rauaaeg | 84.1833 | 53.85 |
| 4 | Rauaaeg | 87.5667 | 57.375 |
| 3 | Rauaaeg | 89.6583 | 55.45 |
| 1 | Rauaaeg | 95.1583 | 59.9667 |
| 1 | Keskaeg | 127.2583 | 32.1 |
| 2 | Keskaeg | 139.4833 | 55.3 |
| 4 | Keskaeg | 143.8083 | 56.2417 |

## Peatumise seis

| Riik | Ajastu | Käike ajastus | Uurimine | Teadus / hind | Linnu |
|---|---|---:|---|---:|---:|
| 1 | Keskaeg | 62.4 | Raske hõlmader | 0.00 / 20.00 | 5 |
| 2 | Keskaeg | 50.175 | Raske hõlmader | 0.00 / 20.00 | 4 |
| 3 | Rauaaeg | 100 | Feodaalkorraldus | 40.00 / 40.00 | 4 |
| 4 | Keskaeg | 45.85 | Raske hõlmader | 0.00 / 20.00 | 4 |

## Materjaliootused

| Riik | Tehnoloogia | Oote algus | Oote lõpp | Oodatud käike | Pooleli |
|---|---|---:|---:|---:|---|
| 1 | Feodaalkorraldus | 105.25 | 127.2583 | 22.0083 | ei |
| 2 | Feodaalkorraldus | 98.9 | 139.4833 | 40.5833 | ei |
| 4 | Feodaalkorraldus | 105.7833 | 143.8083 | 38.025 | ei |
| 3 | Feodaalkorraldus | 100.1417 | 189.6583 | 89.5167 | jah |

## Uurimiste kronoloogia

| Riik | Käik | Avastatud tehnoloogia |
|---|---:|---|
| 2 | 5.7414 | Kivitöö |
| 4 | 5.7414 | Kivitöö |
| 1 | 6.061 | Kivitöö |
| 3 | 6.1414 | Kivitöö |
| 2 | 10.3043 | Sarvkirkad |
| 4 | 10.3043 | Sarvkirkad |
| 1 | 10.4907 | Sarvkirkad |
| 3 | 10.7043 | Sarvkirkad |
| 2 | 14.4319 | Kivikiilud |
| 4 | 14.4319 | Kivikiilud |
| 1 | 14.5216 | Kivikiilud |
| 3 | 14.8319 | Kivikiilud |
| 2 | 18.3698 | Õpetuse alused |
| 4 | 18.3698 | Õpetuse alused |
| 1 | 18.689 | Õpetuse alused |
| 3 | 18.9817 | Õpetuse alused |
| 4 | 19.5299 | Jahipidamine |
| 2 | 19.5429 | Jahipidamine |
| 1 | 19.979 | Jahipidamine |
| 3 | 20.3978 | Jahipidamine |
| 2 | 21.3316 | Püünised ja kalavõrgud |
| 4 | 21.3316 | Püünised ja kalavõrgud |
| 3 | 22.6509 | Püünised ja kalavõrgud |
| 2 | 23.0769 | Veevarustus |
| 4 | 23.1346 | Veevarustus |
| 1 | 23.1742 | Püünised ja kalavõrgud |
| 4 | 24.989 | Põlluharimine |
| 2 | 25.2396 | Põlluharimine |
| 3 | 25.5139 | Veevarustus |
| 1 | 26.458 | Veevarustus |
| 4 | 27.1895 | Tulekivisirbid |
| 2 | 27.7642 | Tulekivisirbid |
| 3 | 27.8865 | Põlluharimine |
| 1 | 28.4375 | Põlluharimine |
| 4 | 30.19 | Pronksitöö |
| 2 | 30.3325 | Pronksitöö |
| 3 | 30.898 | Tulekivisirbid |
| 1 | 31.4915 | Tulekivisirbid |
| 4 | 32.6028 | Põldude kanalniisutus |
| 2 | 32.8106 | Põldude kanalniisutus |
| 3 | 34.208 | Pronksitöö |
| 2 | 34.6222 | Sõnnikuga väetamine |
| 4 | 35.0645 | Sõnnikuga väetamine |
| 1 | 35.1876 | Pronksitöö |
| 2 | 36.3739 | Pronkspeitlid |
| 4 | 36.9824 | Pronkspeitlid |
| 3 | 37.0866 | Põldude kanalniisutus |
| 1 | 37.8975 | Põldude kanalniisutus |
| 2 | 37.9504 | Maagi tõstekorvid |
| 4 | 38.6092 | Maagi tõstekorvid |
| 3 | 38.923 | Sõnnikuga väetamine |
| 2 | 39.0078 | Puusepatöö |
| 4 | 39.8816 | Puusepatöö |
| 1 | 40.5488 | Sõnnikuga väetamine |
| 3 | 40.6667 | Pronkspeitlid |
| 2 | 40.8666 | Savitöö ja keraamika |
| 4 | 41.7093 | Savitöö ja keraamika |
| 3 | 42.4667 | Maagi tõstekorvid |
| 1 | 43.0752 | Pronkspeitlid |
| 3 | 43.6692 | Puusepatöö |
| 2 | 44.2244 | Loomakasvatus |
| 4 | 44.9272 | Loomakasvatus |
| 1 | 45.2455 | Maagi tõstekorvid |
| 3 | 45.5788 | Savitöö ja keraamika |
| 1 | 46.7366 | Puusepatöö |
| 2 | 47.0517 | Kivitahumine |
| 4 | 48.262 | Kivitahumine |
| 3 | 48.8363 | Loomakasvatus |
| 2 | 49.074 | Sõjapidamine |
| 1 | 49.0866 | Savitöö ja keraamika |
| 4 | 50.2113 | Sõjapidamine |
| 2 | 51.7718 | Kaitserajatised |
| 3 | 51.9825 | Kivitahumine |
| 1 | 52.5888 | Loomakasvatus |
| 4 | 53.2243 | Kaitserajatised |
| 2 | 53.4843 | Vibulaskmine |
| 3 | 54.1344 | Sõjapidamine |
| 2 | 54.5487 | Asunduste rajamine |
| 4 | 55.2113 | Vibulaskmine |
| 1 | 55.862 | Kivitahumine |
| 2 | 56.0796 | Kiviaja töökojad |
| 4 | 56.6509 | Asunduste rajamine |
| 3 | 56.9936 | Kaitserajatised |
| 1 | 58.1102 | Sõjapidamine |
| 2 | 58.3053 | Ratta valmistamine |
| 4 | 58.3001 | Kiviaja töökojad |
| 3 | 58.5917 | Vibulaskmine |
| 3 | 59.5764 | Asunduste rajamine |
| 4 | 60.6389 | Ratta valmistamine |
| 2 | 61.1821 | Vase- ja tinatöö |
| 3 | 61.2249 | Kiviaja töökojad |
| 1 | 61.508 | Kaitserajatised |
| 4 | 63.6489 | Vase- ja tinatöö |
| 2 | 63.9211 | Kivist kindlustused |
| 1 | 64.3156 | Vibulaskmine |
| 3 | 65.1511 | Ratta valmistamine |
| 1 | 66.1366 | Asunduste rajamine |
| 4 | 66.5315 | Kivist kindlustused |
| 2 | 66.7211 | Teedeehitus |
| 2 | 67.6844 | Metsade teadlik majandamine |
| 1 | 68.7488 | Kiviaja töökojad |
| 2 | 69.1229 | Laoehitus ja varude korraldus |
| 4 | 69.3211 | Teedeehitus |
| 4 | 70.2844 | Metsade teadlik majandamine |
| 3 | 70.3118 | Vase- ja tinatöö |
| 2 | 70.5201 | Keldrite ja toidu säilitamine |
| 4 | 71.757 | Laoehitus ja varude korraldus |
| 2 | 72.5802 | Linnaturg ja kaubandus |
| 1 | 73.0761 | Ratta valmistamine |
| 4 | 73.1201 | Keldrite ja toidu säilitamine |
| 3 | 74.0988 | Kivist kindlustused |
| 2 | 74.5802 | Kirjakunst |
| 4 | 75.1802 | Linnaturg ja kaubandus |
| 2 | 76.5802 | Pronksriistad ja ehitus |
| 4 | 77.1802 | Kirjakunst |
| 1 | 77.2702 | Vase- ja tinatöö |
| 2 | 77.4345 | Käsijahvatus ja leivategu |
| 3 | 77.711 | Teedeehitus |
| 3 | 78.921 | Metsade teadlik majandamine |
| 4 | 79.1791 | Pronksriistad ja ehitus |
| 2 | 79.5231 | Sillaehitus |
| 4 | 80.0333 | Käsijahvatus ja leivategu |
| 1 | 80.186 | Kivist kindlustused |
| 3 | 80.2158 | Laoehitus ja varude korraldus |
| 2 | 80.241 | Kalapüük |
| 3 | 81.3655 | Keldrite ja toidu säilitamine |
| 4 | 82.1231 | Sillaehitus |
| 2 | 82.3429 | Laevaehitus |
| 1 | 82.3971 | Teedeehitus |
| 3 | 82.8356 | Linnaturg ja kaubandus |
| 4 | 82.841 | Kalapüük |
| 1 | 83.0828 | Metsade teadlik majandamine |
| 2 | 84.1803 | Rauatöö |
| 1 | 84.2398 | Laoehitus ja varude korraldus |
| 3 | 84.4446 | Kirjakunst |
| 4 | 84.9641 | Laevaehitus |
| 2 | 85.3365 | Rauast adratera |
| 1 | 85.4262 | Keldrite ja toidu säilitamine |
| 3 | 85.6398 | Pronksriistad ja ehitus |
| 3 | 86.2242 | Käsijahvatus ja leivategu |
| 2 | 86.546 | Raudvikatid |
| 1 | 87.0974 | Linnaturg ja kaubandus |
| 3 | 87.3789 | Sillaehitus |
| 4 | 87.5641 | Rauatöö |
| 3 | 87.7259 | Kalapüük |
| 2 | 87.7872 | Raudkirkad |
| 1 | 88.6241 | Kirjakunst |
| 3 | 88.7884 | Laevaehitus |
| 2 | 89.024 | Kaevanduse kuivenduskäigud |
| 4 | 89.0333 | Rauast adratera |
| 3 | 89.6579 | Rauatöö |
| 1 | 90.2301 | Pronksriistad ja ehitus |
| 4 | 90.4461 | Raudvikatid |
| 3 | 90.4516 | Rauast adratera |
| 2 | 90.81 | Rauasulatus |
| 1 | 91.0017 | Käsijahvatus ja leivategu |
| 3 | 91.2516 | Raudvikatid |
| 4 | 91.8461 | Raudkirkad |
| 3 | 92.0516 | Raudkirkad |
| 2 | 92.2742 | Sepatöö |
| 1 | 92.5371 | Sillaehitus |
| 3 | 92.8031 | Kaevanduse kuivenduskäigud |
| 1 | 92.9996 | Kalapüük |
| 4 | 93.2461 | Kaevanduse kuivenduskäigud |
| 2 | 93.615 | Ratsaväe väljaõpe |
| 3 | 93.8516 | Rauasulatus |
| 1 | 94.1366 | Laevaehitus |
| 2 | 94.8491 | Filosoofia ja teaduste korraldus |
| 3 | 94.8705 | Sepatöö |
| 1 | 95.1544 | Rauatöö |
| 4 | 95.2692 | Rauasulatus |
| 3 | 95.8635 | Ratsaväe väljaõpe |
| 1 | 95.8804 | Rauast adratera |
| 2 | 96.3965 | Raudriistad ja töökojad |
| 1 | 96.5604 | Raudvikatid |
| 3 | 96.8635 | Filosoofia ja teaduste korraldus |
| 1 | 97.2342 | Raudkirkad |
| 4 | 97.3991 | Sepatöö |
| 2 | 97.8191 | Rannikunavigatsioon |
| 1 | 98.0308 | Kaevanduse kuivenduskäigud |
| 3 | 98.1128 | Raudriistad ja töökojad |
| 1 | 99.097 | Rauasulatus |
| 3 | 99.263 | Rannikunavigatsioon |
| 4 | 99.3515 | Ratsaväe väljaõpe |
| 1 | 100.0348 | Sepatöö |
| 1 | 101.0419 | Ratsaväe väljaõpe |
| 4 | 101.1665 | Filosoofia ja teaduste korraldus |
| 1 | 102.0284 | Filosoofia ja teaduste korraldus |
| 4 | 103.0761 | Raudriistad ja töökojad |
| 1 | 103.2682 | Raudriistad ja töökojad |
| 1 | 104.4134 | Rannikunavigatsioon |
| 4 | 104.6591 | Rannikunavigatsioon |
| 1 | 127.25 | Feodaalkorraldus |
| 2 | 139.475 | Feodaalkorraldus |
| 4 | 143.8 | Feodaalkorraldus |

## Linnade rajamine

- Käik 0.4: riik 2, Idaküla 1, ruut (47, 41), eriala ["grain","water","wood","stone","clay","game","fish"].
- Käik 0.4: riik 4, Lõunaküla 1, ruut (181, 56), eriala ["grain","water","wood","stone","clay","game","fish"].
- Käik 0.8: riik 3, Põhjaküla 1, ruut (80, 106), eriala ["grain","water","wood","stone","clay","game"].
- Käik 0.8083: riik 1, Kadakaküla 1, ruut (184, 91), eriala ["grain","water","wood","stone","clay","game"].
- Käik 69: riik 3, Põhjaküla 2, ruut (78, 109), eriala ["flax","fish"].
- Käik 73.8083: riik 1, Kadakaküla 2, ruut (170, 88), eriala ["copper","tin","flax"].
- Käik 78.6083: riik 1, Kadakaküla 3, ruut (192, 91), eriala ["fish"].
- Käik 80.2: riik 3, Põhjaküla 3, ruut (78, 104), eriala [].
- Käik 82.8: riik 2, Idaküla 2, ruut (44, 45), eriala ["ore","flax"].
- Käik 84.4: riik 3, Põhjaküla 4, ruut (76, 106), eriala [].
- Käik 92.8083: riik 1, Kadakaküla 4, ruut (183, 88), eriala [].
- Käik 93.8: riik 2, Idaküla 3, ruut (51, 40), eriala ["gems"].
- Käik 95.8083: riik 1, Kadakaküla 5, ruut (188, 91), eriala ["fruit"].
- Käik 98: riik 4, Lõunaküla 2, ruut (177, 60), eriala ["ore","gems"].
- Käik 100.6: riik 4, Lõunaküla 3, ruut (182, 59), eriala ["flax"].
- Käik 103.4: riik 4, Lõunaküla 4, ruut (177, 56), eriala [].
- Käik 140.8: riik 2, Idaküla 4, ruut (48, 35), eriala ["silk"].

## Tegelikult kohale toimetatud kaubad

| Käik | Saatja linn → saaja linn | Kaup ja kogus |
|---:|---|---|
| 69.6 | Põhjaküla 2 → Põhjaküla 1 | {"bread":1.805} |
| 69.6 | Põhjaküla 1 → Põhjaküla 2 | {"plank":18.05,"meat":3.61,"stone":3.61} |
| 70.1 | Põhjaküla 1 → Põhjaküla 2 | {"plank":0.9025} |
| 73.25 | Põhjaküla 1 → Põhjaküla 2 | {"meat":0.9025} |
| 75.15 | Kadakaküla 2 → Kadakaküla 1 | {"bread":1.805} |
| 75.15 | Kadakaküla 1 → Kadakaküla 2 | {"plank":18.05,"cutstone":0.9025,"meat":3.61,"vegetables":3.61} |
| 76.4 | Kadakaküla 1 → Kadakaküla 2 | {"cutstone":2.7075,"plank":0.9025} |
| 77 | Põhjaküla 1 → Põhjaküla 2 | {"stone":5.415} |
| 77.25 | Kadakaküla 1 → Kadakaküla 2 | {"grain":9.025} |
| 78.25 | Kadakaküla 1 → Kadakaküla 2 | {"meat":0.9025,"vegetables":0.9025} |
| 78.35 | Põhjaküla 2 → Põhjaküla 1 | {"flax":1.805} |
| 78.85 | Põhjaküla 2 → Põhjaküla 1 | {"berries":0.9025} |
| 79.25 | Põhjaküla 2 → Põhjaküla 1 | {"flax":3.61} |
| 79.3 | Kadakaküla 3 → Kadakaküla 1 | {"bread":1.805} |
| 79.3 | Kadakaküla 1 → Kadakaküla 3 | {"plank":18.05,"grain":1.805,"meat":3.61,"vegetables":3.61} |
| 80.25 | Kadakaküla 1 → Kadakaküla 2 | {"cutstone":0.9025} |
| 80.5 | Põhjaküla 1 → Põhjaküla 3 | {"plank":18.05,"meat":3.61,"stone":3.61} |
| 80.55 | Põhjaküla 3 → Põhjaküla 1 | {"bread":1.805} |
| 80.8 | Põhjaküla 2 → Põhjaküla 3 | {"flax":3.61} |
| 80.85 | Kadakaküla 1 → Kadakaküla 3 | {"cutstone":1.805,"plank":0.9025} |
| 80.9 | Kadakaküla 3 → Kadakaküla 2 | {"stone":6.3175} |
| 80.95 | Põhjaküla 1 → Põhjaküla 3 | {"plank":0.9025} |
| 81.35 | Kadakaküla 1 → Kadakaküla 3 | {"stone":4.5125} |
| 82 | Põhjaküla 1 → Põhjaküla 2 | {"meat":1.805} |
| 82.1 | Kadakaküla 1 → Kadakaküla 3 | {"grain":7.22,"meat":0.9025,"vegetables":0.9025} |
| 83 | Kadakaküla 1 → Kadakaküla 2 | {"vegetables":0.9025} |
| 83.25 | Põhjaküla 1 → Põhjaküla 2 | {"meat":1.805} |
| 83.45 | Idaküla 2 → Idaküla 1 | {"bread":1.805} |
| 83.45 | Idaküla 1 → Idaküla 2 | {"plank":18.05,"grain":3.61,"meat":3.61} |
| 83.75 | Põhjaküla 1 → Põhjaküla 2 | {"meat":0.9025} |
| 83.95 | Idaküla 1 → Idaküla 2 | {"plank":0.9025} |
| 84.2 | Põhjaküla 1 → Põhjaküla 3 | {"stone":5.415,"meat":0.9025} |
| 84.5 | Põhjaküla 2 → Põhjaküla 1 | {"berries":2.7075} |
| 84.5 | Põhjaküla 1 → Põhjaküla 2 | {"meat":1.805} |
| 84.75 | Põhjaküla 4 → Põhjaküla 1 | {"bread":1.805} |
| 84.85 | Kadakaküla 1 → Kadakaküla 3 | {"cutstone":2.7075} |
| 85 | Põhjaküla 2 → Põhjaküla 1 | {"berries":0.9025} |
| 85 | Põhjaküla 1 → Põhjaküla 4 | {"plank":18.05,"meat":3.61,"stone":3.61} |
| 85.45 | Põhjaküla 1 → Põhjaküla 4 | {"plank":0.9025} |
| 85.85 | Idaküla 1 → Idaküla 2 | {"meat":1.805} |
| 85.85 | Põhjaküla 2 → Põhjaküla 4 | {"flax":3.61} |
| 86.15 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 86.75 | Kadakaküla 1 → Kadakaküla 2 | {"grain":2.7075,"vegetables":0.9025} |
| 87 | Põhjaküla 1 → Põhjaküla 2 | {"meat":1.805} |
| 87.1 | Idaküla 1 → Idaküla 2 | {"meat":1.805} |
| 87.5 | Põhjaküla 1 → Põhjaküla 2 | {"meat":0.9025} |
| 87.75 | Kadakaküla 1 → Kadakaküla 2 | {"grain":0.9025} |
| 87.95 | Kadakaküla 2 → Kadakaküla 3 | {"stone":11.7325} |
| 87.95 | Põhjaküla 1 → Põhjaküla 3 | {"meat":0.9025} |
| 88.25 | Põhjaküla 1 → Põhjaküla 2 | {"meat":1.805} |
| 88.35 | Kadakaküla 1 → Kadakaküla 3 | {"stone":10.83,"vegetables":0.9025} |
| 88.35 | Idaküla 1 → Idaküla 2 | {"meat":2.7075} |
| 88.7 | Põhjaküla 1 → Põhjaküla 4 | {"meat":0.9025} |
| 88.75 | Põhjaküla 2 → Põhjaküla 1 | {"berries":0.9025} |
| 88.8 | Kadakaküla 2 → Kadakaküla 1 | {"flax":3.61} |
| 88.85 | Kadakaküla 1 → Kadakaküla 3 | {"stone":0.9025} |
| 88.95 | Idaküla 2 → Idaküla 1 | {"berries":0.9025} |
| 89.25 | Põhjaküla 2 → Põhjaküla 3 | {"berries":1.805} |
| 89.75 | Kadakaküla 1 → Kadakaküla 2 | {"water":2.7075} |
| 90.2 | Põhjaküla 4 → Põhjaküla 1 | {"vegetables":0.9025} |
| 90.2 | Põhjaküla 1 → Põhjaküla 3 | {"stone":11.7325} |
| 90.45 | Põhjaküla 1 → Põhjaküla 3 | {"stone":0.9025} |
| 90.75 | Kadakaküla 1 → Kadakaküla 2 | {"vegetables":0.9025,"water":1.805} |
| 90.75 | Põhjaküla 1 → Põhjaküla 2 | {"meat":2.7075} |
| 90.85 | Kadakaküla 2 → Kadakaküla 3 | {"flax":3.61} |
| 90.85 | Idaküla 1 → Idaküla 2 | {"meat":1.805} |
| 90.95 | Põhjaküla 4 → Põhjaküla 1 | {"vegetables":2.7075} |
| 91.2 | Põhjaküla 4 → Põhjaküla 1 | {"vegetables":0.9025} |
| 91.4 | Kadakaküla 3 → Kadakaküla 2 | {"water":0.9025} |
| 91.75 | Kadakaküla 2 → Kadakaküla 1 | {"cloth":1.805} |
| 91.75 | Kadakaküla 1 → Kadakaküla 2 | {"water":2.7075} |
| 91.95 | Põhjaküla 4 → Põhjaküla 1 | {"vegetables":1.805} |
| 92 | Põhjaküla 1 → Põhjaküla 2 | {"meat":1.805} |
| 92.1 | Idaküla 1 → Idaküla 2 | {"meat":2.7075} |
| 92.2 | Põhjaküla 4 → Põhjaküla 1 | {"berries":0.9025} |
| 92.45 | Põhjaküla 1 → Põhjaküla 3 | {"stone":12.635} |
| 92.5 | Põhjaküla 4 → Põhjaküla 2 | {"vegetables":0.9025} |
| 92.7 | Põhjaküla 1 → Põhjaküla 4 | {"stone":5.415} |
| 92.75 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 92.75 | Kadakaküla 1 → Kadakaküla 2 | {"water":2.7075} |
| 93 | Põhjaküla 4 → Põhjaküla 2 | {"vegetables":2.7075} |
| 93.2 | Kadakaküla 4 → Kadakaküla 1 | {"bread":1.805} |
| 93.25 | Põhjaküla 1 → Põhjaküla 2 | {"plank":3.61,"meat":2.7075} |
| 93.35 | Idaküla 1 → Idaküla 2 | {"meat":1.805} |
| 93.5 | Põhjaküla 4 → Põhjaküla 2 | {"vegetables":0.9025} |
| 93.5 | Põhjaküla 2 → Põhjaküla 3 | {"berries":3.61} |
| 93.6 | Kadakaküla 3 → Kadakaküla 4 | {"plank":18.05,"meat":3.61} |
| 93.7 | Idaküla 2 → Idaküla 1 | {"berries":2.7075} |
| 93.75 | Kadakaküla 1 → Kadakaküla 2 | {"water":2.7075} |
| 93.85 | Kadakaküla 4 → Kadakaküla 2 | {"water":0.9025} |
| 93.95 | Põhjaküla 4 → Põhjaküla 3 | {"vegetables":5.415} |
| 94 | Põhjaküla 1 → Põhjaküla 2 | {"plank":5.415} |
| 94.1 | Idaküla 2 → Idaküla 1 | {"berries":0.9025} |
| 94.2 | Põhjaküla 4 → Põhjaküla 3 | {"vegetables":0.9025} |
| 94.35 | Kadakaküla 2 → Kadakaküla 3 | {"stone":3.61} |
| 94.35 | Kadakaküla 3 → Kadakaküla 4 | {"plank":0.9025} |
| 94.35 | Kadakaküla 1 → Kadakaküla 3 | {"vegetables":0.9025} |
| 94.35 | Idaküla 1 → Idaküla 3 | {"plank":18.05,"meat":3.61,"stone":3.61} |
| 94.6 | Kadakaküla 4 → Kadakaküla 2 | {"water":2.7075} |
| 94.65 | Idaküla 3 → Idaküla 2 | {"bread":1.805} |
| 94.75 | Põhjaküla 1 → Põhjaküla 2 | {"plank":3.61} |
| 94.8 | Idaküla 1 → Idaküla 3 | {"plank":0.9025} |
| 94.95 | Põhjaküla 4 → Põhjaküla 1 | {"vegetables":0.9025} |
| 95.25 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 95.25 | Kadakaküla 1 → Kadakaküla 2 | {"vegetables":0.9025} |
| 95.3 | Kadakaküla 4 → Kadakaküla 3 | {"stone":0.9025} |
| 95.75 | Põhjaküla 4 → Põhjaküla 2 | {"vegetables":1.805} |
| 95.85 | Kadakaküla 1 → Kadakaküla 3 | {"stone":13.5375,"vegetables":0.9025} |
| 96.1 | Kadakaküla 4 → Kadakaküla 2 | {"water":0.9025} |
| 96.15 | Kadakaküla 3 → Kadakaküla 2 | {"water":2.7075} |
| 96.2 | Kadakaküla 5 → Kadakaküla 1 | {"bread":1.805} |
| 96.25 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805,"plank":6.3175} |
| 96.35 | Kadakaküla 1 → Kadakaküla 3 | {"stone":0.9025} |
| 96.6 | Kadakaküla 3 → Kadakaküla 1 | {"plank":0.9025} |
| 96.85 | Kadakaküla 4 → Kadakaküla 2 | {"water":2.7075} |
| 97 | Põhjaküla 1 → Põhjaküla 2 | {"meat":1.805} |
| 97.25 | Kadakaküla 1 → Kadakaküla 2 | {"vegetables":0.9025} |
| 97.3 | Kadakaküla 3 → Kadakaküla 4 | {"meat":0.9025} |
| 97.6 | Kadakaküla 4 → Kadakaküla 2 | {"water":3.61} |
| 97.65 | Kadakaküla 2 → Kadakaküla 3 | {"flax":3.61} |
| 97.7 | Kadakaküla 1 → Kadakaküla 4 | {"grain":9.025,"cutstone":4.5125,"vegetables":3.61,"cloth":1.805} |
| 97.7 | Kadakaküla 3 → Kadakaküla 5 | {"plank":18.05,"meat":3.61} |
| 97.8 | Põhjaküla 3 → Põhjaküla 1 | {"wood":8.1225} |
| 97.95 | Põhjaküla 1 → Põhjaküla 3 | {"water":1.805} |
| 97.95 | Kadakaküla 1 → Kadakaküla 4 | {"vegetables":0.9025} |
| 97.95 | Kadakaküla 3 → Kadakaküla 5 | {"plank":0.9025} |
| 98 | Idaküla 1 → Idaküla 3 | {"meat":0.9025} |
| 98.2 | Kadakaküla 1 → Kadakaküla 4 | {"grain":2.7075} |
| 98.25 | Põhjaküla 4 → Põhjaküla 2 | {"vegetables":1.805} |
| 98.5 | Kadakaküla 2 → Kadakaküla 1 | {"copper":2.7075,"flax":1.805} |
| 98.55 | Põhjaküla 3 → Põhjaküla 1 | {"wood":6.3175} |
| 98.6 | Kadakaküla 4 → Kadakaküla 2 | {"water":3.61} |
| 98.7 | Lõunaküla 2 → Lõunaküla 1 | {"bread":1.805} |
| 98.75 | Põhjaküla 2 → Põhjaküla 1 | {"berries":0.9025} |
| 98.75 | Põhjaküla 4 → Põhjaküla 2 | {"vegetables":0.9025} |
| 98.8 | Lõunaküla 1 → Lõunaküla 2 | {"plank":18.05,"grain":9.025,"meat":3.61,"fish":3.61,"stone":1.805} |
| 99 | Kadakaküla 1 → Kadakaküla 2 | {"vegetables":0.9025} |
| 99 | Põhjaküla 1 → Põhjaküla 2 | {"wood":6.3175} |
| 99.05 | Põhjaküla 3 → Põhjaküla 4 | {"wood":4.5125} |
| 99.2 | Põhjaküla 4 → Põhjaküla 3 | {"berries":1.805,"vegetables":0.9025,"water":2.7075} |
| 99.2 | Kadakaküla 3 → Kadakaküla 5 | {"meat":0.9025} |
| 99.35 | Kadakaküla 2 → Kadakaküla 4 | {"flax":2.7075} |
| 99.35 | Lõunaküla 1 → Lõunaküla 2 | {"stone":1.805,"plank":0.9025} |
| 99.5 | Põhjaküla 1 → Põhjaküla 2 | {"wood":10.83} |
| 99.55 | Põhjaküla 3 → Põhjaküla 4 | {"wood":8.1225} |
| 99.6 | Kadakaküla 4 → Kadakaküla 2 | {"water":1.805} |
| 99.85 | Lõunaküla 1 → Lõunaküla 2 | {"clay":2.7075,"wood":1.805} |
| 100 | Kadakaküla 1 → Kadakaküla 2 | {"water":1.805} |
| 100 | Põhjaküla 1 → Põhjaküla 2 | {"wood":4.5125} |
| 100.05 | Põhjaküla 3 → Põhjaküla 4 | {"wood":7.22} |
| 100.25 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 100.35 | Lõunaküla 1 → Lõunaküla 2 | {"wood":10.83} |
| 100.45 | Põhjaküla 1 → Põhjaküla 3 | {"water":2.7075} |
| 100.55 | Kadakaküla 3 → Kadakaküla 4 | {"meat":0.9025,"water":0.9025} |
| 100.55 | Põhjaküla 3 → Põhjaküla 1 | {"wood":2.7075} |
| 100.75 | Põhjaküla 1 → Põhjaküla 2 | {"meat":0.9025} |
| 100.95 | Kadakaküla 5 → Kadakaküla 2 | {"water":3.61} |
| 100.95 | Kadakaküla 3 → Kadakaküla 5 | {"cloth":1.805} |
| 101 | Kadakaküla 1 → Kadakaküla 2 | {"water":0.9025} |
| 101 | Põhjaküla 4 → Põhjaküla 2 | {"berries":1.805,"vegetables":0.9025} |
| 101.05 | Lõunaküla 3 → Lõunaküla 1 | {"bread":1.805} |
| 101.1 | Lõunaküla 1 → Lõunaküla 2 | {"stone":5.415} |
| 101.25 | Kadakaküla 2 → Kadakaküla 1 | {"copper":3.61} |
| 101.3 | Idaküla 3 → Idaküla 1 | {"berries":0.1525} |
| 101.35 | Idaküla 1 → Idaküla 2 | {"wood":5.415} |
| 101.45 | Põhjaküla 4 → Põhjaküla 1 | {"vegetables":1.805,"berries":0.9025} |
| 101.55 | Kadakaküla 3 → Kadakaküla 4 | {"meat":1.805,"water":1.805} |
| 101.55 | Lõunaküla 1 → Lõunaküla 3 | {"plank":18.05,"grain":9.025,"meat":3.61,"fish":3.61,"stone":1.805} |
| 101.6 | Kadakaküla 1 → Kadakaküla 3 | {"vegetables":0.9025} |
| 101.7 | Idaküla 3 → Idaküla 1 | {"berries":0.75} |
| 101.7 | Põhjaküla 4 → Põhjaküla 1 | {"berries":0.9025} |
| 101.7 | Põhjaküla 1 → Põhjaküla 3 | {"water":3.61} |
| 101.9 | Kadakaküla 4 → Kadakaküla 5 | {"grain":5.415} |
| 101.95 | Kadakaküla 5 → Kadakaküla 2 | {"water":3.61} |
| 102 | Põhjaküla 4 → Põhjaküla 2 | {"vegetables":1.805} |
| 102.05 | Idaküla 3 → Idaküla 1 | {"vegetables":0.9025} |
| 102.1 | Kadakaküla 1 → Kadakaküla 3 | {"vegetables":0.9025} |
| 102.1 | Idaküla 1 → Idaküla 2 | {"wood":7.22} |
| 102.1 | Lõunaküla 1 → Lõunaküla 2 | {"stone":9.9275} |
| 102.25 | Kadakaküla 2 → Kadakaküla 1 | {"tin":1.805,"flax":1.805} |
| 102.4 | Kadakaküla 4 → Kadakaküla 5 | {"grain":3.61} |
| 102.55 | Kadakaküla 3 → Kadakaküla 4 | {"water":2.7075} |
| 102.6 | Lõunaküla 1 → Lõunaküla 2 | {"meat":0.9025,"fish":0.9025,"stone":0.9025} |
| 102.75 | Idaküla 3 → Idaküla 1 | {"vegetables":0.9025} |
| 102.95 | Kadakaküla 5 → Kadakaküla 2 | {"water":3.61} |
| 102.95 | Põhjaküla 3 → Põhjaküla 1 | {"plank":1.805,"wood":0.9025} |
| 102.95 | Põhjaküla 1 → Põhjaküla 3 | {"water":2.7075} |
| 103 | Kadakaküla 1 → Kadakaküla 2 | {"plank":2.7075} |
| 103.05 | Lõunaküla 1 → Lõunaküla 3 | {"stone":1.805,"plank":0.9025} |
| 103.1 | Idaküla 1 → Idaküla 2 | {"wood":3.61} |
| 103.2 | Põhjaküla 3 → Põhjaküla 1 | {"plank":0.9025} |
| 103.25 | Kadakaküla 2 → Kadakaküla 1 | {"wood":8.1225} |
| 103.25 | Idaküla 3 → Idaküla 1 | {"vegetables":1.805} |
| 103.45 | Põhjaküla 3 → Põhjaküla 1 | {"plank":5.415,"wood":3.61} |
| 103.45 | Põhjaküla 1 → Põhjaküla 4 | {"meat":0.9025} |
| 103.55 | Kadakaküla 3 → Kadakaküla 4 | {"meat":0.9025,"water":1.805} |
| 103.7 | Lõunaküla 4 → Lõunaküla 1 | {"bread":1.805} |
| 103.7 | Lõunaküla 1 → Lõunaküla 4 | {"plank":18.05,"grain":9.025,"meat":3.61,"fish":3.61,"stone":1.805} |
| 103.75 | Idaküla 3 → Idaküla 1 | {"vegetables":0.9025} |
| 103.75 | Põhjaküla 3 → Põhjaküla 2 | {"wood":3.61} |
| 103.85 | Idaküla 1 → Idaküla 2 | {"wood":3.61} |
| 103.95 | Kadakaküla 5 → Kadakaküla 2 | {"water":3.61} |
| 103.95 | Lõunaküla 1 → Lõunaküla 4 | {"stone":1.805,"plank":0.9025} |
| 104 | Kadakaküla 1 → Kadakaküla 2 | {"water":1.805,"vegetables":0.9025} |
| 104 | Põhjaküla 1 → Põhjaküla 2 | {"wood":6.3175} |
| 104.2 | Põhjaküla 3 → Põhjaküla 1 | {"wood":2.7075} |
| 104.2 | Põhjaküla 4 → Põhjaküla 3 | {"water":2.7075} |
| 104.25 | Kadakaküla 2 → Kadakaküla 1 | {"copper":3.61,"flax":1.805} |
| 104.3 | Kadakaküla 3 → Kadakaküla 4 | {"meat":0.9025} |
| 104.5 | Põhjaküla 3 → Põhjaküla 2 | {"wood":11.7325} |
| 104.55 | Idaküla 3 → Idaküla 2 | {"vegetables":5.065} |
| 104.7 | Lõunaküla 1 → Lõunaküla 3 | {"meat":0.9025,"fish":0.9025} |
| 104.75 | Põhjaküla 1 → Põhjaküla 2 | {"wood":6.3175} |
| 104.85 | Idaküla 1 → Idaküla 2 | {"wood":4.5125} |
| 105 | Kadakaküla 1 → Kadakaküla 2 | {"wood":24.3675,"water":4.5125} |
| 105 | Põhjaküla 4 → Põhjaküla 2 | {"berries":0.9025} |
| 105.05 | Kadakaküla 3 → Kadakaküla 4 | {"water":2.7075} |
| 105.25 | Kadakaküla 2 → Kadakaküla 1 | {"tin":2.7075} |
| 105.25 | Põhjaküla 3 → Põhjaküla 2 | {"wood":4.5125} |
| 105.35 | Idaküla 3 → Idaküla 2 | {"vegetables":0.35} |
| 105.4 | Kadakaküla 4 → Kadakaküla 5 | {"grain":0.9025} |
| 105.45 | Põhjaküla 4 → Põhjaküla 3 | {"water":3.61,"berries":1.805,"vegetables":0.9025} |
| 105.5 | Põhjaküla 1 → Põhjaküla 2 | {"wood":7.22,"stone":12.635} |
| 105.6 | Idaküla 1 → Idaküla 2 | {"wood":3.61,"stone":3.61} |
| 105.7 | Põhjaküla 4 → Põhjaküla 3 | {"vegetables":0.9025} |
| 105.75 | Idaküla 3 → Idaküla 1 | {"vegetables":5.93} |
| 105.75 | Põhjaküla 3 → Põhjaküla 2 | {"wood":7.22} |
| 105.8 | Kadakaküla 3 → Kadakaküla 4 | {"water":2.7075} |
| 105.85 | Kadakaküla 5 → Kadakaküla 4 | {"plank":13.5375} |
| 106 | Kadakaküla 1 → Kadakaküla 2 | {"water":4.5125} |
| 106 | Põhjaküla 1 → Põhjaküla 2 | {"stone":0.9025} |
| 106.1 | Lõunaküla 1 → Lõunaküla 2 | {"meat":0.9025,"fish":0.9025} |
| 106.2 | Põhjaküla 4 → Põhjaküla 1 | {"berries":0.9025,"vegetables":0.9025} |
| 106.25 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 106.25 | Põhjaküla 3 → Põhjaküla 2 | {"wood":1.805} |
| 106.35 | Idaküla 1 → Idaküla 2 | {"wood":7.22} |
| 106.5 | Põhjaküla 1 → Põhjaküla 2 | {"wood":3.61,"stone":11.7325} |
| 106.6 | Lõunaküla 1 → Lõunaküla 2 | {"stone":12.635} |
| 106.7 | Idaküla 3 → Idaküla 1 | {"vegetables":3} |
| 106.7 | Põhjaküla 3 → Põhjaküla 1 | {"plank":8.1225} |
| 106.75 | Lõunaküla 3 → Lõunaküla 1 | {"vegetables":0.9025} |
| 106.75 | Põhjaküla 4 → Põhjaküla 2 | {"vegetables":1.805,"berries":0.9025} |
| 106.75 | Põhjaküla 2 → Põhjaküla 3 | {"water":2.7075} |
| 106.85 | Idaküla 1 → Idaküla 2 | {"clay":7.22,"stone":12.635} |
| 106.95 | Põhjaküla 3 → Põhjaküla 1 | {"plank":0.9025} |
| 107 | Kadakaküla 1 → Kadakaküla 2 | {"water":0.9025} |
| 107 | Põhjaküla 1 → Põhjaküla 2 | {"wood":4.5125} |
| 107.15 | Kadakaküla 3 → Kadakaküla 2 | {"water":3.61} |
| 107.2 | Põhjaküla 3 → Põhjaküla 1 | {"wood":2.7075} |
| 107.2 | Põhjaküla 4 → Põhjaküla 3 | {"water":0.9025} |
| 107.25 | Kadakaküla 2 → Kadakaküla 1 | {"copper":3.61,"flax":0.9025} |
| 107.35 | Idaküla 1 → Idaküla 2 | {"wood":3.61} |
| 107.35 | Kadakaküla 4 → Kadakaküla 5 | {"grain":0.9025} |
| 107.45 | Põhjaküla 3 → Põhjaküla 4 | {"wood":7.22} |
| 107.45 | Lõunaküla 1 → Lõunaküla 4 | {"meat":0.9025,"fish":0.9025} |
| 107.5 | Lõunaküla 3 → Lõunaküla 1 | {"vegetables":4.5125} |
| 107.5 | Põhjaküla 1 → Põhjaküla 2 | {"wood":9.9275} |
| 107.6 | Kadakaküla 3 → Kadakaküla 1 | {"coal":9.025} |
| 107.75 | Idaküla 1 → Idaküla 3 | {"clay":7.22} |
| 107.85 | Lõunaküla 1 → Lõunaküla 2 | {"stone":11.7325} |
| 107.95 | Idaküla 3 → Idaküla 1 | {"vegetables":1.9} |
| 107.95 | Põhjaküla 3 → Põhjaküla 1 | {"wood":6.3175} |
| 107.95 | Põhjaküla 1 → Põhjaküla 3 | {"water":2.7075} |
| 108 | Kadakaküla 1 → Kadakaküla 2 | {"water":3.61} |
| 108.05 | Põhjaküla 2 → Põhjaküla 4 | {"wood":9.025} |
| 108.1 | Kadakaküla 5 → Kadakaküla 4 | {"meat":0.9025} |
| 108.2 | Põhjaküla 1 → Põhjaküla 4 | {"wood":9.9275} |
| 108.25 | Kadakaküla 2 → Kadakaküla 1 | {"tin":2.7075,"flax":1.805} |
| 108.25 | Idaküla 3 → Idaküla 1 | {"vegetables":2.7075} |
| 108.35 | Idaküla 1 → Idaküla 2 | {"wood":3.61} |
| 108.35 | Lõunaküla 1 → Lõunaküla 2 | {"clay":4.5125,"stone":0.9025} |
| 108.4 | Lõunaküla 3 → Lõunaküla 2 | {"berries":0.9025,"vegetables":5.415} |
| 108.45 | Põhjaküla 3 → Põhjaküla 4 | {"coal":4.5125} |
| 108.5 | Põhjaküla 2 → Põhjaküla 1 | {"wood":5.415} |
| 108.5 | Põhjaküla 1 → Põhjaküla 2 | {"coal":4.5125} |
| 108.7 | Lõunaküla 3 → Lõunaküla 1 | {"vegetables":3.61} |
| 108.7 | Lõunaküla 1 → Lõunaküla 3 | {"clay":6.3175} |
| 108.85 | Idaküla 1 → Idaküla 2 | {"wood":7.22} |
| 108.85 | Kadakaküla 4 → Kadakaküla 5 | {"plank":12.635} |
| 108.9 | Kadakaküla 3 → Kadakaküla 2 | {"coal":4.5125} |
| 108.95 | Lõunaküla 3 → Lõunaküla 1 | {"vegetables":0.9025} |
| 108.95 | Põhjaküla 1 → Põhjaküla 4 | {"wood":5.415} |
| 109 | Kadakaküla 1 → Kadakaküla 2 | {"water":6.3175,"vegetables":0.9025} |
| 109.2 | Põhjaküla 4 → Põhjaküla 3 | {"water":3.61} |
| 109.25 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805,"copper":0.9025} |
| 109.25 | Põhjaküla 2 → Põhjaküla 1 | {"wood":1.805} |
| 109.25 | Põhjaküla 1 → Põhjaküla 2 | {"coal":4.5125} |
| 109.3 | Idaküla 3 → Idaküla 2 | {"vegetables":0.9025} |
| 109.35 | Kadakaküla 4 → Kadakaküla 5 | {"grain":2.7075} |
| 109.45 | Põhjaküla 3 → Põhjaküla 4 | {"meat":0.9025} |
| 109.45 | Lõunaküla 3 → Lõunaküla 1 | {"vegetables":1.669643} |
| 109.6 | Kadakaküla 1 → Kadakaküla 3 | {"vegetables":1.805} |
| 109.7 | Põhjaküla 3 → Põhjaküla 1 | {"wood":0.9025} |
| 109.8 | Põhjaküla 2 → Põhjaküla 4 | {"wood":22.5625} |
| 109.85 | Idaküla 1 → Idaküla 2 | {"wood":3.61} |
| 109.95 | Põhjaküla 1 → Põhjaküla 4 | {"coal":4.5125,"stone":9.9275} |
| 109.95 | Kadakaküla 1 → Kadakaküla 4 | {"wood":36.1} |
| 109.95 | Lõunaküla 4 → Lõunaküla 2 | {"berries":0.9025} |
| 110.1 | Lõunaküla 2 → Lõunaküla 1 | {"wood":3.61} |
| 110.15 | Kadakaküla 3 → Kadakaküla 2 | {"water":4.5125} |
| 110.2 | Põhjaküla 1 → Põhjaküla 4 | {"wood":2.7075,"stone":0.9025} |
| 110.3 | Idaküla 3 → Idaküla 2 | {"vegetables":0.9025} |
| 110.35 | Kadakaküla 4 → Kadakaküla 5 | {"grain":1.805} |
| 110.45 | Lõunaküla 3 → Lõunaküla 1 | {"vegetables":2.842857} |
| 110.45 | Põhjaküla 3 → Põhjaküla 1 | {"wood":1.805} |
| 110.45 | Põhjaküla 1 → Põhjaküla 3 | {"water":3.61} |
| 110.45 | Lõunaküla 1 → Lõunaküla 3 | {"wood":9.025,"clay":0.9025} |
| 110.45 | Lõunaküla 2 → Lõunaküla 4 | {"wood":10.83} |
| 110.55 | Põhjaküla 2 → Põhjaküla 4 | {"wood":11.7325} |
| 110.6 | Idaküla 1 → Idaküla 2 | {"wood":3.61,"stone":12.635} |
| 110.65 | Kadakaküla 2 → Kadakaküla 3 | {"copper":2.7075,"flax":3.61} |
| 110.7 | Põhjaküla 1 → Põhjaküla 4 | {"stone":12.635,"wood":9.025} |
| 110.75 | Kadakaküla 1 → Kadakaküla 2 | {"water":4.5125} |
| 110.75 | Põhjaküla 4 → Põhjaküla 2 | {"berries":0.9025,"vegetables":0.9025} |
| 110.85 | Kadakaküla 4 → Kadakaküla 5 | {"wood":7.22} |
| 110.85 | Lõunaküla 1 → Lõunaküla 2 | {"cutstone":0.9025} |
| 110.95 | Lõunaküla 4 → Lõunaküla 2 | {"vegetables":0.9025} |
| 111.05 | Idaküla 3 → Idaküla 2 | {"stone":0.9025} |
| 111.05 | Lõunaküla 2 → Lõunaküla 3 | {"wood":0.9025} |
| 111.1 | Idaküla 1 → Idaküla 2 | {"wood":8.1225} |
| 111.2 | Põhjaküla 3 → Põhjaküla 1 | {"wood":1.805} |
| 111.2 | Põhjaküla 1 → Põhjaküla 4 | {"stone":11.7325} |
| 111.35 | Lõunaküla 1 → Lõunaküla 2 | {"fish":0.9025} |
| 111.4 | Kadakaküla 3 → Kadakaküla 2 | {"water":0.9025} |
| 111.45 | Põhjaküla 1 → Põhjaküla 4 | {"wood":9.9275,"stone":0.9025} |
| 111.5 | Kadakaküla 2 → Kadakaküla 1 | {"tin":2.7075,"flax":1.805} |
| 111.6 | Kadakaküla 4 → Kadakaküla 5 | {"wood":7.22} |
| 111.7 | Lõunaküla 3 → Lõunaküla 1 | {"berries":4.5125} |
| 111.7 | Põhjaküla 3 → Põhjaküla 1 | {"wood":2.7075} |
| 111.7 | Põhjaküla 4 → Põhjaküla 3 | {"water":3.61,"berries":0.9025,"vegetables":0.9025} |
| 111.7 | Kadakaküla 3 → Kadakaküla 5 | {"water":16.245,"cloth":0.9025,"coal":4.5125,"wood":12.635} |
| 111.7 | Lõunaküla 1 → Lõunaküla 3 | {"wood":8.1225} |
| 111.75 | Kadakaküla 1 → Kadakaküla 2 | {"water":4.5125} |
| 111.75 | Põhjaküla 1 → Põhjaküla 2 | {"plank":13.5375} |
| 111.8 | Lõunaküla 2 → Lõunaküla 3 | {"wood":18.05} |
| 111.85 | Idaküla 1 → Idaküla 2 | {"wood":7.22} |
| 111.85 | Kadakaküla 5 → Kadakaküla 4 | {"plank":12.635} |
| 111.95 | Lõunaküla 3 → Lõunaküla 1 | {"berries":0.9025,"vegetables":0.9025} |
| 111.95 | Lõunaküla 1 → Lõunaküla 4 | {"clay":7.22} |
| 112 | Põhjaküla 3 → Põhjaküla 2 | {"wood":21.66,"plank":0.9025} |
| 112.25 | Põhjaküla 1 → Põhjaküla 2 | {"wood":0.9025} |
| 112.3 | Kadakaküla 3 → Kadakaküla 4 | {"water":16.245,"coal":9.025,"cloth":0.9025,"wood":9.9275} |
| 112.35 | Idaküla 1 → Idaküla 2 | {"wood":4.5125} |
| 112.35 | Kadakaküla 4 → Kadakaküla 5 | {"grain":3.61} |
| 112.45 | Põhjaküla 4 → Põhjaküla 1 | {"berries":0.9025,"vegetables":0.9025} |
| 112.45 | Lõunaküla 1 → Lõunaküla 3 | {"stone":9.9275} |
| 112.5 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 112.5 | Põhjaküla 3 → Põhjaküla 2 | {"wood":13.5375} |
| 112.55 | Lõunaküla 2 → Lõunaküla 3 | {"wood":20.7575} |
| 112.7 | Põhjaküla 4 → Põhjaküla 1 | {"wood":0.9025} |
| 112.75 | Kadakaküla 1 → Kadakaküla 2 | {"water":4.5125} |
| 112.75 | Põhjaküla 1 → Põhjaküla 2 | {"stone":14.44} |
| 112.85 | Idaküla 1 → Idaküla 2 | {"grain":1.805} |
| 112.95 | Põhjaküla 4 → Põhjaküla 3 | {"water":3.61} |
| 112.95 | Lõunaküla 1 → Lõunaküla 3 | {"stone":12.635} |
| 112.95 | Lõunaküla 2 → Lõunaküla 4 | {"wood":9.9275} |
| 113 | Põhjaküla 3 → Põhjaküla 2 | {"wood":8.1225} |
| 113.05 | Kadakaküla 3 → Kadakaküla 4 | {"wood":27.9775} |
| 113.2 | Lõunaküla 1 → Lõunaküla 3 | {"wood":10.83,"stone":0.9025} |
| 113.2 | Lõunaküla 2 → Lõunaküla 4 | {"wood":10.83} |
| 113.25 | Põhjaküla 1 → Põhjaküla 2 | {"stone":0.9025} |
| 113.35 | Idaküla 1 → Idaküla 2 | {"grain":1.805} |
| 113.45 | Kadakaküla 3 → Kadakaküla 5 | {"water":5.415} |
| 113.45 | Lõunaküla 1 → Lõunaküla 3 | {"wood":0.9025,"stone":11.7325} |
| 113.45 | Lõunaküla 2 → Lõunaküla 4 | {"wood":0.9025} |
| 113.5 | Kadakaküla 2 → Kadakaküla 1 | {"tin":2.7075} |
| 113.6 | Kadakaküla 5 → Kadakaküla 4 | {"plank":16.245} |
| 113.7 | Põhjaküla 1 → Põhjaküla 4 | {"plank":13.5375,"wood":14.44} |
| 113.7 | Lõunaküla 1 → Lõunaküla 3 | {"wood":10.83,"stone":0.9025} |
| 113.7 | Lõunaküla 2 → Lõunaküla 4 | {"wood":7.22} |
| 113.75 | Kadakaküla 1 → Kadakaküla 2 | {"water":4.5125} |
| 113.95 | Põhjaküla 1 → Põhjaküla 4 | {"wood":0.9025} |
| 113.95 | Lõunaküla 1 → Lõunaküla 4 | {"stone":12.635} |
| 114.05 | Kadakaküla 3 → Kadakaküla 4 | {"cloth":0.9025,"water":3.61,"wood":2.7075} |
| 114.1 | Idaküla 1 → Idaküla 2 | {"wood":7.22} |
| 114.2 | Põhjaküla 1 → Põhjaküla 3 | {"water":3.61,"wood":2.7075} |
| 114.3 | Lõunaküla 2 → Lõunaküla 3 | {"wood":7.22} |
| 114.35 | Lõunaküla 1 → Lõunaküla 2 | {"wood":1.805} |
| 114.5 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 114.7 | Kadakaküla 4 → Kadakaküla 1 | {"ore":5.415} |
| 114.75 | Kadakaküla 1 → Kadakaküla 2 | {"water":6.3175,"vegetables":1.805} |
| 114.85 | Idaküla 1 → Idaküla 2 | {"wood":7.22} |
| 114.85 | Lõunaküla 1 → Lõunaküla 2 | {"wood":16.245,"plank":13.5375} |
| 114.95 | Põhjaküla 3 → Põhjaküla 1 | {"wood":2.7075} |
| 115.05 | Lõunaküla 2 → Lõunaküla 3 | {"stone":12.635} |
| 115.35 | Kadakaküla 5 → Kadakaküla 4 | {"meat":0.9025} |
| 115.35 | Lõunaküla 1 → Lõunaküla 2 | {"wood":10.83} |
| 115.4 | Kadakaküla 3 → Kadakaküla 2 | {"water":0.9025} |
| 115.45 | Põhjaküla 1 → Põhjaküla 3 | {"water":3.61} |
| 115.6 | Idaküla 1 → Idaküla 2 | {"wood":4.5125} |
| 115.7 | Lõunaküla 1 → Lõunaküla 3 | {"wood":15.3425} |
| 115.7 | Lõunaküla 2 → Lõunaküla 4 | {"wood":12.635,"stone":11.7325} |
| 115.75 | Kadakaküla 1 → Kadakaküla 2 | {"water":4.5125} |
| 115.9 | Kadakaküla 2 → Kadakaküla 3 | {"flax":3.61,"copper":1.805} |
| 115.95 | Lõunaküla 4 → Lõunaküla 2 | {"vegetables":0.9025,"water":1.805} |
| 115.95 | Lõunaküla 1 → Lõunaküla 3 | {"meat":0.9025,"fish":0.9025,"wood":0.9025} |
| 115.95 | Lõunaküla 2 → Lõunaküla 4 | {"wood":0.9025,"stone":0.9025} |
| 116.05 | Kadakaküla 3 → Kadakaküla 4 | {"water":5.415} |
| 116.2 | Lõunaküla 2 → Lõunaküla 4 | {"wood":7.22} |
| 116.35 | Idaküla 1 → Idaküla 2 | {"wood":3.61} |
| 116.35 | Lõunaküla 1 → Lõunaküla 2 | {"fish":0.9025} |
| 116.45 | Kadakaküla 4 → Kadakaküla 1 | {"ore":5.415} |
| 116.7 | Põhjaküla 1 → Põhjaküla 3 | {"water":6.3175} |
| 116.7 | Lõunaküla 1 → Lõunaküla 3 | {"wood":26.1725} |
| 116.75 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805,"tin":1.805} |
| 116.75 | Kadakaküla 1 → Kadakaküla 2 | {"water":5.415} |
| 116.8 | Kadakaküla 3 → Kadakaküla 4 | {"water":3.61} |
| 116.8 | Lõunaküla 2 → Lõunaküla 3 | {"plank":13.5375} |
| 116.95 | Põhjaküla 4 → Põhjaküla 3 | {"berries":0.9025,"vegetables":0.9025} |
| 116.95 | Lõunaküla 1 → Lõunaküla 3 | {"wood":5.415} |
| 117 | Idaküla 3 → Idaküla 1 | {"vegetables":0.9025} |
| 117.1 | Idaküla 1 → Idaküla 2 | {"wood":7.22} |
| 117.2 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 117.45 | Lõunaküla 1 → Lõunaküla 3 | {"stone":14.44,"wood":17.1475} |
| 117.45 | Lõunaküla 2 → Lõunaküla 4 | {"meat":0.9025,"wood":0.9025} |
| 117.55 | Kadakaküla 3 → Kadakaküla 4 | {"cloth":0.9025,"water":3.61} |
| 117.7 | Lõunaküla 1 → Lõunaküla 3 | {"stone":0.9025,"wood":1.805} |
| 117.75 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 117.75 | Kadakaküla 1 → Kadakaküla 2 | {"water":4.5125} |
| 117.85 | Idaküla 1 → Idaküla 2 | {"wood":3.61} |
| 117.95 | Põhjaküla 1 → Põhjaküla 3 | {"water":3.61} |
| 117.95 | Lõunaküla 4 → Lõunaküla 2 | {"plank":4.5125} |
| 117.95 | Lõunaküla 1 → Lõunaküla 4 | {"fish":0.9025} |
| 118.2 | Põhjaküla 1 → Põhjaküla 3 | {"water":0.9025} |
| 118.2 | Lõunaküla 4 → Lõunaküla 2 | {"plank":6.3175} |
| 118.35 | Idaküla 1 → Idaküla 2 | {"wood":0.9025} |
| 118.45 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 118.6 | Kadakaküla 4 → Kadakaküla 2 | {"ore":2.7075} |
| 118.6 | Kadakaküla 1 → Kadakaküla 3 | {"vegetables":0.9025} |
| 118.6 | Kadakaküla 2 → Kadakaküla 4 | {"copper":4.5125,"tin":0.9025,"flax":0.9025} |
| 118.7 | Põhjaküla 4 → Põhjaküla 1 | {"vegetables":0.9025} |
| 118.8 | Idaküla 3 → Idaküla 2 | {"plank":13.5375} |
| 118.85 | Idaküla 1 → Idaküla 2 | {"wood":3.61} |
| 118.9 | Kadakaküla 3 → Kadakaküla 2 | {"water":0.9025} |
| 119.2 | Põhjaküla 1 → Põhjaküla 3 | {"water":3.61} |
| 119.45 | Lõunaküla 3 → Lõunaküla 1 | {"vegetables":0.9025} |
| 119.45 | Lõunaküla 1 → Lõunaküla 4 | {"plank":12.635,"wood":22.5625} |
| 119.5 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 119.5 | Kadakaküla 1 → Kadakaküla 2 | {"water":4.5125} |
| 119.6 | Idaküla 1 → Idaküla 2 | {"wood":3.61} |
| 119.7 | Lõunaküla 4 → Lõunaküla 2 | {"water":3.61} |
| 119.7 | Lõunaküla 1 → Lõunaküla 4 | {"plank":0.9025} |
| 120 | Idaküla 1 → Idaküla 3 | {"plank":15.3425} |
| 120.1 | Kadakaküla 1 → Kadakaküla 3 | {"vegetables":1.805} |
| 120.15 | Kadakaküla 3 → Kadakaküla 2 | {"water":7.22} |
| 120.35 | Kadakaküla 4 → Kadakaküla 2 | {"ore":5.415} |
| 120.35 | Kadakaküla 2 → Kadakaküla 4 | {"tin":2.7075} |
| 120.35 | Kadakaküla 5 → Kadakaküla 4 | {"meat":0.9025} |
| 120.45 | Põhjaküla 3 → Põhjaküla 1 | {"gems":1.805} |
| 120.45 | Põhjaküla 1 → Põhjaküla 3 | {"water":4.5125} |
| 120.45 | Kadakaküla 3 → Kadakaküla 5 | {"water":16.245,"cloth":0.9025} |
| 120.6 | Lõunaküla 2 → Lõunaküla 1 | {"coal":4.5125} |
| 120.6 | Idaküla 1 → Idaküla 2 | {"wood":7.22} |
| 120.7 | Kadakaküla 4 → Kadakaküla 1 | {"flour":5.415} |
| 120.7 | Lõunaküla 4 → Lõunaküla 2 | {"plank":9.9275} |
| 120.95 | Lõunaküla 4 → Lõunaküla 2 | {"plank":4.5125,"water":2.7075} |
| 120.95 | Lõunaküla 1 → Lõunaküla 3 | {"meat":0.9025,"fish":0.9025} |
| 121 | Kadakaküla 1 → Kadakaküla 2 | {"water":5.415,"vegetables":0.9025} |
| 121.05 | Kadakaküla 3 → Kadakaküla 4 | {"water":9.9275} |
| 121.1 | Lõunaküla 2 → Lõunaküla 1 | {"coal":4.5125} |
| 121.1 | Idaküla 1 → Idaküla 2 | {"wood":7.22} |
| 121.35 | Kadakaküla 4 → Kadakaküla 2 | {"flour":3.61,"ore":0.9025} |
| 121.45 | Põhjaküla 3 → Põhjaküla 1 | {"gems":1.805} |
| 121.45 | Lõunaküla 1 → Lõunaküla 4 | {"stone":14.44,"wood":15.3425} |
| 121.65 | Kadakaküla 2 → Kadakaküla 3 | {"tin":0.9025,"flax":3.61} |
| 121.7 | Põhjaküla 1 → Põhjaküla 3 | {"water":4.5125} |
| 121.7 | Lõunaküla 1 → Lõunaküla 4 | {"stone":0.9025,"wood":0.9025} |
| 121.75 | Põhjaküla 3 → Põhjaküla 2 | {"gems":3.61} |
| 121.8 | Kadakaküla 3 → Kadakaküla 4 | {"cloth":0.9025,"water":3.61} |
| 121.85 | Idaküla 1 → Idaküla 2 | {"wood":4.5125} |
| 122 | Kadakaküla 1 → Kadakaküla 2 | {"water":5.415} |
| 122.05 | Lõunaküla 2 → Lõunaküla 3 | {"coal":4.5125} |
| 122.1 | Kadakaküla 4 → Kadakaküla 2 | {"flour":5.415,"ore":1.805} |
| 122.2 | Põhjaküla 3 → Põhjaküla 4 | {"gems":3.61} |
| 122.2 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 122.45 | Kadakaküla 1 → Kadakaküla 4 | {"vegetables":5.415} |
| 122.45 | Lõunaküla 1 → Lõunaküla 4 | {"meat":0.9025,"fish":0.9025} |
| 122.5 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 122.55 | Kadakaküla 3 → Kadakaküla 4 | {"water":4.5125} |
| 122.7 | Lõunaküla 2 → Lõunaküla 4 | {"coal":4.5125} |
| 122.75 | Idaküla 3 → Idaküla 1 | {"ore":10.83} |
| 122.85 | Kadakaküla 4 → Kadakaküla 2 | {"ore":2.7075} |
| 122.85 | Idaküla 1 → Idaküla 2 | {"wood":3.61} |
| 122.95 | Põhjaküla 1 → Põhjaküla 3 | {"water":3.61} |
| 122.95 | Kadakaküla 3 → Kadakaküla 5 | {"water":6.3175} |
| 122.95 | Lõunaküla 2 → Lõunaküla 4 | {"coal":4.5125} |
| 123.2 | Kadakaküla 4 → Kadakaküla 1 | {"flour":0.488571} |
| 123.2 | Põhjaküla 1 → Põhjaküla 3 | {"water":0.9025} |
| 123.25 | Kadakaküla 1 → Kadakaküla 2 | {"water":5.415} |
| 123.25 | Idaküla 3 → Idaküla 1 | {"ore":3.61} |
| 123.45 | Lõunaküla 4 → Lõunaküla 2 | {"water":3.61} |
| 123.5 | Kadakaküla 2 → Kadakaküla 1 | {"flax":2.7075} |
| 123.6 | Idaküla 1 → Idaküla 2 | {"wood":6.3175} |
| 123.8 | Kadakaküla 4 → Kadakaküla 1 | {"flour":3.121429} |
| 124.05 | Idaküla 3 → Idaküla 2 | {"ore":10.83} |
| 124.15 | Kadakaküla 3 → Kadakaküla 2 | {"water":5.415} |
| 124.2 | Põhjaküla 1 → Põhjaküla 3 | {"stone":21.66,"water":3.61} |
| 124.25 | Kadakaküla 1 → Kadakaküla 2 | {"water":0.9025} |
| 124.35 | Idaküla 1 → Idaküla 2 | {"wood":5.415} |
| 124.35 | Kadakaküla 5 → Kadakaküla 4 | {"meat":1.805} |
| 124.45 | Põhjaküla 1 → Põhjaküla 3 | {"stone":24.3675} |
| 124.5 | Kadakaküla 2 → Kadakaküla 1 | {"iron":0.9025,"flax":1.805} |
| 124.55 | Kadakaküla 4 → Kadakaküla 3 | {"ore":3.61} |
| 124.6 | Kadakaküla 4 → Kadakaküla 3 | {"flour":0.9025} |
| 124.6 | Kadakaküla 3 → Kadakaküla 1 | {"berries":2.7075} |
| 124.7 | Põhjaküla 1 → Põhjaküla 3 | {"stone":0.9025} |
| 124.7 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 124.95 | Lõunaküla 3 → Lõunaküla 1 | {"wood":36.1} |
| 124.95 | Põhjaküla 3 → Põhjaküla 1 | {"vegetables":1.805} |
| 124.95 | Põhjaküla 1 → Põhjaküla 3 | {"stone":14.44,"wood":7.22} |
| 125.1 | Idaküla 1 → Idaküla 2 | {"wood":7.22} |
| 125.2 | Lõunaküla 3 → Lõunaküla 1 | {"wood":6.3175} |
| 125.2 | Põhjaküla 1 → Põhjaküla 3 | {"stone":0.9025} |
| 125.25 | Kadakaküla 1 → Kadakaküla 2 | {"water":5.415} |
| 125.3 | Kadakaküla 4 → Kadakaküla 3 | {"flour":3.61} |
| 125.3 | Kadakaküla 3 → Kadakaküla 4 | {"water":9.025,"cloth":0.9025} |
| 125.45 | Põhjaküla 1 → Põhjaküla 3 | {"water":4.5125} |
| 125.5 | Kadakaküla 2 → Kadakaküla 1 | {"iron":2.7075} |
| 125.75 | Idaküla 3 → Idaküla 1 | {"vegetables":0.9025} |
| 125.85 | Kadakaküla 1 → Kadakaküla 3 | {"vegetables":0.9025} |
| 125.85 | Idaküla 1 → Idaküla 2 | {"wood":3.61} |
| 125.95 | Lõunaküla 3 → Lõunaküla 1 | {"wood":0.9025} |
| 125.95 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 125.95 | Lõunaküla 1 → Lõunaküla 3 | {"meat":0.9025,"fish":0.9025} |
| 126.05 | Kadakaküla 3 → Kadakaküla 4 | {"water":4.5125} |
| 126.1 | Kadakaküla 4 → Kadakaküla 2 | {"ore":8.1225} |
| 126.5 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 126.6 | Idaküla 1 → Idaküla 2 | {"wood":4.5125} |
| 126.7 | Põhjaküla 1 → Põhjaküla 3 | {"water":4.5125} |
| 126.75 | Kadakaküla 1 → Kadakaküla 2 | {"water":10.83} |
| 126.8 | Kadakaküla 3 → Kadakaküla 4 | {"water":4.5125} |
| 126.85 | Kadakaküla 4 → Kadakaküla 2 | {"ore":0.9025} |
| 127.2 | Lõunaküla 4 → Lõunaküla 2 | {"water":3.61} |
| 127.35 | Kadakaküla 3 → Kadakaküla 1 | {"berries":4.5125} |
| 127.35 | Idaküla 1 → Idaküla 2 | {"wood":3.61} |
| 127.45 | Idaküla 1 → Idaküla 2 | {"grain":0.865} |
| 127.45 | Lõunaküla 1 → Lõunaküla 4 | {"meat":0.9025,"fish":0.9025} |
| 127.5 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 127.55 | Kadakaküla 4 → Kadakaküla 3 | {"ore":7.22,"flour":4.5125} |
| 127.75 | Kadakaküla 1 → Kadakaküla 2 | {"water":5.415} |
| 127.8 | Idaküla 1 → Idaküla 2 | {"grain":4.2} |
| 127.95 | Kadakaküla 4 → Kadakaküla 1 | {"flour":4.5125} |
| 127.95 | Põhjaküla 1 → Põhjaküla 3 | {"water":3.61} |
| 128.05 | Kadakaküla 3 → Kadakaküla 4 | {"water":3.61} |
| 128.2 | Lõunaküla 3 → Lõunaküla 1 | {"vegetables":1.805} |
| 128.2 | Kadakaküla 4 → Kadakaküla 1 | {"flour":0.9025} |
| 128.3 | Idaküla 1 → Idaküla 2 | {"grain":0.35} |
| 128.35 | Kadakaküla 5 → Kadakaküla 4 | {"wood":1.805} |
| 128.45 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 128.75 | Kadakaküla 1 → Kadakaküla 2 | {"water":5.415} |
| 128.8 | Kadakaküla 3 → Kadakaküla 4 | {"wood":22.5625,"water":4.5125} |
| 128.85 | Kadakaküla 4 → Kadakaküla 2 | {"ore":2.7075} |
| 128.85 | Idaküla 1 → Idaküla 2 | {"wood":14.44} |
| 128.85 | Lõunaküla 1 → Lõunaküla 2 | {"cutstone":2.7075} |
| 128.85 | Lõunaküla 4 → Lõunaküla 3 | {"vegetables":0.9025} |
| 128.9 | Kadakaküla 2 → Kadakaküla 3 | {"flax":4.5125,"tin":2.7075} |
| 129.2 | Kadakaküla 4 → Kadakaküla 1 | {"flour":3.61} |
| 129.2 | Põhjaküla 1 → Põhjaküla 3 | {"water":4.5125} |
| 129.35 | Idaküla 1 → Idaküla 2 | {"wood":4.5125} |
| 129.55 | Kadakaküla 3 → Kadakaküla 4 | {"water":4.5125} |
| 129.6 | Lõunaküla 1 → Lõunaküla 2 | {"copper":2.7075,"cutstone":0.9025} |
| 129.7 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 129.75 | Kadakaküla 1 → Kadakaküla 2 | {"water":5.415} |
| 129.75 | Idaküla 1 → Idaküla 3 | {"grain":0.9025} |
| 129.85 | Kadakaküla 4 → Kadakaküla 2 | {"flour":9.025} |
| 129.95 | Kadakaküla 2 → Kadakaküla 5 | {"cutstone":4.5125,"copper":4.5125,"tin":3.61,"flax":5.415,"cloth":0.9025,"wood":6.3175} |
| 129.95 | Lõunaküla 1 → Lõunaküla 3 | {"cutstone":1.805,"fish":1.805} |
| 130.05 | Lõunaküla 2 → Lõunaküla 3 | {"meat":2.7075} |
| 130.2 | Kadakaküla 1 → Kadakaküla 4 | {"cloth":0.9025,"water":4.5125,"vegetables":1.805,"wood":2.7075} |
| 130.3 | Kadakaküla 3 → Kadakaküla 4 | {"berries":5.415,"wood":30.685} |
| 130.35 | Idaküla 1 → Idaküla 2 | {"wood":3.61} |
| 130.45 | Põhjaküla 1 → Põhjaküla 3 | {"water":4.5125} |
| 130.45 | Kadakaküla 1 → Kadakaküla 5 | {"water":16.245,"vegetables":6.3175,"wood":13.5375} |
| 130.55 | Kadakaküla 4 → Kadakaküla 3 | {"flour":2.2625} |
| 130.6 | Kadakaküla 4 → Kadakaküla 3 | {"flour":2.25} |
| 130.7 | Kadakaküla 1 → Kadakaküla 4 | {"wood":36.1} |
| 130.75 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 130.8 | Idaküla 3 → Idaküla 2 | {"wood":2.7075} |
| 130.85 | Idaküla 1 → Idaküla 2 | {"wood":3.61} |
| 130.95 | Kadakaküla 1 → Kadakaküla 4 | {"wood":2.7075} |
| 130.95 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 131.1 | Kadakaküla 4 → Kadakaküla 5 | {"flour":9.025,"ore":10.83} |
| 131.2 | Kadakaküla 1 → Kadakaküla 4 | {"water":3.61} |
| 131.2 | Lõunaküla 4 → Lõunaküla 2 | {"water":0.9025} |
| 131.25 | Idaküla 1 → Idaküla 3 | {"grain":3.61} |
| 131.45 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 131.45 | Kadakaküla 1 → Kadakaküla 4 | {"water":0.9025} |
| 131.65 | Kadakaküla 3 → Kadakaküla 2 | {"berries":0.9025} |
| 131.7 | Põhjaküla 1 → Põhjaküla 3 | {"water":3.61} |
| 131.7 | Kadakaküla 1 → Kadakaküla 4 | {"water":0.9025} |
| 131.75 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 131.85 | Kadakaküla 4 → Kadakaküla 2 | {"ore":2.7075} |
| 131.85 | Idaküla 1 → Idaküla 2 | {"wood":10.83} |
| 131.95 | Põhjaküla 1 → Põhjaküla 3 | {"water":0.9025} |
| 131.95 | Kadakaküla 1 → Kadakaküla 4 | {"wood":36.1} |
| 131.95 | Kadakaküla 3 → Kadakaküla 5 | {"cloth":0.9025,"wood":19.855,"water":2.7075} |
| 132.1 | Lõunaküla 1 → Lõunaküla 2 | {"pottery":0.9025,"copper":1.805} |
| 132.2 | Kadakaküla 3 → Kadakaküla 5 | {"wood":20.7575,"water":2.7075} |
| 132.2 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 132.25 | Idaküla 3 → Idaküla 1 | {"coal":4.5125} |
| 132.35 | Lõunaküla 2 → Lõunaküla 1 | {"ore":5.415} |
| 132.35 | Idaküla 1 → Idaküla 2 | {"wood":5.415} |
| 132.35 | Kadakaküla 5 → Kadakaküla 4 | {"meat":0.9025} |
| 132.45 | Lõunaküla 3 → Lõunaküla 1 | {"flax":3.61} |
| 132.45 | Põhjaküla 3 → Põhjaküla 1 | {"vegetables":0.9025} |
| 132.45 | Lõunaküla 1 → Lõunaküla 3 | {"copper":4.5125,"cutstone":2.7075} |
| 132.7 | Kadakaküla 5 → Kadakaküla 1 | {"fruit":3.61} |
| 132.7 | Lõunaküla 1 → Lõunaküla 4 | {"copper":0.9025} |
| 132.75 | Kadakaküla 1 → Kadakaküla 2 | {"water":3.61} |
| 132.85 | Lõunaküla 2 → Lõunaküla 1 | {"ore":9.025} |
| 132.85 | Idaküla 1 → Idaküla 2 | {"wood":4.5125} |
| 132.95 | Kadakaküla 5 → Kadakaküla 1 | {"fruit":0.9025} |
| 132.95 | Põhjaküla 1 → Põhjaküla 3 | {"water":3.61} |
| 133 | Idaküla 3 → Idaküla 1 | {"coal":4.5125} |
| 133.15 | Kadakaküla 2 → Kadakaküla 3 | {"flax":3.61} |
| 133.15 | Lõunaküla 3 → Lõunaküla 2 | {"flax":1.805} |
| 133.35 | Idaküla 1 → Idaküla 2 | {"wood":3.61} |
| 133.35 | Kadakaküla 5 → Kadakaküla 4 | {"wood":15.3425} |
| 133.4 | Kadakaküla 3 → Kadakaküla 2 | {"berries":5.415} |
| 133.45 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 133.55 | Lõunaküla 2 → Lõunaküla 3 | {"ore":10.83} |
| 133.6 | Kadakaküla 4 → Kadakaküla 5 | {"grain":1.805} |
| 133.75 | Kadakaküla 1 → Kadakaküla 2 | {"water":3.61,"grain":1.805} |
| 133.75 | Lõunaküla 3 → Lõunaküla 4 | {"flax":3.61} |
| 133.8 | Idaküla 3 → Idaküla 2 | {"wood":3.61} |
| 133.85 | Idaküla 1 → Idaküla 2 | {"wood":3.61} |
| 133.95 | Lõunaküla 2 → Lõunaküla 4 | {"ore":10.83} |
| 134 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 134.05 | Kadakaküla 3 → Kadakaküla 4 | {"water":10.83} |
| 134.1 | Kadakaküla 4 → Kadakaküla 5 | {"wood":12.635} |
| 134.2 | Põhjaküla 1 → Põhjaküla 3 | {"water":4.5125} |
| 134.35 | Idaküla 1 → Idaküla 2 | {"wood":7.22} |
| 134.45 | Lõunaküla 4 → Lõunaküla 1 | {"gems":1.805} |
| 134.45 | Kadakaküla 5 → Kadakaküla 1 | {"fruit":1.200357} |
| 134.5 | Idaküla 3 → Idaküla 1 | {"vegetables":0.7525} |
| 134.65 | Lõunaküla 3 → Lõunaküla 2 | {"flax":1.805} |
| 134.7 | Lõunaküla 4 → Lõunaküla 1 | {"gems":1.805} |
| 134.75 | Kadakaküla 1 → Kadakaküla 2 | {"water":3.61} |
| 134.8 | Kadakaküla 5 → Kadakaküla 1 | {"fruit":1.507143} |
| 134.8 | Kadakaküla 3 → Kadakaküla 4 | {"wood":12.635,"water":5.415} |
| 134.85 | Idaküla 1 → Idaküla 2 | {"wood":4.5125} |
| 134.85 | Lõunaküla 1 → Lõunaküla 2 | {"water":2.7075} |
| 134.95 | Lõunaküla 4 → Lõunaküla 2 | {"gems":3.61,"water":0.9025} |
| 135.2 | Kadakaküla 5 → Kadakaküla 3 | {"fruit":1.805} |
| 135.35 | Idaküla 1 → Idaküla 2 | {"wood":3.61} |
| 135.35 | Kadakaküla 4 → Kadakaküla 5 | {"wood":1.805} |
| 135.35 | Lõunaküla 4 → Lõunaküla 3 | {"gems":3.61} |
| 135.4 | Kadakaküla 2 → Kadakaküla 3 | {"flax":1.805,"vegetables":0.9025} |
| 135.45 | Idaküla 3 → Idaküla 1 | {"vegetables":0.15} |
| 135.45 | Põhjaküla 1 → Põhjaküla 3 | {"water":4.5125} |
| 135.55 | Kadakaküla 3 → Kadakaküla 4 | {"berries":4.5125,"water":5.415} |
| 135.7 | Lõunaküla 3 → Lõunaküla 1 | {"vegetables":0.9025} |
| 135.75 | Kadakaküla 1 → Kadakaküla 2 | {"water":3.61,"grain":1.805} |
| 135.85 | Idaküla 1 → Idaküla 2 | {"copper":2.7075,"wood":3.61} |
| 135.85 | Kadakaküla 4 → Kadakaküla 5 | {"wood":11.7325} |
| 135.95 | Põhjaküla 3 → Põhjaküla 1 | {"berries":3.61} |
| 135.95 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 136 | Põhjaküla 1 → Põhjaküla 2 | {"grain":0.9025} |
| 136.2 | Kadakaküla 5 → Kadakaküla 1 | {"fruit":1.805} |
| 136.25 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 136.35 | Idaküla 1 → Idaküla 2 | {"cutstone":0.9025,"wood":3.61} |
| 136.45 | Kadakaküla 5 → Kadakaküla 3 | {"fruit":3.61} |
| 136.45 | Põhjaküla 1 → Põhjaküla 3 | {"grain":9.025,"stone":21.66} |
| 136.7 | Põhjaküla 1 → Põhjaküla 3 | {"water":3.61,"stone":0.9025} |
| 136.75 | Kadakaküla 1 → Kadakaküla 2 | {"water":3.61,"grain":1.805} |
| 136.85 | Idaküla 1 → Idaküla 2 | {"wood":4.5125} |
| 136.85 | Kadakaküla 5 → Kadakaküla 4 | {"wood":8.1225} |
| 136.85 | Lõunaküla 1 → Lõunaküla 2 | {"flour":3.61} |
| 136.9 | Kadakaküla 3 → Kadakaküla 2 | {"water":0.9025} |
| 136.95 | Põhjaküla 4 → Põhjaküla 3 | {"water":0.9025} |
| 137 | Põhjaküla 1 → Põhjaküla 2 | {"grain":3.61} |
| 137.2 | Kadakaküla 1 → Kadakaküla 4 | {"grain":1.048004,"water":9.9275} |
| 137.2 | Kadakaküla 3 → Kadakaküla 5 | {"water":16.245,"plank":6.3175} |
| 137.2 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 137.25 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 137.25 | Idaküla 1 → Idaküla 3 | {"grain":4.5125,"wood":22.5625} |
| 137.45 | Põhjaküla 1 → Põhjaküla 4 | {"grain":3.61} |
| 137.6 | Kadakaküla 4 → Kadakaküla 2 | {"ore":2.7075} |
| 137.6 | Kadakaküla 5 → Kadakaküla 4 | {"wood":16.245} |
| 137.8 | Kadakaküla 1 → Kadakaküla 4 | {"grain":8.97479} |
| 137.85 | Idaküla 1 → Idaküla 2 | {"wood":16.245} |
| 137.95 | Põhjaküla 1 → Põhjaküla 3 | {"water":3.61} |
| 138.2 | Kadakaküla 4 → Kadakaküla 1 | {"iron":1.805} |
| 138.25 | Kadakaküla 1 → Kadakaküla 4 | {"grain":0.95} |
| 138.25 | Idaküla 3 → Idaküla 1 | {"iron":0.9025} |
| 138.25 | Põhjaküla 1 → Põhjaküla 2 | {"grain":3.61} |
| 138.35 | Idaküla 1 → Idaküla 2 | {"wood":11.7325} |
| 138.4 | Kadakaküla 3 → Kadakaküla 2 | {"water":3.61} |
| 138.45 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 138.6 | Kadakaküla 4 → Kadakaküla 5 | {"grain":0.9025,"ore":2.7075} |
| 138.65 | Kadakaküla 2 → Kadakaküla 3 | {"flax":3.61} |
| 138.7 | Kadakaküla 5 → Kadakaküla 2 | {"fruit":5.415} |
| 138.7 | Põhjaküla 1 → Põhjaküla 4 | {"grain":3.61} |
| 138.7 | Lõunaküla 4 → Lõunaküla 2 | {"water":0.9025} |
| 138.8 | Kadakaküla 1 → Kadakaküla 4 | {"grain":2.564706} |
| 138.85 | Kadakaküla 3 → Kadakaküla 1 | {"berries":1.805} |
| 138.95 | Kadakaküla 4 → Kadakaküla 1 | {"iron":2.7075} |
| 138.95 | Kadakaküla 5 → Kadakaküla 3 | {"cheese":2.7075} |
| 139 | Idaküla 3 → Idaküla 1 | {"iron":2.7075} |
| 139 | Idaküla 1 → Idaküla 3 | {"wood":7.22} |
| 139.2 | Lõunaküla 3 → Lõunaküla 1 | {"fruit":0.9025} |
| 139.2 | Põhjaküla 1 → Põhjaküla 3 | {"flour":5.415,"water":4.5125} |
| 139.2 | Kadakaküla 1 → Kadakaküla 4 | {"wood":27.075,"water":9.025} |
| 139.2 | Kadakaküla 3 → Kadakaküla 5 | {"berries":1.805,"water":7.22,"wood":9.9275} |
| 139.35 | Kadakaküla 2 → Kadakaküla 4 | {"flax":3.61,"wood":11.7325} |
| 139.45 | Lõunaküla 3 → Lõunaküla 1 | {"fruit":1.805} |
| 139.45 | Kadakaküla 5 → Kadakaküla 3 | {"fruit":4.5125} |
| 139.5 | Põhjaküla 1 → Põhjaküla 2 | {"flour":3.61,"grain":0.9025} |
| 139.5 | Idaküla 1 → Idaküla 3 | {"wood":0.9025} |
| 139.6 | Kadakaküla 4 → Kadakaküla 2 | {"ore":2.7075} |
| 139.7 | Idaküla 2 → Idaküla 3 | {"wood":4.5125} |
| 139.7 | Kadakaküla 5 → Kadakaküla 3 | {"fruit":0.9025} |
| 139.7 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 139.8 | Kadakaküla 3 → Kadakaküla 4 | {"water":3.61,"meat":0.9025} |
| 139.95 | Lõunaküla 3 → Lõunaküla 1 | {"fruit":2.7075} |
| 139.95 | Põhjaküla 1 → Põhjaküla 4 | {"flour":3.61} |
| 140 | Kadakaküla 1 → Kadakaküla 2 | {"water":8.1225,"grain":1.805} |
| 140.1 | Idaküla 2 → Idaküla 1 | {"wood":18.05} |
| 140.1 | Kadakaküla 4 → Kadakaküla 5 | {"wood":7.22} |
| 140.2 | Põhjaküla 1 → Põhjaküla 4 | {"flour":0.9025} |
| 140.25 | Kadakaküla 2 → Kadakaküla 1 | {"cheese":0.9025,"flax":1.805,"iron":0.9025} |
| 140.35 | Kadakaküla 3 → Kadakaküla 1 | {"berries":0.9025} |
| 140.45 | Põhjaküla 1 → Põhjaküla 3 | {"flour":0.9025,"water":4.5125} |
| 140.55 | Lõunaküla 3 → Lõunaküla 2 | {"fruit":0.9025} |
| 140.7 | Kadakaküla 5 → Kadakaküla 2 | {"fruit":0.9025} |
| 140.75 | Põhjaküla 1 → Põhjaküla 2 | {"flour":3.61} |
| 140.85 | Lõunaküla 2 → Lõunaküla 1 | {"iron":0.9025} |
| 140.85 | Idaküla 1 → Idaküla 2 | {"grain":3.61} |
| 140.95 | Lõunaküla 3 → Lõunaküla 1 | {"fruit":1.805} |
| 140.95 | Kadakaküla 5 → Kadakaküla 1 | {"cheese":1.805} |
| 140.95 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 141 | Kadakaküla 1 → Kadakaküla 2 | {"water":5.415,"grain":1.805} |
| 141.05 | Kadakaküla 3 → Kadakaküla 4 | {"water":5.415,"berries":0.9025} |
| 141.2 | Põhjaküla 1 → Põhjaküla 4 | {"flour":3.61} |
| 141.25 | Kadakaküla 2 → Kadakaküla 1 | {"cheese":1.805,"flax":2.7075} |
| 141.35 | Kadakaküla 4 → Kadakaküla 2 | {"ore":2.7075} |
| 141.35 | Idaküla 1 → Idaküla 2 | {"grain":1.805} |
| 141.55 | Lõunaküla 3 → Lõunaküla 2 | {"fruit":0.9025} |
| 141.6 | Lõunaküla 2 → Lõunaküla 1 | {"iron":2.7075} |
| 141.65 | Idaküla 3 → Idaküla 4 | {"plank":18.05,"ore":10.83,"coal":7.22} |
| 141.7 | Kadakaküla 4 → Kadakaküla 1 | {"iron":1.805} |
| 141.7 | Põhjaküla 1 → Põhjaküla 3 | {"flour":2.7075,"water":3.61} |
| 141.8 | Kadakaküla 3 → Kadakaküla 4 | {"water":5.415,"berries":1.805} |
| 141.85 | Idaküla 1 → Idaküla 2 | {"grain":0.9025} |
| 141.95 | Idaküla 4 → Idaküla 1 | {"bread":1.805} |
| 141.95 | Lõunaküla 3 → Lõunaküla 1 | {"fruit":4.672143} |
| 141.95 | Kadakaküla 4 → Kadakaküla 1 | {"cheese":2.7075} |
| 141.95 | Põhjaküla 4 → Põhjaküla 3 | {"water":0.9025} |
| 141.95 | Lõunaküla 4 → Lõunaküla 2 | {"berries":1.805} |
| 142 | Kadakaküla 1 → Kadakaküla 2 | {"water":4.5125,"grain":1.805} |
| 142 | Põhjaküla 1 → Põhjaküla 2 | {"flour":1.805} |
| 142.2 | Kadakaküla 5 → Kadakaküla 1 | {"cheese":2.150357} |
| 142.2 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 142.35 | Idaküla 2 → Idaküla 4 | {"meat":3.61,"coal":1.805,"stone":3.61,"plank":0.9025} |
| 142.35 | Idaküla 3 → Idaküla 4 | {"vegetables":3.61} |
| 142.35 | Lõunaküla 2 → Lõunaküla 1 | {"iron":2.7075} |
| 142.45 | Põhjaküla 1 → Põhjaküla 4 | {"grain":1.805,"flour":0.9025} |
| 142.55 | Kadakaküla 3 → Kadakaküla 4 | {"water":6.3175} |
| 142.6 | Kadakaküla 4 → Kadakaküla 2 | {"ore":3.61} |
| 142.65 | Kadakaküla 2 → Kadakaküla 3 | {"iron":2.7075,"cheese":3.61,"flax":3.61} |
| 142.75 | Idaküla 3 → Idaküla 1 | {"wood":0.9025} |
| 142.8 | Kadakaküla 5 → Kadakaküla 1 | {"cheese":0.557143} |
| 142.95 | Lõunaküla 3 → Lõunaküla 1 | {"fruit":0.742857} |
| 142.95 | Põhjaküla 1 → Põhjaküla 3 | {"water":3.61} |
| 142.95 | Kadakaküla 3 → Kadakaküla 5 | {"water":10.83} |
| 142.95 | Lõunaküla 1 → Lõunaküla 4 | {"copper":3.61} |
| 143 | Kadakaküla 1 → Kadakaküla 2 | {"water":6.3175} |
| 143.1 | Lõunaküla 2 → Lõunaküla 1 | {"iron":0.9025} |
| 143.2 | Idaküla 1 → Idaküla 4 | {"grain":9.025,"clay":7.22} |
| 143.2 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805,"fruit":3.172143} |
| 143.2 | Kadakaküla 3 → Kadakaküla 5 | {"berries":5.415,"water":4.5125} |
| 143.2 | Lõunaküla 1 → Lõunaküla 4 | {"cutstone":2.7075} |
| 143.35 | Kadakaküla 4 → Kadakaküla 2 | {"ore":1.805} |
| 143.35 | Kadakaküla 5 → Kadakaküla 4 | {"fruit":3.61,"meat":0.9025} |
| 143.45 | Lõunaküla 4 → Lõunaküla 2 | {"water":3.61} |
| 143.5 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 143.55 | Idaküla 3 → Idaküla 2 | {"wood":34.295} |
| 143.6 | Idaküla 1 → Idaküla 2 | {"wood":2.7075} |
| 143.65 | Lõunaküla 3 → Lõunaküla 1 | {"fruit":2.242857} |
| 143.7 | Kadakaküla 5 → Kadakaküla 1 | {"fruit":0.9025} |
| 143.8 | Kadakaküla 3 → Kadakaküla 4 | {"water":7.22} |
| 143.8 | Lõunaküla 2 → Lõunaküla 3 | {"iron":1.805} |
| 143.95 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 144 | Kadakaküla 1 → Kadakaküla 2 | {"water":4.5125,"grain":1.805} |
| 144.05 | Kadakaküla 4 → Kadakaküla 3 | {"iron":0.9025} |
| 144.1 | Idaküla 1 → Idaküla 2 | {"wood":2.7075} |
| 144.1 | Lõunaküla 1 → Lõunaküla 2 | {"pottery":0.9025} |
| 144.2 | Idaküla 3 → Idaküla 4 | {"wood":22.5625} |
| 144.2 | Lõunaküla 3 → Lõunaküla 1 | {"plank":1.805} |
| 144.2 | Põhjaküla 1 → Põhjaküla 3 | {"water":4.5125} |
| 144.45 | Lõunaküla 3 → Lõunaküla 1 | {"wood":16.245,"vegetables":0.9025} |
| 144.45 | Lõunaküla 1 → Lõunaküla 3 | {"stone":0.9025} |
| 144.5 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 144.55 | Lõunaküla 2 → Lõunaküla 3 | {"stone":5.415} |
| 144.6 | Kadakaküla 1 → Kadakaküla 3 | {"vegetables":0.9025} |
| 144.6 | Kadakaküla 4 → Kadakaküla 5 | {"grain":2.7075} |
| 144.7 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 144.7 | Lõunaküla 1 → Lõunaküla 4 | {"stone":20.7575,"cutstone":1.805} |
| 144.95 | Idaküla 1 → Idaküla 4 | {"wood":0.9025} |
| 144.95 | Kadakaküla 1 → Kadakaküla 4 | {"water":6.3175,"vegetables":2.7075} |
| 144.95 | Lõunaküla 1 → Lõunaküla 4 | {"stone":0.9025} |
| 145.05 | Idaküla 3 → Idaküla 2 | {"wood":13.5375} |
| 145.15 | Kadakaküla 3 → Kadakaküla 2 | {"water":4.5125} |
| 145.2 | Kadakaküla 1 → Kadakaküla 4 | {"water":6.3175} |
| 145.35 | Kadakaküla 4 → Kadakaküla 2 | {"grain":1.805} |
| 145.35 | Idaküla 1 → Idaküla 2 | {"wood":0.9025} |
| 145.45 | Põhjaküla 1 → Põhjaküla 3 | {"water":4.5125} |
| 145.45 | Kadakaküla 3 → Kadakaküla 5 | {"water":6.3175} |
| 145.7 | Idaküla 3 → Idaküla 4 | {"wood":31.5875,"vegetables":0.9025} |
| 145.7 | Kadakaküla 4 → Kadakaküla 1 | {"cheese":0.9025} |
| 145.85 | Idaküla 2 → Idaküla 4 | {"meat":0.9025} |
| 145.9 | Kadakaküla 2 → Kadakaküla 3 | {"flax":3.61,"cheese":4.5125,"iron":3.61} |
| 145.95 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 146 | Kadakaküla 1 → Kadakaküla 2 | {"water":5.415} |
| 146.3 | Kadakaküla 4 → Kadakaküla 3 | {"cheese":2.7075} |
| 146.35 | Idaküla 2 → Idaküla 1 | {"iron":0.9025} |
| 146.45 | Idaküla 1 → Idaküla 4 | {"wood":7.22} |
| 146.45 | Idaküla 3 → Idaküla 4 | {"wood":20.7575} |
| 146.7 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 146.7 | Põhjaküla 1 → Põhjaküla 3 | {"water":3.61} |
| 146.75 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 146.85 | Kadakaküla 4 → Kadakaküla 5 | {"grain":6.3175,"iron":3.61} |
| 146.95 | Kadakaküla 5 → Kadakaküla 3 | {"cheese":1.805,"meat":2.31} |
| 146.95 | Põhjaküla 1 → Põhjaküla 3 | {"water":0.9025} |
| 147 | Kadakaküla 1 → Kadakaküla 2 | {"grain":1.805} |
| 147.15 | Kadakaküla 3 → Kadakaküla 2 | {"water":5.415} |
| 147.2 | Idaküla 1 → Idaküla 4 | {"stone":5.415,"wood":8.1225} |
| 147.2 | Idaküla 3 → Idaküla 4 | {"wood":25.27,"stone":10.83} |
| 147.2 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 147.2 | Lõunaküla 4 → Lõunaküla 2 | {"water":3.61} |
| 147.35 | Kadakaküla 4 → Kadakaküla 5 | {"grain":0.9025} |
| 147.5 | Põhjaküla 1 → Põhjaküla 2 | {"cloth":0.9025} |
| 147.6 | Kadakaküla 5 → Kadakaküla 3 | {"meat":1.3} |
| 147.6 | Idaküla 1 → Idaküla 2 | {"wood":9.9275} |
| 147.7 | Idaküla 3 → Idaküla 4 | {"stone":14.44,"wood":0.9025} |
| 147.75 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 147.8 | Kadakaküla 3 → Kadakaküla 4 | {"water":11.7325} |
| 147.85 | Kadakaküla 4 → Kadakaküla 5 | {"iron":1.805,"grain":0.9025} |
| 147.95 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 147.95 | Kadakaküla 5 → Kadakaküla 3 | {"meat":1.805} |
| 148 | Kadakaküla 1 → Kadakaküla 2 | {"water":6.3175,"grain":0.9025} |
| 148 | Põhjaküla 1 → Põhjaküla 2 | {"cloth":0.9025} |
| 148 | Põhjaküla 2 → Põhjaküla 3 | {"water":3.61} |
| 148.1 | Idaküla 2 → Idaküla 1 | {"iron":2.7075} |
| 148.1 | Idaküla 1 → Idaküla 2 | {"wood":4.5125} |
| 148.2 | Idaküla 3 → Idaküla 4 | {"wood":8.1225} |
| 148.45 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 148.45 | Põhjaküla 1 → Põhjaküla 3 | {"cloth":1.805} |
| 148.45 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 148.55 | Kadakaküla 3 → Kadakaküla 4 | {"water":5.415} |
| 148.6 | Kadakaküla 4 → Kadakaküla 2 | {"grain":1.805} |
| 148.7 | Põhjaküla 1 → Põhjaküla 3 | {"cloth":0.9025} |
| 148.8 | Idaküla 3 → Idaküla 2 | {"wood":9.9275} |
| 148.85 | Idaküla 1 → Idaküla 2 | {"wood":0.9025} |
| 148.95 | Kadakaküla 5 → Kadakaküla 3 | {"meat":3.61} |
| 148.95 | Põhjaküla 1 → Põhjaküla 4 | {"cloth":1.805} |
| 149 | Kadakaküla 1 → Kadakaküla 2 | {"water":5.415} |
| 149.1 | Kadakaküla 4 → Kadakaküla 5 | {"grain":1.805} |
| 149.15 | Kadakaküla 2 → Kadakaküla 3 | {"flax":4.5125,"cheese":0.9125} |
| 149.2 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 149.2 | Põhjaküla 1 → Põhjaküla 3 | {"water":4.5125} |
| 149.35 | Lõunaküla 2 → Lõunaküla 1 | {"iron":0.9025} |
| 149.35 | Idaküla 1 → Idaküla 2 | {"wood":3.61} |
| 149.35 | Lõunaküla 3 → Lõunaküla 4 | {"fruit":5.415} |
| 149.6 | Kadakaküla 2 → Kadakaküla 3 | {"cheese":2.6975,"vegetables":0.9025} |
| 149.6 | Kadakaküla 5 → Kadakaküla 3 | {"cheese":0.9025} |
| 149.7 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 149.7 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 149.7 | Lõunaküla 1 → Lõunaküla 3 | {"fish":0.9025,"meat":0.9025} |
| 149.85 | Idaküla 1 → Idaküla 2 | {"wood":3.61} |
| 149.9 | Kadakaküla 3 → Kadakaküla 2 | {"berries":0.9025} |
| 149.95 | Idaküla 3 → Idaküla 4 | {"wood":36.1} |
| 149.95 | Kadakaküla 5 → Kadakaküla 3 | {"meat":2.7075} |
| 149.95 | Lõunaküla 1 → Lõunaküla 4 | {"meat":0.9025} |
| 150 | Kadakaküla 1 → Kadakaküla 2 | {"water":4.5125} |
| 150.1 | Idaküla 2 → Idaküla 1 | {"iron":2.7075} |
| 150.2 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 150.2 | Kadakaküla 4 → Kadakaküla 1 | {"cheese":0.245357} |
| 150.2 | Kadakaküla 5 → Kadakaküla 3 | {"meat":0.9025} |
| 150.25 | Kadakaküla 4 → Kadakaküla 1 | {"cheese":0.657143} |
| 150.35 | Idaküla 1 → Idaküla 2 | {"wood":3.61} |
| 150.45 | Idaküla 3 → Idaküla 4 | {"plank":8.1225,"meat":0.9025,"vegetables":0.9025} |
| 150.45 | Põhjaküla 1 → Põhjaküla 3 | {"water":4.5125} |
| 150.5 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 150.7 | Kadakaküla 5 → Kadakaküla 1 | {"fruit":0.9025} |
| 150.95 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 150.95 | Kadakaküla 5 → Kadakaküla 3 | {"fruit":2.7075,"cheese":1.805,"meat":2.7075} |
| 150.95 | Lõunaküla 4 → Lõunaküla 2 | {"water":3.61} |
| 151 | Kadakaküla 1 → Kadakaküla 2 | {"grain":1.805,"water":0.9025} |
| 151.1 | Lõunaküla 2 → Lõunaküla 1 | {"iron":2.7075} |
| 151.15 | Kadakaküla 3 → Kadakaküla 2 | {"water":5.415} |
| 151.2 | Idaküla 1 → Idaküla 4 | {"grain":2.7075,"wood":2.7075} |
| 151.2 | Põhjaküla 4 → Põhjaküla 1 | {"flax":0.9025} |
| 151.2 | Kadakaküla 5 → Kadakaküla 1 | {"fruit":0.9025} |
| 151.2 | Lõunaküla 1 → Lõunaküla 4 | {"fish":0.9025,"meat":0.9025} |
| 151.3 | Idaküla 3 → Idaküla 2 | {"wood":3.61} |
| 151.45 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 151.45 | Kadakaküla 5 → Kadakaküla 1 | {"weapons":0.9025} |
| 151.45 | Lõunaküla 1 → Lõunaküla 4 | {"fish":0.9025} |
| 151.5 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 151.6 | Kadakaküla 4 → Kadakaküla 3 | {"cheese":1.805} |
| 151.7 | Põhjaküla 1 → Põhjaküla 3 | {"water":3.61} |
| 151.75 | Idaküla 2 → Idaküla 4 | {"stone":9.9275} |
| 151.8 | Kadakaküla 3 → Kadakaküla 4 | {"water":19.855} |
| 151.95 | Idaküla 1 → Idaküla 4 | {"grain":0.9025,"wood":4.5125,"stone":0.9025} |
| 151.95 | Lõunaküla 4 → Lõunaküla 1 | {"berries":1.805} |
| 152 | Kadakaküla 1 → Kadakaküla 2 | {"water":5.415,"grain":1.805} |
| 152.2 | Lõunaküla 4 → Lõunaküla 1 | {"silk":1.805} |
| 152.2 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 152.3 | Idaküla 3 → Idaküla 2 | {"vegetables":0.4025,"wood":3.61} |
| 152.35 | Kadakaküla 2 → Kadakaküla 4 | {"flax":3.61} |
| 152.35 | Idaküla 2 → Idaküla 1 | {"iron":0.9025} |
| 152.35 | Idaküla 1 → Idaküla 2 | {"wood":0.9025} |
| 152.45 | Kadakaküla 5 → Kadakaküla 2 | {"fruit":0.9025} |
| 152.55 | Kadakaküla 3 → Kadakaküla 4 | {"water":4.5125} |
| 152.55 | Lõunaküla 3 → Lõunaküla 2 | {"water":2.7075} |
| 152.55 | Lõunaküla 2 → Lõunaküla 3 | {"iron":2.7075} |
| 152.6 | Kadakaküla 4 → Kadakaküla 3 | {"meat":1.805,"cheese":1.805} |
| 152.7 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 152.8 | Idaküla 3 → Idaküla 2 | {"vegetables":0.5} |
| 152.8 | Idaküla 1 → Idaküla 2 | {"vegetables":0.9025} |
| 152.95 | Lõunaküla 4 → Lõunaküla 1 | {"silk":1.805} |
| 152.95 | Kadakaküla 5 → Kadakaküla 3 | {"cheese":1.805,"meat":2.7075} |
| 152.95 | Põhjaküla 1 → Põhjaküla 3 | {"cloth":0.9025,"water":4.5125} |
| 153 | Kadakaküla 1 → Kadakaküla 2 | {"water":6.3175,"vegetables":0.9025} |
| 153.2 | Lõunaküla 3 → Lõunaküla 1 | {"fruit":2.7075,"vegetables":0.9025} |
| 153.2 | Lõunaküla 4 → Lõunaküla 2 | {"silk":3.61} |
| 153.25 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 153.3 | Kadakaküla 3 → Kadakaküla 4 | {"water":0.9025} |
| 153.3 | Lõunaküla 2 → Lõunaküla 3 | {"iron":2.7075} |
| 153.35 | Idaküla 1 → Idaküla 2 | {"wood":32.49} |
| 153.45 | Idaküla 3 → Idaküla 4 | {"stone":12.635,"wood":18.05} |
| 153.45 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 153.45 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 153.5 | Idaküla 2 → Idaküla 4 | {"iron":1.805} |
| 153.5 | Põhjaküla 1 → Põhjaküla 2 | {"cloth":0.9025} |
| 153.55 | Kadakaküla 4 → Kadakaküla 3 | {"cheese":0.9025} |
| 153.85 | Lõunaküla 4 → Lõunaküla 3 | {"silk":3.61} |
| 153.95 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 153.95 | Kadakaküla 5 → Kadakaküla 3 | {"meat":5.415} |
| 154 | Kadakaküla 1 → Kadakaküla 2 | {"water":6.3175,"grain":1.805} |
| 154.05 | Kadakaküla 3 → Kadakaküla 4 | {"water":6.3175} |
| 154.05 | Lõunaküla 3 → Lõunaküla 2 | {"fruit":1.805} |
| 154.1 | Lõunaküla 2 → Lõunaküla 1 | {"iron":2.7075} |
| 154.2 | Idaküla 1 → Idaküla 4 | {"grain":4.5125,"vegetables":1.805,"stone":0.9025} |
| 154.2 | Põhjaküla 1 → Põhjaküla 3 | {"water":4.5125} |
| 154.55 | Kadakaküla 4 → Kadakaküla 3 | {"cheese":3.61} |
| 154.65 | Kadakaküla 2 → Kadakaküla 3 | {"flax":3.61,"cheese":0.9025} |
| 154.7 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 154.7 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 154.75 | Idaküla 2 → Idaküla 4 | {"iron":2.7075} |
| 154.8 | Kadakaküla 3 → Kadakaküla 4 | {"water":5.415} |
| 154.8 | Lõunaküla 3 → Lõunaküla 2 | {"fruit":2.7075} |
| 154.95 | Kadakaküla 5 → Kadakaküla 2 | {"fruit":0.9025} |
| 154.95 | Idaküla 1 → Idaküla 4 | {"stone":15.3425,"wood":15.3425} |
| 154.95 | Põhjaküla 1 → Põhjaküla 4 | {"cloth":0.9025} |
| 154.95 | Lõunaküla 4 → Lõunaküla 2 | {"water":0.9025} |
| 154.95 | Lõunaküla 1 → Lõunaküla 4 | {"meat":0.9025,"fish":0.9025} |
| 155 | Kadakaküla 1 → Kadakaküla 2 | {"water":4.5125} |
| 155.1 | Lõunaküla 2 → Lõunaküla 1 | {"iron":0.9025} |
| 155.2 | Lõunaküla 3 → Lõunaküla 1 | {"berries":0.9025} |
| 155.2 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 155.2 | Kadakaküla 5 → Kadakaküla 1 | {"weapons":1.805,"cheese":0.9025} |
| 155.45 | Lõunaküla 3 → Lõunaküla 1 | {"berries":0.9025,"flax":1.805} |
| 155.45 | Põhjaküla 1 → Põhjaküla 3 | {"water":3.61} |
| 155.5 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 155.6 | Kadakaküla 4 → Kadakaküla 3 | {"meat":6.3175,"cheese":2.7075} |
| 155.7 | Idaküla 1 → Idaküla 4 | {"grain":3.61,"wood":15.3425,"meat":1.805,"vegetables":0.9025,"stone":0.9025} |
| 155.7 | Idaküla 3 → Idaküla 4 | {"vegetables":0.9025} |
| 155.7 | Põhjaküla 1 → Põhjaküla 3 | {"water":0.9025} |
| 155.8 | Lõunaküla 2 → Lõunaküla 3 | {"iron":0.9025} |
| 155.85 | Lõunaküla 3 → Lõunaküla 4 | {"fruit":2.21} |
| 155.9 | Lõunaküla 3 → Lõunaküla 4 | {"fruit":1.4} |
| 155.95 | Lõunaküla 4 → Lõunaküla 1 | {"wood":6.3175} |
| 155.95 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 155.95 | Kadakaküla 4 → Kadakaküla 1 | {"cheese":0.9025} |
| 156 | Kadakaküla 1 → Kadakaküla 2 | {"grain":1.805} |
| 156.1 | Lõunaküla 1 → Lõunaküla 2 | {"water":2.7075} |
| 156.15 | Kadakaküla 3 → Kadakaküla 2 | {"water":6.3175} |
| 156.2 | Põhjaküla 4 → Põhjaküla 1 | {"fruit":2.7075} |
| 156.45 | Idaküla 1 → Idaküla 4 | {"grain":0.9025} |
| 156.45 | Idaküla 3 → Idaküla 4 | {"vegetables":0.9025} |
| 156.45 | Lõunaküla 3 → Lõunaküla 1 | {"wood":3.61} |
| 156.45 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 156.45 | Lõunaküla 1 → Lõunaküla 3 | {"fish":1.805} |
| 156.55 | Lõunaküla 2 → Lõunaküla 3 | {"meat":0.9025} |
| 156.7 | Põhjaküla 4 → Põhjaküla 1 | {"flax":0.9025} |
| 156.7 | Põhjaküla 1 → Põhjaküla 3 | {"water":3.61} |
| 156.8 | Kadakaküla 3 → Kadakaküla 4 | {"water":14.44} |
| 156.9 | Kadakaküla 2 → Kadakaküla 3 | {"flax":3.61} |
| 156.95 | Kadakaküla 5 → Kadakaküla 3 | {"meat":5.415} |
| 156.95 | Lõunaküla 2 → Lõunaküla 4 | {"iron":6.3175} |
| 157 | Kadakaküla 1 → Kadakaküla 2 | {"water":5.415} |
| 157.2 | Idaküla 1 → Idaküla 4 | {"grain":2.7075} |
| 157.2 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 157.2 | Kadakaküla 5 → Kadakaküla 1 | {"fruit":0.9025} |
| 157.2 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 157.2 | Lõunaküla 2 → Lõunaküla 4 | {"iron":0.9025} |
| 157.3 | Idaküla 3 → Idaküla 2 | {"vegetables":0.9025} |
| 157.35 | Kadakaküla 4 → Kadakaküla 2 | {"grain":1.805} |
| 157.45 | Kadakaküla 5 → Kadakaküla 1 | {"fruit":0.9025} |
| 157.55 | Kadakaküla 3 → Kadakaküla 4 | {"water":6.3175} |
| 157.7 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 157.7 | Põhjaküla 1 → Põhjaküla 3 | {"cloth":0.9025} |
| 157.75 | Idaküla 2 → Idaküla 4 | {"iron":2.7075} |
| 157.8 | Lõunaküla 3 → Lõunaküla 2 | {"fruit":0.9025} |
| 157.95 | Idaküla 1 → Idaküla 4 | {"meat":1.805,"vegetables":0.9025} |
| 157.95 | Lõunaküla 4 → Lõunaküla 1 | {"berries":1.805} |
| 157.95 | Põhjaküla 1 → Põhjaküla 3 | {"water":4.5125} |
| 158 | Kadakaküla 1 → Kadakaküla 2 | {"water":5.415} |
| 158.05 | Kadakaküla 4 → Kadakaküla 3 | {"cheese":1.805} |
| 158.2 | Lõunaküla 4 → Lõunaküla 1 | {"berries":2.7075} |
| 158.2 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 158.3 | Kadakaküla 3 → Kadakaküla 4 | {"water":1.805} |
| 158.35 | Lõunaküla 3 → Lõunaküla 4 | {"fruit":0.9025} |
| 158.45 | Kadakaküla 5 → Kadakaküla 2 | {"fruit":4.5125} |
| 158.45 | Kadakaküla 1 → Kadakaküla 4 | {"cutstone":2.7075,"water":6.3175} |
| 158.45 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 158.6 | Kadakaküla 2 → Kadakaküla 3 | {"cheese":4.5125} |
| 158.7 | Kadakaküla 5 → Kadakaküla 1 | {"weapons":1.805} |
| 158.7 | Kadakaküla 3 → Kadakaküla 5 | {"water":16.245} |
| 158.7 | Lõunaküla 4 → Lõunaküla 2 | {"water":0.9025} |
| 158.85 | Kadakaküla 4 → Kadakaküla 2 | {"grain":1.805} |
| 158.95 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 159.1 | Kadakaküla 5 → Kadakaküla 4 | {"fruit":0.9025} |
| 159.2 | Idaküla 1 → Idaküla 4 | {"grain":3.61} |
| 159.2 | Idaküla 3 → Idaküla 4 | {"vegetables":0.9025} |
| 159.2 | Põhjaküla 1 → Põhjaküla 3 | {"water":4.5125} |
| 159.25 | Kadakaküla 1 → Kadakaküla 2 | {"water":8.1225} |
| 159.45 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 159.5 | Kadakaküla 2 → Kadakaküla 1 | {"flax":4.5125} |
| 159.7 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 159.95 | Kadakaküla 5 → Kadakaküla 3 | {"meat":6.3175,"cheese":0.9025} |
| 160 | Idaküla 3 → Idaküla 1 | {"wood":36.1} |
| 160.15 | Kadakaküla 3 → Kadakaküla 2 | {"water":5.415} |
| 160.2 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 160.2 | Kadakaküla 5 → Kadakaküla 3 | {"fruit":2.7075} |
| 160.25 | Kadakaküla 1 → Kadakaküla 2 | {"vegetables":0.9025,"water":0.9025} |
| 160.35 | Kadakaküla 2 → Kadakaküla 4 | {"flax":3.61} |
| 160.35 | Idaküla 2 → Idaküla 1 | {"wood":4.5125} |
| 160.45 | Idaküla 1 → Idaküla 4 | {"grain":2.7075,"meat":2.7075,"vegetables":1.805} |
| 160.45 | Põhjaküla 4 → Põhjaküla 3 | {"water":3.61} |
| 160.5 | Põhjaküla 1 → Põhjaküla 2 | {"cloth":0.9025} |
| 160.7 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 160.75 | Põhjaküla 2 → Põhjaküla 3 | {"water":0.9025} |
| 160.8 | Kadakaküla 3 → Kadakaküla 4 | {"water":14.44} |
| 160.95 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 161.2 | Kadakaküla 5 → Kadakaküla 2 | {"fruit":1.805} |
| 161.2 | Lõunaküla 1 → Lõunaküla 4 | {"meat":0.9025,"fish":0.9025} |
| 161.25 | Kadakaküla 1 → Kadakaküla 2 | {"grain":1.805,"water":6.3175} |
| 161.45 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 161.45 | Põhjaküla 4 → Põhjaküla 1 | {"fruit":1.805,"flax":1.805} |
| 161.45 | Kadakaküla 5 → Kadakaküla 1 | {"fruit":0.9025,"cheese":0.245357} |
| 161.55 | Kadakaküla 3 → Kadakaküla 4 | {"water":7.22} |
| 161.6 | Kadakaküla 4 → Kadakaküla 3 | {"cheese":5.415,"meat":4.5125} |
| 161.65 | Kadakaküla 2 → Kadakaküla 3 | {"flax":3.61} |
| 161.7 | Idaküla 1 → Idaküla 4 | {"grain":3.61,"vegetables":0.9025} |
| 161.7 | Idaküla 3 → Idaküla 4 | {"vegetables":0.9025} |
| 161.7 | Põhjaküla 1 → Põhjaküla 3 | {"water":3.61} |
| 161.8 | Kadakaküla 5 → Kadakaküla 1 | {"cheese":0.657143} |
| 161.85 | Lõunaküla 3 → Lõunaküla 4 | {"fruit":0.9025} |
| 161.95 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 161.95 | Põhjaküla 1 → Põhjaküla 4 | {"cloth":0.9025} |
| 162.1 | Kadakaküla 4 → Kadakaküla 5 | {"iron":1.805} |
| 162.2 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 162.2 | Lõunaküla 1 → Lõunaküla 3 | {"meat":1.805,"fish":0.9025} |
| 162.25 | Kadakaküla 1 → Kadakaküla 2 | {"water":5.415} |
| 162.25 | Põhjaküla 4 → Põhjaküla 2 | {"fruit":3.61} |
| 162.3 | Kadakaküla 3 → Kadakaküla 4 | {"water":0.9025} |
| 162.45 | Põhjaküla 1 → Põhjaküla 3 | {"cloth":0.9025} |
| 162.45 | Lõunaküla 4 → Lõunaküla 2 | {"water":0.9025} |
| 162.5 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 162.5 | Põhjaküla 2 → Põhjaküla 1 | {"flax":1.805} |
| 162.6 | Kadakaküla 4 → Kadakaküla 5 | {"iron":1.805,"grain":1.805} |
| 162.7 | Põhjaküla 4 → Põhjaküla 1 | {"fruit":0.9025,"flax":0.9025} |
| 162.95 | Kadakaküla 5 → Kadakaküla 2 | {"weapons":1.805} |
| 162.95 | Idaküla 1 → Idaküla 4 | {"grain":2.7075,"vegetables":0.9025} |
| 162.95 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 162.95 | Põhjaküla 1 → Põhjaküla 3 | {"water":4.5125} |
| 163.05 | Kadakaküla 3 → Kadakaküla 4 | {"water":6.3175} |
| 163.2 | Lõunaküla 4 → Lõunaküla 1 | {"berries":4.5125} |
| 163.2 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 163.25 | Kadakaküla 1 → Kadakaküla 2 | {"grain":1.805,"water":6.3175} |
| 163.3 | Kadakaküla 4 → Kadakaküla 3 | {"cheese":4.6275} |
| 163.35 | Idaküla 1 → Idaküla 2 | {"vegetables":0.9025} |
| 163.45 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 163.45 | Lõunaküla 1 → Lõunaküla 3 | {"cloth":0.9025} |
| 163.5 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 163.6 | Kadakaküla 4 → Kadakaküla 3 | {"cheese":1.69,"meat":3.61} |
| 163.7 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 163.8 | Kadakaküla 3 → Kadakaküla 4 | {"water":6.3175} |
| 163.95 | Kadakaküla 5 → Kadakaküla 2 | {"weapons":1.805} |
| 164.15 | Idaküla 4 → Idaküla 1 | {"silk":1.805} |
| 164.2 | Idaküla 1 → Idaküla 4 | {"grain":3.61,"meat":1.805} |
| 164.2 | Põhjaküla 1 → Põhjaküla 3 | {"water":4.5125} |
| 164.25 | Kadakaküla 1 → Kadakaküla 2 | {"water":5.415} |
| 164.3 | Kadakaküla 4 → Kadakaküla 3 | {"cheese":4.5125} |
| 164.35 | Kadakaküla 2 → Kadakaküla 4 | {"flax":3.61} |
| 164.35 | Lõunaküla 1 → Lõunaküla 2 | {"tin":1.805} |
| 164.45 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 164.45 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 164.55 | Kadakaküla 3 → Kadakaküla 4 | {"water":6.3175} |
| 164.7 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 164.7 | Lõunaküla 1 → Lõunaküla 3 | {"tin":2.7075,"cloth":1.805} |
| 164.85 | Kadakaküla 4 → Kadakaküla 5 | {"iron":1.805} |
| 164.95 | Kadakaküla 5 → Kadakaküla 2 | {"weapons":0.9025} |
| 164.95 | Lõunaküla 3 → Lõunaküla 1 | {"berries":2.7075} |
| 164.95 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 165.1 | Lõunaküla 1 → Lõunaküla 2 | {"cloth":0.9025} |
| 165.15 | Idaküla 4 → Idaküla 1 | {"silk":1.805} |
| 165.2 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 165.2 | Kadakaküla 5 → Kadakaküla 3 | {"weapons":0.9025,"meat":4.325} |
| 165.25 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 165.25 | Kadakaküla 1 → Kadakaküla 2 | {"water":8.1225,"grain":0.9025} |
| 165.3 | Kadakaküla 3 → Kadakaküla 4 | {"water":1.805} |
| 165.45 | Idaküla 1 → Idaküla 4 | {"grain":3.61,"meat":2.7075,"vegetables":0.9025} |
| 165.45 | Idaküla 3 → Idaküla 4 | {"vegetables":0.9025} |
| 165.45 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 165.45 | Põhjaküla 1 → Põhjaküla 3 | {"water":3.61} |
| 165.45 | Lõunaküla 1 → Lõunaküla 4 | {"cloth":2.7075} |
| 165.6 | Kadakaküla 5 → Kadakaküla 3 | {"meat":1.09,"cheese":3.61} |
| 165.6 | Kadakaküla 4 → Kadakaküla 5 | {"iron":0.9025} |
| 165.7 | Põhjaküla 1 → Põhjaküla 3 | {"water":0.9025} |
| 165.8 | Lõunaküla 3 → Lõunaküla 2 | {"berries":1.805,"flax":1.805} |
| 165.95 | Kadakaküla 5 → Kadakaküla 3 | {"weapons":1.805,"meat":4.5125} |
| 165.95 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 166.05 | Kadakaküla 3 → Kadakaküla 4 | {"water":6.3175} |
| 166.2 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 166.2 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 166.2 | Kadakaküla 5 → Kadakaküla 3 | {"cheese":0.9025} |
| 166.25 | Kadakaküla 1 → Kadakaküla 2 | {"water":6.3175,"grain":1.805,"vegetables":0.9025} |
| 166.35 | Lõunaküla 1 → Lõunaküla 2 | {"cloth":0.9025} |
| 166.4 | Idaküla 4 → Idaküla 2 | {"silk":5.415} |
| 166.45 | Lõunaküla 3 → Lõunaküla 1 | {"flax":2.7075} |
| 166.65 | Kadakaküla 2 → Kadakaküla 3 | {"flax":4.5125} |
| 166.7 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 166.7 | Põhjaküla 1 → Põhjaküla 3 | {"water":3.61} |
| 166.95 | Kadakaküla 5 → Kadakaküla 3 | {"meat":4.8675} |
| 167 | Idaküla 4 → Idaküla 3 | {"silk":3.61} |
| 167 | Põhjaküla 4 → Põhjaküla 2 | {"fruit":1.805} |
| 167.2 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 167.2 | Kadakaküla 4 → Kadakaküla 1 | {"cheese":0.745357} |
| 167.2 | Lõunaküla 4 → Lõunaküla 2 | {"water":3.61,"vegetables":0.9025} |
| 167.25 | Kadakaküla 1 → Kadakaküla 2 | {"grain":0.9025} |
| 167.25 | Põhjaküla 1 → Põhjaküla 2 | {"cloth":0.9025} |
| 167.4 | Kadakaküla 3 → Kadakaküla 2 | {"water":7.22} |
| 167.45 | Põhjaküla 4 → Põhjaküla 1 | {"fruit":3.61,"flax":1.805} |
| 167.45 | Lõunaküla 4 → Lõunaküla 2 | {"vegetables":0.9025} |
| 167.45 | Lõunaküla 1 → Lõunaküla 4 | {"meat":0.9025,"fish":0.9025} |
| 167.5 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 167.5 | Kadakaküla 4 → Kadakaküla 1 | {"cheese":0.157143} |
| 167.6 | Kadakaküla 5 → Kadakaküla 3 | {"meat":1.45} |
| 167.7 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 167.7 | Põhjaküla 1 → Põhjaküla 3 | {"cloth":0.9025} |
| 167.85 | Idaküla 2 → Idaküla 1 | {"flax":5.415} |
| 167.95 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 167.95 | Kadakaküla 5 → Kadakaküla 1 | {"fruit":0.9025} |
| 167.95 | Põhjaküla 1 → Põhjaküla 3 | {"water":4.5125} |
| 167.95 | Lõunaküla 1 → Lõunaküla 3 | {"cloth":0.9025} |
| 168.05 | Kadakaküla 3 → Kadakaküla 4 | {"water":12.635} |
| 168.1 | Lõunaküla 3 → Lõunaküla 4 | {"fruit":0.9025} |
| 168.2 | Põhjaküla 4 → Põhjaküla 1 | {"flax":0.9025} |
| 168.25 | Kadakaküla 1 → Kadakaküla 2 | {"grain":1.805,"water":6.3175} |
| 168.35 | Kadakaküla 2 → Kadakaküla 4 | {"flax":4.5125} |
| 168.45 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 168.45 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 168.45 | Põhjaküla 1 → Põhjaküla 4 | {"cloth":0.9025} |
| 168.45 | Lõunaküla 4 → Lõunaküla 2 | {"silk":1.805,"water":2.7075} |
| 168.6 | Kadakaküla 4 → Kadakaküla 3 | {"cheese":6.3175,"meat":1.805} |
| 168.8 | Kadakaküla 3 → Kadakaküla 4 | {"water":6.3175} |
| 168.85 | Lõunaküla 2 → Lõunaküla 1 | {"bread":2.7075} |
| 168.95 | Kadakaküla 5 → Kadakaküla 2 | {"fruit":0.9025} |
| 169 | Põhjaküla 1 → Põhjaküla 2 | {"copper":2.7075} |
| 169.05 | Lõunaküla 3 → Lõunaküla 2 | {"water":0.9025} |
| 169.2 | Kadakaküla 5 → Kadakaküla 1 | {"berries":0.9025} |
| 169.2 | Põhjaküla 4 → Põhjaküla 3 | {"water":4.5125} |
| 169.2 | Lõunaküla 2 → Lõunaküla 4 | {"bread":1.805} |
| 169.25 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 169.25 | Kadakaküla 1 → Kadakaküla 2 | {"water":6.3175,"grain":0.9025} |
| 169.35 | Lõunaküla 1 → Lõunaküla 3 | {"fish":0.9025,"meat":0.9025} |
| 169.45 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 169.45 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 169.45 | Kadakaküla 5 → Kadakaküla 3 | {"weapons":1.805} |
| 169.7 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 169.8 | Idaküla 3 → Idaküla 2 | {"vegetables":0.8025} |
| 169.85 | Kadakaküla 5 → Kadakaküla 4 | {"fruit":4.5125} |
| 169.85 | Lõunaküla 1 → Lõunaküla 2 | {"cloth":0.9025,"water":2.7075} |
| 169.95 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 170.15 | Kadakaküla 3 → Kadakaküla 2 | {"water":7.22} |
| 170.15 | Idaküla 3 → Idaküla 2 | {"vegetables":0.1} |
| 170.2 | Kadakaküla 5 → Kadakaküla 3 | {"fruit":0.9025,"meat":4.4125} |
| 170.25 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 170.25 | Kadakaküla 1 → Kadakaküla 2 | {"grain":1.805} |
| 170.35 | Lõunaküla 1 → Lõunaküla 2 | {"tin":1.805} |
| 170.45 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 170.45 | Põhjaküla 1 → Põhjaküla 3 | {"water":3.61} |
| 170.5 | Lõunaküla 4 → Lõunaküla 2 | {"berries":2.7075} |
| 170.6 | Kadakaküla 4 → Kadakaküla 3 | {"cheese":8.1225,"meat":1.805} |
| 170.6 | Kadakaküla 5 → Kadakaküla 3 | {"meat":0.1} |
| 170.7 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 170.7 | Põhjaküla 1 → Põhjaküla 3 | {"water":0.9025} |
| 170.7 | Lõunaküla 1 → Lõunaküla 3 | {"tin":0.9025} |
| 170.95 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 170.95 | Lõunaküla 4 → Lõunaküla 2 | {"water":3.61,"berries":0.9025} |
| 170.95 | Lõunaküla 1 → Lõunaküla 3 | {"cloth":0.9025} |
| 171.2 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 171.2 | Lõunaküla 1 → Lõunaküla 4 | {"tin":2.7075,"cloth":0.9025} |
| 171.25 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 171.25 | Kadakaküla 1 → Kadakaküla 2 | {"vegetables":0.9025,"water":0.9025} |
| 171.4 | Kadakaküla 3 → Kadakaküla 2 | {"water":7.22} |
| 171.45 | Põhjaküla 4 → Põhjaküla 1 | {"fruit":3.61} |
| 171.55 | Lõunaküla 3 → Lõunaküla 2 | {"fruit":0.9025} |
| 171.6 | Lõunaküla 1 → Lõunaküla 2 | {"fish":0.9025} |
| 171.7 | Idaküla 1 → Idaküla 4 | {"meat":0.9025} |
| 171.7 | Põhjaküla 1 → Põhjaküla 3 | {"water":3.61} |
| 171.75 | Põhjaküla 4 → Põhjaküla 2 | {"fruit":1.805} |
| 171.95 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 171.95 | Kadakaküla 5 → Kadakaküla 3 | {"cheese":1.805,"meat":7.22} |
| 171.95 | Põhjaküla 1 → Põhjaküla 3 | {"cloth":0.9025} |
| 172 | Põhjaküla 2 → Põhjaküla 1 | {"flax":1.805} |
| 172.05 | Kadakaküla 3 → Kadakaküla 4 | {"water":18.9525} |
| 172.1 | Lõunaküla 1 → Lõunaküla 2 | {"fish":0.9025} |
| 172.2 | Lõunaküla 3 → Lõunaküla 1 | {"flax":2.7075} |
| 172.2 | Kadakaküla 5 → Kadakaküla 1 | {"berries":0.9025} |
| 172.2 | Lõunaküla 4 → Lõunaküla 2 | {"water":3.61,"berries":0.9025,"vegetables":0.9025} |
| 172.25 | Kadakaküla 1 → Kadakaküla 2 | {"water":7.22,"grain":1.805} |
| 172.45 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 172.55 | Kadakaküla 4 → Kadakaküla 3 | {"cheese":0.9025} |
| 172.65 | Kadakaküla 2 → Kadakaküla 3 | {"flax":3.61} |
| 172.8 | Kadakaküla 3 → Kadakaküla 4 | {"water":5.415} |
| 172.8 | Lõunaküla 3 → Lõunaküla 2 | {"fruit":1.805} |
| 172.85 | Lõunaküla 1 → Lõunaküla 2 | {"cloth":0.9025,"fish":0.9025} |
| 172.95 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 172.95 | Põhjaküla 1 → Põhjaküla 3 | {"water":4.5125} |
| 173 | Idaküla 4 → Idaküla 3 | {"silk":1.805} |
| 173.2 | Kadakaküla 5 → Kadakaküla 2 | {"fruit":0.9025} |
| 173.2 | Lõunaküla 1 → Lõunaküla 4 | {"cloth":0.9025} |
| 173.25 | Kadakaküla 1 → Kadakaküla 2 | {"water":7.22,"grain":1.805} |
| 173.45 | Kadakaküla 5 → Kadakaküla 1 | {"fruit":0.9025,"cheese":0.9025} |
| 173.45 | Lõunaküla 4 → Lõunaküla 2 | {"water":3.61} |
| 173.5 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 173.55 | Kadakaküla 3 → Kadakaküla 4 | {"water":5.415} |
| 173.6 | Kadakaküla 4 → Kadakaküla 3 | {"cheese":8.1225,"meat":2.7075} |
| 173.7 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 173.85 | Kadakaküla 5 → Kadakaküla 4 | {"weapons":1.805,"fruit":1.805} |
| 174 | Põhjaküla 1 → Põhjaküla 2 | {"cloth":0.9025} |
| 174.2 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 174.25 | Idaküla 4 → Idaküla 2 | {"fruit":0.9025} |
| 174.25 | Kadakaküla 1 → Kadakaküla 2 | {"water":6.3175} |
| 174.25 | Põhjaküla 2 → Põhjaküla 3 | {"water":4.5125} |
| 174.3 | Kadakaküla 3 → Kadakaküla 4 | {"water":0.9025} |
| 174.35 | Kadakaküla 5 → Kadakaküla 4 | {"fruit":2.7075} |
| 174.45 | Põhjaküla 4 → Põhjaküla 1 | {"flax":0.9025} |
| 174.5 | Kadakaküla 2 → Kadakaküla 1 | {"flax":2.7075} |
| 174.7 | Kadakaküla 3 → Kadakaküla 5 | {"water":16.245} |
| 174.7 | Lõunaküla 4 → Lõunaküla 2 | {"water":3.61} |
| 174.7 | Lõunaküla 1 → Lõunaküla 3 | {"cloth":0.9025,"fish":0.9025,"meat":0.9025} |
| 174.85 | Kadakaküla 5 → Kadakaküla 4 | {"fruit":0.9025} |
| 174.95 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 174.95 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 174.95 | Lõunaküla 1 → Lõunaküla 3 | {"fish":0.9025} |
| 174.95 | Lõunaküla 2 → Lõunaküla 4 | {"meat":1.805} |
| 175.2 | Idaküla 4 → Idaküla 1 | {"fruit":1.510357} |
| 175.2 | Kadakaküla 5 → Kadakaküla 3 | {"vegetables":0.9025,"fruit":4.165} |
| 175.2 | Lõunaküla 1 → Lõunaküla 4 | {"fish":1.805} |
| 175.25 | Kadakaküla 1 → Kadakaküla 2 | {"water":7.22,"grain":1.805} |
| 175.3 | Kadakaküla 3 → Kadakaküla 4 | {"water":7.22} |
| 175.45 | Idaküla 4 → Idaküla 1 | {"fruit":4.807143} |
| 175.45 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 175.45 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 175.45 | Põhjaküla 1 → Põhjaküla 3 | {"water":3.61} |
| 175.6 | Kadakaküla 4 → Kadakaküla 3 | {"meat":8.1225,"cheese":1.805} |
| 175.6 | Kadakaküla 5 → Kadakaküla 3 | {"fruit":0.3475,"meat":0.9025} |
| 175.7 | Kadakaküla 2 → Kadakaküla 5 | {"flax":3.61,"iron":4.5125} |
| 175.7 | Põhjaküla 1 → Põhjaküla 4 | {"cloth":0.9025} |
| 175.7 | Lõunaküla 1 → Lõunaküla 4 | {"cloth":0.9025} |
| 175.95 | Lõunaküla 4 → Lõunaküla 2 | {"water":4.5125} |
| 176.05 | Kadakaküla 3 → Kadakaküla 4 | {"water":5.415} |
| 176.1 | Idaküla 1 → Idaküla 2 | {"copper":1.805} |
| 176.1 | Lõunaküla 3 → Lõunaküla 4 | {"fruit":1.805} |
| 176.2 | Idaküla 4 → Idaküla 1 | {"fruit":0.307857} |
| 176.2 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 176.25 | Kadakaküla 1 → Kadakaküla 2 | {"water":6.3175} |
| 176.45 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 176.5 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 176.5 | Idaküla 1 → Idaküla 3 | {"copper":1.805} |
| 176.6 | Kadakaküla 5 → Kadakaküla 4 | {"weapons":1.805} |
| 176.7 | Idaküla 4 → Idaküla 1 | {"fruit":5.107143} |
| 176.7 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 176.7 | Põhjaküla 4 → Põhjaküla 1 | {"fruit":1.805} |
| 176.7 | Põhjaküla 1 → Põhjaküla 3 | {"cloth":0.9025,"water":4.5125} |
| 176.95 | Kadakaküla 5 → Kadakaküla 3 | {"meat":9.025,"fruit":0.9025,"cheese":0.9025} |
| 176.95 | Põhjaküla 4 → Põhjaküla 3 | {"fruit":0.9025} |
| 177.2 | Lõunaküla 4 → Lõunaküla 2 | {"water":3.61} |
| 177.25 | Kadakaküla 1 → Kadakaküla 2 | {"grain":1.805,"water":0.9025} |
| 177.35 | Kadakaküla 2 → Kadakaküla 4 | {"flax":3.61} |
| 177.35 | Idaküla 1 → Idaküla 2 | {"cutstone":2.7075} |
| 177.4 | Kadakaküla 3 → Kadakaküla 2 | {"water":7.22} |
| 177.45 | Idaküla 4 → Idaküla 1 | {"fruit":0.731786} |
| 177.45 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 177.45 | Lõunaküla 4 → Lõunaküla 2 | {"water":0.9025} |
| 177.5 | Põhjaküla 2 → Põhjaküla 1 | {"flax":1.805} |
| 177.7 | Põhjaküla 4 → Põhjaküla 3 | {"fruit":0.9025} |
| 177.7 | Idaküla 3 → Idaküla 4 | {"meat":0.9025} |
| 177.75 | Idaküla 1 → Idaküla 3 | {"copper":2.7075} |
| 177.95 | Idaküla 4 → Idaküla 1 | {"fruit":5.585714} |
| 177.95 | Kadakaküla 5 → Kadakaküla 3 | {"cheese":4.5125,"meat":0.9175} |
| 177.95 | Põhjaküla 1 → Põhjaküla 3 | {"water":4.5125} |
| 178.05 | Kadakaküla 3 → Kadakaküla 4 | {"water":12.635} |
| 178.1 | Lõunaküla 1 → Lõunaküla 2 | {"cloth":0.9025} |
| 178.2 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 178.25 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 178.25 | Kadakaküla 1 → Kadakaküla 2 | {"water":8.1225,"grain":1.805,"vegetables":1.805} |
| 178.35 | Idaküla 1 → Idaküla 2 | {"tin":1.805} |
| 178.45 | Lõunaküla 4 → Lõunaküla 2 | {"water":5.415,"vegetables":0.9025} |
| 178.45 | Lõunaküla 1 → Lõunaküla 3 | {"cloth":0.9025} |
| 178.6 | Kadakaküla 5 → Kadakaküla 3 | {"meat":5.4} |
| 178.7 | Idaküla 4 → Idaküla 1 | {"fruit":0.443214} |
| 178.7 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 178.85 | Lõunaküla 1 → Lõunaküla 2 | {"fish":0.9025} |
| 178.95 | Kadakaküla 5 → Kadakaküla 3 | {"fruit":0.315} |
| 179.2 | Idaküla 4 → Idaküla 1 | {"fruit":2.264286} |
| 179.2 | Idaküla 1 → Idaküla 4 | {"copper":4.5125} |
| 179.2 | Põhjaküla 1 → Põhjaküla 3 | {"water":3.61} |
| 179.2 | Lõunaküla 1 → Lõunaküla 4 | {"tin":0.9025,"vegetables":0.9025} |
| 179.25 | Kadakaküla 1 → Kadakaküla 2 | {"water":0.9025} |
| 179.3 | Lõunaküla 3 → Lõunaküla 2 | {"berries":0.9025,"fruit":0.9025} |
| 179.4 | Kadakaküla 3 → Kadakaküla 2 | {"water":7.22} |
| 179.45 | Põhjaküla 1 → Põhjaküla 3 | {"water":0.9025} |
| 179.6 | Kadakaküla 5 → Kadakaküla 3 | {"fruit":3.295,"cheese":1.805} |
| 179.65 | Kadakaküla 2 → Kadakaküla 3 | {"flax":3.61} |
| 179.7 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 179.7 | Põhjaküla 4 → Põhjaküla 3 | {"fruit":1.805} |
| 179.7 | Lõunaküla 4 → Lõunaküla 2 | {"water":5.415} |
| 179.7 | Lõunaküla 1 → Lõunaküla 4 | {"cloth":0.9025} |
| 179.85 | Idaküla 1 → Idaküla 2 | {"cutstone":0.9025} |
| 179.95 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 179.95 | Lõunaküla 1 → Lõunaküla 4 | {"meat":0.9025} |
| 180.05 | Kadakaküla 3 → Kadakaküla 4 | {"water":12.635} |
| 180.2 | Lõunaküla 3 → Lõunaküla 1 | {"flax":0.9025} |
| 180.2 | Lõunaküla 4 → Lõunaküla 2 | {"water":0.9025} |
| 180.25 | Idaküla 4 → Idaküla 2 | {"fruit":5.415} |
| 180.25 | Kadakaküla 1 → Kadakaküla 2 | {"grain":1.805,"water":7.22} |
| 180.25 | Idaküla 1 → Idaküla 3 | {"cutstone":1.805} |
| 180.3 | Kadakaküla 4 → Kadakaküla 3 | {"meat":0.615} |
| 180.45 | Põhjaküla 1 → Põhjaküla 3 | {"water":3.61} |
| 180.5 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 180.6 | Kadakaküla 4 → Kadakaküla 3 | {"meat":4.8} |
| 180.7 | Kadakaküla 5 → Kadakaküla 2 | {"fruit":0.9025} |
| 180.7 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 180.75 | Põhjaküla 1 → Põhjaküla 2 | {"cloth":0.9025} |
| 180.8 | Kadakaküla 3 → Kadakaküla 4 | {"water":6.3175} |
| 180.95 | Kadakaküla 4 → Kadakaküla 1 | {"cheese":1.805} |
| 180.95 | Kadakaküla 5 → Kadakaküla 3 | {"meat":4.5125} |
| 180.95 | Lõunaküla 4 → Lõunaküla 2 | {"water":0.9025} |
| 181.2 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 181.2 | Lõunaküla 1 → Lõunaküla 4 | {"fish":1.805,"meat":0.9025,"vegetables":0.9025} |
| 181.25 | Kadakaküla 1 → Kadakaküla 2 | {"water":6.3175,"grain":0.9025} |
| 181.35 | Kadakaküla 2 → Kadakaküla 4 | {"flax":3.61} |
| 181.35 | Kadakaküla 5 → Kadakaküla 4 | {"weapons":0.9025} |
| 181.45 | Põhjaküla 1 → Põhjaküla 3 | {"cloth":0.9025} |
| 181.45 | Lõunaküla 2 → Lõunaküla 4 | {"berries":1.805,"fruit":0.9025} |
| 181.5 | Idaküla 4 → Idaküla 2 | {"fruit":0.9025} |
| 181.55 | Kadakaküla 4 → Kadakaküla 3 | {"cheese":1.805} |
| 181.7 | Põhjaküla 1 → Põhjaküla 3 | {"water":4.5125} |
| 181.95 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 181.95 | Kadakaküla 5 → Kadakaküla 3 | {"meat":0.265} |
| 181.95 | Põhjaküla 4 → Põhjaküla 3 | {"fruit":0.9025} |
| 181.95 | Lõunaküla 1 → Lõunaküla 3 | {"cloth":0.9025} |
| 182.15 | Kadakaküla 3 → Kadakaküla 2 | {"water":8.1225} |
| 182.2 | Põhjaküla 4 → Põhjaküla 1 | {"flax":1.805} |
| 182.2 | Põhjaküla 1 → Põhjaküla 4 | {"cloth":0.9025} |
| 182.2 | Lõunaküla 4 → Lõunaküla 2 | {"water":3.61} |
| 182.2 | Lõunaküla 1 → Lõunaküla 3 | {"meat":0.9025,"fish":0.9025} |
| 182.25 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 182.25 | Kadakaküla 1 → Kadakaküla 2 | {"grain":1.805} |
| 182.45 | Idaküla 4 → Idaküla 1 | {"berries":0.9025} |
| 182.45 | Lõunaküla 1 → Lõunaküla 4 | {"cloth":0.9025,"vegetables":1.705} |
| 182.6 | Kadakaküla 5 → Kadakaküla 3 | {"meat":5.15} |
| 182.95 | Kadakaküla 5 → Kadakaküla 3 | {"meat":5.415} |
| 182.95 | Põhjaküla 1 → Põhjaküla 3 | {"water":4.5125} |
| 183 | Idaküla 4 → Idaküla 3 | {"fruit":8.1225} |
| 183.25 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 183.25 | Kadakaküla 1 → Kadakaküla 2 | {"grain":1.805,"water":0.9025} |
| 183.4 | Kadakaküla 3 → Kadakaküla 2 | {"water":7.22} |
| 183.4 | Lõunaküla 1 → Lõunaküla 4 | {"vegetables":0.1} |
| 183.45 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 183.55 | Kadakaküla 4 → Kadakaküla 3 | {"cheese":0.9025} |
| 183.7 | Idaküla 4 → Idaküla 3 | {"fruit":0.9025} |
| 183.7 | Kadakaküla 5 → Kadakaküla 1 | {"fruit":0.9025} |
| 183.7 | Lõunaküla 4 → Lõunaküla 2 | {"water":0.9025} |
| 183.7 | Lõunaküla 1 → Lõunaküla 4 | {"vegetables":1.805} |
| 183.95 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 184.05 | Kadakaküla 3 → Kadakaküla 4 | {"water":18.9525} |
| 184.2 | Idaküla 1 → Idaküla 4 | {"meat":1.805} |
| 184.2 | Põhjaküla 1 → Põhjaküla 3 | {"water":3.61} |
| 184.25 | Kadakaküla 1 → Kadakaküla 2 | {"water":6.3175} |
| 184.3 | Kadakaküla 4 → Kadakaküla 3 | {"meat":0.23} |
| 184.35 | Lõunaküla 3 → Lõunaküla 4 | {"fruit":1.805} |
| 184.45 | Põhjaküla 1 → Põhjaküla 3 | {"water":0.9025} |
| 184.45 | Lõunaküla 1 → Lõunaküla 3 | {"cloth":0.9025} |
| 184.6 | Kadakaküla 4 → Kadakaküla 3 | {"meat":9.6975,"cheese":0.9025} |
| 184.65 | Kadakaküla 2 → Kadakaküla 3 | {"flax":3.61,"cheese":0.9025} |
| 184.7 | Kadakaküla 5 → Kadakaküla 2 | {"fruit":0.9025} |
| 184.7 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 184.7 | Põhjaküla 4 → Põhjaküla 3 | {"fruit":4.5125} |
| 184.7 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 184.7 | Lõunaküla 1 → Lõunaküla 3 | {"pottery":0.9025} |
| 184.8 | Kadakaküla 3 → Kadakaküla 4 | {"water":5.415} |
| 184.95 | Kadakaküla 5 → Kadakaküla 1 | {"fruit":0.9025} |
| 184.95 | Lõunaküla 1 → Lõunaküla 4 | {"meat":1.805,"fish":1.805,"vegetables":1.805} |
| 185.2 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 185.25 | Kadakaküla 1 → Kadakaküla 2 | {"water":8.1225,"grain":1.805} |
| 185.35 | Kadakaküla 2 → Kadakaküla 4 | {"flax":3.61} |
| 185.45 | Põhjaküla 1 → Põhjaküla 3 | {"water":3.61} |
| 185.6 | Kadakaküla 4 → Kadakaküla 3 | {"cheese":0.9025} |
| 185.6 | Kadakaküla 5 → Kadakaküla 3 | {"fruit":0.9025} |
| 185.6 | Lõunaküla 1 → Lõunaküla 2 | {"cloth":0.9025} |
| 185.7 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 185.7 | Põhjaküla 4 → Põhjaküla 3 | {"fruit":0.2525} |
| 185.95 | Kadakaküla 5 → Kadakaküla 3 | {"meat":9.025} |
| 185.95 | Lõunaküla 4 → Lõunaküla 2 | {"water":3.61} |
| 185.95 | Lõunaküla 1 → Lõunaküla 4 | {"cloth":0.9025} |
| 186.15 | Kadakaküla 3 → Kadakaküla 2 | {"water":6.3175} |
| 186.2 | Kadakaküla 5 → Kadakaküla 3 | {"fruit":0.9025} |
| 186.2 | Põhjaküla 1 → Põhjaküla 3 | {"cloth":0.9025} |
| 186.2 | Lõunaküla 1 → Lõunaküla 4 | {"vegetables":1.805} |
| 186.25 | Idaküla 4 → Idaküla 2 | {"berries":1.805} |
| 186.25 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 186.25 | Kadakaküla 1 → Kadakaküla 2 | {"water":0.9025} |
| 186.45 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 186.5 | Põhjaküla 4 → Põhjaküla 3 | {"fruit":0.65} |
| 186.7 | Põhjaküla 1 → Põhjaküla 3 | {"water":4.5125} |
| 186.75 | Põhjaküla 2 → Põhjaküla 1 | {"flax":1.805} |
| 186.85 | Lõunaküla 3 → Lõunaküla 4 | {"fruit":1.805} |
| 186.95 | Kadakaküla 5 → Kadakaküla 3 | {"meat":6.28} |
| 186.95 | Põhjaküla 4 → Põhjaküla 3 | {"fruit":0.9025} |
| 187 | Põhjaküla 1 → Põhjaküla 2 | {"cutstone":0.9025} |
| 187.2 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 187.2 | Kadakaküla 4 → Kadakaküla 1 | {"cheese":0.9025} |
| 187.2 | Lõunaküla 4 → Lõunaküla 2 | {"water":3.61} |
| 187.2 | Lõunaküla 1 → Lõunaküla 3 | {"vegetables":0.9025} |
| 187.2 | Lõunaküla 2 → Lõunaküla 4 | {"cheese":0.9025,"berries":0.9025} |
| 187.25 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 187.25 | Kadakaküla 1 → Kadakaküla 2 | {"grain":1.805} |
| 187.4 | Kadakaküla 3 → Kadakaküla 2 | {"water":7.22} |
| 187.45 | Lõunaküla 3 → Lõunaküla 1 | {"flax":0.9025} |
| 187.45 | Lõunaküla 1 → Lõunaküla 3 | {"vegetables":0.9025} |
| 187.45 | Lõunaküla 2 → Lõunaküla 4 | {"fruit":1.805,"vegetables":1.805,"meat":1.805,"fish":1.805} |
| 187.5 | Idaküla 4 → Idaküla 2 | {"fruit":0.9025} |
| 187.5 | Põhjaküla 1 → Põhjaküla 2 | {"cloth":0.9025} |
| 187.6 | Kadakaküla 5 → Kadakaküla 3 | {"meat":3.6475,"cheese":0.9025} |
| 187.95 | Kadakaküla 5 → Kadakaküla 1 | {"berries":0.9025,"fruit":0.9025} |
| 187.95 | Põhjaküla 1 → Põhjaküla 3 | {"water":4.5125} |
| 188.05 | Kadakaküla 3 → Kadakaküla 4 | {"water":18.9525} |
| 188.2 | Lõunaküla 1 → Lõunaküla 3 | {"cloth":0.9025} |
| 188.25 | Kadakaküla 1 → Kadakaküla 2 | {"water":8.1225,"grain":1.805} |
| 188.3 | Kadakaküla 4 → Kadakaküla 3 | {"cheese":1.67} |
| 188.3 | Idaküla 3 → Idaküla 2 | {"fruit":0.9025} |
| 188.45 | Lõunaküla 4 → Lõunaküla 2 | {"water":2.7075} |
| 188.6 | Kadakaküla 4 → Kadakaküla 3 | {"cheese":5.55} |
| 188.65 | Kadakaküla 2 → Kadakaküla 3 | {"flax":3.61} |
| 188.7 | Lõunaküla 1 → Lõunaküla 4 | {"cloth":0.9025,"meat":1.4675} |
| 188.95 | Lõunaküla 3 → Lõunaküla 1 | {"flax":1.805} |
| 188.95 | Kadakaküla 5 → Kadakaküla 3 | {"vegetables":0.9025,"meat":5.415} |
| 189 | Põhjaküla 1 → Põhjaküla 2 | {"cutstone":2.7075} |
| 189.2 | Põhjaküla 4 → Põhjaküla 3 | {"water":3.61} |
| 189.25 | Kadakaküla 1 → Kadakaküla 2 | {"water":0.9025} |
| 189.25 | Idaküla 1 → Idaküla 3 | {"ore":1.805} |
| 189.4 | Kadakaküla 3 → Kadakaküla 2 | {"water":7.22} |
| 189.45 | Põhjaküla 1 → Põhjaküla 3 | {"water":0.9025} |
| 189.5 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 189.65 | Lõunaküla 1 → Lõunaküla 4 | {"meat":1.24,"fish":2.7075,"vegetables":0.9025} |

## Peatumise diagnostika

### Riik 1

Järgmise ajastu materjalide puudujääk: {}. Teadust käigus: 77.50.
- Kadakaküla 1: elanikke 17.00; varud {"wood":420,"plank":409.85,"stone":420,"grain":20.657142857142823,"flour":9.5,"water":99.40000000000025,"bread":0,"ore":11.4,"coal":9.5,"iron":7.6,"weapons":4.75,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":1612,"clay":0,"pottery":0,"cutstone":12.900000000000002,"copper":15.2,"tin":15.2,"bronze":0,"carts":0,"meat":113.40000000000008,"fish":0,"berries":13.299999999999997,"vegetables":99.49999999999997,"fruit":19.949999999999992,"cheese":19.949999999999992,"spices":0,"coffee":0,"flax":2.950000000000008,"gems":0,"silk":0,"dyes":0,"cocoa":0,"rubber":0,"cloth":143.48316666666642,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.
  - (184, 91) quarry: valmis=true, töötajaid=0, olek=Ootab tööjõudu.
  - (184, 91) hunter: valmis=true, töötajaid=2, olek=Ladu täis: Liha.
  - (184, 91) hunter: valmis=true, töötajaid=2, olek=Ladu täis: Liha.
  - (184, 91) farm: valmis=true, töötajaid=4, olek=Ladu täis: Vili.
  - (184, 91) saw: valmis=true, töötajaid=3, olek=Toodab · 100%.
- Kadakaküla 2: elanikke 16.00; varud {"wood":420,"plank":420,"stone":420,"grain":3.4214285714285753,"flour":9.5,"water":22.59999999999984,"bread":0,"ore":1.6999999999999984,"coal":420,"iron":14.650000000000002,"weapons":4.75,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":1228,"clay":0,"pottery":0,"cutstone":63,"copper":420,"tin":189.4,"bronze":0,"carts":0,"meat":152.94999999999837,"fish":0,"berries":7.6000000000000005,"vegetables":18.999999999999996,"fruit":19,"cheese":83.14999999999999,"spices":0,"coffee":0,"flax":193.4499999999999,"gems":0,"silk":0,"dyes":0,"cocoa":0,"rubber":0,"cloth":273.59033333335157,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.
  - (170, 88) hunter: valmis=true, töötajaid=2, olek=Ladu täis: Liha.
  - (170, 88) quarry: valmis=true, töötajaid=0, olek=Ootab tööjõudu.
  - (170, 88) saw: valmis=true, töötajaid=0, olek=Ootab tööjõudu.
  - (170, 88) mine: valmis=true, töötajaid=0, olek=Ootab tööjõudu.
  - (170, 88) smelter: valmis=true, töötajaid=0, olek=Ootab: Maak.
- Kadakaküla 3: elanikke 21.00; varud {"wood":120,"plank":120,"stone":27.75,"grain":9.5,"flour":9.5,"water":71.90000000000173,"bread":0,"ore":11.399999999999999,"coal":120,"iron":7.6,"weapons":4.75,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":1468,"clay":0,"pottery":0,"cutstone":4.75,"copper":4.75,"tin":3.8,"bronze":0,"carts":0,"meat":13.400000000000098,"fish":0,"berries":14.149999999999917,"vegetables":13.349999999999994,"fruit":13.849999999999994,"cheese":13.649999999999995,"spices":0,"coffee":0,"flax":2.9499999999999966,"gems":0,"silk":0,"dyes":0,"cocoa":0,"rubber":0,"cloth":73.36349999999662,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.
  - (192, 91) hunter: valmis=true, töötajaid=2, olek=Läheb jahile.
  - (192, 91) saw: valmis=true, töötajaid=0, olek=Ootab tööjõudu.
- Kadakaküla 4: elanikke 13.00; varud {"wood":120,"plank":120,"stone":120,"grain":5.285714285714242,"flour":79.05882352941082,"water":12.1,"bread":0,"ore":0.24999999999998757,"coal":120,"iron":8.05,"weapons":4.75,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":1000,"clay":0,"pottery":0,"cutstone":85.6,"copper":120,"tin":66.8,"bronze":0,"carts":0,"meat":78.44999999999999,"fish":0,"berries":13.299999999999999,"vegetables":14.600000000000001,"fruit":15.2,"cheese":82.7,"spices":0,"coffee":0,"flax":1.1499999999999986,"gems":0,"silk":0,"dyes":0,"cocoa":0,"rubber":0,"cloth":38.708833333329835,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.
  - (183, 88) quarry: valmis=true, töötajaid=0, olek=Ootab tööjõudu.
  - (183, 88) farm: valmis=true, töötajaid=4, olek=Ladu täis: Vili.
  - (183, 88) saw: valmis=true, töötajaid=0, olek=Ootab tööjõudu.
  - (183, 88) mine: valmis=true, töötajaid=0, olek=Ootab tööjõudu.
  - (183, 88) smelter: valmis=true, töötajaid=0, olek=Ootab: Maak.
- Kadakaküla 5: elanikke 3.00; varud {"wood":120,"plank":120,"stone":120,"grain":1.7142857142857109,"flour":9.5,"water":0,"bread":0,"ore":2.25,"coal":120,"iron":1.0999999999999979,"weapons":8.999999999999996,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":569,"clay":0,"pottery":0,"cutstone":28.75,"copper":4.75,"tin":3.8,"bronze":0,"carts":0,"meat":252.49999999999972,"fish":0,"berries":4.749999999999999,"vegetables":4.75,"fruit":18.400000000000016,"cheese":5.750000000000001,"spices":0,"coffee":0,"flax":1.5,"gems":0,"silk":0,"dyes":0,"cocoa":0,"rubber":0,"cloth":6.620500000000539,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.
  - (188, 91) hunter: valmis=true, töötajaid=1.5, olek=Ladu täis: Liha.
  - (188, 91) quarry: valmis=true, töötajaid=0, olek=Ootab tööjõudu.
  - (188, 91) saw: valmis=true, töötajaid=0, olek=Ootab tööjõudu.
  - (188, 91) smelter: valmis=true, töötajaid=0, olek=Ootab: Maak.
  - (188, 91) hunter: valmis=true, töötajaid=0.25, olek=Ladu täis: Liha.

### Riik 2

Järgmise ajastu materjalide puudujääk: {}. Teadust käigus: 49.70.
- Idaküla 1: elanikke 19.00; varud {"wood":419.6,"plank":420,"stone":420,"grain":41.37142857142858,"flour":0,"water":95.60000000000025,"bread":1.9,"ore":418.45,"coal":9.5,"iron":7.6000000000000005,"weapons":0,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":2152,"clay":121.2,"pottery":1.0694999999999815,"cutstone":5.3500000000000005,"copper":9.75,"tin":4.1,"bronze":0,"carts":0,"meat":53.599999999999085,"fish":0,"berries":12.049999999999999,"vegetables":23.400000000000002,"fruit":21.849999999999998,"cheese":0,"spices":0,"coffee":0,"flax":1.7000000000000002,"gems":0,"silk":3.8,"dyes":0,"cocoa":0,"rubber":0,"cloth":1.5191666666666066,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.
  - (47, 41) quarry: valmis=true, töötajaid=0, olek=Ootab tööjõudu.
  - (47, 41) hunter: valmis=true, töötajaid=2, olek=Ladu täis: Liha.
  - (47, 41) hunter: valmis=true, töötajaid=2, olek=Ladu täis: Liha.
  - (47, 41) hunter: valmis=true, töötajaid=2, olek=Ladu täis: Liha.
  - (47, 41) farm: valmis=true, töötajaid=3, olek=Ladu täis: Vili.
  - (47, 41) saw: valmis=true, töötajaid=0, olek=Ootab tööjõudu.
  - (47, 40) mine: valmis=true, töötajaid=4, olek=Kaevandab.
- Idaküla 2: elanikke 8.00; varud {"wood":120,"plank":120,"stone":120,"grain":9.14999999999999,"flour":0,"water":100,"bread":0,"ore":8.400000000000006,"coal":120,"iron":77.80000000000001,"weapons":0,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":583,"clay":7.6,"pottery":0,"cutstone":4.75,"copper":4.75,"tin":1.9,"bronze":0,"carts":0,"meat":193.14999999999975,"fish":0,"berries":4.3500000000000005,"vegetables":12.349999999999998,"fruit":9.5,"cheese":0,"spices":0,"coffee":0,"flax":6.3,"gems":0,"silk":5.7,"dyes":0,"cocoa":0,"rubber":0,"cloth":0,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.
  - (44, 45) hunter: valmis=true, töötajaid=2, olek=Jahib ulukeid.
  - (44, 45) quarry: valmis=true, töötajaid=0, olek=Ootab tööjõudu.
  - (44, 45) saw: valmis=true, töötajaid=0, olek=Ootab tööjõudu.
  - (44, 45) mine: valmis=true, töötajaid=0, olek=Ootab tööjõudu.
  - (44, 45) smelter: valmis=true, töötajaid=3, olek=Toodab · 100%.
- Idaküla 3: elanikke 6.00; varud {"wood":116.1,"plank":120,"stone":120,"grain":9.5,"flour":0,"water":100,"bread":0,"ore":11.9,"coal":119.9,"iron":58,"weapons":0,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":509,"clay":7.6,"pottery":0,"cutstone":1.9,"copper":4.75,"tin":0,"bronze":0,"carts":0,"meat":197.44999999999996,"fish":0,"berries":5.05,"vegetables":19.850000000000012,"fruit":8.55,"cheese":0,"spices":0,"coffee":0,"flax":0,"gems":0,"silk":5.7,"dyes":0,"cocoa":0,"rubber":0,"cloth":0,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.
  - (51, 40) hunter: valmis=true, töötajaid=1, olek=Jahib ulukeid.
  - (51, 40) quarry: valmis=true, töötajaid=0, olek=Ootab tööjõudu.
  - (51, 40) saw: valmis=true, töötajaid=0, olek=Ootab tööjõudu.
  - (51, 40) mine: valmis=true, töötajaid=0, olek=Ootab tööjõudu.
  - (51, 40) smelter: valmis=true, töötajaid=0.25, olek=Toodab · 12%.
- Idaküla 4: elanikke 12.00; varud {"wood":107.95000000000002,"plank":120,"stone":27.849999999999994,"grain":9.692857142857141,"flour":0,"water":99.85000000000021,"bread":5.099999999999998,"ore":11.4,"coal":120,"iron":7.6,"weapons":0,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":287,"clay":7.6,"pottery":0,"cutstone":0,"copper":4.75,"tin":0,"bronze":0,"carts":0,"meat":13.099999999999998,"fish":0,"berries":16.107142857142847,"vegetables":23.80000000000002,"fruit":23.700000000000003,"cheese":0,"spices":0,"coffee":0,"flax":0,"gems":0,"silk":120,"dyes":0,"cocoa":0,"rubber":0,"cloth":0,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.
  - (48, 35) saw: valmis=true, töötajaid=0, olek=Ootab tööjõudu.

### Riik 3

Järgmise ajastu materjalide puudujääk: {"iron":20}. Teadust käigus: 50.25.
- Põhjaküla 1: elanikke 13.00; varud {"wood":120,"plank":120,"stone":120,"grain":0.3571428571428683,"flour":85.14705882352939,"water":94.55000000000014,"bread":0,"ore":0,"coal":120,"iron":0,"weapons":0,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":1377,"clay":0,"pottery":0,"cutstone":5.200000000000001,"copper":5.15,"tin":3,"bronze":0,"carts":0,"meat":86.09999999999918,"fish":0,"berries":15.199999999999998,"vegetables":85.39999999999999,"fruit":15.2,"cheese":0,"spices":0,"coffee":0,"flax":5.250000000000019,"gems":21.8,"silk":0,"dyes":0,"cocoa":0,"rubber":0,"cloth":119.10716666666242,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.
  - (80, 106) quarry: valmis=true, töötajaid=0, olek=Ootab tööjõudu.
  - (80, 106) hunter: valmis=true, töötajaid=2, olek=Läheb jahile.
  - (80, 106) hunter: valmis=true, töötajaid=2, olek=Jahib ulukeid.
  - (80, 106) farm: valmis=true, töötajaid=4, olek=Ladu täis: Vili.
  - (80, 106) saw: valmis=true, töötajaid=0, olek=Ootab tööjõudu.
  - (80, 106) smelter: valmis=true, töötajaid=0, olek=Ootab: Maak.
  - (80, 105) mine: valmis=true, töötajaid=0, olek=Ootab tööjõudu.
- Põhjaküla 2: elanikke 7.00; varud {"wood":120,"plank":120,"stone":27.25,"grain":9.5,"flour":9.5,"water":100,"bread":0,"ore":0,"coal":120,"iron":0,"weapons":0,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":582,"clay":0,"pottery":0,"cutstone":3.8,"copper":2.85,"tin":0,"bronze":0,"carts":0,"meat":53.000000000000064,"fish":0,"berries":7.400000000000003,"vegetables":8,"fruit":7.6,"cheese":0,"spices":0,"coffee":0,"flax":117.09999999999998,"gems":3.8,"silk":0,"dyes":0,"cocoa":0,"rubber":0,"cloth":1.6978333333328677,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.
  - (78, 109) hunter: valmis=true, töötajaid=2, olek=Ladu täis: Liha.
  - (78, 109) hunter: valmis=true, töötajaid=2, olek=Ladu täis: Liha.
  - (78, 109) saw: valmis=true, töötajaid=0, olek=Ootab tööjõudu.
- Põhjaküla 3: elanikke 10.00; varud {"wood":120,"plank":120,"stone":120,"grain":9.5,"flour":9.5,"water":19.89999999999991,"bread":0,"ore":0,"coal":120,"iron":0,"weapons":0,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":763,"clay":0,"pottery":0,"cutstone":0,"copper":0,"tin":0,"bronze":0,"carts":0,"meat":111.54999999999896,"fish":0,"berries":47.50000000000105,"vegetables":110.55,"fruit":11.399999999999999,"cheese":0,"spices":0,"coffee":0,"flax":3.8,"gems":120,"silk":0,"dyes":0,"cocoa":0,"rubber":0,"cloth":2.2083333333341693,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.
  - (78, 104) hunter: valmis=true, töötajaid=0, olek=Ootab tööjõudu.
  - (78, 104) hunter: valmis=true, töötajaid=0, olek=Ootab tööjõudu.
  - (78, 104) saw: valmis=true, töötajaid=0, olek=Ootab tööjõudu.
  - (78, 104) smelter: valmis=true, töötajaid=0, olek=Ootab: Maak.
  - (77, 104) mine: valmis=true, töötajaid=0, olek=Ootab tööjõudu.
- Põhjaküla 4: elanikke 7.00; varud {"wood":120,"plank":120,"stone":27.499999999999996,"grain":9.5,"flour":9.5,"water":99.30000000000057,"bread":0,"ore":0,"coal":120,"iron":0,"weapons":0,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":528,"clay":0,"pottery":0,"cutstone":0,"copper":0,"tin":0,"bronze":0,"carts":0,"meat":18.650000000000073,"fish":0,"berries":18.449999999999918,"vegetables":20.450000000000006,"fruit":13.8,"cheese":0,"spices":0,"coffee":0,"flax":120,"gems":3.8,"silk":0,"dyes":0,"cocoa":0,"rubber":0,"cloth":0.9508333333328819,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.
  - (76, 106) hunter: valmis=true, töötajaid=2, olek=Jahib ulukeid.
  - (76, 106) saw: valmis=true, töötajaid=0, olek=Ootab tööjõudu.

### Riik 4

Järgmise ajastu materjalide puudujääk: {}. Teadust käigus: 57.45.
- Lõunaküla 1: elanikke 19.00; varud {"wood":120,"plank":120,"stone":120,"grain":6.642857142857139,"flour":2.200000000000003,"water":92.9500000000027,"bread":50.85,"ore":15.2,"coal":9.5,"iron":7.6000000000000005,"weapons":0,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":2120,"clay":120,"pottery":4.34416666666647,"cutstone":3.75,"copper":57.75,"tin":18.6,"bronze":0,"carts":0,"meat":116.64999999999712,"fish":104.19999999999966,"berries":21.849999999999998,"vegetables":33.499999999999986,"fruit":21.849999999999994,"cheese":0,"spices":0,"coffee":0,"flax":3.8000000000000096,"gems":3.8,"silk":9.8,"dyes":0,"cocoa":0,"rubber":0,"cloth":71.7996666666672,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.
  - (181, 56) quarry: valmis=true, töötajaid=0, olek=Ootab tööjõudu.
  - (181, 56) hunter: valmis=true, töötajaid=2, olek=Ladu täis: Liha.
  - (181, 56) hunter: valmis=true, töötajaid=2, olek=Ladu täis: Liha.
  - (181, 56) hunter: valmis=true, töötajaid=2, olek=Ladu täis: Liha.
  - (181, 56) farm: valmis=true, töötajaid=4, olek=Ladu täis: Vili.
  - (181, 56) saw: valmis=true, töötajaid=0, olek=Ootab tööjõudu.
  - (181, 56) fisher: valmis=true, töötajaid=2, olek=Ladu täis: Kala.
- Lõunaküla 2: elanikke 6.00; varud {"wood":120,"plank":120,"stone":120,"grain":3.5,"flour":3.8,"water":14.999999999999952,"bread":18.05,"ore":120,"coal":120,"iron":80.15,"weapons":0,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":497,"clay":7.6,"pottery":0,"cutstone":4.75,"copper":4.75,"tin":3.8,"bronze":0,"carts":0,"meat":102.85000000000015,"fish":8.549999999999999,"berries":8.549999999999999,"vegetables":8.549999999999999,"fruit":7.6000000000000005,"cheese":8.05,"spices":0,"coffee":0,"flax":5.7,"gems":3.8,"silk":5.7,"dyes":0,"cocoa":0,"rubber":0,"cloth":1.7229999999999892,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.
  - (177, 60) hunter: valmis=true, töötajaid=2, olek=Jahib ulukeid.
  - (177, 60) quarry: valmis=true, töötajaid=0, olek=Ootab tööjõudu.
  - (177, 60) saw: valmis=true, töötajaid=0, olek=Ootab tööjõudu.
  - (177, 60) mine: valmis=true, töötajaid=0, olek=Ootab tööjõudu.
  - (177, 60) smelter: valmis=true, töötajaid=2.75, olek=Toodab · 93%.
- Lõunaküla 3: elanikke 14.00; varud {"wood":120,"plank":120,"stone":27.89999999999999,"grain":6.071428571428571,"flour":0,"water":100,"bread":6.699999999999999,"ore":11.4,"coal":120,"iron":7.650000000000003,"weapons":0,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":562,"clay":7.6000000000000005,"pottery":0,"cutstone":4.75,"copper":4.75,"tin":3.8,"bronze":0,"carts":0,"meat":14.699999999999998,"fish":15.299999999999997,"berries":16.128571428571348,"vegetables":15.500000000000078,"fruit":15.300000000000004,"cheese":0,"spices":0,"coffee":0,"flax":118.79999999999978,"gems":120,"silk":3.8,"dyes":0,"cocoa":0,"rubber":0,"cloth":3.358666666666919,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.
  - (182, 59) saw: valmis=true, töötajaid=0, olek=Ootab tööjõudu.
- Lõunaküla 4: elanikke 14.00; varud {"wood":120,"plank":120,"stone":27.349999999999994,"grain":9.5,"flour":0,"water":95.65000000000074,"bread":11.799999999999999,"ore":11.4,"coal":120,"iron":7.6000000000000005,"weapons":0,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":556,"clay":7.6,"pottery":0,"cutstone":4.75,"copper":4.75,"tin":3.8,"bronze":0,"carts":0,"meat":15.600000000000001,"fish":16.200000000000003,"berries":13.399999999999938,"vegetables":14.100000000000058,"fruit":14.9,"cheese":0.95,"spices":0,"coffee":0,"flax":3.8,"gems":120,"silk":120,"dyes":0,"cocoa":0,"rubber":0,"cloth":3.7076666666668365,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.
  - (177, 56) saw: valmis=true, töötajaid=0, olek=Ootab tööjõudu.


## Logi sisu

Sündmused: {"configuration":1,"city_founded":17,"building_placed":410,"research_started":199,"building_completed":350,"research_completed":195,"era_changed":11,"trade_departed":1432,"trade_fee":1424,"trade_delivered":1473,"trade_finished":1424,"era_material_wait_started":4,"trade_status":1306,"era_material_wait_ended":3,"test_stopped":1}.
JSON-aruanne sisaldab sündmusi, materjaliootusi ja lõppseisu. JSONL.GZ sisaldab lisaks iga käigu kõigi linnade ja piirkondade seisu: tööjõud, hoonete valmidus ja olekud, sisendid, lao kasutus ja piir, kohalikud veosed, töötajad, maardlate jäägid, tarnete ajalugu ning linnadevahelised veosed. Kohalike tarnete ajalugu sisaldab ka kaubaveoga saabunut; see ei ole puhta tootmise mõõdik. Kaupmehe tarne kogus arvutatakse koorma vähenemisest pärast eraldi peatumistasude mahaarvamist.
Katse oli kampaanialoogika simulatsioon, mitte brauseri visuaalne kontroll. Keskaega jõudnud riikide teadus pannakse ootele. Pärast stopptingimust katset ei jätkata ega korrata.
