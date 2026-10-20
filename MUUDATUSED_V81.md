# Kuningriigid V81 – renessansiaja uued 3D-hooned ja Päikeselinna näidismäng

Mäng: https://orogdor.github.io/Kuningriigid/?v=81-20261020

**Renessansiaja näidislinn:** https://orogdor.github.io/Kuningriigid/?v=81-20261020&demo=renaissance

## Mida V81 muudab

Renessanss on mängus **ajastu 4** (ajastu 3 = keskaeg). Senised 0/1/2/3 ja 5/6 arhitektuurid jäävad muutmata.

Uus `renaissance-buildings-v81.js` loob üle **50 toetatud hooneliigi** jaoks ajastule iseloomuliku 3D arhitektuuri. Eraldi mahulised detailid ja tuntavad siluetid on olulisemad kui lihtsalt erinev värv:

- **Raekoda ja gildimaja:** suur krohvitud kivipalee, avatud sammaskäik, viimistletud karniisid, kellatorn, vaskkuplid ning lipumast.
- **Linnamajad ja kõrts:** korruseline krohv ja tumedad puitprussid, punasest kivist katused, väljaehitusega katuseaknad, kiviraamidega klaasaknad, korstnad, rõdud ja kõrtsisilt.
- **Ülikool ja akadeemia:** sammastega peafassaad, kiviraiendid, kuppel ning silmapaistev keskosa; õpikojal ja kirjutusmajal on paberi- ja töölauad.
- **Tähetorn:** kõrge ümmargune torn, vaskkuppel ja ülespoole suunatud teleskoop.
- **Trükikoda:** suur kruviga trükipress, paberilehed ja kuivatuslauad; mitte enam üks tavaline elamu.
- **Kabel ja klooster:** kaks torni, dekoratiivsed kaaraknad, roosaken, kloostril siseõue sammaskäik ja ürdiaed.
- **Kindlus ja väravahoone:** tornid, müürid, vasega tornikate, väravad ja lõigatud kivist plokid.
- **Turg ja kaubahoov:** madal sammasloggia, eri värvi varikatused, kaubaastjad; kaubahoovil vanker.
- **Vesi- ja tuuleveski:** eristatavad hiiglaslikud labad, vesiratas ja vesiveski peahoone.
- **Saeveski, vankrimeister, metsnik, pagariäri, kaevandused, sepikoda, sõjaväe töökojad:** igal majaklassil oma ametile viitavad välised 3D-vahendid, sh palgid, ratastega vanker, relvariiulid, kivihunnikud ja sepapada.
- **Kaev, ladu, kelder, sadam, talu, tall ja kõrvalhooned:** paremad proportsioonid, puu- ja kivimaterjalid, professionaalsed rekvisiidid.

Kasutusel on tekstuuridega tellis, renessansikrohv, terrakotakatus, kivi, vask, klaas ja puit; need luuakse arvutuslikult, ilma väliste 3D-failide allalaadimiseta. Sama hoonetüübi 3D-geomeetria ja materjalid on vahemälus; materjalide kaupa ühendatud detailid vähendavad joonistuskutsete arvu.

**NB!** Teised ajastud säilitavad senised mudelid, kaitsemüüride rotatsioon ja jõudlusparandused jäävad alles. Täpne füüsilise Androidi GPU kaadrisagedus ei ole tarkvaralises Chromiumis mõõdetav.

## Näidislinna salvestus

`?demo=renaissance` avab automaatselt detailkaardile **Päikeselinna renessansilinna**, kus on 37 valmis hoonet, 35 erinevat hoonetüüpi ja palju inimeste läbikäimisest tekkinud tänavaid. Linn on ajastus 4 ning tal on avatud renessansi, trükikunsti, astronoomia ja püssirohu uurimised.

See on päris **V4 mänguseis**. Näidislinna avamine **ei kirjuta olemasolevat mängu automaatsalvestust ega salvestuskohti üle**. JSON-faili saamiseks ava mängus menüü ja vajuta `Ekspordi salvestus`: `Kuningriigid_V81_Renessanss_Paikeselinn.json`. Sama JSON salvestatakse GitHub Actionsi artefakti `v81-renaissance-town-demo`.

## Testimine

- `TEST_V81.mjs`: kõik ajastu 4 mudelid, 3D-geomeetria ja mõõtmete piirangud, materjalide batching, instantside ühine geomeetria, siluettide kõrgused, teiste ajastute eraldatus, näidislinna V4 JSON ning teede paiknemine väljaspool hooneid.
- `TEST_V81_UI.mjs`: päris Chromiumiga telefon püstiselt 390×844, rõhtsalt 844×390 ja arvuti 1440×900. Kontrollitakse ajastut, 3D-hoonete tegelikku kuvamist, rollipõhiste mudelite olemasolu, suurt tänavavõrgustikku, JSON-eksporti, vanade salvestuste turvalisust ja ekraanipilte.
- Varasemad `TEST_V80.mjs`, `TEST_V79.mjs`, `TEST_V78.mjs`, `TEST_V77.mjs` ja `TEST_V73.mjs` töötavad muutmata. V4 formaati ei muudeta.

## Ülevaate lingid

- [Renessansiaegne Päikeselinn](https://orogdor.github.io/Kuningriigid/?v=81-20261020&demo=renaissance)
- [Keskaegne Kivilinn](https://orogdor.github.io/Kuningriigid/?v=81-20261020&demo=medieval)
- [Pronksiaegne Vaskoru](https://orogdor.github.io/Kuningriigid/?v=81-20261020&demo=bronze)
- [Jätka enda salvestust](https://orogdor.github.io/Kuningriigid/?v=81-20261020)
