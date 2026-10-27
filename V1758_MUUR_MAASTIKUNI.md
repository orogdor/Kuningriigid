# V175.8 – müür mere ja mäeni

Müüri sirge või kumera joone otsa saab lohistada üle rannajoone või naaberruudu läbimatu mäe piiri. Eelvaade ja ehitamine lõikavad mõlemad otsad esimese/viimase kuiva maapinnani. Müüri keha peab jääma maale; keskel oleva vee või mäe ületamine on keelatud.

Müür kasutab oma pööratud jalajälge, mitte maja 6 × 5,6 m prooviala. Ainult otsakate võib maastikuga veidi kattuda, et vältida navigeerimisvõrgus läbipääsu. Ranniku ehitamine ja töötajate liikumine kasutavad nüüd ühist pideva maastiku rannajoont, sama 0,2 m lävendiga kui lahingunavigatsioon. Naabri mäe lippu kontrollitakse ka detailkaardi serval. Müüri keskkoha vana 5 m servavaru eemaldati.

Lühikesed lõpujupid võivad liituda olemasoleva joonistatud müüri otsaga. Majad, väravaava, maardlad, nõlvapiir, materjalikulu ja ehitusjärjekorra piirangud jäävad kontrolli alla. Kivimüüride nähtav pikkus järgib samuti joonistatud lõigu salvestatud pikkust.

## Kontroll

`node TEST_V1758_TERRAIN_ENDS.mjs`: sirge/kumer; madal/kõrge palissaad; tee puudumine mere ja mäega ühendatud müüri otstest; sama tulemus JSON-taastamisel; vee/mäe ületamise ja liiga järsu pinna tõrjumine; kaks tasutud lühikest müürilõiku päris salvestuse linna mäepiirile; duplikaadi tõrjumine; algse genereeritud ranniku piir ja töötajate rannajoone kooskõla.

Lisaks läbisid V175.2 müürijoonistamine, V175.7b maksumus/salvestus, V175.4 väravafüüsika, V175.5 pööratud müüri liikumine ja `node scripts/test.mjs traffic`.

Kohalik Chromiumi kontroll ei käivitunud: brauser puudus ja Playwrighti allalaadimine tagastas vigase ZIP-i. Visuaalset läbimist ei ole selle muudatuse kohta kinnitatud.

Uus regressioon lisandub olemasolevasse ühte kiirkontrolli; eraldi automaatset töövoogu ei lisata. V175.7c kahe väravavariandi menüüarendus jääb järgmiseks eraldi etapiks.
