# V341 raport: mis võib veel FPS-i ja laadimisaega piirata

Selle raporti leide **ei ole muudetud**. Allikad:
- `reports/perf-survey-v341.json`: `tests/perf-profile-v341.cjs`, Chrome'i CPU-profiil päris mängust.
- `reports/detail-stream-v341-browser.json`: laadimisetappide ajad.
- Koodi ülevaatus.

Mõõdetud on SwiftShaderiga, mis on tarkvaraline WebGL ja kus GPU töö jookseb protsessoril. Kaadriajad ei ole seetõttu riistvara FPS. JavaScripti osakaalud ja etappide ajad on siiski usaldusväärsed. Prioriteet on hinnang.

## A. Detailkaardi hakkimine ja laadimine

1. **Üks laadimissamm võib kesta 60–370 ms** (suur). Laadija kontrollib 11 ms eelarvet ainult sammude vahel. Mõõdetud pikimad üksiksammud: maastik 110 ms, navigatsioon 138 ms, ressursid 105 ms; V340-s horisont 373 ms ja jõed 154 ms. Iga selline samm on ühe kaadri nähtav nõks. Väiksemad sammud oleksid vajalikud maastiku/jõe võrgu ehitamisel ja `prepareNavV242`-s.
2. **Umbes 65% ühe ruudu ehitusajast läheb kihtidele, mida kasutab ainult keskruut** (suur). Ruudu kohta keskmiselt: jõed 45 ms, horisont 28 ms, navigatsioon 32 ms, maastik 37 ms, meri 8,5 ms. Jõed, 9×9 horisont, teed ja piirid on `decor`-is ning nähtavad ainult keskruudul. Neid ehitatakse siiski kõigile kuni 49 vahemälus olevale ruudule. V341 lükkab need järjekorras tahapoole, aga ei jäta neid ära. Kui need ehitada ainult siis, kui ruut võib saada keskruuduks, väheneks taustatöö umbes kolm korda.
3. **Laadimise eelarve on lauaarvutis 11 ms kaadri kohta** (keskmine). 60 FPS juures jääb ülejäänud mängule ja joonistamisele 5,7 ms, nii et laadimise ajal langeb FPS paratamatult. Eelarvet võiks siduda tegeliku kaadriajaga.
4. **Loogika jookseb ka kaadritel, mida FPS-piirang ei joonista** (keskmine kuni suur, kui ekraan on üle 60 Hz). `frame()` teeb igal `requestAnimationFrame`-il simulatsiooni, laadija `tick()`-i (kuni 11 ms), `syncLocal()`-i jne, ning alles lõpus kontrollib `canRender`. 144 Hz ekraanil 60 FPS piiranguga tehakse laadimis- ja sünkroonimistööd 2,4 korda rohkem, kui kaadreid näidatakse.
5. **`refreshStreamHoldersV242()` töötab igal kaadril** (väike kuni keskmine). Iga nähtava naaberruudu kõik hooned (`buildings.includes` → O(n²)) ja kõik ressursid (mõõdetud 1184 ressurssi 36 ruudus) käiakse läbi igal kaadril, lisaks maski string. Seda võiks teha ainult muudatuse korral või harvemini.

## B. Joonistamine
6. **Maailmakaardil 356 joonistuskutset, 2,76 M kolmnurka, 3978 nähtavat võrku, millest 3808 on instantsvõrgud (43 000 instantsi), ja 554 varjuheitjat** (suur GPU-l). Väga palju väikesi instantsvõrke. Liitmine vähemateks partiideks ja kauguse järgi peitmine aitaks.
7. **Detailkaardil 192 kutset, 0,9 M kolmnurka, 10 400 instantsi.** Vaikimisi profiil on „high“: MSAA, 100% resolutsioon, keskmised varjud (1024², PCF). `pixelRatio` võib olla kuni 2 × resolutsioon. Kõrge DPI-ga ekraanil on see neli korda rohkem piksleid.
8. **`applyMaterialEngine()` käib iga 4 s läbi mõlema stseeni kõik objektid** (väike kuni keskmine, perioodiline nõks). `graphics-runtime-v226.js` `afterRender` kutsub seda iga 4 sekundi järel ka siis, kui midagi pole muutunud. Suure maailma puhul on see regulaarne nõks.
9. **Lokaliseerimine (`translateEstonian` regex) on igas profiilis 0,5–0,8%**, ka siis, kui mäng seisab. DOM-i tõlkimine käivitub UI uuendusega pidevalt.

## C. Laadimisaeg
10. **Uue maailma käivitus võttis umbes 24 s, millest `hashV278` võttis 6,5 s (27%)** (suur). See on rannajoone väänamise siinuspõhine räsi, mida kutsutakse iga kõrgusproovi jaoks mitu korda. Järgnevad `memoHeight` 2,2 s, `riverNear` 1,7 s, `Civilization.noise` 0,9 s ja `continent-map distance` 0,8 s. Täisarvuline räsi või ruudustiku eelarvutus võiks käivitust märgatavalt lühendada.
11. **`memoHeight` loob igal kutsel uue revisjonistringi** (`terrainRevision+':'+crossingRevision`) ja kasutab kahetasandilist `Map`-i. 2,2 s käivituse ajast kulub vahemälule, mis peaks aega säästma.
12. **Maailmakaardi esimesel salvestamisel pakib `pako` genereeritud maailma põhilõimes**: 15 s mõõtmise jooksul umbes 4,5 s (`generated-world-v331.js` `packedWorld`, tükkide vahel antakse küll aega). V338/V340 salvestus-Worker seda tööd ei tee. Selle viimine Workerisse eemaldaks uue mängu alguse nõksud.
13. **V340 katse lipud.** `EAGER_MODULES_V340=true` laadib 35 demomoodulit alati enne mängu. `USE_TERRAIN_CACHE_V340=false` lülitab maailmakaardi maastiku vahemälu välja. Mõlemad pikendavad käivitust seadmetel, kus V336 vahemälu muidu toimiks. Mõju vajab võrdlust sama salvestusega.
14. **Käivitusel laaditakse 434 faili (10,2 MB)**, sh Google Fontsi CSS (329 ms) ja HUD-i pildid. Kohalikus EXE/APK-s pole võrk probleem, veebis on.

## Soovitatud järgmine järjekord
1. Punkt 2: keskruudukihid ainult võimalikele keskruutudele. See on suurim võit laadimisele.
2. Punkt 1: pikad üksiksammud tükeldada. Kõrvaldab nõksud.
3. Punkt 4: loogika vahelejätmine joonistamata kaadritel.
4. Punkt 10/11: käivituse räsi ja kõrguse vahemälu.
5. Punkt 12: maailma pakkimine Workerisse.
6. Punkt 6: maailmakaardi instantsvõrkude liitmine.

Riistvara FPS tuleb mõõta kasutaja seadmel sama salvestusega (graafikaseadetes „FPS ja renderdusstatistika“).
