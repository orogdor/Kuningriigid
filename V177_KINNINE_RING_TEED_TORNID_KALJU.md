# V177 – kinnine kaitsering, teeväravad, tornid ja kalju

Sama Kaljuvärava algseis mängiti AI-ga uuesti läbi. Uus ülevõtmissalvestus: käik 93, kiviaeg, 10 elanikku, 8 elumaja ja 71/71 valmis kaitserajatist, sealhulgas 4 puidust torni ning 3 väravat.

## Muudatused

- Kaitseplaneerija ei loe läbimatuks märgitud mäeruudu äärt enam puuduva müürikaare asenduseks. Füüsiline vall suletakse kuival maal; mägi kaitseb selle tagakülge lisaks. Väravaavad on teadlikud läbipääsud.
- Plaani koordinaadid on kogu linnas ühised. Oma linna naaberruudul olev müürijupp saab vastava ruudu kohaliku koordinaadi ja päris ehitustellimuse. Võõrale territooriumile ehitada ei saa. See toimib puidust ja kivist AI kaitseplaanidel; põldude koridorikaitse kasutab sama koordinaadistikku.
- Väravakohad arvestavad tegelikku sissekäidud rada. Hiljem tekkinud arenenud tee korral saab AI valmis müürilõigu päris tasulise väravaga asendada. Kontroll nõuab piisavalt kulunud rada mõlemal pool; üksikud jalajäljed ei põhjusta lammutamist. Garnisoniga lõiku automaatselt ei muudeta. Pööratud väravapostide navigatsioon järgib mudeli nurka.
- Tornikohti otsitakse eraldi kaitsekontuuri sees ja tornid tellitakse juba valli ehitamise käigus. Kui esialgne koht hiljem blokeerub, otsitakse lähedalt tavareeglite järgi sobiv koht. Uue pikema kinnise ringi lõpetamiseks on kiviaja piiratud ootamise ülempiir 150 käiku; muud senised plaanid säilitavad oma piiri.
- Kalju visuaalne kõrgendus hajub madalmaa ääres katkematult. Ka mäe/mäe/madalmaa nurkade hajutus kasutab ühist kaugust, et naaberruutude valemid ei tekitaks vertikaalset lõiget. Kaugete mägede hõredamat võrku ei jäeta detailse võrgu sisse lõikuma ning selle kõrgus võetakse tegelikust maailmaasendist.

## Kontroll

`TEST_V177_RING_ROADS.mjs` kontrollib päris uue salvestuse nelja torni, naaberruudule ulatuvaid tasutud rajatisi ja 155 väljaspool ringi asuvat ligipääsetavat punkti. Väravate kontrolliks sulgemisel neist ühegagi juhuslikku väljapääsu ei teki. Test kontrollib ka tegeliku müüri tasulist asendamist teeväravaga ning kalju kõrguse pidevust.

`TEST_V177_VISUAL.mjs` käivitab oma kohaliku HTTP-serveri ja Chromiumi. Kontrollitud arvuti- ja telefonivaade, torni lähivaade ning mäevaade; ekraanipildid vaadati üle. Veebis ei esinenud JavaScripti vigu ning näidismängu laadimine säilitas olemasoleva automaatsalvestuse.

Lisaks läbisid ülevõtmissalvestuse, orgaanilise planeerimise, torni patrulli ja kõrguste, müüriotsade, pööratud müüride, asulakoha valiku, tänavafrondi ning liikluse regressioonid. Uus lühike kontroll lisandus olemasolevasse ühte CI töösse; brauseri mahukat maatriksit automaatselt ei lisatud.

Mängitav link: `?v=177a&demo=ai-mountain-v176`. Demo avaneb mängija juhtimise all ja pausil. Uue AI läbimängu generaator: `node scripts/make-ai-mountain-v177.mjs`.
