# V97 — stabiilne lähenemine, takistustest möödumine ja füüsiline põgenemine

Parandus kehtib ühiselt põhimängus ning pronksiaja testlahingus.

## AI liikumine

- Salga virtuaalne marsipunkt ei saa meestest piiramatult ette joosta. See põhjustas hiljem tagasisuunalise korrigeerimise ja kogu rivi pöördumise.
- Ratsaväe kiilrivistuse geomeetriline keskpunkt on nüüd marsipunktiga kooskõlas; varasem nihkes keskpunkt võis põhjustada tagasisuunalist triivi.
- Lahingurivi suund lähtub vastasest, mitte marsipunkti väikesest tagasisammust. Kilbirivi mehed saavad vastaseni sulgeda viimase vahe.
- Laskurid kasutavad automaatselt hajurivi ja tulistamispositsiooni. Automaatsed korduvad eemaldumissammud on eemaldatud; mängija saab endiselt valida käsitsi „Lase ja eemaldu”.
- Vibudega sõjavankri manööver toimub tiival. Laskemoona lõppedes läheb vanker otse lähivõitlusse, mitte ei jää lõputult tiiba otsima.

## Puud, põõsad ja ummikud

Iga mees kasutab nüüd isiklikku teekonna järgmise punkti valikut, mitte ainult otse sihtkoha poole kõndimist. Salgajuhi raja leidmisest üksi ei piisanud: tagumised mehed jäid puu taha seisma. Marjapõõsad kuuluvad nüüd samuti lahingu takistuste hulka.

Raja silumine kontrollib kõiki läbitavaid ruudustikurakke ja ei lõika takistuse nurka. Kui mees on teekonnast kõrvale libisenud ja järgmine lõik enam vaba ei ole, leitakse rada uuesti. Väikesed täielikult suletud taskud põõsaste vahel jäetakse meeste paigutamisel välja. Ummikusse jäänud mees või vanker võib korraks kaaslastele ruumi anda; ajutine kõrvalepõige hoiab teda kohe samasse ummikusse tagasi pöördumast. Liikumine jääb kokkupõrgetega füüsiliseks, ilma meeste tõstmise või läbi üksteise liigutamiseta.

Teekonnad jagavad ruudustikupõhist vahemälu. Lahingu 3-meetrine navigeerimisruudustik jääb samaks.

## Mehepõhine põgenemine

Varem märkis esimene joone ületaja kogu armee kohe lahkunuks. Nüüd:

1. Moraali kaotanud mees või salk hakkab jooksma. Üks põgenev mees ei vii tervet ülejäänud armeed automaatselt lahingust ära.
2. Põgeneja otsib ligipääsetava väljapääsu, eelistades eemaldumist lähimast võitlusvõimelisest vastasest. Katkine kilbi- või odarivi ei aeglusta tema jooksu.
3. Mees saab lahkunuks märgitud ja peidetakse alles pärast punase joone füüsilist ületamist. Ta jääb ellujäänuna arvele.
4. Salga lahkumine lõpeb siis, kui kõik selle elus mehed on väljunud. Kogu armee liigub maailmakaardil ohutusse kohta alles oma viimase salga lahkumisel.
5. Võitja lõpetab edasise tagaajamise, kui vastaspoole võitlusvõimelised salgad on murdunud. Lähedal olevad põgenejad võivad endiselt lahingus pihta saada. Tulemuse kinnitamine ootab kaardil olevate kaotajate põgenemise või langemiseni; võitjapoole järelejäänud omade paanika võib lahingu lõppedes raugeda.
6. Kindluse langemisel põgenevad allesjäänud kaitsjad samuti füüsiliselt. Langenud kindluse kaitsepostid lõpetavad tulistamise.

„Tagane armeega” annab oma meestele päris taandumiskäsu. Mängu paus peatab ka põgenemise. Lahingu tulemus ja maailmakaardile naasmine avanevad alles pärast lõpetatud lahkumist.

## Kontroll

`TEST_V97.mjs` kontrollib, et üks põgeneja ei eemaldaks armeed, käsitsi antud taandumiskäsk ei peidaks alles kaardil olevaid mehi, lahingutulemus ootaks viimast jooksjat ja tee läheks takistusest ümber. Samuti kontrollitakse põgenemist vaenlase eest eemalduvas suunas.

`TEST_V97_UI.mjs` käivitab päris brauseris 250 mehe taandumise. Vahekontrollis oli 34 meest joone ületanud ja 216 veel kaardil. Lõpukontrollis olid kõik 250 elusat meest füüsiliselt üle joone, kaart polnud enne seda lahingut lõpetanud ja armee maailmakaardile üleviimise kirje tekkis ühe korra. See proov kasutab ajasäästuks ainult testis kiirendatud kõndimiskiirust; mängu kiirus jääb varasemaks.

Varasemad lahingutestid arvestavad nüüd osaliselt väljunud salkade mehi eraldi ning lubavad tegelikuks põgenemiseks rohkem simulatsiooniaega. Need kontrollivad endiselt 500 mehe piiri, terviseid, kokkupõrkeid, maastiku läbivust, relvaulatust, moraali, tulemuse tekkimist ja salvestuse taastamist.
