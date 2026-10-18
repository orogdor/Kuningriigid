# Kuningriigid V62 – neli rannikuäärset alguskohta

## Mängu algus
- **Iga mängija** (inimmängija ja kolm arvutivastast) alustab uues mängus maismaal, mille **vahetus naaberruudus on päris meri**. Start valitakse maailma seemne ja päris maastikukõrguse järgi.
- Alguskohad jäävad üksteisest vähemalt 28 maailmaruudu kaugusele, et mängijad saaksid laieneda.
- Valik väldib väikeseid üksikuid rannaliivasaari: alguse kõrval peab olema piisavalt kuiva maismaad, et linna rajada.
- Koos asunikuga kolib uude ranniku alguskohta ka sama mängija esimene avastaja/armee.
- Alguskoht saab jätkuvalt puidu, kivi, joogivee ja ulukid ning V60 savi-, vase- ja tinamaardlad.

## Kaarditüübid
- **Juhuslikud 2–4 kontinenti**: uus asukoht leitakse päris kontinendi rannikult, võimaluse korral senise mängijapiirkonna lähedalt.
- **Suur manner rannikutega** (varem menüüs „Sisemaa“): uutes mängudes ümbritseb mandrit meri, et ka selle kaarditüübi kõik mängijad saaksid rannas alustada.
- Asunike ümbruse ehitatava ala tasandamine ei täida enam kõrvalasuvaid mereruutusid maismaaga. Hiljem saab laevaehituse avamisel samasse rannikualasse sadama rajada.

## Salvestuste ühilduvus
- Uue maailma marker on `coastalStartsVersion:1`; alguskohtade koordinaadid jäävad salvestusse (`coastalStartPositions`).
- Mänguseisu **`version:4` ei muudetud**.
- V61 ja vanemate mängude salvestustel pole uut markerit: alguspaigad, linnad ja maastik jäävad laadimisel endiseks.
- Pärast V62 uue mängu alustamist ei liiguta laadimine juba liikunud armeed või asunikku tagasi algusrannikule.
- Kui mänguseisus on juba linnad enne selle esmast genereerimist, jäetakse ümberpaigutamine turvalisuse huvides ära.

## Kontrollid
- `TEST_V62.mjs`: 20 maailma kümne eri seemne ja kahe kaarditüübi peale, kokku 80 mängija rannikuäärset alguskohta. Kontrollitud merega vahetu naabrus, läbitav maismaa, lähedane ehitusmaa, minimaalsed vahed, algressursid ning salvestusjärgne samade randade ja liigutatud üksuste säilimine.
- V61, V60, V59 ja V55 automaatregressioonid läbisid kontrolli.
- Avalikul GitHub Pages V62 lehel loodi uus mäng ja kontrolliti nelja mängija alguskohta päris brauseris: 4/4 maismaal, 4/4 otse mere kõrval, 4/4 algressurssidega, JavaScripti vigu ei esinenud.
- Põhimängu pikk võidu/kaotuse läbimängimine ei kuulu selle muudatuse testide hulka.
