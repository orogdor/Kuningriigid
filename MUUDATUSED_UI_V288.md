# Kuningriigid V288 – illustreeritud maailmakaardi HUD

V287 oli vaid värvide ja CSS-i osaline ümberkujundus. V288 kasutab referentspildist otse välja võetud kuue kaardi graafikat ja loob maailmakaardile eraldi reaalselt toimiva HUD-i.

## Uus ilme
- Ülariba: vapp, kuningriigi nimi, reaalne ajastu ja käigu number, mängu enda ressursid, juhend, päevik ja seaded.
- Vasak ülaserv: uurimuse kaart, kus on mängu tegelik aktiivne avastus ja edenemise protsent. Originaalsed eesmärgid jäävad selle alla.
- Paremal: neli riiki olemasolevate fraktsiooninimede, diplomaatiliste suhete ja tegeliku elanikkonna andmetega. Arvud ei ole väljamõeldud skoorid.
- All vasakul: mängu päris minimap koos tööriistadega.
- Keskel all: kuus suuremat pildipõhist kaarti (Ehitused, Üksused, Uurimus, Diplomaatia, Kaubandus, Riigi juhtimine). Eestikeelses lauavaates kasutatakse kavandipildist pärinevat ühiskujundust, iga kaardi peal on eraldi päris nupp.
- Paremal all: päris valitud üksuse info ja käsud ning suur ringikujuline olemasolev paus/jätka nupp. Referentsi pildil olnud „Lõpeta pööre“ on asendatud mängu reaalajareeglitele sobiva tegevusega.
- Diplomaatia: päris liidud, neutraalsus ja sõda kasutavad olemasolevat suhtesüsteemi. Keelatud algne sõjarahu jääb kehtima.

## Tehniline
- Uued failid: ui-reference-v288.js, ui-reference-v288.css, ui-art-v288/*.svg.
- Esialgne V286 mängu renderdus, majandus, armeed, salvestamine ja maailmakaart jäävad muutmata. V288 on UI versioon, mitte mängu loogika uus suurversioon.
- 1/1 kopeeritakse UI aluspaigutus 1672×941 referentsvaates. Maastik, linnade asukohad ja numbrid peavad jätkuvalt sõltuma käimasolevast mängust, nii et ekraan ei saa olla terve pildina identne.
- Brauseri ja väiksemate ekraanide jaoks on responsiivne varuplaan. Mobiilivaates säilitame olemasoleva katsetatud puutemenüü, mitte ei suru lauaarvuti kaarte ekraanile.
- Pildifail ui-art-v288/toolbar.svg sisaldab referentspildist lõigatud 6-kaardi WebP riba, SVG-sse manustatud, et faili oleks võimalik GitHubi tekstilise API kaudu versioonihaldusesse viia.

## Proovimine
- Uus kujundus: https://orogdor.github.io/Kuningriigid/?ui=painted&v=288
- Vana kujundus: https://orogdor.github.io/Kuningriigid/?ui=classic&v=288
- Peamenüüst saab vana ja uue vahel lülitada.

## Kontrollimise seis
- Sõltumatu staatiline regressioonitest tests/ui-reference-v288.mjs (allikad, olemasolevad nupud, päris andmed, pildid ja CSS).
- CI quick-check lisatud.
- Visuaalne 1/1 kontroll päris Chrome'i ja telefoni ekraanipiltide põhjal jääb vajalikuks; seda ei loeta automaatselt tehtuks ainult koodi üleslaadimisega.
