# Kuningriigid V223.2 – hõljuvate teede ja jõekallaste parandused

## Millest vead tulid

V223.1 parandas *maanteede* maapinnakontakti, aga jättis alles teise, sõltumatu teedesüsteemi: külade käigurajad ja kulumisjäljed.

- `detail-roads.js` lisas külajalgrajade kõikidele tippudele **+0,30 detailmeetrit**. Pikkade ühenduslõikude vahel oli vaid üks nelinurk, mis võis maastikust lahku tõusta.
- `civilization.js` joonistas külade ümmargusi käimisjälgi **+0,24 detailmeetri** kõrgusele; need olid isegi tasasel maal õhus.
- `continuous-landscape.js` hoidis nähtavat jõepõhja kuni vee *äärmiseni servani* 2,2 m sügavusel, mistõttu veekiht lõppes kõrge, ebaloomuliku lõike kohal. Suudme juurde lisandus ka eraldi vee kõrguse segamisreegel.

## Muudatused
1. `detail-roads.js`: nüüd jagatakse jalgradade ribad kuni 0,48 detailmeetri pikkusteks lõikudeks. Iga tipu Y võetakse **samast renderdatud maapinnast**, mis on kasutusel FPV-vaates; lisanihe vaid **+0,014**.
2. `civilization.js`: ümmargused käimisjäljed langetati **+0,015** kõrgusele. Ebatasase pinnase korral neid lamedaid kettaid ei näidata, et nende servi ei saaks õhus näha; tihedamad pinnast järgivad teeribad jäävad alles.
3. `continuous-landscape.js`: detailkaardi jõe *visuaalne* profiil süveneb keskel, kuid tõuseb kalda eel sujuvalt veepiirini; nähtava rannaserva vee sügavus on 0,06 maailmameetrit. Jõesängi füüsika, jõgede kulg, ületatavus ja salvestusandmed jäävad endiseks.
4. Ühine `visibleRiverHeight()` arvutab nii tegeliku veemudeli kui ka nähtavate kallaste taseme, sealhulgas jõe merre suubumisel.
5. `landscape-polish-v84.js` paigutab jõe ületuskivid sama vee kõrgusega; versioonitud impordid takistavad varasema renderdusmooduli püsimist vahemälus.

## Valideerimine

- Chrome + Three.js: **897 jõelõiku ja 1794 kahepoolset kaldapunkti**: kaldal vee ja nähtava põhja kõrgusvahe mediaan **0,018 detailmeetrit** (alla 2 cm).
- Päris jõe visuaalne mesh 114:102 detailkaardil: 531 mõõdetud kaldapiiri tippu – mediaan 0,0185 ja maksimum 0,166 detailmeetrit, arvestades võrgu diskreetset lõikamist; veepiiri enam järsult sügava oru kohal ei katkestata.
- Lokaalne teeriba: 360 tipu kõrguse erinevus maapinnast 0,014 detailmeetrit (kõigil tippudel, min 0,01399987, max 0,01400014).
- Strateegiline maantee, detailkaart, kiviaja mängu käivitus ja jõe renderdus: **läbisid brauseritestid**; null JavaScripti viga ja null nurjunud võrgupäringut.
- Mõõtmiste alus: tegelik `DETAIL_X=4.5` ja `DETAIL_Z=3.9`. Varasem ühe katse 70 cm kaldavahe hinnang oli vale mõõtkavaga ning sisaldas tegelikku sügavamat jõesängi.

## Piirangud ja jõudlus

- V223.2 ei muuda liikluslogikat, jõe navigatsioonipiire, maailma kaarte ega mängusalvestusi.
- Seadmespetsiifiline mobiilse GPU kontroll vajab kasutaja ekraanivaatlust: testiti Chrome/Three.js-ga nii laua- kui mobiilse ekraani mõõtudes.
- Uued pinnast järgivalt tihendatud teeribad kasutavad rohkem tippe kui V223.1, kuid neid lisatakse ainult siis, kui käigurajad on päriselt tekkinud. Väike kiirtest jääb põhiliseks CI kontrolliks.
