# Kuningriigid Godot — esimene päriselt mängitav kampaaniaalfa

Seis 2026-10-24, kontrollitud Godot arendusväljalase `godot-dev-74`. See on edasise töö **vastuvõtukriteeriumide** nimekiri, mitte kalendriline valmimislubadus.

## Eesmärk

Telefonis saab mängija alustada **uut kiviaja kampaaniat**, teha sisulisi valikuid ja areneda pronksiaega. Sama salvestatud maailm jääb alles, AI-riigid kasvavad ja võistlevad ning mängijal on põhjust laieneda, kaubelda ja vajaduse korral sõdida. See ei pea sisaldama kõiki V153 keskaja ja moodsa aja funktsioone.

## Minimaalne mängutsükkel enne esimest alfaväljalaset

1. **Alusta / jätka.** Avamenüü `Uus mäng`, `Jätka`, `Salvesta`. Valitav inimriik ja selge riigivärv; kolm sõltumatut AI-riiki. Mäng algab mõistetavast väikesest kiviaja rannikulinnast, mitte käsitsi loodud demonstratsioonist.
2. **Üks majandus.** Toit ja vesi, elanike arv ja elamiskohad, töötajate jaotus, tootmisahelad, materjalivedu ning päriselt makstud hooned töötavad ühe mängukellaga. Linn kasvab südamest välja ja kasutab maakonna ressursse.
3. **Teadus ja pronksiaeg.** Riigi teadus on armeest lahutatud, uurimised avavad tegelikke hooneid ja üksusi kõigis sama riigi linnades. Mängijal on võimalik kiviajast pronksiaega jõuda; AI ei jää lõputult tehnoloogiate või ressursside taha kinni.
4. **Konkurents.** AI peab suutma luua täiendavaid linnu, otsida puuduvaid ressursse, ehitada, areneda, kaubelda, liikuda ja vajaduse korral sõdida ilma eraldi `demo` menüü käskudeta.
5. **Sõjad ja riigipiirid.** Armeed saavad käske maailmakaardil, lahing töötab osalistega, kindlustatud linna vallutamine muudab omanikku, võidetud linna ressursid ja hooned säilivad.
6. **Telefoni kasutatavus.** Ehitus-, teadus-, linna-, armee- ja salvestuskäsud ei kattu ega vaja arendaja diagnostikamenüüd. Maailmakaardilt saab avada detailkaarti ning tagasi liikuda.
7. **Püsiv mänguseis ja vastupidavus.** Uus mäng talub järjestikku vähemalt **200 simuleeritud käiku** ilma seisaku, vigase linna, lõputu ehitusjärjekorra, puuduva tee või salvestuse rikkumiseta. Automaatne test kontrollib majandust, AI-d, tehnoloogiaid, kaubandust, piire ja salvestus/laadimine. Tuleb teha ka käsitsi telefonitest.

## Selge verstapost

Esimene päriselt mängitav alfa loetakse valmis, kui mängija saab **alustada ühe linnaga, jõuda pronksiaega ja jätkata sama kampaaniat pärast salvestamist**, samal ajal kui kolm AI-riiki reaalselt arenevad ja linnad on sõjaliselt vallutatavad. Demo- ja testmenüüd võivad arenduseks alles jääda, kuid neid ei tohi tavaliseks mängimiseks vaja minna.

## Mis tuleb hiljem

Rauaaeg, keskaeg, moodne aeg, mereväe täielik simulatsioon, kogu 12×12 detailruudu ühine lahinguväli, moodne relvastus, keerukam diplomaatia, planeedilt lahkumise lõppsiht ning V153 ülekande täielik 1:1 kontroll.

**Hetkeseis:** praegu on mitmeid toimivaid majandus-, teede-, territooriumi-, tehnoloogia- ja lahinguosamudeleid, kuid ülal kirjeldatud kasutajateekond ei ole veel lõpuni üheks mänguks ühendatud. Varasem üldine pordi valmiduse hinnang on 47%; see ei anna valmimiskuupäeva ega tähenda, et alfa on 47% kaugusel.
