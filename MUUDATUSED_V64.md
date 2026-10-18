# Kuningriigid V64 – kalandus, vaba ehituskaugus ja kiirem maailmakaart

## Kalad on meres
- Maailm genereerib püsiva seemne põhjal kalaparvi **ainult mereruutudel**, mitte maismaal.
- Kalad paiknevad rannikumeres ja kaugemal avamerel. Rannikuvetes on püügiõnn kindlam, kaugemates vetes on suuremad saagid. Kalaruutude 3D-mudelid on vees nähtavad ka ruudu detailkaardil; maailmakaardil kuvatakse avastatud kalapüügi kohad ning ülevaatekaardil merekalarved.
- Kalamehe onni saab ehitada **ainult mererannaga vahetult piirnevale maismaaruudule**; kalastamine ei vaja enam maismaaruudul asuvat kalavarutäppi.
- Kalasaak võetakse päriselt meres asuvatest püügikohtadest. Iga kalakoha varu väheneb püügil ja taastub pärast ammendumist (120 mängusekundi pärast). Varude muutus salvestub mänguseisu `fishStocks` osana.
- Vanade mängude maismaal asunud kalamudelid eemaldatakse maailma genereerimisel ja kohalike salvestatud detailmaailmade avamisel; linnade asukohti ega ehitisi ei muudeta.

## Kalamehe püügivõime ajastuti

| Ajastu | Kaugeim mere sügavus kaldast ruutudes | Püügiviis |
|---|---:|---|
| Kiviaeg | 1 | Ainult kaldalt |
| Pronksiaeg | 2 | Madal rannikumeri, väike paat |
| Rauaaeg | 4 | Paat kaugemal rannikumeres |
| Keskaeg | 7 | Avamerepüük |
| Renessanss | 11 | Suuremad kalapaadid |
| Tööstusajastu | 17 | Mootoriga kalalaevad |
| Moodne ajastu | 28 | Pikad püügiretked |

- Paadis kalurid on maailmakaardil **päriselt liikuvad kalapaadid**. Püüki ei tehta tasuta: kaugematel retkedel kulub edasi- ja tagasisõidu aeg; uuematel ajastutel sõidetakse kiiremini ja sügavama mere saak on suurem.
- Kalapüügi ulatus ja püügiviis on kirjas kalamehe onni ehitusvalikul. Merele minev kalur avastab oma püügipiirkonda.
- Tehnoloogia `fishing` jääb kalamehe onni avamise eelduseks. Ajastu lisapüügikaugus jõustub automaatselt pärast uue ajastu avastamist.

## Ehituskaugus
- Eemaldatud varasem nõue, et iga uus hoone asuks kuni **13 kohaliku sammu** kaugusel juba valmis hoonest.
- Oma linna territooriumile kuuluvatel detailkaartidel saab ehitada ka kaugemale: sobiv uus hoone seotakse lähima valmis hoone või linnakeskusega. Endiselt kehtivad kuiva maa, kalle, takistuste, maardlate, ehitusjärjekorra, materjalikulu ja hoonete kattumise piirangud.
- Linna territooriumi suurus kasvab endiselt rahvaarvuga; see muudatus ei anne uusi tasuta maailmaruute.

## Maailmakaardi vea parandused
1. **Hiire ja puute ekraanipinna valimine:** eemaldatud iga liigutuse korral tehtav sadade tuhandete maastikukolmnurkade läbiotsimine. Selle asemel kasutatakse kiiret maapinna kõrgust arvestavat analüütilist kiirlõiget.
2. **Ülevaatekaart:** 220 × 165 maailmaruudu värviline taust jääb vahemällu. Liigutamisel joonistatakse uuesti ainult kaamera vaateaken ja valitud ruudu tähistus, mitte kogu maailma aluspilt.
3. **Vähem 3D tippusid:** maailmakaardi pinnavõrk kõrgel/keskmisel graafikaseadel ~145 971 tipu asemel varasemate ~327 856 tipu; säästlikul režiimil ~36 686 tippu. Vähendatud kaartidele kantud ruudustiku geomeetriat.
4. **Ressursiikoonid:** korraga kuni 160 kaardiikooni, neist kuni 46 kalaparvede märki; kaardi liigutamisel vanad ikoonimaterjalid ja tekstuurid vabastatakse. Enam ei kogune sadu kasutuseta tekstuure iga kaameranihkega.
5. Püsivad teed, linnad, uduloor, armee liikumiskäsud, randade 3D-vaated ja uuritud alade valik jäid alles.

## Testid
- `TEST_V64.mjs`: mitu seemet, ainult meres asuvad kalad, ranniku- ja avamerevarud, seitsme ajastu püügipiir, päriselt kaugemale sõitvad kalurid, kalavarude kulumine, töötav saagitootmine, ainult rannikule lubatud kalameheonn, kaugemad hooned ja vanade kalavarude migratsioon.
- Läbitud `TEST_V63.mjs` (keeled), `TEST_V61.mjs` (müürid/tornid), `TEST_V60.mjs` (majandus) ja `TEST_V56.mjs` (teed ja avastaja).
- Avalikul GitHub Pages V64 lehel loodud mängus kontrollitud 4/4 mängija rannikualgused, 0 maismaal olevat kalavaruruutu, üle 13 000 kaladega mereruudu ühes seemnes ning maailmakaardi armee liikumine naaberruudule.
- Ülevaatekaardi automaattestis muutus valiku/vaate nihutamisel ainult ülekatte loendur; maailma aluskihi uuesti joonistamiste arv jäi samaks. Avalikus brauseris käivitus mäng JavaScripti vigadeta.
- Mänguseisu **`version:4`** jäi samaks. Sätted ja olemasolevad salvestused on säilitatud.

**Märkus.** Suurt hilise mängu mitme linna, laevastiku ja lahinguga jõudlustesti ei ole tehtud. Lisaks ei lisatud kutselise kalanduse eraldi püügilaevastiku juhtpaneeli: paadid kuuluvad töötavale kalameheonnile.
