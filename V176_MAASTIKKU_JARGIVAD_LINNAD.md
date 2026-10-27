# V176 – maastikku järgivad vastase linnad

AI uued kaitseplaanid võivad olla ebakorrapärase ümara kontuuriga, ranniku vastu toetatud või läbimatu kaljukülje vastu ehitatud. Vana ristkülik ei ole enam ainus kiviaja plaan. Sama planeerija töötab ka hilisemate kivimüüridega.

Planeerija sobitab kontuuri linnasüdame majade ümber ning otsib ühes tagumises sektoris sobivat lähedast looduslikku kaitset. Mere, sügava jõe või mäeruudu vastu võib jääda ehitamata müürikaar; mõlemad müüriotsad sobitatakse tegeliku läbimatu piirini. Läbitavat küngast, dekoratiivset kivi ega detailkaardi tehnilist serva ei arvestata loodusliku müürina. Kui kindel plaan ei mahu, säilib senine varuplaan.

Lagedal maal kavandatakse tavaliselt kaks väravat. Kalju või ranna poole toetatud linn võib saada ühe avatud esikülje värava. Väravate tegelik telg ja postide 7 m välislaius säilivad. Majade AI paigutus eelistab uut kontuuri täita enne väliste eeslinnade kandidaatide kasutamist. Põllud võivad jääda väljapoole; nende ruumivajadus ning päris liikumisteed jäävad kaitstuks.

Iga müürijupp ja värav tellitakse senise mängu ehituse kaudu: ressursikulu, tehnoloogia, ehitusjärjekord ja tööaeg kehtivad edasi. Maastikku ei muudeta ega lisata tasuta kaitserajatisi. Olemasolevaid ehitatud kaitseliine ei lammutata; vanad veel ehitamata plaanid saavad uue maastikukontrolli.

## Kontrollitud

- `TEST_V176_TERRAIN_CITIES.mjs`: lageda maa, läbimatu kalju, ranniku ja läbitava künka variandid; eri seemnetel eri kuju; puidust ja kivist kaljutoega müürid; majad kontuuri sees; väravad läbitavad; suletud väravatega ei leidu juhuslikku väljapääsu; sama tulemus pärast JSON-taastamist.
- Sama test kasutab päris mängu AI ehitusgraafikut ja tavalisi ehitus-/ressursireegleid: kontrollitud varudega asula ostis ning lõpetas 48-osalise orgaanilise kaitseplaani. Test teeb ehitusjärjekorra kontrolliks valminuks, mitte kiiruse/majandustasakaalu mõõtmiseks.
- Sekkumiseta uus mäng, seeme `142023`, 20 käiku: kõik kolm AI linna valisid `organic-terrain-enclosure` reservplaani; elanikke 6/6/7 ja hooneid 9/12/8. Varusid ega hooneid selles jooksus ei lisatud.
- V175.8 mere-/mäeühendused, V175.4 väravafüüsika, V175.5 pööratud müürid, V168 koridori jalajäljed, V169 asulakoha valik, V172 linnatihedus ning V174 tänavafrondid läbisid kontrolli.
- Planeerija kolme kontrollmaastiku skeeme vaadati eraldi üle. Need on planeerimistesti skeemid; 3D mängu visuaalset brauserikontrolli selles keskkonnas teha ei saanud.

V176 regressioon lisati olemasolevasse ühte kiirkontrolli. Uut automaatsete tööde maatriksit ei lisatud.
