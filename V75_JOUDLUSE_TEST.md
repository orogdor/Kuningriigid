# Kuningriigid V75 – 3D-objektide suuruse ja jõudluse test

**Testitud:** 2026-10-20, GitHub Actions [testiring #39388369228](https://github.com/orogdor/Kuningriigid/actions/runs/39388369228). Töövoo `v75-performance-measurements` artifaktis on `results.json` ja võrdluskuvatõmmised.

## Mõõtmiskeskkond
- Chromium + Playwright, ANGLE/SwiftShader tarkvaraline WebGL GitHubi Linuxi testimasinas.
- Vaated: telefon püsti **390 × 844** (DPR 2), telefon rõhtsalt **844 × 390** (DPR 2), arvuti **1440 × 900**.
- Graafika: telefonil säästlik, keskmine ja kõrge; rõhtvaates keskmine; arvutil keskmine ja kõrge.
- Iga mõõtmise korral vaadati sama küla stseeni nii V75 3D-objektidega kui ka ilma nende objektideta. Frame-time on 23 kaadri mõõtmise keskmine. Võrdluse eesmärk on **suhteline lisakoormus**, mitte päris Androidi FPS.
- Varasema kaadriajastuse vea vältimiseks oodati nüüd enne mõõtmete kontrolli, kuni kaamera on detailvaate asendis.

## Objektide tegelik geomeetria

Ühe detailruudu suurus on **150 × 130** mänguühikut. Mudelid on kõik 3D-mudelid; minimaalne/ maksimaalne vaadeldud ruudu jalajälg oli **19–35%** vastavast küljest (pööramisest sõltuvalt). Läbitud on 15 objekti-suuruse kontrolli, kõik viis liiki kõigis kolmes vaates.

| Objekt | Kolmnurki | Püsttelefoni kuvatud mõõt, px (ühes proovistseenis) | GLB faili suurus |
|---|---:|---:|---:|
| Küla | 712 | 377 × 273 | 22 148 B |
| Varemed | 804 | 286 × 248 | 22 328 B |
| Kivipaljand | 720 | 249 × 195 | 17 456 B |
| Metsakogumik | 1 244 | 290 × 257 | 24 980 B |
| Sild | 588 | 193 × 128 | 17 076 B |

Kõik viis GLB-faili on kokku **103 988 baiti** (~102 KiB). Mudelite väiksus ei tähenda iseenesest väikest ekraanile projitseeritud kuju.

**Suuruse tähelepanek:** küla projektsioon võttis ühes püsttelefoni stseenis 377 / 390 = 97% ekraani laiusest. See pole ruudu geomeetria viga, vaid kaamera lähivaate ja mudeli koosmõju. Mobiilis tasub kaaluda esialgset detailkaardi kaamera kaugendamist või küla ja varemete visuaalse suuruse vähendamist; mõõdetud kuvatõmmiste põhjal vajab lõplik otsus ka visuaalset kontrolli füüsilisel telefonil.

## Stseeni WebGL-koormus ja FPS (tarkvaraline renderdus)

Mõõdetud ühe küla lisamine: **+8 draw call'i ja +712 kolmnurka**. Püsttelefoni keskmise kvaliteedi stseenis oli kogukoormus 199 renderduskutset ja 206 428 kolmnurka. Küla geomeetria lisas sellest vaid **0,34% kolmnurkadest** ning umbes 4% renderduskutsetest.

| Vaade | Kvaliteet | Objektidega FPS | Objektideta FPS | Lisandunud kutsed |
|---|---|---:|---:|---:|
| Telefon 390 × 844 | Säästlik | 8,3 | 9,6 | +8 |
| Telefon 390 × 844 | Keskmine | 6,3 | 6,9 | +8 |
| Telefon 390 × 844 | Kõrge | 4,6 | 4,7 | +8 |
| Telefon 844 × 390 | Keskmine | 3,5 | 3,6 | +8 |
| Arvuti 1440 × 900 | Keskmine | 2,6 | 2,5 | +8 |
| Arvuti 1440 × 900 | Kõrge | 2,0 | 2,0 | +8 |

**Neid FPS-numbreid ei tohi esitada tegeliku telefoni või arvuti jõudlusena.** Tarkvaraline WebGL testimasinas on võrreldes GPU-ga kunstlikult aeglane; ka mänguseis ja jooksude arv muudavad tulemusi. Mõnes katses oli objektidega hetkeline FPS isegi kõrgem kui objektideta, mis viitab mõõtemürale. Usaldusväärne tehniline fakt on samas stseenis erinevus **+8 draw call'i / +712 kolmnurka**.

## Järeldused ja järgmised paranduskohad
1. Objektide geomeetria on suhteliselt kerge (588–1 244 kolmnurka); nende olemasolu ei seleta kogu detailkaardi renderduskulu.
2. Küla on püsttelefoni lähivaates liiga domineeriv, seda tuleks võrrelda soovitud mängukaardi nähtavusega.
3. Mobiili graafikaseade `low` vähendab arvutatud pikslite hulka (benchmarkis 331 × 717 vs `high` 624 × 1350) ja säästab renderdust. Füüsilise Androidi jaoks tuleks mõõta fps ja kaadri p95 eraldi.
4. Kui on vaja vähendada uute GLB-mudelite draw call'e, saab koondada iga sama materjaliga külamudeli osad üheks mesh'iks; enne muutmist säilitada varjud, värvid, orientatsioon ja V75 ekraanitestid.
5. V75 olemasolevad objektide vastavuse ning V73 salvestuste testid läbivad kontrolli. Salvestusvorming ja mänguloogika pole selle testitööga muutunud.

**Piirang:** kasutaja füüsilisele Android-telefonile ega arvutile ei olnud võimalik testi automaatselt käivitada; ühendatud Desktop Commander arvuti oli kontrolli ajal offline.
