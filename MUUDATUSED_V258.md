# V258 – maailmakaardi ja detailkaardi inimesed

Maailmakaardi ja detailkaardi liikumise ning üksuste kuvamise parandus. Sisaldab ka V257 looma ja tõrviku parandusi.

- Naaberdetailkaartidel kuvatakse kõik maismaaarmee salgad, mitte ainult avastaja; aktiivsel kaardil sünkroonitakse liikuva armee salgad maailmakaardi asukohaga. Mängitav salk võtab üle kui armee jõuab loogiliselt samale maailmaruudule; saabunud salk paigutatakse maailmakaardil vastava asukoha juurde ka varem külastatud ruudul.
- Ühe ruudu läbimise aeg saadakse detailkaardi kaugusest (idas/läänes 225 m; põhjas/lõunas 195 m) ja tegelikust liikumiskiirusest, armee puhul aeglaseima salga järgi. Tee ja maantee kiirendus jääb alles. Sama arvutus kehtib asunike, armee ja maismaakaupmeeste kohta; laevad ja rongid jäävad omaette. Teekonnad on varasemast palju aeglasemad, näiteks 3 m/s inimesel 75 s ida-lääne ruudu kohta varem 3 s asemel.
- Vanast salvestusest käimas teekonna suhteline asukoht säilib. Teekonna suund ja vahemaa ning maantee arvestatakse iga lõigu kaupa.
- Kontrollitud: tests/world-movement-v258.mjs, Chrome tests/qa-v258.cjs (armee naaberalal ja üleminek mängitavaks üksuseks), täis kiirkontroll ning liiklustestid. TEST_V87.mjs jõuab varasemast sõltumatu gem_mine mudeli geomeetriakontrolli veani; buildings.js ja city-needs-v87.js on V255 lähtega samad.
- Piirang: teise loogilise maailmaruudu kuvand on nähtav, kuid seda ei saa valida kuni armee on loogiliselt sellel ruudul.
