# Kuningriigid V82 – tööstusajastu 3D-majad ja hoonete infokaardid

## Järgmine ajastu: tööstusajastu (ajastu 5)

Kõik olemasolevad kivi-, pronksi-, raua-, keskaja ja renessansi mudelid jäävad alles. V82 lisab tööstusajastu (age=5) jaoks **65 eristuvat 3D-hoonemudelit**, mis on inspireeritud 18.–19. sajandi tööstuslinnadest. Neid ei asenda ühesugune karp eri värviga: suurtes tehastes on kõrged telliskivikorstnad, kõrgahjud ja malmtorud, masinaehituses aurukatlad ja hoorattad, raudteejaamal raudkatusega perroon ning rööpad ja õppehoonel tööstusajastu kivifassaad.

- **Terasevabrik / kõrgahi** – malmahjud, tööstustorustik, ladu ja kõrge korsten.
- **Masinatehas** – rataste, aurukatelde, metalltorude ja tootmisruumiga tehas.
- **Raudteejaam** – perroon, rauast kandetalad, kaartööstuslik varikatus ja rööpad.
- **Polütehnikum, ülikool ja raekoda** – suur kivist fassaad, tihedam akendarida, torn ja vaskkuppel.
- **Elamud, kõrts, laohooned, turg ja töökojad** – tööstusajastu tellis, krohv ja kiltkivikatused, eri siluetid ja otstarvet näitavad välisdetailid.
- Sõjalaagrid, sadamad, kaevandused, vesiveskid, tuuleveskid ja varasemad ametikojad saavad ajastule sobiva välimuse.

Mudelid on protseduurilise puidu-, tellise-, raua- ja kiltkivi tekstuuriga. Geomeetria ühendatakse materjalide järgi, korduvad hooned jagavad sama GPU-geomeetriat ning telefoni tarvis puuduvad välised GLB-mudelid.

## Majale vajutades avaneb hooneinfo – kõigil ajastutel

V82 kasutab tegelikku `Three.js` hiire- ja puutekiire lõikamist olemasoleva hoone mudeli mesh'iga. Katuse, torni, seinadetaili või kõrvalhoone otsa vajutamine valib õige hoone; enam pole vaja sihtida ainult hoone keskpunkti maapinnal.

Paremal all avaneb telefonis kompaktne, suletav infokaart:
- nimi, linn ja ajastu;
- valmimisolek, tootmise hetkeseis ja maja seisukord/HP;
- vajalik tööjõud, tegelikult määratud töötajad ning töö tõhusus;
- toodang, sisendressursid ja ehitamise hind;
- ehitusprotsent, vajaminevad materjalid ja tehnoloogia, kui need kehtivad;
- omaniku majal nupud **Töölised** ja **Peata töö / Jätka tööd**.

Infokaart töötab ka vanadel kiviaja ja pronksiaja salvestustel, samuti rauaajal, keskajal, renessansis ning moodsas ajastus. Vastase majast näeb infot, kuid selle tegevust ei saa muuta.

## Näidislinn ja salvestuste ohutus

- [Ava Aurulinna tööstusajastu näidislinn](https://orogdor.github.io/Kuningriigid/?v=82-20261020&demo=industrial).
- [Tavaline mäng V82](https://orogdor.github.io/Kuningriigid/?v=82-20261020).
- V81 renessansilinn ja vanemate ajastute näidislinnad on endiselt menüüst kättesaadavad.

Aurulinna V4 näidissalvestuses on tööstusajastu 5, 41 valmis hoonet ja jalakäijate läbitud marsruutide põhjal moodustunud teedevõrk. Näidis avatakse omaette, olemasolevat automaatsalvestust **ei kirjutata üle**. Näidist saab menüüst päris JSON-failina eksportida. V82 ei lisa V4 salvestusse uusi kohustuslikke välju.

## Automaatsed kontrollid

`TEST_V82.mjs`:
- kõik 65 tööstusajastu mudelit, geomeetria taaskasutamine, joonistuskutsete ning kolmnurkade piirid;
- viie eri ajastu näidise puhul infot sisaldav struktuur ja õige ajastu;
- Aurulinna salvestuse taasesitus, linnamajade paiknemine ja päriselt läbitavate teeradade kontroll.

`TEST_V82_UI.mjs`:
- päris Chromiumi telefonis ja arvutis tap/click hoone 3D-mudeli katusele;
- eraldi infokaardi avamine ja sulgemine; telefoni ekraanile mahtumine;
- tööstusajastu kõrgahju tegevuse peatamine ning taaskäivitamine;
- JSON-näidissalvestuse allalaadimine.

Lisaks V81, V80, V79, V78, V77, V76, V75, V73 ja vanemate müüri/teede testide ühilduvuskontrollid.

**Piirang:** Chromiumi tarkvaraline WebGL ei mõõda Samsungi telefoni tegelikku GPU FPS-i.
