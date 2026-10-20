# Kuningriigid V80

Eestikeelne (ja ingliskeelne) reaalajas tsivilisatsioonimäng brauseris, mis ühendab maailmakaardi avastamise, linnade ehitamise, teadusarengu, laevastikud ja taktikalised lahingud.

**Mängi:** https://orogdor.github.io/Kuningriigid/?v=80-20261020

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
