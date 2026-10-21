# V88 ajastute läbimise test

Seeme: 8417. Üks käik = 60 mängusekundit. Kõiki nelja riiki juhib AI 12-sekundilise planeerimissammuga.

Tulemus: **STOP_100_TURNS**, peatatud käigul **133.317**.
100 käigu piir täitus riigil/riikidel: 2. Test peatati kohe; uut katset ei käivitatud.

## Ajastuvahetused

| Riik | Uus ajastu | Mängu käik | Eelmises ajastus käike |
|---|---|---:|---:|
| 2 | Pronksiaeg | 33.317 | 33.317 |
| 4 | Pronksiaeg | 33.608 | 33.608 |
| 1 | Pronksiaeg | 35.117 | 35.117 |
| 3 | Pronksiaeg | 37.892 | 37.892 |
| 4 | Rauaaeg | 113.85 | 80.242 |
| 1 | Rauaaeg | 120.633 | 85.517 |

## Seis peatumisel

| Riik | Ajastu | Käike ajastus | Uurimine | Teadus / hind | Linnu |
|---|---|---:|---|---:|---:|
| 1 | Rauaaeg | 12.683 | Raudriistad ja töökojad | 16.96 / 40.00 | 3 |
| 2 | Pronksiaeg | 100 | Rauatöö | 40.00 / 40.00 | 2 |
| 3 | Pronksiaeg | 95.425 | Rauatöö | 40.00 / 40.00 | 1 |
| 4 | Rauaaeg | 19.467 | Feodaalkorraldus | 40.00 / 40.00 | 3 |

## Leitud takistus

- **Katse peatas riik 2.** Pronksiaeg algas käigul 33,317 ja 100 käigu piir saabus käigul 133,317. Rauatöö teadus oli valmis (40/40), kuid ajastuvahetuse materjalikulu ei saanud tasuda: puudu 88 lauda, 38 kivi ja 1,85 toiduühikut. Toiduühikud arvestavad tera, jahu, leiva ja muude toitude toiteväärtust.
- Riigi 2 pealinna valmis saekojas oli 0 töötajat ja olek „Ootab: Puit”. Pealinna puiduvaru oli 2, teises linnas 1. Vaadeldud seis viitab puudulikule puidu–laua tootmisvoole ja tööjõujaotusele. Puiduhoone näitas samal hetkel „Ladu täis: Puit”; üksnes salvestatud lõppseisust ei saa selle lao-/veoseoleku põhjust lõplikult määrata.
- Riik 3 oli pronksiajas 95,425 käiku ning samuti rauatöö teadusega valmis. Puudus 100 lauda ja 47,2 toiduühikut; tema ainsas linnas ja selle piirkondades saekoda puudus.
- Riigid 1 ja 4 jõudsid rauaaega vastavalt 85,517 ja 80,242 pronksiaja käiguga. Riik 4 oli juba keskaja teaduse lõpetanud, kuid keskaega pääsemiseks puudus 40 rauda ja 91 lauda.
- **Keskaega ei jõudnud ükski riik.** Esimese ebaõnnestunud ajastutähtaja järel kampaaniat ei jätkatud ega korratud. Tasakaalu ja AI tootmisahelat pärast seda katset ei muudetud.

## Kontrolli ulatus

See oli mängu kampaanialoogika simulatsioon sammuga 0,5 mängusekundit, mitte brauseri visuaalne kontroll. Kõigil neljal riigil oli sama AI planeerimissamm; riikide tavalised raskusastme tootmis- ja teaduskordajad säilisid. 100 käigu piir arvestati iga riigi iga ajastu algusest eraldi. Tehnoloogiate eraldiseisev kontroll läbis kõik 28 uut uurimust; majanduse V87/V86 ning maardlate/ranniku V88 kontrollid läbisid samuti kontrolli.

## Diagnostika

### Riik 1

Ajastumaterjalide puudujääk: {}. Teaduse kiirus: 18.50 punkti käigus.
- Kadakaküla 1: elanikke 3.00, hooneid 23, ressursid {"wood":49.15000000000002,"plank":0,"stone":27.55,"grain":7.257142857142861,"flour":0,"water":0,"bread":0,"ore":0,"coal":0,"iron":0,"weapons":0,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":953,"clay":8.649999999999997,"pottery":2.196333333333048,"cutstone":5.05,"copper":15.2,"tin":15.2,"bronze":0,"carts":0,"meat":3.1500000000000186,"fish":0,"berries":0,"vegetables":2.4499999999999904,"fruit":0,"cheese":0,"spices":0,"coffee":0,"flax":3.650000000000002,"gems":0,"silk":0,"dyes":0,"cocoa":0,"rubber":0,"cloth":1.5030000000002348,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.
- Kadakaküla 2: elanikke 3.00, hooneid 25, ressursid {"wood":295,"plank":18,"stone":225.74999999999991,"grain":9.5,"flour":0,"water":0,"bread":0,"ore":0,"coal":0,"iron":0,"weapons":0,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":387,"clay":7.6,"pottery":2.458999999999738,"cutstone":2.1999999999999993,"copper":24.049999999999997,"tin":8,"bronze":0,"carts":0,"meat":184.14999999999986,"fish":0,"berries":0,"vegetables":4.2,"fruit":0,"cheese":0,"spices":0,"coffee":0,"flax":76.74999999999997,"gems":0,"silk":0,"dyes":0,"cocoa":0,"rubber":0,"cloth":1.6710000000000944,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.
- Kadakaküla 3: elanikke 3.00, hooneid 21, ressursid {"wood":213.85000000000002,"plank":20.000000000000014,"stone":25.799999999999997,"grain":19.057142857142857,"flour":0,"water":0,"bread":0,"ore":0,"coal":0,"iron":0,"weapons":0,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":339,"clay":190.75,"pottery":11.35299999999855,"cutstone":4.75,"copper":4.75,"tin":3.8,"bronze":0,"carts":0,"meat":50.70000000000006,"fish":0,"berries":0,"vegetables":4.75,"fruit":0,"cheese":0,"spices":0,"coffee":0,"flax":3.700000000000001,"gems":0,"silk":0,"dyes":0,"cocoa":0,"rubber":0,"cloth":37.942499999999605,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.

### Riik 2

Ajastumaterjalide puudujääk: {"plank":88,"stone":38.00000000000001,"bread":1.8500000000001648}. Teaduse kiirus: 8.80 punkti käigus.
- Idaküla 1: elanikke 4.00, hooneid 26, ressursid {"wood":2,"plank":12,"stone":34.099999999999994,"grain":2.7857142857142856,"flour":0,"water":0,"bread":1.9,"ore":0,"coal":0,"iron":0,"weapons":0,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":817,"clay":79.4,"pottery":0,"cutstone":7.249999999999999,"copper":0,"tin":0,"bronze":0,"carts":0,"meat":2.8499999999999237,"fish":0,"berries":1.8000000000000003,"vegetables":1.7500000000000022,"fruit":0,"cheese":0,"spices":0,"coffee":0,"flax":5.050000000000005,"gems":0,"silk":0,"dyes":0,"cocoa":0,"rubber":0,"cloth":0,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.
- Idaküla 2: elanikke 3.00, hooneid 3, ressursid {"wood":1,"plank":0,"stone":27.9,"grain":9.5,"flour":0,"water":0,"bread":9.899999999999999,"ore":0,"coal":0,"iron":0,"weapons":0,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":176,"clay":120,"pottery":0,"cutstone":4.75,"copper":0,"tin":0,"bronze":0,"carts":0,"meat":4.75,"fish":0,"berries":0,"vegetables":26.599999999999913,"fruit":0,"cheese":0,"spices":0,"coffee":0,"flax":120,"gems":0,"silk":0,"dyes":0,"cocoa":0,"rubber":0,"cloth":0,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.

### Riik 3

Ajastumaterjalide puudujääk: {"plank":100,"bread":47.1999999999998}. Teaduse kiirus: 4.60 punkti käigus.
- Põhjaküla 1: elanikke 3.00, hooneid 20, ressursid {"wood":0,"plank":0,"stone":120,"grain":4.000000000000007,"flour":0,"water":0,"bread":0,"ore":0,"coal":0,"iron":0,"weapons":0,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":824,"clay":6,"pottery":5.9086666666671315,"cutstone":33,"copper":0,"tin":0,"bronze":0,"carts":0,"meat":4.600000000000199,"fish":0,"berries":0,"vegetables":5.399999999999999,"fruit":0,"cheese":0,"spices":0,"coffee":0,"flax":0,"gems":0,"silk":0,"dyes":0,"cocoa":0,"rubber":0,"cloth":0,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.

### Riik 4

Ajastumaterjalide puudujääk: {"iron":40,"plank":90.99999999999997}. Teaduse kiirus: 29.30 punkti käigus.
- Lõunaküla 1: elanikke 8.00, hooneid 27, ressursid {"wood":0.2499999999999929,"plank":19.95,"stone":27.95,"grain":8.907142857142851,"flour":9.605882352941174,"water":17.00000000000036,"bread":0,"ore":0,"coal":0,"iron":0,"weapons":0,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":817,"clay":71.80000000000001,"pottery":2.2855000000000434,"cutstone":8.500000000000002,"copper":5.15,"tin":3,"bronze":0,"carts":0,"meat":5.599999999999987,"fish":0,"berries":5.099999999999998,"vegetables":9.499999999999993,"fruit":0,"cheese":0,"spices":0,"coffee":0,"flax":5.800000000000006,"gems":3.8,"silk":0,"dyes":0,"cocoa":0,"rubber":0,"cloth":2.25733333333371,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.
- Lõunaküla 2: elanikke 12.00, hooneid 16, ressursid {"wood":16,"plank":19.95,"stone":358.54999999999995,"grain":9.5,"flour":9.5,"water":17.79999999999996,"bread":0,"ore":0,"coal":0,"iron":0,"weapons":0,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":375,"clay":7.6,"pottery":1.1039999999999992,"cutstone":16.75,"copper":2.85,"tin":0,"bronze":0,"carts":0,"meat":7.6000000000000005,"fish":0,"berries":9.549999999999983,"vegetables":8.750000000000096,"fruit":0,"cheese":0,"spices":0,"coffee":0,"flax":147.09999999999988,"gems":4.1,"silk":0,"dyes":0,"cocoa":0,"rubber":0,"cloth":52.88449999999832,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.
- Lõunaküla 3: elanikke 12.00, hooneid 19, ressursid {"wood":32.74999999999999,"plank":19.100000000000023,"stone":27.49999999999999,"grain":60.35714285714287,"flour":51.12941176470588,"water":100,"bread":0,"ore":0,"coal":0,"iron":0,"weapons":0,"paper":0,"saltpeter":0,"gunpowder":0,"steel":0,"machines":0,"oil":0,"fuel":0,"power":0,"vehicles":0,"gold":297,"clay":109.6,"pottery":6.324166666666754,"cutstone":4.75,"copper":0,"tin":0,"bronze":0,"carts":0,"meat":2.8000000000000003,"fish":0,"berries":9,"vegetables":27.349999999999994,"fruit":0,"cheese":0,"spices":0,"coffee":0,"flax":5.100000000000002,"gems":4.1,"silk":0,"dyes":0,"cocoa":0,"rubber":0,"cloth":13.265666666666139,"jewelry":0,"silkcloth":0,"perfume":0,"chocolate":0,"electronics":0}.

Täielik hoonete, tööjõu, tehnoloogiate ja veoste seis: V88_KESKAJA_TEST.json.
