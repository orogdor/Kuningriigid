# V88 uus kampaaniatest – ajastuvahetus poole odavam

Seeme: 8417. Koodi revisjon: 0fd42c57a2fd29847d5ddf2201bbf5de6940c8a6. Üks käik = 60 mängusekundit.
Kõiki nelja riiki juhib AI sama 12-sekundilise planeerimissammuga; simulatsioonisamm 0,5 sekundit. Tavalised raskusastme kordajad säilivad. Materjale ega teadust juurde ei anta.

**STOP_100_TURNS**, peatumine käigul **137.15**.
100 käigu piir täitus riigil: 3. Katse peatati kohe.

## Kokkuvõte ja tuvastatud takistus

**Hindade poolitamine aitas kolmel riigil jõuda rauaaega, kuid ei lahendanud kolmanda riigi tootmis- ja liikumistakistust.** Ükski riik ei jõudnud keskaega. Katse peatati esimese 100 käigu pikkuse ajastuseisaku korral; uut kampaaniat ei käivitatud.

- Peatumise põhjustas **riik 3 (Põhjaküla)**. Rauatöö teadus oli valmis 40/40; puudu oli ainult **50 lauda**. Kivi ja toitu oli ajastuvahetuseks piisavalt.
- Riigil oli üks linn, **3 elanikku ja saekoda puudus**. Linnas oli 20 hoonet, neist 19 valmis; tööjõud jagunes paljude töökohtade vahel.
- Detailne logi näitab puuraiujat, kes seisis vähemalt **65.–137,15. käiguni samas kohas, kaasas 12 puitu**, faasis „return”. Tema `pathFailure` kasvas 8-lt 694-le. See on otsene tõend ebaõnnestuvatest tagasiteekonna katsetest; täpset teed blokeerivat objekti see test ei määranud.
- Lõppseisus oli riigil **37 kohalikku veost**, sealhulgas korduvalt ebaõnnestunud teega toidu- ja savikoormad. Seega vajavad järgmise paranduse juures tähelepanu töömeeste tagasitee ja kauba kohaletoimetamine ning AI võime taastada puidu–laua tootmisahel.
- Riigid 1 ja 2 olid keskaja teaduse lõpetanud, kuid ootasid mõlemad 20 rauda ning vastavalt 26 ja 40,7 lauda. Riik 4 oli rauasulatuse uurimisel. Neid riike ei kuulutatud ebaõnnestunuks: nende rauaaja 100 käigu piir ei olnud täitunud.
- Logis on **175 lõpetatud uurimust, 9 rajatud linna ja 392 tegelikku sisekaubanduse tarnekorda**. Riikidevahelisi tarneid selles katses ei toimunud. Lähetusi oli 396; neli koormat olid peatumisel veel teel.

### Võrdlus eelmise hinnaga katsega

| Näitaja | Eelmine hind | Poole väiksem hind |
|---|---:|---:|
| Rauaaega jõudnud riike | 2 | 3 |
| Keskaega jõudnud riike | 0 | 0 |
| Esimene ebaõnnestunud riik | 2 | 3 |
| Katse lõpu käik | 133,317 | 137,15 |

See on üks katse kummagi hinnaga samal seemnel. Hinnamuutus muudab linnade edasisi ehitus- ja kaubandusotsuseid; iga riigi ajastuvahetus ei pea seetõttu muutuma ühepalju kiiremaks.

### Avaldamine ja kontrolli piirid

Mäng avaldati GitHubi põhiharusse revisjonina `820cd262581911398a9fceb12bf890bfea6a0770`. Selle lähtepuu `dc29cfa9a0bce147feaac5db8fd81db60e024587` kattub täpselt simulatsiooni käivitanud kohaliku revisjoni lähtepuuga. GitHub Pagesi avaldamine ning V88 loogikatestid õnnestusid.

Esimene V88 visuaalne test salvestas ranniku arvuti- ja telefonipildid, seejärel takerdus testskripti katsesse vajutada arvutivaates peidetud mobiili suuminuppu. Testskript parandati kasutama arvuti hiirerulli; mängu- ja kampaanialoogikat selle käigus ei muudetud. Parandatud V88 loogika- ja brauseritestid [läbisid kontrolli](https://github.com/orogdor/Kuningriigid/actions/runs/39577905765); [GitHub Pagesi avaldamine õnnestus](https://github.com/orogdor/Kuningriigid/actions/runs/39577878980). Mitmed varasemate versioonide mudelitestid eeldavad veel asendatud mudelite metatähiseid; nende ebaõnnestumine ei ole selle kampaaniatesti tulemus.

## Ajastuvahetused

| Riik | Ajastu | Mängu käik | Eelmises ajastus käike |
|---|---|---:|---:|
| 2 | Pronksiaeg | 33.3167 | 33.3167 |
| 4 | Pronksiaeg | 33.6083 | 33.6083 |
| 1 | Pronksiaeg | 35.1167 | 35.1167 |
| 3 | Pronksiaeg | 37.15 | 37.15 |
| 2 | Rauaaeg | 104.9667 | 71.65 |
| 1 | Rauaaeg | 112.5167 | 77.4 |
| 4 | Rauaaeg | 128.05 | 94.4417 |

## Peatumise seis

| Riik | Ajastu | Käike ajastus | Uurimine | Teadus / hind | Linnu |
|---|---|---:|---|---:|---:|
| 1 | Rauaaeg | 24.6333 | Feodaalkorraldus | 40.00 / 40.00 | 3 |
| 2 | Rauaaeg | 32.1833 | Feodaalkorraldus | 40.00 / 40.00 | 3 |
| 3 | Pronksiaeg | 100 | Rauatöö | 40.00 / 40.00 | 1 |
| 4 | Rauaaeg | 9.1 | Rauasulatus | 19.59 / 30.00 | 2 |

## Materjaliootused

| Riik | Tehnoloogia | Oote algus | Oote lõpp | Oodatud käike | Pooleli |
|---|---|---:|---:|---:|---|
| 2 | Rauatöö | 96.9833 | 104.9667 | 7.9833 | ei |
| 1 | Rauatöö | 95.3833 | 112.5167 | 17.1333 | ei |
| 4 | Rauatöö | 101.3083 | 128.05 | 26.7417 | ei |
| 2 | Feodaalkorraldus | 121.2917 | 137.15 | 15.8583 | jah |
| 3 | Rauatöö | 125.775 | 137.15 | 11.375 | jah |
| 1 | Feodaalkorraldus | 130.2083 | 137.15 | 6.9417 | jah |

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
| 1 | 18.5922 | Õpetuse alused |
| 3 | 18.9216 | Õpetuse alused |
| 2 | 19.5622 | Jahipidamine |
| 4 | 19.5622 | Jahipidamine |
| 1 | 19.8629 | Jahipidamine |
| 3 | 20.2105 | Jahipidamine |
| 2 | 22.2664 | Püünised ja kalavõrgud |
| 4 | 22.3039 | Püünised ja kalavõrgud |
| 1 | 23.0785 | Püünised ja kalavõrgud |
| 3 | 23.4918 | Püünised ja kalavõrgud |
| 2 | 24.9488 | Veevarustus |
| 4 | 25.1039 | Veevarustus |
| 1 | 26.1174 | Veevarustus |
| 3 | 26.9076 | Veevarustus |
| 2 | 27.4394 | Põlluharimine |
| 4 | 27.7678 | Põlluharimine |
| 1 | 28.9331 | Põlluharimine |
| 2 | 30.0106 | Tulekivisirbid |
| 3 | 30.091 | Põlluharimine |
| 4 | 30.3488 | Tulekivisirbid |
| 1 | 31.7039 | Tulekivisirbid |
| 3 | 33.2785 | Tulekivisirbid |
| 2 | 33.311 | Pronksitöö |
| 4 | 33.6011 | Pronksitöö |
| 1 | 35.1135 | Pronksitöö |
| 2 | 35.7464 | Põldude kanalniisutus |
| 4 | 36.2737 | Põldude kanalniisutus |
| 3 | 37.1428 | Pronksitöö |
| 1 | 37.6969 | Põldude kanalniisutus |
| 2 | 38.0866 | Sõnnikuga väetamine |
| 4 | 38.7633 | Sõnnikuga väetamine |
| 3 | 39.9703 | Põldude kanalniisutus |
| 1 | 40.2106 | Sõnnikuga väetamine |
| 2 | 40.4208 | Pronkspeitlid |
| 4 | 41.0866 | Pronkspeitlid |
| 3 | 42.7039 | Sõnnikuga väetamine |
| 1 | 42.7582 | Pronkspeitlid |
| 2 | 42.7747 | Maagi tõstekorvid |
| 4 | 43.4866 | Maagi tõstekorvid |
| 2 | 44.9747 | Savitöö ja keraamika |
| 1 | 45.0866 | Maagi tõstekorvid |
| 3 | 45.377 | Pronkspeitlid |
| 4 | 45.8012 | Savitöö ja keraamika |
| 1 | 47.4526 | Savitöö ja keraamika |
| 3 | 47.9488 | Maagi tõstekorvid |
| 2 | 48.1281 | Loomakasvatus |
| 4 | 49.262 | Loomakasvatus |
| 3 | 50.4264 | Savitöö ja keraamika |
| 1 | 50.862 | Loomakasvatus |
| 2 | 51.3099 | Kivitahumine |
| 4 | 52.6144 | Kivitahumine |
| 2 | 53.4473 | Sõjapidamine |
| 1 | 54.1468 | Kivitahumine |
| 3 | 54.2159 | Loomakasvatus |
| 4 | 54.8732 | Sõjapidamine |
| 1 | 56.2732 | Sõjapidamine |
| 2 | 56.6594 | Kaitserajatised |
| 3 | 58.0606 | Kivitahumine |
| 4 | 58.4257 | Kaitserajatised |
| 2 | 59.2394 | Vibulaskmine |
| 1 | 59.5914 | Kaitserajatised |
| 3 | 60.4866 | Sõjapidamine |
| 2 | 61.0567 | Asunduste rajamine |
| 4 | 61.3039 | Vibulaskmine |
| 1 | 62.2745 | Vibulaskmine |
| 4 | 63.1423 | Asunduste rajamine |
| 2 | 63.7488 | Kiviaja töökojad |
| 3 | 63.8714 | Kaitserajatised |
| 1 | 64.0567 | Asunduste rajamine |
| 2 | 65.6158 | Puusepatöö |
| 4 | 65.7488 | Kiviaja töökojad |
| 3 | 66.5488 | Vibulaskmine |
| 1 | 66.7852 | Kiviaja töökojad |
| 4 | 67.4641 | Puusepatöö |
| 1 | 67.9663 | Puusepatöö |
| 3 | 68.3834 | Asunduste rajamine |
| 2 | 70.0592 | Ratta valmistamine |
| 1 | 70.4723 | Ratta valmistamine |
| 4 | 70.5723 | Ratta valmistamine |
| 3 | 71.2791 | Kiviaja töökojad |
| 1 | 72.993 | Vase- ja tinatöö |
| 3 | 73.1966 | Puusepatöö |
| 4 | 74.0636 | Vase- ja tinatöö |
| 2 | 74.6522 | Vase- ja tinatöö |
| 1 | 75.7384 | Kivist kindlustused |
| 3 | 77.2436 | Ratta valmistamine |
| 4 | 77.5204 | Kivist kindlustused |
| 2 | 78.4265 | Kivist kindlustused |
| 1 | 78.4475 | Teedeehitus |
| 1 | 79.4528 | Metsade teadlik majandamine |
| 1 | 80.8719 | Laoehitus ja varude korraldus |
| 4 | 81.0936 | Teedeehitus |
| 2 | 82.0762 | Teedeehitus |
| 1 | 82.2389 | Keldrite ja toidu säilitamine |
| 4 | 82.321 | Metsade teadlik majandamine |
| 3 | 82.4977 | Vase- ja tinatöö |
| 2 | 83.1943 | Metsade teadlik majandamine |
| 4 | 84.0786 | Laoehitus ja varude korraldus |
| 1 | 84.2717 | Linnaturg ja kaubandus |
| 2 | 84.5426 | Laoehitus ja varude korraldus |
| 4 | 85.8277 | Keldrite ja toidu säilitamine |
| 2 | 85.9426 | Keldrite ja toidu säilitamine |
| 1 | 86.2637 | Kirjakunst |
| 3 | 87.4587 | Kivist kindlustused |
| 2 | 87.6009 | Linnaturg ja kaubandus |
| 1 | 88.3138 | Pronksriistad ja ehitus |
| 4 | 88.4006 | Linnaturg ja kaubandus |
| 1 | 89.2284 | Käsijahvatus ja leivategu |
| 2 | 89.2509 | Kirjakunst |
| 4 | 90.8928 | Kirjakunst |
| 2 | 90.9438 | Pronksriistad ja ehitus |
| 1 | 91.2024 | Sillaehitus |
| 2 | 91.6543 | Käsijahvatus ja leivategu |
| 1 | 91.9747 | Kalapüük |
| 3 | 92.2087 | Teedeehitus |
| 4 | 93.2394 | Pronksriistad ja ehitus |
| 2 | 93.281 | Sillaehitus |
| 1 | 93.7803 | Laevaehitus |
| 3 | 93.8863 | Metsade teadlik majandamine |
| 2 | 93.8994 | Kalapüük |
| 4 | 94.363 | Käsijahvatus ja leivategu |
| 2 | 95.5184 | Laevaehitus |
| 3 | 96.2624 | Laoehitus ja varude korraldus |
| 4 | 96.506 | Sillaehitus |
| 4 | 97.2995 | Kalapüük |
| 3 | 98.5747 | Keldrite ja toidu säilitamine |
| 4 | 99.4984 | Laevaehitus |
| 3 | 101.9171 | Linnaturg ja kaubandus |
| 2 | 104.9583 | Rauatöö |
| 3 | 105.4776 | Kirjakunst |
| 2 | 106.0714 | Rauast adratera |
| 2 | 107.2286 | Raudvikatid |
| 2 | 108.4286 | Raudkirkad |
| 3 | 109.2684 | Pronksriistad ja ehitus |
| 2 | 109.6178 | Kaevanduse kuivenduskäigud |
| 3 | 111.0567 | Käsijahvatus ja leivategu |
| 2 | 111.308 | Rauasulatus |
| 1 | 112.5083 | Rauatöö |
| 2 | 112.8747 | Sepatöö |
| 1 | 113.7346 | Rauast adratera |
| 2 | 113.9585 | Ratsaväe väljaõpe |
| 1 | 114.8689 | Raudvikatid |
| 3 | 115.2041 | Sillaehitus |
| 2 | 115.4731 | Filosoofia ja teaduste korraldus |
| 1 | 116.0367 | Raudkirkad |
| 3 | 116.8136 | Kalapüük |
| 1 | 117.2555 | Kaevanduse kuivenduskäigud |
| 2 | 117.6003 | Raudriistad ja töökojad |
| 1 | 118.988 | Rauasulatus |
| 2 | 119.8107 | Rannikunavigatsioon |
| 1 | 120.6218 | Sepatöö |
| 3 | 121.4411 | Laevaehitus |
| 1 | 122.4218 | Ratsaväe väljaõpe |
| 1 | 124.2218 | Filosoofia ja teaduste korraldus |
| 1 | 126.5624 | Raudriistad ja töökojad |
| 4 | 128.0417 | Rauatöö |
| 1 | 128.7624 | Rannikunavigatsioon |
| 4 | 129.9177 | Rauast adratera |
| 4 | 131.7707 | Raudvikatid |
| 4 | 133.5868 | Raudkirkad |
| 4 | 135.3868 | Kaevanduse kuivenduskäigud |

## Linnade rajamine

- Käik 0.4: riik 2, Idaküla 1, ruut (47, 41), eriala ["grain","water","wood","stone","clay","game","fish"].
- Käik 0.4: riik 4, Lõunaküla 1, ruut (181, 56), eriala ["grain","water","wood","stone","clay","game","fish"].
- Käik 0.8: riik 3, Põhjaküla 1, ruut (80, 106), eriala ["grain","water","wood","stone","clay","game"].
- Käik 0.8083: riik 1, Kadakaküla 1, ruut (184, 91), eriala ["grain","water","wood","stone","clay","game"].
- Käik 66.6083: riik 1, Kadakaküla 2, ruut (170, 88), eriala ["copper","tin","flax"].
- Käik 68.4: riik 4, Lõunaküla 2, ruut (176, 60), eriala ["ore","flax"].
- Käik 72: riik 2, Idaküla 2, ruut (44, 45), eriala ["ore","flax"].
- Käik 82.6: riik 2, Idaküla 3, ruut (50, 40), eriala [].
- Käik 98.8083: riik 1, Kadakaküla 3, ruut (173, 87), eriala [].

## Tegelikult kohale toimetatud kaubad

| Käik | Saatja linn → saaja linn | Kaup ja kogus |
|---:|---|---|
| 67.9 | Kadakaküla 2 → Kadakaküla 1 | {"bread":1.805} |
| 67.9 | Kadakaküla 1 → Kadakaküla 2 | {"grain":9.025,"clay":7.22,"cutstone":0.9025,"meat":3.61,"vegetables":3.61,"stone":3.61} |
| 69.05 | Lõunaküla 2 → Lõunaküla 1 | {"bread":1.805} |
| 69.05 | Lõunaküla 1 → Lõunaküla 2 | {"grain":9.025,"clay":7.22,"pottery":0.9025,"cutstone":0.9025,"meat":3.61,"vegetables":2.7075,"stone":11.7325} |
| 69.15 | Kadakaküla 2 → Kadakaküla 1 | {"flax":1.805} |
| 69.8 | Lõunaküla 1 → Lõunaküla 2 | {"stone":1.805} |
| 70.4 | Kadakaküla 2 → Kadakaküla 1 | {"flax":3.61} |
| 70.55 | Lõunaküla 2 → Lõunaküla 1 | {"flax":1.805} |
| 70.9 | Kadakaküla 1 → Kadakaküla 2 | {"stone":5.415,"meat":0.9025,"vegetables":0.9025} |
| 71.2 | Lõunaküla 2 → Lõunaküla 1 | {"flax":3.61} |
| 71.75 | Kadakaküla 1 → Kadakaküla 2 | {"stone":9.9275} |
| 72.65 | Lõunaküla 1 → Lõunaküla 2 | {"meat":0.9025} |
| 72.7 | Idaküla 2 → Idaküla 1 | {"bread":1.805} |
| 72.7 | Idaküla 1 → Idaküla 2 | {"clay":7.22,"cutstone":3.61,"meat":3.61,"vegetables":3.61,"stone":18.05} |
| 72.75 | Kadakaküla 1 → Kadakaküla 2 | {"stone":0.9025} |
| 73.2 | Idaküla 1 → Idaküla 2 | {"stone":1.805} |
| 73.75 | Kadakaküla 1 → Kadakaküla 2 | {"meat":0.9025,"vegetables":0.9025} |
| 73.95 | Idaküla 2 → Idaküla 1 | {"flax":1.805} |
| 74.15 | Lõunaküla 1 → Lõunaküla 2 | {"cutstone":2.7075,"pottery":1.805} |
| 74.35 | Idaküla 1 → Idaküla 2 | {"grain":9.025} |
| 74.4 | Lõunaküla 2 → Lõunaküla 1 | {"flax":1.805} |
| 74.75 | Kadakaküla 1 → Kadakaküla 2 | {"stone":21.66,"grain":0.9025} |
| 74.95 | Idaküla 2 → Idaküla 1 | {"flax":3.61} |
| 75.75 | Kadakaküla 1 → Kadakaküla 2 | {"stone":0.9025} |
| 76.35 | Idaküla 1 → Idaküla 2 | {"meat":0.9025,"vegetables":0.9025} |
| 76.5 | Kadakaküla 2 → Kadakaküla 1 | {"cloth":1.805} |
| 77 | Kadakaküla 1 → Kadakaküla 2 | {"stone":21.66} |
| 77.15 | Lõunaküla 2 → Lõunaküla 1 | {"flax":1.805} |
| 77.15 | Lõunaküla 1 → Lõunaküla 2 | {"cloth":1.805} |
| 77.5 | Kadakaküla 2 → Kadakaküla 1 | {"meat":1.805} |
| 77.65 | Lõunaküla 1 → Lõunaküla 2 | {"grain":2.7075} |
| 78.1 | Idaküla 2 → Idaküla 1 | {"flax":1.805} |
| 78.15 | Lõunaküla 1 → Lõunaküla 2 | {"grain":0.9025} |
| 78.4 | Lõunaküla 2 → Lõunaküla 1 | {"vegetables":0.9025} |
| 78.5 | Kadakaküla 2 → Kadakaküla 1 | {"cloth":0.9025,"meat":1.805} |
| 78.6 | Idaküla 1 → Idaküla 2 | {"cutstone":0.9025} |
| 79.15 | Lõunaküla 2 → Lõunaküla 1 | {"berries":0.9025} |
| 79.5 | Kadakaküla 2 → Kadakaküla 1 | {"meat":1.805} |
| 79.9 | Lõunaküla 2 → Lõunaküla 1 | {"flax":1.805} |
| 79.9 | Lõunaküla 1 → Lõunaküla 2 | {"cutstone":0.9025} |
| 80.4 | Lõunaküla 1 → Lõunaküla 2 | {"meat":0.9025} |
| 80.5 | Kadakaküla 2 → Kadakaküla 1 | {"meat":0.9025} |
| 80.85 | Idaküla 2 → Idaküla 1 | {"flax":1.805} |
| 80.85 | Idaküla 1 → Idaküla 2 | {"cloth":1.805} |
| 80.9 | Lõunaküla 1 → Lõunaküla 2 | {"pottery":0.9025} |
| 81.5 | Kadakaküla 2 → Kadakaküla 1 | {"meat":1.805} |
| 81.5 | Kadakaküla 1 → Kadakaküla 2 | {"water":1.805} |
| 82.4 | Lõunaküla 2 → Lõunaküla 1 | {"flax":1.805} |
| 82.5 | Kadakaküla 2 → Kadakaküla 1 | {"cloth":0.9025} |
| 82.5 | Kadakaküla 1 → Kadakaküla 2 | {"water":2.7075} |
| 83.05 | Idaküla 3 → Idaküla 1 | {"bread":1.805} |
| 83.05 | Idaküla 1 → Idaküla 3 | {"clay":7.22,"cutstone":1.805,"meat":3.61,"vegetables":3.61,"cloth":0.9025,"stone":3.61} |
| 83.5 | Kadakaküla 2 → Kadakaküla 1 | {"meat":0.9025} |
| 83.5 | Kadakaküla 1 → Kadakaküla 2 | {"water":2.7075} |
| 83.5 | Idaküla 1 → Idaküla 3 | {"cloth":0.9025} |
| 83.6 | Idaküla 2 → Idaküla 3 | {"flax":3.61} |
| 84.1 | Idaküla 2 → Idaküla 1 | {"flax":1.805} |
| 84.45 | Idaküla 1 → Idaküla 3 | {"cutstone":2.7075} |
| 84.5 | Kadakaküla 1 → Kadakaküla 2 | {"water":3.61} |
| 84.65 | Lõunaküla 2 → Lõunaküla 1 | {"berries":4.5125} |
| 84.75 | Kadakaküla 2 → Kadakaküla 1 | {"copper":2.7075} |
| 85.15 | Lõunaküla 2 → Lõunaküla 1 | {"flax":1.805} |
| 85.15 | Lõunaküla 1 → Lõunaküla 2 | {"meat":0.9025} |
| 85.5 | Kadakaküla 1 → Kadakaküla 2 | {"water":2.7075} |
| 85.75 | Kadakaküla 2 → Kadakaküla 1 | {"meat":0.9025} |
| 86.35 | Idaküla 2 → Idaküla 1 | {"flax":1.805} |
| 86.45 | Idaküla 1 → Idaküla 3 | {"stone":5.415} |
| 86.5 | Kadakaküla 1 → Kadakaküla 2 | {"water":0.9025} |
| 86.7 | Idaküla 1 → Idaküla 3 | {"meat":0.9025,"vegetables":0.9025} |
| 86.75 | Kadakaküla 2 → Kadakaküla 1 | {"meat":0.9025} |
| 86.9 | Lõunaküla 1 → Lõunaküla 2 | {"cloth":0.9025} |
| 87.65 | Lõunaküla 1 → Lõunaküla 2 | {"water":1.805} |
| 87.7 | Idaküla 1 → Idaküla 3 | {"stone":5.415} |
| 87.75 | Kadakaküla 2 → Kadakaküla 1 | {"meat":1.805} |
| 87.9 | Lõunaküla 2 → Lõunaküla 1 | {"flax":1.805} |
| 88.75 | Kadakaküla 2 → Kadakaküla 1 | {"meat":0.9025,"copper":3.61} |
| 88.9 | Lõunaküla 1 → Lõunaküla 2 | {"water":2.7075} |
| 89.1 | Idaküla 2 → Idaküla 1 | {"flax":1.805} |
| 89.65 | Lõunaküla 2 → Lõunaküla 1 | {"berries":1.805} |
| 89.75 | Kadakaküla 2 → Kadakaküla 1 | {"meat":0.9025} |
| 90.15 | Lõunaküla 1 → Lõunaküla 2 | {"meat":0.9025,"water":1.805} |
| 90.45 | Idaküla 1 → Idaküla 3 | {"meat":0.9025,"vegetables":0.9025} |
| 90.65 | Lõunaküla 2 → Lõunaküla 1 | {"flax":1.805} |
| 90.75 | Kadakaküla 2 → Kadakaküla 1 | {"tin":1.805,"meat":5.415} |
| 91.4 | Lõunaküla 1 → Lõunaküla 2 | {"water":3.61} |
| 91.45 | Idaküla 1 → Idaküla 3 | {"stone":14.44} |
| 91.6 | Idaküla 2 → Idaküla 1 | {"flax":1.805} |
| 91.7 | Idaküla 1 → Idaküla 3 | {"stone":0.9025} |
| 91.75 | Kadakaküla 2 → Kadakaküla 1 | {"meat":0.9025} |
| 92.6 | Idaküla 1 → Idaküla 2 | {"cloth":0.9025} |
| 92.65 | Lõunaküla 1 → Lõunaküla 2 | {"water":2.7075} |
| 92.75 | Kadakaküla 2 → Kadakaküla 1 | {"meat":6.3175,"copper":3.61,"cloth":0.9025,"stone":3.61} |
| 92.95 | Idaküla 1 → Idaküla 3 | {"vegetables":1.805,"meat":0.9025} |
| 93.4 | Lõunaküla 2 → Lõunaküla 1 | {"flax":1.805} |
| 93.4 | Lõunaküla 1 → Lõunaküla 2 | {"cloth":0.9025} |
| 93.85 | Idaküla 2 → Idaküla 1 | {"flax":1.805} |
| 93.85 | Idaküla 1 → Idaküla 2 | {"water":1.805} |
| 93.9 | Lõunaküla 2 → Lõunaküla 1 | {"flax":0.9025} |
| 93.9 | Lõunaküla 1 → Lõunaküla 2 | {"water":2.7075} |
| 94 | Kadakaküla 2 → Kadakaküla 1 | {"meat":3.61} |
| 94.2 | Idaküla 1 → Idaküla 3 | {"meat":1.805,"vegetables":0.9025} |
| 94.45 | Idaküla 1 → Idaküla 3 | {"cloth":0.9025,"meat":0.9025} |
| 94.65 | Lõunaküla 2 → Lõunaküla 1 | {"berries":0.9025} |
| 95 | Kadakaküla 2 → Kadakaküla 1 | {"tin":2.7075,"meat":2.7075} |
| 95.1 | Idaküla 1 → Idaküla 2 | {"water":1.805} |
| 95.15 | Lõunaküla 1 → Lõunaküla 2 | {"water":3.61,"meat":0.9025} |
| 95.45 | Idaküla 1 → Idaküla 3 | {"meat":2.7075,"vegetables":0.9025} |
| 95.65 | Lõunaküla 2 → Lõunaküla 1 | {"flax":1.805} |
| 95.65 | Lõunaküla 1 → Lõunaküla 2 | {"meat":0.9025} |
| 96 | Kadakaküla 2 → Kadakaküla 1 | {"meat":3.61,"copper":3.61} |
| 96.1 | Idaküla 2 → Idaküla 3 | {"vegetables":0.9025} |
| 96.35 | Idaküla 1 → Idaküla 2 | {"water":1.805} |
| 96.4 | Lõunaküla 1 → Lõunaküla 2 | {"water":2.7075} |
| 96.5 | Idaküla 3 → Idaküla 1 | {"stone":0.9025} |
| 96.7 | Idaküla 1 → Idaküla 3 | {"meat":1.805} |
| 96.85 | Idaküla 2 → Idaküla 1 | {"flax":1.805} |
| 96.9 | Lõunaküla 1 → Lõunaküla 2 | {"water":0.9025} |
| 97 | Kadakaküla 2 → Kadakaküla 1 | {"meat":1.805,"stone":3.61} |
| 97.35 | Idaküla 2 → Idaküla 1 | {"flax":0.9025} |
| 97.6 | Idaküla 1 → Idaküla 2 | {"water":0.9025} |
| 97.65 | Lõunaküla 2 → Lõunaküla 1 | {"flax":1.805} |
| 97.65 | Lõunaküla 1 → Lõunaküla 2 | {"cloth":0.9025,"water":2.7075} |
| 98 | Kadakaküla 2 → Kadakaküla 1 | {"tin":2.7075,"stone":0.9025} |
| 98.1 | Idaküla 2 → Idaküla 3 | {"vegetables":1.805} |
| 98.1 | Idaküla 1 → Idaküla 2 | {"water":0.9025} |
| 98.45 | Idaküla 1 → Idaküla 3 | {"meat":1.805} |
| 98.85 | Idaküla 1 → Idaküla 2 | {"water":0.9025} |
| 98.9 | Lõunaküla 1 → Lõunaküla 2 | {"water":3.61} |
| 99 | Kadakaküla 2 → Kadakaküla 1 | {"copper":0.9025} |
| 99.2 | Idaküla 1 → Idaküla 3 | {"meat":2.7075} |
| 99.35 | Idaküla 2 → Idaküla 1 | {"flax":1.805} |
| 99.65 | Lõunaküla 2 → Lõunaküla 1 | {"berries":1.805,"vegetables":1.805} |
| 99.75 | Kadakaküla 3 → Kadakaküla 1 | {"bread":1.805,"water":16.245} |
| 99.75 | Kadakaküla 1 → Kadakaküla 3 | {"clay":7.22} |
| 99.85 | Idaküla 2 → Idaküla 1 | {"vegetables":0.9025} |
| 100 | Kadakaküla 2 → Kadakaküla 1 | {"meat":1.805} |
| 100.1 | Idaküla 1 → Idaküla 2 | {"water":1.805} |
| 100.15 | Lõunaküla 2 → Lõunaküla 1 | {"flax":1.805} |
| 100.15 | Lõunaküla 1 → Lõunaküla 2 | {"water":3.61} |
| 100.5 | Idaküla 2 → Idaküla 3 | {"vegetables":1.805} |
| 100.75 | Kadakaküla 3 → Kadakaküla 1 | {"water":1.805} |
| 100.9 | Lõunaküla 2 → Lõunaküla 1 | {"vegetables":3.61,"berries":2.7075} |
| 101 | Kadakaküla 2 → Kadakaküla 1 | {"plank":3.61} |
| 101.1 | Idaküla 2 → Idaküla 1 | {"vegetables":1.805} |
| 101.35 | Idaküla 1 → Idaküla 2 | {"water":1.805} |
| 101.65 | Lõunaküla 1 → Lõunaküla 2 | {"cloth":0.9025} |
| 101.75 | Kadakaküla 3 → Kadakaküla 1 | {"water":1.805} |
| 101.75 | Idaküla 2 → Idaküla 3 | {"vegetables":1.805} |
| 102 | Kadakaküla 2 → Kadakaküla 1 | {"meat":3.61} |
| 102 | Idaküla 3 → Idaküla 1 | {"wood":5.415} |
| 102.15 | Lõunaküla 2 → Lõunaküla 1 | {"vegetables":3.61,"berries":1.805} |
| 102.35 | Idaküla 2 → Idaküla 1 | {"vegetables":3.61} |
| 102.5 | Idaküla 3 → Idaküla 1 | {"wood":7.22} |
| 102.6 | Idaküla 1 → Idaküla 2 | {"water":1.805} |
| 102.65 | Lõunaküla 2 → Lõunaküla 1 | {"flax":1.805} |
| 102.7 | Kadakaküla 3 → Kadakaküla 1 | {"water":1.805} |
| 102.95 | Idaküla 3 → Idaküla 1 | {"wood":3.61,"stone":3.61} |
| 103 | Kadakaküla 2 → Kadakaküla 1 | {"cloth":0.9025} |
| 103 | Idaküla 2 → Idaküla 3 | {"vegetables":2.7075} |
| 103.4 | Lõunaküla 2 → Lõunaküla 1 | {"berries":3.61,"vegetables":2.7075} |
| 103.45 | Idaküla 3 → Idaküla 1 | {"plank":3.61} |
| 103.7 | Idaküla 3 → Idaküla 1 | {"wood":3.61} |
| 103.75 | Idaküla 2 → Idaküla 3 | {"vegetables":1.805} |
| 103.85 | Idaküla 1 → Idaküla 2 | {"water":1.805} |
| 103.95 | Idaküla 3 → Idaküla 1 | {"plank":3.61} |
| 104 | Kadakaküla 2 → Kadakaküla 1 | {"plank":5.415,"meat":1.805} |
| 104.2 | Idaküla 3 → Idaküla 1 | {"wood":8.1225} |
| 104.5 | Idaküla 2 → Idaküla 3 | {"vegetables":3.61} |
| 104.65 | Lõunaküla 2 → Lõunaküla 1 | {"vegetables":1.805} |
| 104.75 | Idaküla 3 → Idaküla 2 | {"plank":7.22} |
| 105 | Kadakaküla 2 → Kadakaküla 1 | {"meat":0.9025} |
| 105.1 | Idaküla 2 → Idaküla 1 | {"vegetables":7.22,"flax":1.805} |
| 105.1 | Idaküla 1 → Idaküla 2 | {"water":1.805} |
| 105.2 | Idaküla 3 → Idaküla 1 | {"stone":25.27} |
| 105.45 | Idaküla 3 → Idaküla 1 | {"stone":4.5125} |
| 105.45 | Idaküla 1 → Idaküla 3 | {"vegetables":2.7075} |
| 105.65 | Lõunaküla 2 → Lõunaküla 1 | {"berries":3.61} |
| 105.85 | Idaküla 2 → Idaküla 1 | {"vegetables":3.61} |
| 106 | Kadakaküla 2 → Kadakaküla 1 | {"meat":1.805} |
| 106 | Idaküla 3 → Idaküla 2 | {"stone":19.855} |
| 106.15 | Lõunaküla 2 → Lõunaküla 1 | {"vegetables":4.5125} |
| 106.35 | Idaküla 1 → Idaküla 2 | {"water":1.805} |
| 106.5 | Idaküla 2 → Idaküla 3 | {"flax":1.805} |
| 106.75 | Idaküla 3 → Idaküla 2 | {"stone":0.9025} |
| 106.9 | Lõunaküla 1 → Lõunaküla 2 | {"cloth":0.9025} |
| 107 | Kadakaküla 2 → Kadakaküla 1 | {"wood":4.5125,"meat":1.805} |
| 107.1 | Idaküla 2 → Idaküla 1 | {"vegetables":4.5125} |
| 107.15 | Lõunaküla 2 → Lõunaküla 1 | {"flax":1.805,"berries":1.805,"vegetables":1.805} |
| 107.6 | Idaküla 2 → Idaküla 1 | {"flax":1.805} |
| 107.6 | Idaküla 1 → Idaküla 2 | {"water":1.805} |
| 108 | Kadakaküla 2 → Kadakaküla 1 | {"meat":1.805,"plank":5.415} |
| 108.2 | Kadakaküla 3 → Kadakaküla 1 | {"wood":9.025} |
| 108.2 | Idaküla 3 → Idaküla 1 | {"water":0.9025} |
| 108.25 | Idaküla 2 → Idaküla 3 | {"vegetables":2.7075} |
| 108.4 | Lõunaküla 2 → Lõunaküla 1 | {"vegetables":2.7075} |
| 108.45 | Kadakaküla 2 → Kadakaküla 3 | {"cutstone":4.5125,"copper":2.7075,"meat":5.415,"flax":3.61,"cloth":1.805} |
| 108.7 | Idaküla 3 → Idaküla 1 | {"vegetables":3.61} |
| 108.9 | Lõunaküla 2 → Lõunaküla 1 | {"berries":1.805} |
| 108.95 | Kadakaküla 3 → Kadakaküla 1 | {"wood":7.22} |
| 109.25 | Kadakaküla 2 → Kadakaküla 1 | {"meat":1.805,"wood":3.61} |
| 109.25 | Idaküla 3 → Idaküla 2 | {"water":0.9025} |
| 109.5 | Idaküla 2 → Idaküla 3 | {"flax":1.805,"vegetables":2.7075} |
| 109.65 | Lõunaküla 2 → Lõunaküla 1 | {"vegetables":2.7075,"berries":1.805} |
| 109.7 | Kadakaküla 3 → Kadakaküla 1 | {"wood":19.855} |
| 109.7 | Idaküla 3 → Idaküla 1 | {"water":2.7075} |
| 109.95 | Idaküla 3 → Idaküla 1 | {"water":0.9025} |
| 110.25 | Kadakaküla 2 → Kadakaküla 1 | {"meat":1.805} |
| 110.35 | Idaküla 2 → Idaküla 1 | {"vegetables":5.415,"flax":1.805} |
| 110.45 | Kadakaküla 3 → Kadakaküla 1 | {"berries":0.9025,"wood":0.9025} |
| 110.5 | Idaküla 3 → Idaküla 2 | {"water":1.805} |
| 110.85 | Idaküla 2 → Idaküla 1 | {"vegetables":4.5125} |
| 110.9 | Lõunaküla 2 → Lõunaküla 1 | {"berries":2.7075,"vegetables":1.805} |
| 110.95 | Idaküla 3 → Idaküla 1 | {"water":2.7075} |
| 111.25 | Kadakaküla 2 → Kadakaküla 1 | {"meat":1.805,"plank":3.61} |
| 111.4 | Lõunaküla 2 → Lõunaküla 1 | {"berries":0.9025,"vegetables":0.9025} |
| 111.5 | Idaküla 3 → Idaküla 2 | {"water":1.805} |
| 111.5 | Idaküla 2 → Idaküla 3 | {"vegetables":3.61} |
| 111.9 | Lõunaküla 2 → Lõunaküla 1 | {"flax":1.805} |
| 111.95 | Idaküla 3 → Idaküla 1 | {"cloth":0.9025,"water":3.61} |
| 112.2 | Idaküla 3 → Idaküla 1 | {"berries":0.9025} |
| 112.25 | Kadakaküla 2 → Kadakaküla 1 | {"meat":1.805,"plank":0.9025} |
| 112.25 | Idaküla 2 → Idaküla 3 | {"flax":1.805} |
| 112.4 | Lõunaküla 2 → Lõunaküla 1 | {"vegetables":0.9025} |
| 112.75 | Idaküla 3 → Idaküla 2 | {"cloth":0.9025,"water":1.805} |
| 112.85 | Idaküla 2 → Idaküla 1 | {"vegetables":4.5125,"flax":1.805} |
| 112.9 | Lõunaküla 2 → Lõunaküla 1 | {"meat":0.9025,"berries":0.9025} |
| 113.2 | Idaküla 3 → Idaküla 1 | {"water":3.61} |
| 113.25 | Kadakaküla 2 → Kadakaküla 1 | {"meat":0.9025} |
| 113.4 | Lõunaküla 2 → Lõunaküla 1 | {"vegetables":1.805} |
| 113.45 | Kadakaküla 3 → Kadakaküla 1 | {"stone":25.27} |
| 113.5 | Idaküla 2 → Idaküla 3 | {"vegetables":1.805} |
| 113.7 | Kadakaküla 2 → Kadakaküla 3 | {"wood":3.61,"meat":3.61,"flax":1.805} |
| 114 | Idaküla 3 → Idaküla 2 | {"water":1.805} |
| 114.1 | Idaküla 2 → Idaküla 1 | {"vegetables":4.5125} |
| 114.2 | Kadakaküla 3 → Kadakaküla 1 | {"stone":0.9025} |
| 114.45 | Idaküla 3 → Idaküla 1 | {"water":3.61} |
| 114.5 | Kadakaküla 2 → Kadakaküla 1 | {"meat":2.7075} |
| 114.65 | Lõunaküla 2 → Lõunaküla 1 | {"vegetables":2.7075} |
| 114.75 | Idaküla 2 → Idaküla 3 | {"flax":1.805} |
| 114.95 | Idaküla 3 → Idaküla 1 | {"wood":2.7075} |
| 115.35 | Idaküla 2 → Idaküla 1 | {"vegetables":4.5125,"flax":1.805} |
| 115.5 | Kadakaküla 2 → Kadakaküla 1 | {"meat":0.9025} |
| 115.5 | Idaküla 3 → Idaküla 2 | {"water":1.805} |
| 115.85 | Idaküla 2 → Idaküla 1 | {"vegetables":5.415} |
| 115.9 | Lõunaküla 2 → Lõunaküla 1 | {"vegetables":2.7075} |
| 115.95 | Idaküla 3 → Idaküla 1 | {"wood":10.83,"cloth":0.9025,"water":2.7075} |
| 116.2 | Idaküla 3 → Idaküla 1 | {"wood":8.1225,"water":0.9025} |
| 116.4 | Lõunaküla 2 → Lõunaküla 1 | {"meat":0.9025,"berries":0.9025} |
| 116.5 | Kadakaküla 2 → Kadakaküla 1 | {"meat":0.9025} |
| 116.7 | Idaküla 1 → Idaküla 3 | {"vegetables":1.805} |
| 116.75 | Idaküla 3 → Idaküla 2 | {"cloth":0.9025,"water":1.805} |
| 116.9 | Lõunaküla 2 → Lõunaküla 1 | {"flax":1.805} |
| 117.1 | Idaküla 2 → Idaküla 1 | {"vegetables":1.805} |
| 117.2 | Idaküla 3 → Idaküla 1 | {"wood":21.66,"water":1.805} |
| 117.4 | Lõunaküla 2 → Lõunaküla 1 | {"vegetables":1.805} |
| 117.45 | Idaküla 3 → Idaküla 1 | {"wood":0.9025} |
| 117.5 | Kadakaküla 2 → Kadakaküla 1 | {"meat":1.805} |
| 117.7 | Kadakaküla 3 → Kadakaküla 1 | {"cloth":0.9025} |
| 117.7 | Idaküla 3 → Idaküla 1 | {"wood":0.9025} |
| 117.75 | Idaküla 2 → Idaküla 3 | {"flax":1.805,"vegetables":2.7075} |
| 117.9 | Lõunaküla 2 → Lõunaküla 1 | {"vegetables":0.9025} |
| 117.95 | Idaküla 3 → Idaküla 1 | {"wood":7.22} |
| 117.95 | Kadakaküla 2 → Kadakaküla 3 | {"meat":3.61,"flax":3.61} |
| 118.2 | Idaküla 3 → Idaküla 1 | {"water":2.7075} |
| 118.4 | Lõunaküla 2 → Lõunaküla 1 | {"vegetables":1.805} |
| 118.45 | Kadakaküla 3 → Kadakaküla 1 | {"berries":0.9025} |
| 118.45 | Idaküla 3 → Idaküla 1 | {"vegetables":2.7075,"wood":6.3175} |
| 118.5 | Idaküla 2 → Idaküla 3 | {"vegetables":1.805} |
| 118.7 | Idaküla 3 → Idaküla 1 | {"vegetables":0.9025} |
| 118.75 | Kadakaküla 2 → Kadakaküla 1 | {"meat":2.7075} |
| 118.95 | Idaküla 3 → Idaküla 1 | {"pottery":0.9025} |
| 119.25 | Idaküla 2 → Idaküla 3 | {"flax":1.805} |
| 119.5 | Idaküla 3 → Idaküla 2 | {"wood":10.83,"water":3.61} |
| 119.65 | Lõunaküla 2 → Lõunaküla 1 | {"vegetables":0.9025} |
| 119.75 | Kadakaküla 2 → Kadakaküla 1 | {"meat":1.805} |
| 119.85 | Idaküla 2 → Idaküla 1 | {"vegetables":3.61,"flax":1.805} |
| 119.95 | Idaküla 3 → Idaküla 1 | {"berries":1.805,"water":2.7075} |
| 120.15 | Lõunaküla 2 → Lõunaküla 1 | {"meat":0.9025,"berries":0.9025} |
| 120.35 | Idaküla 2 → Idaküla 1 | {"flax":1.805} |
| 120.5 | Idaküla 3 → Idaküla 2 | {"wood":15.3425,"water":1.805} |
| 120.75 | Kadakaküla 2 → Kadakaküla 1 | {"meat":1.805} |
| 120.85 | Idaküla 2 → Idaküla 1 | {"vegetables":3.61} |
| 120.9 | Lõunaküla 2 → Lõunaküla 1 | {"vegetables":2.7075,"berries":0.9025} |
| 120.95 | Idaküla 3 → Idaküla 1 | {"water":2.7075,"wood":3.61} |
| 121.2 | Kadakaküla 3 → Kadakaküla 1 | {"berries":2.7075} |
| 121.5 | Idaküla 3 → Idaküla 2 | {"wood":18.9525,"water":0.9025} |
| 121.5 | Idaküla 2 → Idaküla 3 | {"flax":1.805} |
| 121.65 | Lõunaküla 2 → Lõunaküla 1 | {"flax":1.805} |
| 121.75 | Kadakaküla 2 → Kadakaküla 1 | {"meat":1.805} |
| 121.95 | Idaküla 3 → Idaküla 1 | {"water":2.7075} |
| 122.15 | Lõunaküla 2 → Lõunaküla 1 | {"vegetables":1.805} |
| 122.2 | Kadakaküla 2 → Kadakaküla 3 | {"meat":1.805,"flax":1.805} |
| 122.25 | Idaküla 2 → Idaküla 3 | {"vegetables":4.5125} |
| 122.45 | Kadakaküla 2 → Kadakaküla 3 | {"flax":1.805} |
| 122.5 | Idaküla 3 → Idaküla 2 | {"wood":11.7325} |
| 122.85 | Idaküla 2 → Idaküla 1 | {"vegetables":3.61} |
| 123.25 | Idaküla 3 → Idaküla 2 | {"wood":15.3425} |
| 123.35 | Idaküla 2 → Idaküla 1 | {"vegetables":3.61,"flax":1.805,"water":2.7075} |
| 123.4 | Lõunaküla 2 → Lõunaküla 1 | {"vegetables":1.805} |
| 123.7 | Idaküla 3 → Idaküla 1 | {"water":0.9025} |
| 123.75 | Kadakaküla 2 → Kadakaküla 1 | {"meat":1.805} |
| 123.9 | Lõunaküla 2 → Lõunaküla 1 | {"meat":0.9025,"berries":0.9025} |
| 124.1 | Idaküla 2 → Idaküla 1 | {"flax":0.9025,"vegetables":0.9025} |
| 124.2 | Kadakaküla 3 → Kadakaküla 1 | {"berries":1.805} |
| 124.25 | Idaküla 3 → Idaküla 2 | {"wood":11.7325} |
| 124.6 | Idaküla 2 → Idaküla 1 | {"vegetables":3.61,"water":2.7075} |
| 124.75 | Kadakaküla 2 → Kadakaküla 1 | {"meat":1.805} |
| 125 | Idaküla 3 → Idaküla 2 | {"wood":3.61} |
| 125.2 | Kadakaküla 2 → Kadakaküla 3 | {"meat":1.805,"flax":1.805} |
| 125.25 | Idaküla 2 → Idaküla 3 | {"flax":1.805,"vegetables":2.7075} |
| 125.65 | Lõunaküla 2 → Lõunaküla 1 | {"plank":3.61} |
| 125.7 | Kadakaküla 3 → Kadakaküla 1 | {"plank":1.805} |
| 125.7 | Idaküla 3 → Idaküla 1 | {"cloth":0.9025,"water":2.7075} |
| 125.95 | Idaküla 3 → Idaküla 1 | {"pottery":1.805} |
| 126 | Idaküla 2 → Idaküla 3 | {"vegetables":1.805} |
| 126.15 | Lõunaküla 2 → Lõunaküla 1 | {"vegetables":2.7075} |
| 126.5 | Idaküla 3 → Idaküla 2 | {"wood":17.1475} |
| 126.6 | Idaküla 2 → Idaküla 1 | {"vegetables":4.5125} |
| 126.65 | Lõunaküla 2 → Lõunaküla 1 | {"flax":1.805} |
| 126.75 | Kadakaküla 2 → Kadakaküla 1 | {"meat":1.805} |
| 126.95 | Idaküla 3 → Idaküla 1 | {"water":3.61,"wood":3.61} |
| 127.15 | Lõunaküla 2 → Lõunaküla 1 | {"vegetables":0.9025,"plank":3.61,"flax":0.9025} |
| 127.2 | Kadakaküla 3 → Kadakaküla 1 | {"berries":0.9025} |
| 127.2 | Idaküla 3 → Idaküla 1 | {"wood":0.9025} |
| 127.25 | Idaküla 2 → Idaküla 3 | {"vegetables":5.415} |
| 127.65 | Lõunaküla 2 → Lõunaküla 1 | {"berries":0.9025} |
| 127.75 | Kadakaküla 2 → Kadakaküla 1 | {"meat":1.805} |
| 127.75 | Idaküla 3 → Idaküla 2 | {"wood":4.5125} |
| 127.85 | Idaküla 2 → Idaküla 1 | {"vegetables":5.415} |
| 128.2 | Idaküla 3 → Idaküla 1 | {"water":3.61} |
| 128.6 | Idaküla 2 → Idaküla 1 | {"vegetables":4.5125,"flax":1.805} |
| 128.75 | Kadakaküla 2 → Kadakaküla 1 | {"meat":1.805} |
| 128.75 | Idaküla 3 → Idaküla 2 | {"cloth":0.9025,"wood":5.415} |
| 129.25 | Idaküla 2 → Idaküla 3 | {"flax":1.805} |
| 129.45 | Kadakaküla 3 → Kadakaküla 1 | {"plank":5.415} |
| 129.45 | Idaküla 3 → Idaküla 1 | {"water":2.7075,"wood":3.61} |
| 129.65 | Lõunaküla 2 → Lõunaküla 1 | {"vegetables":1.805} |
| 129.7 | Idaküla 3 → Idaküla 1 | {"water":0.9025} |
| 129.75 | Kadakaküla 2 → Kadakaküla 1 | {"plank":3.61,"meat":1.805} |
| 129.8 | Kadakaküla 3 → Kadakaküla 2 | {"berries":2.7075} |
| 129.95 | Idaküla 3 → Idaküla 1 | {"wood":6.3175} |
| 130 | Idaküla 2 → Idaküla 3 | {"vegetables":1.805,"flax":0.9025} |
| 130.15 | Lõunaküla 2 → Lõunaküla 1 | {"vegetables":0.9025} |
| 130.2 | Idaküla 3 → Idaküla 1 | {"wood":0.9025} |
| 130.45 | Idaküla 3 → Idaküla 1 | {"wood":10.83} |
| 130.7 | Idaküla 3 → Idaküla 1 | {"water":2.7075} |
| 130.75 | Kadakaküla 2 → Kadakaküla 1 | {"meat":0.9025} |
| 130.75 | Idaküla 2 → Idaküla 3 | {"vegetables":3.61} |
| 130.9 | Lõunaküla 2 → Lõunaküla 1 | {"vegetables":0.9025} |
| 130.95 | Idaküla 3 → Idaküla 1 | {"cloth":0.9025,"wood":7.22} |
| 131.2 | Idaküla 3 → Idaküla 1 | {"wood":0.9025} |
| 131.2 | Kadakaküla 2 → Kadakaküla 3 | {"flax":3.61,"wood":8.1225,"meat":1.805} |
| 131.45 | Kadakaküla 2 → Kadakaküla 3 | {"wood":0.9025,"flax":0.9025} |
| 131.5 | Idaküla 2 → Idaküla 3 | {"vegetables":0.9025} |
| 131.7 | Idaküla 3 → Idaküla 1 | {"wood":1.805} |
| 131.95 | Idaküla 3 → Idaküla 1 | {"vegetables":3.61,"water":3.61} |
| 132.15 | Lõunaküla 2 → Lõunaküla 1 | {"vegetables":1.805} |
| 132.25 | Kadakaküla 2 → Kadakaküla 1 | {"plank":5.415} |
| 132.35 | Idaküla 2 → Idaküla 1 | {"vegetables":4.5125} |
| 132.5 | Idaküla 3 → Idaküla 2 | {"wood":18.05} |
| 132.7 | Kadakaküla 3 → Kadakaküla 1 | {"berries":1.805} |
| 132.85 | Idaküla 2 → Idaküla 1 | {"flax":1.805,"vegetables":0.9025} |
| 133.25 | Kadakaküla 2 → Kadakaküla 1 | {"meat":1.805} |
| 133.25 | Idaküla 3 → Idaküla 2 | {"wood":9.9275} |
| 133.35 | Idaküla 2 → Idaküla 1 | {"vegetables":5.415,"water":3.61} |
| 133.4 | Lõunaküla 2 → Lõunaküla 1 | {"vegetables":1.805} |
| 133.45 | Kadakaküla 3 → Kadakaküla 1 | {"cloth":0.9025,"plank":1.805} |
| 133.7 | Idaküla 3 → Idaküla 1 | {"wood":3.61} |
| 133.7 | Kadakaküla 2 → Kadakaküla 3 | {"meat":1.805,"flax":1.805,"wood":8.1225} |
| 133.95 | Idaküla 3 → Idaküla 1 | {"wood":0.9025} |
| 133.95 | Kadakaküla 2 → Kadakaküla 3 | {"wood":0.9025} |
| 134 | Idaküla 2 → Idaküla 3 | {"meat":4.5125,"vegetables":4.5125,"flax":1.805} |
| 134.2 | Kadakaküla 3 → Kadakaküla 1 | {"plank":0.9025} |
| 134.5 | Idaküla 3 → Idaküla 2 | {"wood":12.635} |
| 134.6 | Idaküla 2 → Idaküla 1 | {"meat":6.3175,"vegetables":3.61,"water":3.61} |
| 134.65 | Lõunaküla 2 → Lõunaküla 1 | {"vegetables":1.805} |
| 134.75 | Kadakaküla 2 → Kadakaküla 1 | {"meat":1.805} |
| 134.95 | Idaküla 3 → Idaküla 1 | {"cloth":0.9025} |
| 135.2 | Kadakaküla 3 → Kadakaküla 1 | {"berries":1.805} |
| 135.25 | Idaküla 2 → Idaküla 3 | {"meat":3.61} |
| 135.5 | Idaküla 3 → Idaküla 2 | {"wood":8.1225} |
| 135.55 | Kadakaküla 3 → Kadakaküla 2 | {"berries":0.9025} |
| 135.75 | Kadakaküla 2 → Kadakaküla 1 | {"meat":1.805} |
| 135.85 | Idaküla 2 → Idaküla 1 | {"meat":1.805,"vegetables":3.61,"water":3.61} |
| 135.9 | Lõunaküla 2 → Lõunaküla 1 | {"vegetables":1.805} |
| 135.95 | Idaküla 3 → Idaküla 1 | {"wood":3.61} |
| 136.2 | Idaküla 3 → Idaküla 1 | {"pottery":0.9025} |
| 136.45 | Idaküla 3 → Idaküla 1 | {"vegetables":0.9025} |
| 136.5 | Idaküla 2 → Idaküla 3 | {"plank":3.61,"meat":1.805} |
| 136.75 | Kadakaküla 2 → Kadakaküla 1 | {"meat":1.805} |
| 136.9 | Lõunaküla 2 → Lõunaküla 1 | {"cloth":1.805} |
| 136.95 | Idaküla 3 → Idaküla 1 | {"water":3.61} |

## Peatumise diagnostika

### Riik 1

Järgmise ajastu materjalide puudujääk: {"iron":20,"plank":25.999999999999993}. Teadust käigus: 18.50.
- Kadakaküla 1: elanikke 3.00; varud {"wood":49.5,"plank":19.95,"stone":27.55,"grain":0,"flour":0,"water":0,"bread":0,"ore":0,"coal":0,"iron":0,"weapons":0,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":867,"clay":14.799999999999999,"pottery":0,"cutstone":5.05,"copper":15.2,"tin":7.6,"bronze":0,"carts":0,"meat":1.6000000000000019,"fish":0,"berries":3.2500000000000004,"vegetables":0,"fruit":0,"cheese":0,"spices":0,"coffee":0,"flax":5.699999999999999,"gems":0,"silk":0,"dyes":0,"cocoa":0,"rubber":0,"cloth":1.6850000000002887,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.
  - (184, 91) quarry: valmis=true, töötajaid=0.25, olek=Ladu täis: Kivi.
  - (184, 91) hunter: valmis=true, töötajaid=0.25, olek=Ladu täis: Liha.
  - (184, 91) hunter: valmis=true, töötajaid=0.25, olek=Ladu täis: Liha.
  - (184, 91) hunter: valmis=true, töötajaid=0.25, olek=Ladu täis: Liha.
  - (184, 91) farm: valmis=true, töötajaid=0.25, olek=Ladu täis: Vili.
  - (184, 91) saw: valmis=false, töötajaid=0.25, olek=Ehitab · 31% tööjõud.
- Kadakaküla 2: elanikke 3.00; varud {"wood":68.65,"plank":26.5,"stone":420,"grain":0,"flour":0,"water":0,"bread":0,"ore":0,"coal":0,"iron":0,"weapons":0,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":320,"clay":7.6,"pottery":0,"cutstone":8.2,"copper":5.950000000000001,"tin":4.4,"bronze":0,"carts":0,"meat":86.91500000000002,"fish":0,"berries":3.8,"vegetables":0.9000000000000004,"fruit":0,"cheese":0,"spices":0,"coffee":0,"flax":54.449999999999996,"gems":0,"silk":0,"dyes":0,"cocoa":0,"rubber":0,"cloth":25.442166666670918,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.
  - (170, 88) hunter: valmis=true, töötajaid=0.25, olek=Jahib ulukeid.
  - (170, 88) quarry: valmis=true, töötajaid=0.25, olek=Ladu täis: Kivi.
  - (170, 88) saw: valmis=true, töötajaid=0.25, olek=Toodab · 12%.
  - (170, 88) hunter: valmis=true, töötajaid=0.25, olek=Jahib ulukeid.
  - (170, 88) hunter: valmis=true, töötajaid=0.25, olek=Jahib ulukeid.
- Kadakaküla 3: elanikke 3.00; varud {"wood":20.850000000000016,"plank":2.5500000000000043,"stone":168.45,"grain":0,"flour":0,"water":0,"bread":0,"ore":0,"coal":0,"iron":0,"weapons":0,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":146,"clay":7.6,"pottery":0,"cutstone":10.75,"copper":2.85,"tin":0,"bronze":0,"carts":0,"meat":1.8000000000000003,"fish":0,"berries":0.9000000000000021,"vegetables":0,"fruit":0,"cheese":0,"spices":0,"coffee":0,"flax":3.8499999999999996,"gems":0,"silk":0,"dyes":0,"cocoa":0,"rubber":0,"cloth":24.844000000001174,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.
  - (173, 87) quarry: valmis=true, töötajaid=0.25, olek=Kaevandab.
  - (173, 87) saw: valmis=true, töötajaid=0.25, olek=Toodab · 12%.

### Riik 2

Järgmise ajastu materjalide puudujääk: {"iron":20,"plank":40.7}. Teadust käigus: 19.25.
- Idaküla 1: elanikke 9.00; varud {"wood":45.55000000000001,"plank":0,"stone":1.3500000000000014,"grain":0,"flour":0,"water":16.80000000000034,"bread":0,"ore":0,"coal":0,"iron":0,"weapons":0,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":836,"clay":77.80000000000001,"pottery":0.9731666666666272,"cutstone":5.499999999999998,"copper":4,"tin":0,"bronze":0,"carts":0,"meat":5.55,"fish":0,"berries":0,"vegetables":5.749999999999999,"fruit":0,"cheese":0,"spices":0,"coffee":0,"flax":5.7000000000000055,"gems":0,"silk":0,"dyes":0,"cocoa":0,"rubber":0,"cloth":2.1509999999999807,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.
  - (47, 41) quarry: valmis=true, töötajaid=0.1, olek=Ladu täis: Kivi.
  - (47, 41) hunter: valmis=true, töötajaid=2, olek=Ladu täis: Liha.
  - (47, 41) hunter: valmis=true, töötajaid=2, olek=Ladu täis: Liha.
  - (47, 41) hunter: valmis=true, töötajaid=2, olek=Ladu täis: Liha.
  - (47, 41) farm: valmis=true, töötajaid=0.1, olek=Ladu täis: Vili.
  - (47, 41) saw: valmis=true, töötajaid=0.8000000000000058, olek=Toodab · 33%.
  - (46, 40) fisher: valmis=false, töötajaid=0, olek=Ootab tööjõudu.
- Idaküla 2: elanikke 4.00; varud {"wood":48.949999999999996,"plank":26.5,"stone":22.24999999999999,"grain":0,"flour":0,"water":64.50000000000006,"bread":0,"ore":0,"coal":0,"iron":0,"weapons":0,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":205,"clay":120,"pottery":0,"cutstone":4.75,"copper":0,"tin":0,"bronze":0,"carts":0,"meat":11.399999999999944,"fish":0,"berries":0,"vegetables":3.1499999999998365,"fruit":0,"cheese":0,"spices":0,"coffee":0,"flax":118.54999999999986,"gems":0,"silk":0,"dyes":0,"cocoa":0,"rubber":0,"cloth":1.1960000000003634,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.
  - (44, 45) hunter: valmis=true, töötajaid=0.1, olek=Jahib ulukeid.
  - (44, 45) quarry: valmis=true, töötajaid=0.1, olek=Kaevandab.
  - (44, 45) saw: valmis=true, töötajaid=3, olek=Toodab · 100%.
  - (44, 44) farm: valmis=false, töötajaid=0.1, olek=Ehitab · 14% tööjõud.
- Idaküla 3: elanikke 10.00; varud {"wood":115.50000000000001,"plank":7.799999999999994,"stone":9.399999999999991,"grain":0,"flour":0,"water":79.25000000000031,"bread":0,"ore":0,"coal":0,"iron":0,"weapons":0,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":329,"clay":31.6,"pottery":3.46700000000036,"cutstone":4.75,"copper":0,"tin":0,"bronze":0,"carts":0,"meat":9.65,"fish":0,"berries":7.350000000000003,"vegetables":8.250000000000007,"fruit":0,"cheese":0,"spices":0,"coffee":0,"flax":3.7500000000000036,"gems":0,"silk":0,"dyes":0,"cocoa":0,"rubber":0,"cloth":16.957333333332702,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.
  - (50, 40) quarry: valmis=true, töötajaid=3, olek=Ladu täis: Kivi.
  - (50, 40) saw: valmis=true, töötajaid=3, olek=Ladu täis: Lauad.
  - (49, 40) hunter: valmis=false, töötajaid=0, olek=Ootab tööjõudu.

### Riik 3

Järgmise ajastu materjalide puudujääk: {"plank":50}. Teadust käigus: 4.60.
- Põhjaküla 1: elanikke 3.00; varud {"wood":0,"plank":0,"stone":120,"grain":10.857142857142867,"flour":0,"water":0,"bread":0,"ore":0,"coal":0,"iron":0,"weapons":0,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":751,"clay":18,"pottery":0,"cutstone":33,"copper":0,"tin":0,"bronze":0,"carts":0,"meat":16.100000000000147,"fish":0,"berries":0,"vegetables":14.399999999999997,"fruit":0,"cheese":0,"spices":0,"coffee":0,"flax":0,"gems":0,"silk":0,"dyes":0,"cocoa":0,"rubber":0,"cloth":0,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.
  - (80, 106) quarry: valmis=true, töötajaid=0.1, olek=Ladu täis: Kivi.
  - (80, 106) hunter: valmis=true, töötajaid=0.1, olek=Ladu täis: Liha.
  - (80, 106) hunter: valmis=true, töötajaid=0.1, olek=Ladu täis: Liha.
  - (80, 106) hunter: valmis=true, töötajaid=0.1, olek=Ladu täis: Liha.
  - (80, 106) farm: valmis=true, töötajaid=0.1, olek=Ladu täis: Vili.

### Riik 4

Järgmise ajastu materjalide puudujääk: {"iron":20,"plank":71,"bread":36.37142857142849}. Teadust käigus: 11.19.
- Lõunaküla 1: elanikke 3.00; varud {"wood":0,"plank":0,"stone":34,"grain":0,"flour":0,"water":0,"bread":0,"ore":0,"coal":0,"iron":0,"weapons":0,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":837,"clay":67.4,"pottery":0,"cutstone":7.250000000000001,"copper":4,"tin":0,"bronze":0,"carts":0,"meat":0,"fish":0,"berries":0,"vegetables":1.849999999999996,"fruit":0,"cheese":0,"spices":0,"coffee":0,"flax":5.900000000000006,"gems":0,"silk":0,"dyes":0,"cocoa":0,"rubber":0,"cloth":1.8850000000000016,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.
  - (181, 56) quarry: valmis=true, töötajaid=0.25, olek=Kaevandab.
  - (181, 56) hunter: valmis=true, töötajaid=0.25, olek=Ladu täis: Liha.
  - (181, 56) hunter: valmis=true, töötajaid=0.25, olek=Ladu täis: Liha.
  - (181, 56) hunter: valmis=true, töötajaid=0.25, olek=Ladu täis: Liha.
  - (181, 56) farm: valmis=true, töötajaid=0.25, olek=Ladu täis: Vili.
  - (181, 56) saw: valmis=true, töötajaid=0, olek=Ootab: Puit.
- Lõunaküla 2: elanikke 3.00; varud {"wood":14,"plank":3.9999999999999964,"stone":120,"grain":0,"flour":0,"water":0,"bread":0,"ore":0,"coal":0,"iron":0,"weapons":0,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":313,"clay":7.6,"pottery":0,"cutstone":4.75,"copper":0,"tin":0,"bronze":0,"carts":0,"meat":0,"fish":0,"berries":4.128571428571448,"vegetables":7.650000000000065,"fruit":0,"cheese":0,"spices":0,"coffee":0,"flax":118.09999999999992,"gems":0,"silk":0,"dyes":0,"cocoa":0,"rubber":0,"cloth":3.8924999999999406,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.
  - (176, 60) quarry: valmis=true, töötajaid=0.25, olek=Ladu täis: Kivi.
  - (176, 60) saw: valmis=true, töötajaid=0.25, olek=Toodab · 12%.


## Logi sisu

Sündmused: {"configuration":1,"city_founded":9,"building_placed":189,"research_started":179,"building_completed":156,"research_completed":175,"era_changed":7,"trade_departed":396,"trade_fee":392,"trade_delivered":392,"trade_finished":392,"era_material_wait_started":6,"era_material_wait_ended":3,"test_stopped":1}.
JSON-aruanne sisaldab sündmusi, materjaliootusi ja lõppseisu. JSONL.GZ sisaldab lisaks iga käigu kõigi linnade ja piirkondade seisu: tööjõud, hoonete valmidus ja olekud, sisendid, lao kasutus ja piir, kohalikud veosed, töötajad, maardlate jäägid, tarnete ajalugu ning linnadevahelised veosed. Kohalike tarnete ajalugu sisaldab ka kaubaveoga saabunut; see ei ole puhta tootmise mõõdik. Kaupmehe tarne kogus arvutatakse koorma vähenemisest pärast eraldi peatumistasude mahaarvamist.
Katse oli kampaanialoogika simulatsioon, mitte brauseri visuaalne kontroll. Keskaega jõudnud riikide teadus pannakse ootele. Pärast stopptingimust katset ei jätkata ega korrata.
