# V341: detailkaardi täisdetailsus järgib kaamerat

## Probleem
Lauaarvutis laaditi detailkaardi avamisel 5×5 ruutu, aga liikudes jäi täisdetailsus sisuliselt 3×3 peale. Põhjus `detail-stream-v242.js` `tick()`-is: töösse võeti ainult ruudud kaugusega ≤1 kesk- või sihtruudust. Välimise rõnga ruudud said aega alles siis, kui kõik lähemad ruudud olid **täielikult** valmis, kaasa arvatud keskruudu kihid, mida naaber ei näita (9×9 horisont, jõed, navigatsioon, teed). Liikumise ajal tekkis pidevalt uusi lähiruute, mistõttu välimine rõngas ei saanud kunagi järge kätte.

## Lahendus (ainult visuaal; simulatsioon ja salvestused muutmata)
- **Täisdetailsuse aken valitakse kaamera järgi.** Iga kaader saab laadija kaamera vaatepüramiidi (`setView`). Alati hoitakse 3×3 naabrust, mis on vajalik sujuvaks ruudult ruudule liikumiseks. Ülejäänud eelarve (kokku 25 ruutu, sama palju kui varem) kulub ruutudele, mida kaamera näeb, lähimad ees. Lauaarvutis võib aken vaatesuunas ulatuda ühe rõnga kaugemale (7×7 piires), selja taha jäävad ruudud eelarvet ei võta. Laaditud ruute eelistatakse, et kaamera liigutamine ei vahetaks valmis ruutu tühja vastu. Telefonis/puutetahvlil jääb 3×3 kulu samaks, aga järjekord seatakse vaate järgi.
- **Prioriteedid:** 0) keskruut ja sihtruut (ületamine ootab neid), 1) vaates olevate ruutude nähtavad etapid, 2) selja taha jäävad naabrid, 3) lähinaabrite keskruudukihid, 4) vaatest väljas olev varueelarve.
- **Ehitusetappide järjekord:** meri ja hooned (mida naabriruut näitab) ehitatakse nüüd enne horisonti, jõgesid, kaljusid, navigatsiooni, teid ja piire (mida näidatakse ainult keskruudul).
- Horisondi auk lõigatakse iga valmis detailruudu alla, mitte ainult 5×5 piires.
- Eelpäring laadib sihtruudu 3×3 naabruse (varem 5×5); laiem ring valitakse pärast ületamist kaamera järgi.
- Vahemälu piir on sama: kuni 7×7 = 49 ruutu.

## Kontrollid
- `tests/detail-stream-v341.mjs`: 25-ruuduline eelarve vaatesuunas, iga vaates olev ruut on valitud, vaates olevad ruudud laaditakse enne varuruute, vastupidine vaatesuund, liikumine üle ruutude, piiratud vahemälu ja telefonis 3×3. Vana koodiga see test kukub läbi (102 puuduvat välisruutu 20 kontrolli peale, uuega 19).
- Vanad testid V242/V319/V320 läbivad. Kohalikus kiirkontrollis läbisid kõik 111 käsku (`v128.yml`).
- Päris mängu brauseritest `tests/detail-stream-v341-browser.cjs`: sama seeme, kaamera liigub detailkaardil põhja suunas, laadija sammud vastavad 60 FPS kaadrieelarvele. Tulemus `reports/detail-stream-v341-browser*.json` ja võrdlus V340-ga `reports/detail-stream-v340-baseline-*.json`:

| Liikumine | V340 täielikult nähtavad välisruudud (16-st) | V341 |
|---|---|---|
| tavakiirus 60 FPS juures | 16 (puud), meri/hooned hiljem | 15,6 |
| Shift 60 FPS juures või tavakiirus 30 FPS juures | keskmiselt 7,3, lõpuks püsivalt **3** | keskmiselt **14,8**, vähemalt 11 |

SwiftShader on tarkvararenderdaja. See test kinnitab laadimise käitumist, mitte riistvara FPS-i. Uus töövoog `.github/workflows/detail-stream-v341.yml`.
