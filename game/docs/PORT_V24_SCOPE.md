# V131 → Godot 2.4 · maakonna pidev liikumine ja sisendveod

V131 aluseks on `orogdor/Kuningriigid@26562368f56a32616651a266ed2d8c87f06d43d1`. See on **osaline port**, mitte mängu täielik üleviimine.

## Muudatused

- Maakonna töötajatel ja kaubal on säiliv maailmakaardi ruudustiku asukoht, marsruut ja sammukell. Renderdatud asukoht interpoleeritakse iga kahe ruudusüdame vahel; samu positsioone näidatakse maailmakaardil ja aktiivsel 225 × 195 detailkaardil.
- Kaugema tootmishoone sisendmaterjalid paiknevad väljal `county_worksites[].inputs` ja on **füüsiliselt kohale veetavad**. Kaubad lahkuvad linna laost väljasaatmisel, ilmuvad tootmiskoha sisendvarusse saabumisel ja kuluvad ainult kohalikus tootmistsüklis.
- `county_shipments[].direction` eristab `supply` (linna → töökoht) ja `return` (töökoht → linn). V2.3 saadetistel suund puudub ning neid käsitletakse tagasiveona.
- Kaevanduse ja tootmisretseptide sisendkoormad planeeritakse maksimaalselt neljaks tsükliks, maksimaalselt 18 ühikut veose kohta. Juba teel olev kaup vähendab uut varustusvajadust; tühi või tõkestatud marsruut ei võta linna varudest kaupa maha.
- Vana töökoha kadudes suunatakse juba saadetud sisendvarud linna tagasi; täis ladu jätab veose ootele.
- 3D-kuvas on sinised sisendveosed, pruunid valmistoodangu veosed, kollased maakonnatöötajad. Sama loogika kehtib linna- ja maakonnadetailil.
- Käsitsi käivitatav **Maakonna sisendveod: demo** loob ajutise kaugema proovikaevanduse; katse-eelne mänguseis taastatakse nupuga **Taasta maakonnakatse**.
- CSV `user://v131_godot_measurements_v24.csv` lisab lähetatud ja saabunud sisendveod, toodud koguse ning marsruudi ümberplaneerimised.
- Salvestus `user://v131_godot_preview_v24.json`; varasema V2.3 faili saab endiselt lugeda.

## Mida ei ole tehtud

- Maailmaruutude vaheline liikumine on **sirglõigu interpolatsioon maailmaruudu keskpunktide vahel**, mitte V131 detailtasandil autentne teede ja maastikutakistuste navigeerimine.
- Puuduvad hobuvankri koorma visuaalid/animatsioonid, laadimispunkti 3D-interaktsioon ning eri materjalide konkreetne kaubakandja.
- Täielik V131 riikidevaheline kaubandus, sadamad, sillad ja lahingute lõplik täpsus ei ole portitud.
- Siinses keskkonnas Godoti käivitamist ega Androidi testi teha ei õnnestunud; koodi struktuurikontroll ei ole kompilaatori kontroll.

## Kuidas telefonis kontrollida

1. Paki projekt puhtasse kausta ja impordi selle `project.godot` Godot 4 editoris.
2. Käivita **MENÜÜ → Testid → Maakonna sisendveod: demo** ja ava proovikaevanduse detailruut.
3. Vajuta **+10 min katseaega**. Esialgu ilmub kollane tööline, seejärel **sinine leivakoorem**, mis läheb kaevandusse; hiljem tuleb **pruun maagikoorem** linna tagasi.
4. Vajuta **Reeglitest**. Kui mõni test ebaõnnestub, vaata Godoti siluri tõrkenimesid; siin pole testide tegelikku läbimist kinnitatud.
5. Käivita **20s jõudlustest** (soovitavalt võrreldes V2.3-ga), tulemused salvestatakse V2.4 CSV-faili.
6. Vajuta **Taasta maakonnakatse**. Katseajal on tavapärane salvestamine blokeeritud.

## Testide olek

443 ettevalmistatud GDScripti kontrollväidet (425 olemasolevat + 18 uut), kaasa arvatud tooraine kohalevedu, varude järjepidevus, ühel ajal toimuvad sisse- ja väljaveod, katkine tee, marsruudi interpoleerimine ja salvestus. Godoti mootoris läbimist ei ole kinnitatud.
