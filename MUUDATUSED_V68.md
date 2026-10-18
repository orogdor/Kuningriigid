# Kuningriigid V68 — looduslikud jõed, päris 3D-kõrgused ja aeglasem majandus

## Jõgede suudmed ja ühinemiskohad

- V67 `continuous-landscape-visual.js` jõevõrgu põhjal on nüüd jõgede **merre suubumine lõigatud tegeliku ranniku kõrgusjoonel**, mitte merre edasi ulatuva sirge sinise 3D-ribana. Rannajoonel suudme laius suureneb ning vesi läheb kokku mere tasapinnaga.
- Mitme harujõe kohtumispunktidesse lisati ümardatud, sama veetasapinna kõrgusel olev ühine veepind, mis peidab varasemad kolmnurksed katkestused.
- Eelmise versiooni pruune kaldaribasid kitsendati. Kaldapind kasutab rohkem loodusliku pinnase toone.
- Eemaldati kogu jõeruudule antud sinakas maailmakaardivärv: vesi paikneb nüüd peamiselt päris jõekanalis, mitte sinise nelinurga kujul.
- Jõe geomeetria on endiselt kokku liidetud indekseeritud 3D-võrk, mitte ruutude kaupa loodud objektid.

## Kolmemõõtmeline merepõhi, jõepõhi ja mäed

- `continuous-landscape.js` lisab merepõhja kõrgusele **mere sügavusest sõltuva järkjärgulise languse**, mitte tasapinnalise järve põhja.
- Jõgede all lõigatakse ühisesse maastiku kõrgusvälja senisest märgatavalt sügavamad sängid, mille kallastel on kõrguste üleminek. Vesi kulgeb sängi kohal.
- Mäestike 3D-kõrgusväli on oluliselt tõstetud: pidevad harjad ja järsemad kõrguserinevused asendavad ühetaolist halli maapinda. Detailkaart ja maailmakaart loevad jätkuvalt sama geomeetriaallikat.
- Detailkaardi merepinnal on nüüd vee sügavusest sõltuv sinakasroheline värvus ning väiksem läbipaistmatus, nii et merepõhja kõrguserinevus on paremini nähtav.
- Kiviste kõrgemate nõlvade maastikutoonid eristavad rohelisi nõlvu, kaljusid ja kõrgemaid mäetippe.
- Kohalik murukate ei ilmu jõesängi keskele, ja maailmakaardi puud väldivad jõekanaleid.
- Senine ühine 450 × 390 detailkaart ja teede keskjooned säilivad.

## Majanduslik otsustusvajadus

- Uue linna stardivarud muutusid: puit **100 → 68**, lauad **35 → 10**, kivi **30 → 18**, toit **40 → 26**, vesi **40 → 28**, kuld **120 → 90**.
- `RESOURCE_PRODUCTION_MULTIPLIER` muutus **1/3 → 1/4,5**. Sama aeglasem tootmismäär rakendub puidule, kivile, toidule, vee tootmisele ning teistele töötavate hoonete toodetele.
- Kallimate hoonete ehitamine nõuab nüüd selgemat valikut: esmalt on mõistlik luua põhitootmisvõimekus, seejärel kasutada järgmisi ehitusmaterjale.
- **Vanad salvestused säilitavad senise varu**; tootmiskiirus muutub ka vanades mängudes.
- Ehitus-, uurimis- ja sõduriväljaõppe aegu selles muudatuses eraldi ei suurendatud.

## Värbamine, kui armee on linnast väljas

- Leiti täpne põhjus `civilization-core.js` funktsioonides `recruit` ja `tickTraining`: mõlemad nõudsid põhiarmee koordinaatide kattumist linna koordinaatidega.
- Eemaldati see vale nõue. Nüüd saab värbamise tellida ja lõpetada ka siis, kui olemasolev välivägi seikleb mujal.
- Kui linnas on oma väesalk, ühinevad uued sõdurid sellega. Kui ei ole, luuakse **eraldi kohalik väesalk** koos stabiilse `armyId`-ga; senist väliväge ei telepordita linna.
- Väesalga kuuluvus ja asukohad salvestuvad ning taastuvad; vanad salvestused säilivad.

## Testimine

- `TEST_V68.mjs`: kolm erinevat maailma tõestasid, et mägede tegelik 3D-kõrgus ületab algset kõrgusvälja, merepõhi on madalamal ja jõed paiknevad sängis. Kolme maailma peal kontrolliti ka värbamist linnast eemal oleva armeega, kahe värvatud sõduri kohaliku väesalga teket ning salvestamist.
- `TEST_V67.mjs`: kolme maailma ühiste jõgede/teede ning kõrguste ühilduvus läbis kontrolli pärast uuendusi.
- Kõik `TEST_V66.mjs`, `TEST_V64.mjs`, `TEST_V63.mjs`, `TEST_V61.mjs`, `TEST_V60.mjs` ja `TEST_V56.mjs` läbisid regressioonikontrolli (linn, kalapüük, tõlked, kindlustused, majandus, teed ja avastaja).
- Päris GitHub Pagesi brauseris: V68 ingliskeelne pealkiri, stardivarud ja tootmiskordaja õiged; detailkaardi mägine maastik tõusis ligikaudu 21,5 kohaliku kõrgusühikuni, merepõhi paiknes umbes 12,5 ühikut allpool veetaset. Jõgi kuvati ühise 3D-võrguna ning kodulinn värbas sõduri väliväge tagasi kutsumata. **JavaScripti vigu ega puuduvaid võrgufaile ei esinenud.**

**Piirang:** veele ei ole lisatud eraldi hüdrodünaamika simulaatorit ja uued järsemad kaljunõlvad on esialgu 3D-reljeefi muudatus; maailmakaardi läbipääsud ja detailkaardi liiklusreeglid kasutavad jätkuvalt varem salvestatud loogikat.

Mäng: https://orogdor.github.io/Kuningriigid/?v=68d-20261018
