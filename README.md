# Kuningriigid V223.3

Eestikeelne (ja ingliskeelne) reaalajas tsivilisatsioonimäng brauseris, mis ühendab maailmakaardi avastamise, linnade ehitamise, teadusarengu, laevastikud ja taktikalised lahingud.

**Mängi:** https://orogdor.github.io/Kuningriigid/?v=2233

## V223.3 – kiviaja lähivaate mudelid

Detailsemad kiviaja hooned ja luustikuga inimene laaditakse kaamera 100 meetri läheduses. Kaugvaates säilivad kerged mudelid. [Muudatused ja kontrollid](MUUDATUSED_V2233.md) · [Mudelite eelvaade](preview-stone-near.html).

## V88 – rannajoon, maardlad ja riigi ressursid

V87 pealt alustatud arendusharu: rannajoonele paigutatavad kalameheonnid ja sadamad, konkreetsed kaevanduskohad, ajastuga muutuvad kaevandusmudelid ning riigi puuduvate ressursside järgi valitud uued AI linnad. [Muudatused ja kontrollid](MUUDATUSED_V88.md).

V88b: kõigi ajastuvahetuste materjalikulu on poole väiksem. [Uue 100 käigu reegliga katse aruanne](V88_POOLHIND_TEST.md) ja [täielik käigulogi](V88_POOLHIND_TEST.jsonl.gz).

V88d: avastaja nähtavus uuendatakse osaliselt, AI põhiehitistel ja saekojal on eelis, läbipääsud ning kaevandaja toidukulu on parandatud. [Kontrolli aruanne](V88_PARANDUSED_TEST.md).

## V87 – linnade varud, kaupmehed ja vajadused

Linnapõhised varud koos riigi kogusega, ajakuluga maa- ja meretransport, piiratud reisijalad, 5% peatumistasu ning neutraalsed suhted ja kaubanduspinged. Ajastupõhised toidu- ja luksusvajadused, 17 tootmishoonet ja uued piirkondlikud ressursid. [Reeglid ja testide ulatus](MAJANDUS_V87.md).

## V86 – sujuvam mängukulu ja vähem taustakoormust

Majanduse taastumine puudusest, vajaduspõhine toidutootmine, ligipääsetavad AI ehituskohad ning säästlikum maailmakaardi ja menüüde joonistamine. [Analüüs ja kontrollide ulatus](ANALUUS_V86.md).

## V85 – kaljud, jõgede ühenduskohad ja detailkaardi linnapiirid

Maapinnaga ühendatud lõhelised kaljud, ühtne jõepind ning omaniku värvi territooriumipiirid. Jõgede senine laius ja salvestused säilivad.

## V84 – mäed, jõed ja kaldast kaldani sillad

Ühised tahulised mäeharjad, madala vee värvid ja uued sillad/koolmekohad mõlemal kaardil. Salvestuste V4 vorming säilib. [Muudatused](MUUDATUSED_V84.md).

## V83 – menüü viimistlus

Jätkamine on kohe nähtav; uue maailma seaded, salvestused ja näidislinnad on kokkupandavad. Käivitus- ja salvestusvead kuvatakse menüüs. [Muudatused](MUUDATUSED_V83.md).

## V82 – tööstusajastu 3D-hooned ja hooneinfo kõigil ajastutel
- Tööstusajastu (ajastu 5) sai 65 erineva hooneliigiga tekstureeritud 3D-paketi: kõrge korstnaga kõrgahjud, aurumasinatöökojad, raudteejaam, tehnikaülikool, telliskivimajad ja tehasehooned.
- **Puuduta detailkaardil ükskõik millise ajastu maja katust või seina**: avaneb eraldi väike infokaart nime, ajastu, toodangu, sisendite, töötajate, HP ja ehitusprotsendiga. Oma majadel saab sealt töö peatada ja jätkata.
- **[Ava Aurulinna tööstusajastu näidislinn](https://orogdor.github.io/Kuningriigid/?v=2233&demo=industrial)** – 41 valmisehitatud hoonet, kõndimisega tekkinud tänavad ja JSON-salvestuse eksport.
- V80 teed ei lõiku hoonetega, varasemad arhitektuurid ja salvestused jäävad alles. [MUUDATUSED_V82.md](MUUDATUSED_V82.md).

## V81 – renessansiaja uued kvaliteetsed 3D-hooned
- 51 toetatud hooneliigi jaoks uus renessansiaegne arhitektuur: krohvitud kivimajad, terrakota- ja vaskkatused, sammaskäigud, klaasaknad, tornid, kuplid ja töökohtade erivarustus.
- Raekoda kellatorniga, kupliga ülikool, teleskoobiga tähetorn, trükipressiga trükikoda, kloostri siseõu, kõrtsi silt, vesiveski, tuuleveski ja vankrimeistri vanker.
- Kujutamiseks kasutatakse ühist tekstuuridega geomeetriat ja materjalide kaupa liidetud 3D-pindu, et hoida telefoni GPU koormust kontrolli all.
- **[Ava Päikeselinna renessansiaegne näidislinn](https://orogdor.github.io/Kuningriigid/?v=81-20261020&demo=renaissance)** – 37 hoonet, 35 eri hoonetüüpi, tänavavõrgustik, JSON-i eksport. Näidislinn ei kirjuta sinu päris mängu salvestust üle.
- Kivi-, pronksi- ja keskaegne arhitektuur, V80 teed ja vanad V4 salvestused säilivad. [Muudatused ja testid](MUUDATUSED_V81.md).

## V80 – turvaline tänavavõrgustik ja keskaja näidislinn
- Parandatud V79 probleem: teed ei lähe enam läbi hoonete, treppide ega varikatuste. Sissepääsud ja teeribad järgivad täpsemaid hoone kaitsealasid.
- Majade, töökodade, turu, kaevu ja elamute vahel tekib **ühendatud teede võrgustik**, mitte ainult mõned otseteed. Kulumine kasvab tõelisi läbitavaid marsruute pidi.
- Vanade teede jäljed eemaldatakse automaatselt uute majade alt. Salvestuse V4 formaat ja olemasolevad mängud säilivad.
- **[Vaata uuendatud pronksiaja linna](https://orogdor.github.io/Kuningriigid/?v=80-20261020&demo=bronze)** või **[uut keskaegset näidislinna](https://orogdor.github.io/Kuningriigid/?v=80-20261020&demo=medieval)**.
- Keskaeg (ajastu 3) sai oma 3D-hoonete paketi; rauaaeg (2) jääb eraldi ajastuks. [Täpsemalt](MUUDATUSED_V80.md).

## V79 – pronksiaja majad ja parem teede teke
- **30 uut pronksiaja 3D-hoonemudelit**, eristatavad katuse, savi-/kiviseinte ja tootmisrekvisiitide järgi. Kiviaja mudelid säilivad.
- **[Ava Vaskoru pronksilinn](https://orogdor.github.io/Kuningriigid/?v=79-20261020&demo=bronze)** – 32 valmis hoonet, vanade salvestuste suhtes kirjutuskaitstud näidismäng, päriselt sisse tallatud teerajad, eksport JSON-i.
- Jalgrada tekib nüüd mõõdukama korduva liikluse järel, kestab kauem ja ei jookse läbi hoonete. Ühekordsest sammumisest rada ei teki.
- Loe [MUUDATUSED_V79.md](MUUDATUSED_V79.md).

## V78 – turulkäijate liikumine ja teerajad
- Turul toitu toovad elanikud liiguvad nüüd igal 0,1-sekundilisel mängusammul, mitte hüpetena kord sekundis.
- Jalajälgede kulumine jaotub kõigile tegelikult läbitud navigeerimisruutudele: korduv kõndimine teeb katkematuid radu.
- Ühekordne läbikäimine ei tekita endiselt nähtavat teed, olemasolevad maailmakaardi ühendusteed säilivad.
- Telefonis ja arvutis testitud sujuv turulkäijate liikumine ning teede 3D-kuvamine. [MUUDATUSED_V78.md](MUUDATUSED_V78.md).

## V77 – kiviaja uued 3D-majad
- 13 selgelt erinevat kiviaja ehitist: peamaja, elamu, ladu, kelder, turg, õpikoda, puuraidur, kivimurd, jahimees, kalur, talu, kaev, sõdalaste laager.
- Kõrgema kvaliteediga 3D-kujud, rookatused, puidu-/kivitekstuurid ja erialased rekvisiidid; geomeetria koondatud mobiili jõudluseks.
- **[Ava Kivimetsa kiviaja testlinn](https://orogdor.github.io/Kuningriigid/?v=78-20261020&demo=stone)** otse detailkaardil. Demo ei asenda olemasolevat automaatsalvestust. Salvestuse JSON-i saad mängus menüüst eksportida.
- Muudatused: [MUUDATUSED_V77.md](MUUDATUSED_V77.md).

## V76 – elavad külad ja linnad
- Külaelanikud suhtlevad, käivad külas, istuvad, söövad, puhkavad, kannavad korve ning lapsed mängivad.
- Õhtul süttib lõke, öösel lähevad elanikud koju ja valvurid jäävad patrullima.
- Ohu korral elanikud põgenevad; telefonis piiratakse tegelaste hulka kvaliteediseade järgi.
- Vanad salvestused ja tööliste arvestus ei muutu. [MUUDATUSED_V76.md](MUUDATUSED_V76.md)

## V75 – maailmakaardi objektid detailkaardil
- Külad, varemed, metsad, kaljud ja sillad paiknevad nüüd ka detailkaartidel samade maailmakaardi ruutude juures.
- Kasutatakse samu GLB 3D-mudeleid ja külade/varemete salvestatud olekut, ilma mänguseisu lähtestamiseta.
- Üksikasjad: [MUUDATUSED_V75.md](MUUDATUSED_V75.md).

## V74 – mobiililiides
- Kaardikeskne vaade: suuremad alumise menüü nupud ja vaikimisi peidetud minikaart.
- Linna ehitised kuvatakse mobiilis loetavate kaartidena kahes veerus.
- Avastamine, ressursid, üksused, suumimine ja linna juhtimine avanevad vajaduse korral, ilma kaarti tarbetult katmata.
- Arvutis säilib senine töölaualiides.
- V73 salvestuste parandused: V71/V72 olemasolevad mängud jäävad ühilduvaks; varukoopia ja JSON-i eksport/import.

Testid: `TEST_V74_UI.mjs`, `TEST_V71_UI.mjs`, `TEST_V73.mjs`, `TEST_V72.mjs` ja olemasolevad UI-regressioonitestid. Brauseri mobiiliemulatsiooni edukus ei asenda füüsilise Android-telefoni käsitsi testimist.

Muudatuste üksikasjad: [MUUDATUSED_V74.md](MUUDATUSED_V74.md).
