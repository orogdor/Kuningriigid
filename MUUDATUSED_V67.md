# Kuningriigid V67 — pidevad 3D-jõed, mäed ja teed

## Maastiku arhitektuur ehitati uuesti üles

- Uus **`continuous-landscape.js`** on ühine maailmakoordinaatidega kõrgusväli, valglapõhine jõevõrk ja teede trajektooride arvutus. Vanade, eraldi maailmakaardi ja detailkaardi jõe-, kalju- ja teekujutiste asemel kasutavad mõlemad vaated sama geomeetriat ja samu kõrgusi.
- Uus **`continuous-landscape-visual.js`** koostab jõe- ja teepinnad ühisesse **indekseeritud, kokkukeevitatud tippudega 3D-võrku**. Ühendatud tipud ja ühtsed normaalid kõrvaldavad senise kolmnurkadevahelise erineva valgustuse.
- Maailmakaardil moodustavad jõgede veepinna ja kaldad kumbki ühe liidetud võrgupinna; tee sõidupind ja teepeenar kumbki ühe ühise võrgupinna. Füüsilised sillad/koolmekohad on eraldi ehitised, aga paiknevad samal geograafial.
- Detailkaardi **keskruut ja selle kaheksa naabrit** kasutavad nüüd **ühte 450 × 390 suurust 3D-maastikupinda**, mitte üheksat iseseisvat pinnavõrku. Rannikumeri on samuti üks 450 × 390 pind. See välistab ruudupiiridel tekkivad vertikaalsed õmblused.
- **Mäestikud** moodustuvad 3D-maastiku pideva kõrgusvälja ja sujuva lainetuse abil. Varasemad ükshaaval paigutatud 3D-kaljutükid eemaldati põhikaardilt ja linnakaardilt; mäenõlv ei koosne enam üksteisest eraldi seisvatest objektidest.
- **Jõed** kulgevad kõveratel, kõrgusega sobitatud keskjoontel, neil on veesäng ja kaldanõlv. Jõeharu suubub teise haru täpsesse ühenduspunkti sama kõrguse ja ühtlustatud laiusega.
- **Teed** tekivad endiselt ainult tegelikust liiklusest. Tee kasutab nii maailmakaardil kui detailkaardil ühte trajektoori, jagatud pinnavõrku, tumedamat teepeenart ja vana mängu värviatribuute. Detailvaates kuvatakse kogu 3 × 3 lähiala teed ühe võrguna.
- Kõrgus ja teede/vee pinnad teisendatakse maailmakaardilt detailkaardile kindlalt: X × 3, Z × 2,6, kõrgus (Y − 0,7) × 0,30. Teede, jõgede, sillakohtade ja maapinna X/Y/Z koordinaadid on sellega seotud.
- Kaardi objektid, väeüksused, puud, linnasildid, valiku märgised ja hiirega valimine järgivad uusi maailmakaardi kõrgusi.

## Mängureeglite ühilduvus

- Jõgede **hüdroloogiline mängureegel** on jätkuvalt sama valgla- ja ruudupõhine süsteem: V67 muudab peamiselt maastiku 3D-kujutamist, mitte vanade maailmade jõgede asukohti ega navigatsiooni, mille reeglid jäävad samaks.
- Olemasolevate salvestuste `version:4` on muutmata. Teede kujunemine ning vanad linnad, ehitised, kalapüük ja avastaja jäävad alles.
- **Piirang:** jõgede voolu ja vee füüsikat ei simuleerita uue füüsikamootoriga. Detailkaardi liikumisvõrk kasutab endiselt vanu läbitavuse reegleid, et juba olemasolevad ehitused ja salvestused ei puruneks. Mäed on läbitamatud samadel maailmaruutudel nagu varem.
- Olemasolevad peenemad elanike käigurajad jäävad detailvaates lisaks ühiselt arvutatud maailmateedele.

## Testitulemused

- `TEST_V67.mjs`: kolm maailma; 693–956 jõge; jõgede ühesed algus/lõpp-punktid ja järjepidevad laiused; maailma ja detailkaardi täpselt teisendatavad kõrgused, sillad ja teed; üks koondatud 3D-jõgede võrk; indeksite abil jagatud 3D-tipud.
- `TEST_V56.mjs`: viis maailma; avastaja liikumine, tee loomine liiklusest, nähtav katend ja tumedam teepeenar, ilma kahe ruudu vahel pendeldamiseta. **Läbitud.**
- Varasemad `TEST_V66.mjs`, `TEST_V64.mjs` ja `TEST_V61.mjs`: linna ühine ehitusala, kalapüük ja kaitserajatised **läbitud**.
- Avaliku GitHub Pagesi V67 brauseritestis 3D-maastikupindu detailvaates täpselt **2** (üks maa ja üks meri) senise **18** asemel, üks kogu naabrust kattev jõe 3D-võrk, JavaScripti veateateid **0**, puuduvaid ressursifaile **0**.
- Reaalse äsjaloodud tee brauseritest: sama tee oli nähtav maailmakaardil ja kummagi naaberruudu detailkaardil; pinnakoordinaatide maailm/detail hälve oli alla **0,002** kõikides telgedes.

Uus versioon: https://orogdor.github.io/Kuningriigid/?v=67r5-20261018
