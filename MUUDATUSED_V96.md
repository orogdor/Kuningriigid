# V96 — lähivõitluse kontakt ja liiga varane taandumine

Parandus kehtib nii põhimängus kui ka pronksiaja testlahingus. Mõlemad kasutavad sama lahingumootorit.

## Põhjused ja parandused

1. Varem kasutas iga mees salga üldist laskekauguse näitajat ka lähivõitluses. See kasvas kogemustaseme ja varustusega ning laskis näiteks eliitodamehel lüüa mitme meetri tagant. Lähivõitlus kasutab nüüd tegelikku relvaulatust keha servast: lühirelv 0,38 m, oda 1,05 m, piik/hellebard 1,85 m ja ratsaväe relv 0,55 m. Kaugusele lisanduvad mõlema võitleja kehamõõdud. Tase ja varustus parandavad endiselt võitlusnäitajaid, kuid ei pikenda lähivõitlusrelva.
2. Tavaline ratsanik kasutas sama suurt kokkupõrkeraadiust kui kahe hobusega vanker. Ratsaniku raadius on nüüd 1,05 m; vankri ja sõiduki oma jääb 2 m. Nii saab ratsavägi samuti vastasele lähemale.
3. Salgajuhid peatusid senise relvaulatuse + 2 m kaugusel. Nüüd liiguvad lähivõitlejad kontaktini, sealhulgas kilbirivis. Hoia-positsiooni käsk ja käsitsi määratud odarivi jäävad mängija kontrolli alla.
4. Tühja nooletupe või laskemoonaga laskurid kasutasid endiselt laskekaugusel põhinevat peatumist. Nad lähevad nüüd lähivõitlusse. Automaatne eemaldumise või kogupaugu rivistus lõpeb laskemoona ammendumisel. Lähivõitlust ei blokeeri enam tulirelva tulejoone kontroll ning kilbikaitse arvutatakse tabamuse tegeliku liigi järgi.
5. AI võis peatada odarivi juba 30 m kaugusel olevate ratsanike pärast. Automaatne vastuvõtt käivitub alles 12 m piires ning odad võetakse vastu siis, kui lähivõitluseks lähenev ratsavägi on lähim oht, mitte eemalt tulistava sõjavankri pärast; lähemale jõudnud jalaväe vastu jätkub võitlus.
6. Kaotused, naabri paanika ja väsimus summeerusid liiga järsult. Kaotuste mõju vähendati 90-lt 70-le, naabri paanikat 18-lt 9-le ning väsimuse moraalimõju 0,12-lt 0,07-le. Küljerünnaku moraališoki lagi on 18 varasema 26 asemel. Tugevalt kaotusi saanud ja purunenud salgad põgenevad endiselt.

Alles on 500 mehe piir, individuaalsed tervised ja kokkupõrked, 3 × 3 lahinguala, tühi sektor armeede algpositsioonide vahel ning poole kiirusega lahingukell. Üksusekaart näitab nüüd tegelikku lähivõitluse kaugust. Keelevaliku vana V88 pealkiri asendati automaatselt lehe versioonist loetava numbriga. Kampaania majandust ega teadust ei muudetud.

## Kontroll

`TEST_V96.mjs` kontrollib füüsilist relvaulatust sõltumata tasemest, ratsaniku ja vankri erinevaid mõõtmeid, tühja laskemoonaga lähenemist, odarivi õigeaegset käivitamist ja terve salga vastupidavust naabri paanikale. Seejärel mängib see 500 mehe lahingu päris maastikul lõpuni ja kontrollib iga registreeritud lähivõitlusetabamuse kaugust ning elusate, langenute ja põgenenute arvu säilimist.

Kontrolllahingus jõudis lähivõitlusse 257 erinevat meest. Esimene lähivõitlus toimus 32,9 lahingusekundil ja esimene terve salga põgenemine 40,8 sekundil. Suurim jalaväe kehade vahele jäänud löögivahe oli ligikaudu 1,05 m odamehel. Testi ajad on simulatsiooni-, mitte seinakella sekundid.

`TEST_V96_UI.mjs` avab uuendatud pronksilahingu brauseris, mängib selle kontaktini, kontrollib tabamiskaugust ja teeb lähedalt ekraanipildi. Seejärel avab sama lähtekoodiga tavalise mängu ning kontrollib V96 versiooni ja algusmenüüd. Varasemad lahingu-, mudeli-, telefoni- ja kaitsetornitestid kontrollivad regressioone.
