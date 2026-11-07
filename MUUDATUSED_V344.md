# V344: ümarad, laienevad jõesuudmed

Kasutaja soov: jõesuudmed peavad laienema – jõe lõpu kaldad lähevad üle mererannaks ja keeravad siis piki maismaad, nagu õpikupildil suudmest ja deltast. Varem kohtusid jõekallas ja rannajoon järsu, peaaegu täisnurkse nurgaga.

Alus: main `7fafb1c` (V343).

## Muudatus

- Suudme kuju on kahe veekogu sujuv ühend (smooth union): kaugus jõe kaldast ja kaugus rannajoonest. Seal, kus mõlemad on lähedal, langetatakse maapinda täpselt nii palju, et rannajoon nihkuks ümara kaarena välja. Kallas keerab jõest välja ja jätkub rannana; rannanõlv jääb looduslikuks.
- Kaare suurus sõltub jõe laiusest rannal: `k = 2 × laius + 28`, piirides 32–80 maailmameetrit. Väike jõgi saab umbes poole detailruudu suuruse lahe, suur jõgi suurema.
- Igale suudmele mõõdetakse üks rannanõlv mõlema kalda kõrvalt. Punktipõhine kalle muutuks atlase ruudu piiril järsult ja jätaks ruudukujulisi laike.
- Muudetakse ainult madalat rannamaad (alla 4,7 m). Künkaid ja kaljusid ei lõigata. Meresügavus lahes on kuni 1,2 m (madal rannavesi), merepõhja sügavamaks ei kaevata. Mõju lõpeb, kui punkt ei ole lähedal korraga nii jõele kui ka rannale.
- Detailkaardi meri kasutab sama kõrgust (`localNaturalSeaGroundV322` → `estuaryShoreHeightV323`), seega meri täidab lahe. Maailmakaardil lubab `atlasSeaGeometryV326` merd ka lahes ning `naturalAtlasHeightV327` võtab lahe kuju joonistatud maastikult.
- Lahe sees ei ole jõe kaldavalli ega mudariba. Puid, rohtu ja põõsaid lahte ei panda.
- Kui suue ulatub jõe enda otsinguraadiusest kaugemale, rakendatakse kaart ikkagi. Ilma selleta tekkis ruudupiiril järsk aste.

## Mis ei muutunud

- Füüsiline maastik, `riverNear()` laiused, koolmed, navigatsioon, ehitamise reeglid ja salvestus on V343-ga bitti-bitti samad. Test võrdleb 6760 punkti kontrollsummat main-i omaga.
- Mängureeglid, mudelid, jõe veematerjal ja sisemaa jõed on muutmata.
- Visuaal ja füüsika erinevad ainult lahe madalas osas: seal on endine kuiv rannamaa nüüd madal vesi. Üksus saab seal endiselt käia ja paistab vees kahlavat.

## Failid

- `continuous-landscape.js`: `estuaryMouthsV344`, `estuaryFlareV344`, `smoothUnionCutV344`, `flareRadiusV344`. `estuaryShoreHeightV323` rakendab kaare. `worldElevation(…, true)` ei tee lahte kaldavalli ja rakendab kaart ka väljaspool jõe raadiust.
- `continuous-landscape-visual.js`: muda/kruusa kaldaribad hääbuvad lahes.
- `atlas-sea-v326.js`: maailmakaardi meri täidab lahe. Proovimängu objektil (ilma `cells`-ita) ei kutsuta.
- `civilization.js`: maailmakaardi maastik järgib lahte; detailkaardi puud ja rohi ei kasva lahes.
- `terrain-cache-v336.js`: atlase vahemälu võti `v344-1`, et vana kujuga maailmakaarti ei laaditaks.
- `index.html`, `boot-v83.js`: V344 ja muudetud moodulite `?v=344a`.
- `tests/river-mouth-flare-v344.mjs` (uus, ka `.github/workflows/v128.yml`-is). `tests/world-assets-v327.mjs` ootab nüüd `atlas-sea-v326.js?v=344a`.

## Kontrollid

- `tests/river-mouth-flare-v344.mjs`, seemned 77, 12345 ja 20261103 (loogiline maailm): kõik 160 suuet avanevad. Maapind ainult langeb ja mitte üle 1,2 m alla veepiiri. Üle 4,7 m maad ei muudeta ning kaugel suudmetest muutusi pole. Suurim 1 cm sammuga kõrgusemuutus 0,015 m (lävi 0,15). Detailmeri ja kallas kasutavad täpselt sama kõrgust. Salvestus on puutumata ja füüsiline kontrollsumma võrdub V343 omaga.
- Mängu pildid peata Chrome'is (SwiftShader), sama seeme `joesuue344` ja samad neli suuet enne/pärast: vt PR-i kirjeldus.
- Jõudlus: joonistatud maastiku arvutus suudme ümbruses (120 000 punkti) 1474 → 1700 ms (+15%). Mujal muutust pole, sest suudmeta ruutudel jääb järele ainult ruudu nimekirja kontroll.

Avaldamine: arendusharu `feature/river-mouth-flare-v344`.
