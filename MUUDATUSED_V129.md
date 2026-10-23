# V129 — nähtavad maakonnad, hõredam asustus ja kitsamad teed

Maailmakaart eristab nüüd linnaala ja maakonda: maakond on heledam, linn tumedam ning mõlemal on oma piir. Piir säilib ka sama riigi naaberlinnade vahel. Oma maakonna ruudud avastatakse automaatselt, nii et nende välimine osa ei jää udu alla. Maakonna majanduse ja kuni kolme ehitise reegel ruudu kohta säilivad.

Uue linna rajamiseks peavad kõigi olemasolevate linnade keskused olema vähemalt 17 ruudu kaugusel mõlemat telge arvestava ruutkauguse järgi. See välistab ka diagonaalse kokkusurumise ning jätab kuni 8-ruuduse ulatusega maakondadele ruumi. Sama kontroll kehtib mängijale, AI maismaa-asunikule ja AI merekoloonia sihtkoha valikule. AI otsib sihtkohti kuni 40 ruudu kauguselt ja lubab kuni 64 sammu pikkust maismaateed.

Maailmakaardi teede täislaiused on nüüd taseme järgi 1,3 / 1,8 / 2,4 / 3,1 maailmaühikut (varem 8,8 / 11 / 14,8 / 18,8). Minikaardi teed on samuti kitsamad. Detailkaardi teede laius ja teede tegelik mõju liikumisele säilivad.

Vanade salvestuste linnu ei tõsteta ümber. Uus kaugusreegel kehtib edaspidisele rajamisele. Rauaaja testseis luuakse uuesti tavalisest AI läbimängust, et selles oleksid linnad algusest peale suurema vahega. Ressursse, avastusi ega üksusi ei lisata tasuta.

Kontrollid: V129 kontrollib testseisu kõigi linnapaaride kaugust, igale linnale kuuluva maakonna olemasolu ning oma maakonna nähtavust. V125–V128 regressioonitestid ja avaldamise tavapärased kontrollid. Brauseritest kontrollib rauaaja laadimist, jätkamist, salvestuse kaitset ning teeb arvuti ja telefoni vaates pildid ka maailmakaardist.
