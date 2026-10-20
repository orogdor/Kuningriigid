# Kuningriigid V80 – keskaegne linn ja tõeline tänavavõrk

## Probleem ja lahendus

V79 näidislinnas olid teed kohati hoonete treppide ja varikatuste all ning mõned üksikud kodu-turg-kodu marsruudid ei moodustanud tänavavõrku.

- `navigation.js`: jalakäijate läbitamatu ala arvestab nüüd **maja tervikliku 3D-jalajäljega**, mitte vana minimaalse 2,5 m navigatsiooniraadiusega. Suuremad saalid, laod, turud ja hooned koos varikatustega vajavad rohkem ruumi.
- `Navigation.roadMargin` ja `roadSurfaceWidth`: arvutavad ohutu teeriba laiuse hoonete lähedal, et rajad ei kataks 3D-mudeleid.
- `detail-roads.js`: ei joonista teekatet läbi hoonete või blokeeritud ruutude; kitsas kohas kohandab tee laiust.
- `civilization.js`: vanad salvestatud jalajäljed peidetakse nähtava hoone sees ning teepunkti suurus kohandatakse vaba ruumi järgi.
- `continuous-landscape-visual.js`: maailmakaardi laiad maanteed ei ilmu detailkaardile enam ebaproportsionaalselt laia ribana otse hoonete sisse.

## Terve linna tänavavõrk

`urban-roads-v80.js` kasutab päris `Navigation.route` algoritmi ning täpselt sama `recordTraffic` kulumissüsteemi, mis päris turulkäijatel ja töölistel.

- Kõik valmis hooned ühendatakse lähima olemasoleva tänavaga.
- Naaberhoonete vahel tekivad ristühendused, et vältida ainult ühte puud meenutavat marsruuti.
- Elamutest turule ja teenindushooneteni arvestatakse tihedamalt kasutatavaid käike.
- Tavalises mängus tekivad rajad **aja jooksul** elanike koondatud käiguliikluse põhjal. Uusi koheseid kunstlikke teid ei teki ühekordsel käimisel; kasutamata rajad kuluvad.
- Näidislinnades on simuleeritud arvukad eelnevad jalgsikäigud, et tänavavõrk oleks kohe näha.

## 3D-hoonemudelid ja ajastud

Uus **keskaegne ajastu on tehnoloogiapuus ajastu 3** (ajastu 2 on rauaaeg). V80 sisaldab 30 eristatavat keskaegset hoonetüüpi: elamud, gildimajad, töökojad, kõrtsid, kloostrid, kirikud, linnused, vahitornid ja muud. Mudelite geomeetria koondatakse materjalide järgi, et ühe hoone 3D-joonistuskutsete arvu vähendada.

## Testimiseks

- **Keskaja näidislinn:** https://orogdor.github.io/Kuningriigid/?v=80-20261020&demo=medieval
- **Parandatud pronksiaja näidislinn:** https://orogdor.github.io/Kuningriigid/?v=80-20261020&demo=bronze
- **Põhimäng:** https://orogdor.github.io/Kuningriigid/?v=80-20261020

Näidislinnad ei salvesta üle sinu automaatsalvestust. JSON-i saab näidislinnas valikuga **Menüü → Ekspordi salvestus**. Säilivad V4 salvestused ja varasemad kiviaja/pronksiaja 3D-ehitised.

## Automaatkontrolli mõõtmised

| Kontroll | Tulemus |
|---|---:|
| Keskaegse linna mudelid | 33 valmis hoonet |
| Pronksiaja mudelid | 32 valmis hoonet |
| Keskaegne linna kulunud teeruutude arv | 686 |
| Keskaja teede ulatus | 84 × 79 detailkaardi ühikut |
| Keskaegsed teekatte kolmnurgad | 1036 |
| Pronksiaja kulunud teeruudud | 692 |
| Keskajal mobiilis nähtavaid teepunkte | 477 |
| Pronksiajal mobiilis nähtavaid teepunkte | 554 |
| Hoonest läbi minevaid teeriba kolmnurki testis | 0 |
| Brauseri ekraanisuurused | Androidi püst- ja rõhtvaade; lauaarvuti |
| Näidislinnade tõttu muudetud kasutaja salvestused | 0 |

Mudelid ja teed läbivad `TEST_V80.mjs`, `TEST_V80_UI.mjs` ning varasema V79, V78 ja V73 regressiooni. Reaalset Samsungi telefoni GPU kaadrisagedust need tarkvaralise WebGL-ga testid ei mõõda.
