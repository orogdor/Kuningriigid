# Kuningriigid V165 – igal riigil oma pärimuse külanimed

Uue mängu neljal riigil on nüüd püsiv ja eristuv rahvuslik nimekogu. Riigi uued asulad kasutavad **ainult tema nimekogusse** kuuluvaid nimesid. Vanad salvestused säilitavad olemasolevad nimed.

| Tiim | Riigi nimi menüüs | Nimede päritolu | Näited |
|---|---|---|---|
| 0 (mängija) | Eesti | Kalevipoeg, Tõll, Leiger ja eesti pärimus | Kalevila, Lindamäe, Tõlluste |
| 1 (AI) | Soome | Kalevala ja soome-karjala pärimus | Väinölä, Pohjola, Tapiola |
| 2 (AI) | Rootsi | Ynglinga ja Rootsi pärimuspaigad | Birka, Vendel, Fyrisvellir |
| 3 (AI) | Norra | Heimskringla, Norra saagad ja paigad | Hlaðir, Skiringssal, Kaupang |

**Tulevikuks valmis:** eraldi nimekogud ka Taani (Lejre, Skjoldung, Heorot) ning Islandi (Hlíðarendi, Bergþórshváll, Reykholt) jaoks. Praegu on mängus neli riiki, nii et neid kahte nimekogu ei määrata olemasolevatele neljale tiimile.

- V164 Rootsi kogus olnud Skiringssal viidi Norra kogusse, sest see asub Vestfoldis.
- Mängija jaoks varem 'Ida', 'Põhja' ja 'Lõuna' nime kandvad vastased kuvatakse 'Soome', 'Rootsi' ja 'Norra' vastastena.
- Iga riigi 16 nime on teistest kogudest eristuvad. Pärast nimede ammendumist lisandub kordumatuse tagamiseks number.
- Maailma seeme määrab iga riigi esimese nime ja nimede järjekorra; eri mängude nimed võivad erineda.
- Uusi asulaid nimetatakse asutamisel. Olemasolevate salvestuste külasid ei nimetata ümber.
- Kui kasutaja on salvestuses oma fraktsiooninimed eraldi määranud, säilib see valik.
- Muutus puudutab ainult nimesid ja fraktsioonide nimetusi. AI, majandus, salvestusvorming ja 3D-mudelid jäävad endiseks.
- Nimed on mõeldud ajaloolise pärimuse **ainestikul põhineva mängulise nimetamisena**; kõik nimed ei ole reaalselt kiviajal kasutatud külanimed.

## Kontrollimine

`TEST_V164_NAMES.mjs`: kuue eraldi nimekogu kontroll, riigi ja nimede vastavus, nime kordumatuse kontroll, sama maailma deterministlikkus, mängija määratud nimede säilitamine, tehisintellekti asutatud linnad ja salvestuse taaslaadimine.

`.github/workflows/v164-nordic-names.yml`: automaattest.
