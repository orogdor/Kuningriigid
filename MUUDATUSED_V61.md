# Kuningriigid V61 – Kaitsemüürid, vahitornid ja päris garnison

## Uued tehnoloogiad ja ehitised

- **Kaitserajatised** (kiviaeg, eeldab kivitööd ja sõjapidamist): puidust kaitsemüür (`palisade`) ja vahitorn (`watchtower`).
- **Kivist kindlustused** (pronksiaeg, eeldab pronksitööd, kaitserajatisi ja kivitahumist): kivimüür (`stonewall`) ja kivist kaitsetorn (`stonetower`).
- Neli uut detailset 3D-hoonemudelit. Puitmüür on teritatud palkidest, kivimüür sakiliste kaitserinnatistega; tornidel on nähtav vahimees ainult tööjõu olemasolul.
- Müürilõiku saab paigaldamisel pöörata 90° ekraaninupuga või **R** klahviga; suund säilib mängusalvestuses.

## Kaitse toimimine

- Vahitorn vajab **üht olemasolevat linna töötajat**: `labor.demand` ja tööjõu jaotus arvestavad seda. Tühjalt, peatatud või hävinud torn ei tulista. Töötajaga torn teeb piiramisel automaatseid kaugusrünnakuid (puit 8, kivi 12 kahju, 2.2 s tsüklis).
- Puitmüürile mahub **2** sõdurit ja kivimüürile **3**. Müüri valides ilmub detailkaardi juhtpaneelile „Saada järgmine sõdur“ / „Kutsu sõdur tagasi“.
- Sõdur peab olema **päris olemasolev elus armeeüksus** samas maailmaruudus ning armee peab olema peatunud. Müürile määratud üksus ei liigu enam koos armeega ega osale teise ruudu lahingus. Müürilt ära kutsudes liitub olemasoleva samal ruudul oleva armeega või moodustab kohaliku kaitsearmee.
- Sõduritel on reaalsed elupunktid; garnisonisõdur võib piiramislahingus surra. Müüril paigutatud üksused hoiavad oma posti ega jälita vastast läbi kaardi; nende kõrgendatud positsioon annab 30% ründeboonuse ja 5 lisakaugust.
- Rajatud müürid ja tornid annavad linnusele piiramisel lisakaitsepunkte (lihtsustatud kaitsekiht). Vastaste AI võib uurida kaitserajatisi, rajada neid ja paigutada ühe sõduri müürile, kui tal on piisavalt vägesid.
- Jätkuvalt ei ole mängus eraldi müürilõikude hävitamise ega piiramismasinate füüsilist simulatsiooni. Müürid on käesolevas versioonis ehitatav/kaitsev rajatis ja garnisonipositsioon, mitte täielik eraldi hävitatav füüsiline perimeeter.

## Täiendavad V61 parandused
- Müürile määratud sõdurite 3D-asend on parandatud: sõdurid seisavad müüri peal, mitte selle sees või maapinnal; sõdurite paigutus joondub müüri suunaga.
- Müüride navigatsioonitõke katab nüüd kogu 7-ühikulise müürilõigu ja pöördub 90° koos müüriga. Vana salvestuse olemasolevad müürid saavad õiged kokkupõrkemõõtmed automaatselt.
- Ehitustest kontrollib lisaks menüülukule ka päris ressursikulu ja ehitusjärjekorda pärast vajaliku metsamaja valmimist.

## Ühilduvus ja testid
- Salvestuse `version:4` jäi samaks; `unit.garrison` ja `building.wallAxis` lisanduvad ainult siis, kui neid kasutatakse. Vana mängu laadimine säilib.
- `TEST_V61.mjs`: uurimislukud, 3D-mudelid, sõdurite müürile/armeesse üleviimine, piirarv, tornituli, kaitseboonus ja salvestamine/laadimine.
- `TEST_V60.mjs`, `TEST_V59.mjs`, `TEST_V57.mjs`, `TEST_V51.mjs`: regressioonid edukalt läbitud.
- Parandati varasem kaubandusloogika äärejuht, kus puuduva rahvaarvu väärtuse korral võis laadung muutuda `NaN`-iks.
