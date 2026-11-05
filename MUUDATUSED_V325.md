# V325 – jõe välimuse regressiooni tagasivõtmine

Kasutaja V324 pilt näitas, et jõevesi oli muutunud heledaks mereveeks ning jõe ja suudme ümber olid suured järskude servadega liivased alad. V324 automaatkontrollid ei kinnitanud visuaalset õnnestumist ja kasutaja pilt lükkas selle ümber.

## Muudatus

- Eemaldatud V324 üldine vee ja laia suudmemaastiku asendus ning selle katsefailid.
- Taastatud V323 voolav, tumedam jõevee materjal koos päris voolusuuna, kaldavarjutuse, varasemate jõesängide ja veekõrgustega. Maailmakaardi vana merevõrk ja detailkaardi iseseisvad mereruudud taastatud.
- Suudme paranduse ulatus on väike rannajooneriba. Maapinna kõrgust silutakse kaalutud 3×3 prooviga; toorest atlase kõrgust ei tõsteta enam max()-iga pehmendatud ranniku peale. Maastiku ja merepiiri vahel olnud 80%/100% kõrguse lahknevus eemaldatud.
- V320 puude laadimisjärjekord, 5×5 kõrge kvaliteediga detailala, salvestused ja uuendatud mängukäivitaja säilivad.

## Kontroll ja piirid

`tests/river-estuary-v325.mjs` kontrollib päris jõe materjali ning aFlow/aShore atribuute, sisemaa veekõrguste taastamist, 3705 ranniku proovipunkti, kaldavälja pidevust ja salvestuse puutumatust. Seemnel 77 oli filtri suurim mõõdetud muutus 0,469 m ja suurim 1 cm sammuga kõrgusemuutus 0,00965 m. Need mõõtmised ei ole hinnang kasutaja salvestuse välimusele.

Kõik 103 nõutud CI käsku läbisid; tulemused on `reports/river-estuary-v325-ci.json`. Lisaks V314 jõekujude kontroll. Uue materjali ja maastiku laadimistee on testitud; mängusisest GPU-pilti selles keskkonnas kinnitada ei saa. Eraldi maastikurenderdus on üksnes geomeetria ülevaatus. Kasutaja sama suudme seadmel tehtav kontroll jääb vajalikuks.
