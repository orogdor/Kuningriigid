# Kuningriigid V78 – turulkäijate sujuv liikumine ja teerajad

## Parandatud vead

**1. Turul käivad inimesed hüppasid.** Seni kutsuti `tickMarketHouseholds()` välja vaid kord mängusekundis, parameetriga `dt ≈ 1`, mistõttu 3 m/s kõnnikiirusega inimest nihutati ühe renderdusetapi jooksul umbes 3 meetrit. Kuigi ülejäänud mäng simuleerib 0,1 s samme, liikusid turulkäijad seal eraldi harva.

V78 kutsub turulkäijate liikumisloogikat nüüd välja **igal simulatsioonisammul** ning kasutab päris `dt`-d. Sama sihtpunktide, toidu ja vee kohaletoimetamise ning kodu-turg-kodu marsruudi loogika säilib.

**2. Teerajad olid kohati katkised.** `Navigation.move()` suurendas jalajälgede kulumist ainult liikumissammu lõpus oleval ruudul. Pikemal liikumisel võis tegelane astuda üle mitme navigeerimisruudu nii, et vahepealsed ruudud kulumisest osa ei saanud.

V78 `recordTraffic(from,to)` arvestab iga tegelikult läbitud lõigu kulumist 0,38 m või lühemate alalõikude kaupa. Soovitud kulumistase ei muutu: **ühekordne läbikäimine veel nähtavat teed ei tekita**. Korduv läbikäimine tekitab sidusaid kohalikke jalgradu. Maailmakaardi teede lävendid jäävad samaks ning mängija üksused saavad olemasolevaid teid kasutada senise 1,5× liikumisboonusega.

## Testitulemused

GitHub Actions `TEST_V78.mjs`:
- 1570 simulatsioonisammu, maksimaalne 0,45 m ühe 0,1 sekundi jooksul (sisaldab 1,5× teekiirust).
- Esimese läbikäimise järel nähtavaid teid ei tekkinud.
- 9 edasi-tagasi käigu järel 33 läbitava ruudu hulgast oli 33 kulumisega jalajälje ruutu; kontrolliti, et marsruudil ei tekkinud tühimikke, ja loodi 64 kolmnurgaga 3D-teeriba.
- Maailmakaardi naaberruutude vahel ei tekkinud teed pärast ühte läbikäimist, korduva liikluse järel tekkis tee.
- V77 Kivimetsa linnas katsetati 3 elanikku ja 460 simuleeritud kaadrit: 1377 sujuvat liikumissammu, maksimaalne vahemaa 0,45 m ja 142 mõjutatud teeruudukest.

Chromiumi testid `TEST_V78_UI.mjs`: telefon püsti (390 × 844), telefon rõhtsalt (844 × 390), arvuti (1440 × 900). Igas vaates:
- kolm turul käivat inimest läbisid kokku 1347 animatsioonisammu **ilma ühegi teleportimise / järsu hüppeta**;
- linnakaarte jäljed tekkisid 148–152 ruudul, neist 6 olid juba nähtavad jalgrada (vähemalt lävend 6) ja nähtav 3D-teeriba koosnes 10 kolmnurgast;
- kõik V77 15 näidishoone 3D-mudelit säilisid.

Lisaks läbitud V77 mudeli-, V76 külainimeste, V75 maailma/detailkaartide ning V73 salvestuste testid.

## Salvestused

Salvestusvorming jäi `version: 4`. Teede kulumine salvestatakse olemasolevatesse `world.heat`, `heatLast` ja `trailChanges` väljadele. Vanad teed, linnad, töölised, transpordid ja varukoopiad säilivad.

## Mängu lingid

- Tavaline mäng: https://orogdor.github.io/Kuningriigid/?v=78-20261020
- Näidislinn: https://orogdor.github.io/Kuningriigid/?v=78-20261020&demo=stone

Märkus: Chromiumi tarkvaraline WebGL ei ole füüsilise Androidi GPU jõudlustest.
