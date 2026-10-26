# Kuningriigid V175.2 – vali Sirge või Kumer müür

26.10.2026

## Mängimine

[**Ava V175.2 Sogni kiviaja lõpu testmäng**](https://orogdor.github.io/Kuningriigid/?v=1752-20261026&demo=ai-stone-v174)

1. Ava linna detailkaart ja vali **Build / Ehita → Puitvall**.
2. Ekraani ülaossa ilmub valik **▰ Sirge / ⌒ Kumer** (telefonis eraldi kompaktne valikuriba).
3. Hoia sõrme maapinnal, lohista müüri soovitud suunas ja vabasta.
4. Sirge režiim ühendab algus- ja lõpp-punkti. Kumer režiim järgib lohistatud rada, tasandab ebatasasused ja loob järjestikku ühenduvad 3–8 m pööratud müürilõigud.
5. Roheline/punane joon näitab ehitatava müüri kuju; sõnum ütleb, kas ehitus läks läbi või puudub ressurss / ehitusjärjekorra koht.

Sama valik toimib ka kivimüüri ehitusrežiimis, kui ajastu ja tehnoloogia lubavad. Üks lohistus võib sisaldada kuni **10 lõiku**, lisaks arvestatakse mängu 12 hoonega maksimaalse ehitusjärjekorra piirangut.

## Teostus

- `wall-draw-v175.js`: deterministlik sirge või pehmendatud kumera käsitsi tõmmatud joone tükeldamine, pöördenurga ning tegeliku lõigupikkuse määramine; ei muuda mänguseisu.
- `civilization.js`: sirge/kumera müüri valiku nupud, hiire/puute lohistus, värviline eelvaade, osalise ehituse veateade, päriselt ehitatud mudelite pööramine.
- `wall-draw-v175.css`: mobiilse ekraani peal eraldi nähtavad valikunupud; ehitusliigutus ei liiguta kaamerat.
- `civilization-core.js`: tavaliste materjalihindadega päris ehitus (mitte tasuta joon), tehnoloogia/kuiv maa, muude hoonete ja tee olemasolu kontroll. Lõikude pöördenurk ja tegelik ulatus salvestatakse olemasolevasse V4 mänguseisu.
- `navigation.js`: pööratud palisaad on tõeliselt läbimatu ka diagonaalselt, mitte ainult teljega joondatult. Püsivad värava avad.
- `fortifications.js`: müürilõigu ulatus ja pööre kanduvad õigesse collision-footprint'i.

## Testid

- [V175.2 müüride füüsika ja ehitusreeglite CI](https://github.com/orogdor/Kuningriigid/actions/runs/40328249245): **PASS**. Kontrollitud sirge ja kumer kuju, naaberlõikude ühispunktid, pööratud seinast läbipääsu puudumine, Sogni päris salvestusest müüri ost ja ehitamine, materjalide mahaarvamine, V4 salvestus/laadimine. V175.1 väravate test, V168 kaitsekoridorid, V173/V59 päris liiklusest tekkivad teed ja V73 vanad salvestused: **PASS**.
- [V175.2 WebGL telefon ja arvuti](https://github.com/orogdor/Kuningriigid/actions/runs/40329085668): **PASS**. Kummaski vaates leiti Sirge ja Kumer valik, kaarjoont sai lohistada ning värviline eelvaade tekkis; arvutis alustati ühe päris müürilõigu ehitamist. Telefoni esialgne lohistus valis takistatud koha, seega üksikust katsest ei saanud kinnitada telefoni müüri valmimist, küll aga režiimi ja joonistamise tööd.
- [V175.2 mobiiliriba füüsilise puudutamise korduskontroll](https://github.com/orogdor/Kuningriigid/actions/runs/40330589535): **2/2 PASS**, nii arvutis kui emuleeritud Androidi mõõdus sai uue ülariba kaudu valida Kumer → Sirge, lohistada päris kaare eelvaadet, olemasolevad teerakud säilisid ning kasutaja autosalvestusi ei muudetud. Arvuti žest ehitas ühe müürilõigu; mobiili katse lohistus lõppes olemasolevale hoonele liiga lähedal ja tagastas õigesti ehituse keelamise, mitte ekraanivea.

## Piirangud, mida mitte segi ajada

- **Kumerus tähendab lühikeste reaalsete sirglõikude järjestikku pööramist**, mitte ühe katkematu painutatava tala mudelit. Teravates pöördekohtades võib visuaal vajada eraldi nurgamudelit.
- See väljalase lisab **mängija käsitsi ehitatava** sirge ja kumera müüri valiku. AI juba valmis V174 kiviaja kaitseringi nurkade ja tornide visuaalseid lünki see automaatselt ümber ei kujunda. Nende parandamine on eraldi V175.3 ülesanne.
- Väravaid ei lisata lohistuse keskele automaatselt; need ehitatakse olemasoleva puidust värava mehhanismiga.
- Müüri saab joonistada ühe detailkaardi sees, mitte korraga üle mitme detailruudu.
- Telefonikatsed toimuvad Chromiumi emuleeritud 390×844 vaates; päris Androidi FPS-i pole veel mõõdetud.
