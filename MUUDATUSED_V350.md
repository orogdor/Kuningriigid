# V350 – kasutajaliides kirjutab DOM-i ainult muutuse korral

Kasutaja palus uurida, kuidas saaks UI kiiremaks, nii et see ei hoiaks mängu FPS-i tagasi, ja seejärel panna parandused peavoogu. Välimus ja käitumine on samad; muutus on selles, kui tihti UI brauserit tööle sunnib.

## Mis leiti (V348/V349)

Mõõdetud päris mängus Chrome'is, uus mäng (kiviaeg), 3D-joonistamine pärast käivitust välja lülitatud, et näha ainult UI kulu põhilõimes (`tests/ui-cost-v350-browser.cjs`).

- `frame()` kirjutas igal kaadril kolm väärtust ka siis, kui need ei muutunud: päevakella `title`, käigukella `#clock` väärtuse ja `#buildhint` peidetuse.
- Iga selline kirjutus on DOM-muudatus. `localization.js` vaatleja tõlkis eestikeelse `title` inglise keelde, järgmine kaader kirjutas mäng eestikeelse tagasi. Tõlkija käivitus kaks korda kaadris.
- `ui-art-v263.js` vaatleja reageeris igale muudatusele kogu lehel, käivitas `decorate()` ja küsis iga kord `getComputedStyle`. `classList.add` juba olemasoleva klassiga tekitas 16 nupul iga kord uue muudatuse.
- `ui-v304.js` (`update`, iga 500 ms) ja `ui-v306.js` (`sync`, iga 500 ms) kirjutasid kõik tekstid ja sildid üle ka siis, kui väärtus oli sama.
- Tulemus: detailkaardil arvutati stiil ümber igal kaadril, kuigi ekraanil ei muutunud midagi.

## Muudatused

1. **`civilization.js`, `frame()`**: päevakella `title` kirjutatakse üks kord; käigukell kirjutatakse veerandsekundi sammuga (riba on 60 s pikk, samm on 0,4% laiusest); `#buildhint` peidetakse ainult siis, kui see on nähtaval.
2. **Uus `ui-write-v350.js`**: abifunktsioonid `text`, `attr`, `prop`, `data`, mis kirjutavad ainult siis, kui soovitud väärtus erineb eelmisest soovist. Kui tõlkija või mõni teine skript on elementi vahepeal muutnud, jätab abi esimesel kordusel selle seisu meelde ega kirjuta üle; kui element hiljem sellest erineb, kirjutatakse soovitud väärtus uuesti.
3. **`ui-v304.js` `update()` ja `ui-v306.js` `sync()`** kasutavad neid abifunktsioone. Ilma abifailita (vanad eelvaatelehed `tests/ui-v306-preview.html` jt) töötavad vanad otsekirjutused.
4. **`ui-art-v263.js`**: vaatleja ei reageeri muudatustele `#v304-hud`, `#resources`, `#dayclock-v235`, `#toast` ja `#clock` sees (seal pole ühtegi kaunistatavat nuppu, ehituskaarti ega portreed). `getComputedStyle` tehakse üks kord. Klass, portree peidetus ja portree lipp kirjutatakse ainult muutuse korral.
5. **`localization.js`**: `translateEstonian` aeglase tee tulemused jäetakse meelde (kuni 4000 teksti, täitumisel tühjendatakse). Tõlge sõltub ainult tekstist, tulemus on sama mis enne.
6. Versioon V350: pealkiri, menüü silt, `boot-v83.js?v=350a`, `civilization.js?v=350a`, `ui-v304.js`, `ui-v306.js`, `ui-art-v263.js`, `localization.js` vahemälu võtmed.

## Mõõtmine

15 sekundit, 1600×900, Chrome SwiftShader, 3D-joonistamine välja lülitatud. „Enne“ on kaks V348 jooksu (UI-failid on V349-s samad). Ajad on selle masina põhilõime ajad, mitte riistvara FPS.

| Detailkaart, 15 s | Enne | V350 |
|---|---:|---:|
| DOM-muudatusi | 9802–9916 | 2651 |
| Stiili ümberarvutusi | 885–923 | 68 |
| Stiili arvutamise aeg | 267–367 ms | 43 ms |
| Värvimisi (Paint) | 396–415 | 68 |
| Tõlkija käivitusi | 1838–1913 | 87 |
| Tõlkija aeg | 174–527 ms | 17 ms |
| `ui-art-v263` aeg | 66–98 ms | 4 ms |

| Maailmakaart, 15 s | Enne | V350 |
|---|---:|---:|
| DOM-muudatusi | 8556–8892 | 2670 |
| Stiili ümberarvutusi | 108–113 | 67 |
| Värvimisi (Paint) | 358–360 | 30 |
| Tõlkija aeg | 185–204 ms | 27 ms |
| `ui-art-v263` aeg | 63–73 ms | 5 ms |

## Kontroll

- Uus `tests/ui-writes-v350.mjs` (lisatud kiirkontrolli): abifunktsioonid ei kirjuta korduvat väärtust, ei võitle tõlkijaga, parandavad võõra muudatuse; `update()`/`sync()` ei sisalda tingimusteta kirjutusi; tõlke vahemälu annab samad vastused ka pärast tühjendamist.
- Kiirkontroll (`.github/workflows/v128.yml`): 121 käsku läbisid kohapeal.
- Päris mäng Chrome'is, V349 ja V350 kõrvuti sama stsenaariumiga (algus, paus, jätka, armee valik, detailkaart, ehitusvaade): HUD-i nähtavad tekstid, sildid, pildid ja olekud olid kõigis kuues sammus identsed (numbrid maskeeritud), ekraanipildid samad, käigukell liigub, vigu konsoolis ei olnud.

## Tegemata ja teadmata

- **Riistvara FPS on mõõtmata.** Põhilõime UI kulu oli selles testis enne umbes 1 ms kaadri kohta; V350 võtab sellest suurema osa ära, aga see üksi ei seleta suurt FPS-i langust brauseris. HTML-kihi kokkupanek 3D-pildiga videokaardil on mõõtmata.
- **Mõõdetud on mängu algus**, mitte suur riik. Kasutaja 94. käigu salvestusega on mõõtmata.
- **`renderUI()` kirjutab iga 0,8 s järel endiselt osa tekste tingimusteta** (`#resourceoverlay`, `#selectarmy`, `#autoexplore` jt, umbes 40 muudatust korraga) ja `ui-v264.js` ehitab ressursiriba kiibid iga kord uuesti (323 muudatust 15 s kohta). Järgmine samm oleks tõlkida tekst enne DOM-i kirjutamist ja uuendada kiipe paigal.
- **12 UI taimerit on alles.** Mõõtmisel kulutasid aega ainult `ui-v304` ja `ui-v306` (kokku umbes 1,3 ms sekundis); vanade HUD-ide taimerid naasevad V304 režiimis kohe. Üheks signaaliks liitmist ei tehtud.
- **39 CSS-faili ja 28 UI-skripti** on alles; ühtseks kihiks liitmine on eraldi suurem töö.
- Ehituskaartide `v263-art` kaunistust ei saanud brauseris kontrollida, sest testmängus polnud veel linna; see koodiosa on muutmata, muutus ainult see, millised muudatused vaatleja käivitavad.
