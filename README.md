# Kuningriigid V76

Eestikeelne (ja ingliskeelne) reaalajas tsivilisatsioonimäng brauseris, mis ühendab maailmakaardi avastamise, linnade ehitamise, teadusarengu, laevastikud ja taktikalised lahingud.

**Mängi:** https://orogdor.github.io/Kuningriigid/?v=76-20261020

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
