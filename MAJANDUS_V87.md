# V87: linnade varud, kaupmehed ja vajadused

HUD: **kohalik varu (kõigi oma linnade varu) / kohalik mahutavus**. Riigi kogus on ülevaade; ehitus kasutab kohalikku ladu. Toidunäitu vajutades avaneb liikide ja luksuste loetelu. Toitu nõudvad värbamised ja laevad kasutavad kõiki söödavaid liike. Vili, jahu ja leib moodustavad ühe teraviljatoidu liigi. Liha, kala ja marjad on eraldi.

| Ajastu | Toiduliike | Luksusliike |
|---|---:|---:|
| Kiviaeg | 2 | 0 |
| Pronksiaeg | 3 | 1 |
| Rauaaeg | 4 | 2 |
| Keskaeg | 5 | 3 |
| Renessanss | 6 | 4 |
| Tööstusajastu | 7 | 5 |
| Moodne ajastu | 8 | 6 |

Üks puuduv liik vähendab tootlikkust 5 protsendipunkti, üks üle nõutud arvu olev liik suurendab 2 protsendipunkti. Liigi arvestamiseks peab laos olema vähemalt max(0,5; elanike arv × 0,1) ühikut. Luksuskaupade kasutus on 0,02 ühikut elaniku kohta minutis. Mõju rakendub ressursside tootmisele ja korjamisele. Linna tervisepaneel näitab vajaduste täitmist ja tootlikkust.

Toidud: teravili, liha, kala, marjad, köögiviljad, puuviljad, juust, vürtsid, kohv. Luksused: keraamika, linane kangas, ehted, siidkangas, parfüüm, šokolaad, elektroonika. Uued aiad, istandused, kaevandused ja töökojad kasutavad tööjõudu, ehitusmaterjale ja töötlemisel sisendeid. Piirkondlikud ressursid lisatakse deterministlikult olemasolevale maismaale; salvestatud hooneid ja varusid ei kustutata.

Kaupmees lahkub ainult reaalse ülejäägiga linnast. Kaup võetakse lähtelaost kohe, sihtlattu jõuab see pärast reisi. Automaatne tellimine täidab linna varu- ja mitmekesisusvajadusi; puuduva ehitusmaterjali korral saab ehituskaardilt teha tellimuse. Kui puudub müüja või sobiv tee, kaupa ei teki.

Maismaajalg kuni 32 maailmaruutu, merejalg kuni 72. Maismaal baas 4 sekundit ruudule (teed kiirendavad); merel 1,5 sekundit ruudule. Sadam ja laevaehituse tehnoloogia on vajalikud meresõiduks. Linn või sadam taastab järgmise jala liikumisulatuse. Iga külastus, sealhulgas lähtekoht ja sihtkoht, võtab allesolevast kaubast 5%, mis läheb peatuslinna lattu. Raudtee- ja lennukaubaveod säilitavad senised erireeglid.

Võõra riigi peatused ja import nõuavad sõbralikku suhet. Võõrast linnast ostmine maksab ühe kulla kaubaühiku eest. Oma linnade kaup liigub ostuhinnata; peatumistasu jääb kehtima. Kaubaveo peatamisel jääb saadetis loa taastumist ootama.

Kõik riigid alustavad neutraalselt. Avastatud võõra linna tegevustes saab sõlmida sõpruse. Rünnakukäsk kuulutab sõja. Neutraalseid asunikke ei tabata ja neutraalsed laevad ei tulista üksteist. Oma linna tegevustes saab riikide kaupa kaupmehi tõkestada. Tõkestamine lisab 15 pinget, kestev tõkestamine 5 minutis. Iga minuti sõjaoht on pinge/100 × 20%; ilma tõkestuseta langeb pinge 2 minutis. Käimasolev vana salvestuse lahing säilitab sõjasuhte.

Kontrollid: TEST_V87 kontrollib toiduliike, kõigi ajastute teoreetilist pakkumist, tootlikkuse arvutust, reaalset tarbimist, piiratud ulatust, maa- ja merereise, peatusi ja tasusid, sõprade ligipääsu, tõkestust ja salvestuse taastamist. TEST_V87_UI mängib telefonis asutamise/ehitamise ning kontrollib toiduakent ja riigi koguseid. Pikemate hilisajastute kampaaniate majanduslik tasakaal vajab eraldi läbimängimist.

Pikem avamängu simulatsioon: kaks kaardiseemet, mõlemal neli riiki ja 60 minutit mänguaega. Kõik 8 riiki jõudsid pronksiaega; tunni lõpus polnud ühegi linna elanike varustuse puudujääki. See ei asenda raua- kuni moodsa ajastu tervikkampaania kontrolli.
