# Kuningriigid V248 – loogiline maailmakaart (laamad ja kliima)

## Uus kaarditüüp
Menüüs „Uus mäng → Maailma tüüp“ on uus vaikevalik **„Loogiline maailm: laamad ja kliima (uus)“** (`type:'tectonic'`, `geographyVersion:5`). Iga seeme annab endiselt oma kindla kaardi. Vanad kaarditüübid ja salvestused ei muutunud.

Generaator on failis `world-tectonic-v248.js` ja loob kogu kaardi korraga:
1. **Laamad.** Kaardil on 9–14 laama, mis kasvavad müraga üleujutustäitena, seega on piirid sakilised. Osa laamu on mandrilised, osa ookeanilised, ja iga laam liigub oma suunas. Mandrilised laamad valitakse enamasti üksteisest eraldi, nii et tekib 2–5 maismaad. Mõnikord kaks mandrit liituvad ja nende liitekohta tekib kõrge mäeahelik.
2. **Mäed.** Need tekivad laamade kokkupõrkel:
   - kaks mandrit põrkuvad: lai ja kõrge mäeahelik;
   - ookean läheb mandri alla: rannikuahelik ja süvik;
   - kaks ookeani põrkuvad: saarteahelik;
   - laamad lahknevad: riftiorg.
3. **Rannajoon.** Suur moonutatud müra lõikab mandritesse lahtesid, sisemeresid ja poolsaari, nii et rannik ei järgi laamapiiri. Kaardi serva poole jääb ümar maailmameri. Maad on umbes 36% ja läbimatuid mägesid umbes 6% maast.
4. **Erosioon.** Vesi voolab allamäge (ka nõod täituvad ja voolavad üle), uuristab orge ja jätab tasandikke. Liiga järsud astmed varisevad.
5. **Kliima.** Temperatuur sõltub laiuskraadist ja kõrgusest. Sademed tulevad tuulevöönditega: passaadid, läänetuuled ja polaarsed idatuuled. Mäed jätavad enda taha vihmavarju ja rannik on niiskem kui sisemaa. Niiskuse järgi määratakse nii välimus (`visualBiome`) kui ka mängu mets või tasandik. Polaaralade piir on sakiline ja mägedes on külmem.
6. **Stardikohad.** Need on parasvöötmes, suurel maismaal, mitte mäel ja võimalikult eri mandritel. Seejärel valib senine `chooseCoastalStarts` nende lähedalt rannikukoha.

## Ajutine nupp: kogu kaart
Peamenüüs on nupp **„🗺 Kogu kaart: nähtav (udu väljas)“** (`#reveal-v248`), mis on vaikimisi sees. Vajutus lülitab udu sisse või välja ja laadib lehe uuesti. Valik salvestub `localStorage` võtmesse `kingdoms-reveal-v248`. Kui nupp on sees, loeb mäng mängija jaoks kõik lahtrid avastatuks (`seen()` ja `VisionDelta`). Seega pole maadeavastajatel midagi avastada. Nupp on ajutine ja eemaldatakse pärast kaardi ülevaatust.

## Tööriistad
- `node tools/preview-world-v248.mjs out.png 1 2 3`: generaatori kaardid pildina, ilma mänguta.
- `node tools/check-world-v248.mjs [out.png] 11 22 33`: loob päris mängu (`Civilization`) ja kontrollib, et stardikohad on maal, mitte mäel ning ulatuvad jalgsi vähemalt 150 lahtrini. Väljastab biomide jaotuse.

## Kontrollid
- `tools/check-world-v248.mjs`: 16 seemet, kõik mängitavad. Ühe maailma loomine võtab umbes 1,5–2 s.
- Vanade kaarditüüpide lahtrite räsi on enne ja pärast muudatust sama (`continents` 5932019 ja 123, `inland` 77). Sama tektooniline seeme annab alati sama kaardi.
- Brauser (WebGL): uus mäng uue tüübiga, udu väljas, maailmakaart ja minikaart näitavad tervet maailma, vigu pole.
- `node scripts/test.mjs traffic`: PASS.

## Teadaolevad küsimused
- Stepp on 26–31% maast. Mandrite sisemaa on kuiv, nagu päriselt, aga seda võib olla liiga palju.
- Maailma loomine võtab Node'is umbes 1,5 s, millest generaator ise umbes 0,2–0,5 s. Ülejäänu on olemasolevad sammud (detailid, ressursid).
