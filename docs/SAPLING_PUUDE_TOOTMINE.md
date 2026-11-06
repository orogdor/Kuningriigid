# Sapling puude arendusharu

Staatus: visuaalset heakskiitu ootav katse, draft PR #49. Põhimängu puud ei ole asendatud.

## Korratav tootmine

- Blender 5.2.3 LTS, allalaadimine blender.org serverist SHA256 kontrolliga.
- Sapling Tree Gen **1.0.0**, lähtekood `meet-brad-ch/add_curve_sapling` commit `2fa50a8f6a5f1a9485bdc394c30c81d971dc751f`. GitHub Releasesi vana 0.4.0 paketti ei kasutata.
- `.github/workflows/sapling-trees.yml` käivitub ainult arendusharus `experimental/sapling-trees-30`.
- `tools/trees/generate.py` loob parametrilise puu, säilitab Saplingu jämedamate oksakõverate täispikkused, lisab 4-osalise RGBA lehestikuatlasega kaardid ja ekspordib GLB.
- Viis varianti: eri seemned, kõrgused, külgokste pikkused, tüve jämedused ja palja tüve proportsioonid. `recipe.json` salvestab kõik tegelikud parameetrid. Pärna retsept on muudetud ümara võra ja südamekujulise lehe jaoks; kuusel kitsam, madalalt algav võra; palmil kitsad lehekesed radiaalsetel harudel.
- Kõik eelvaated ja impostorid renderdatakse **uuesti imporditud near.glb-st**, mitte illustratsioonist.
- Iga puu: `near.glb`, `mid.glb`, `far.glb`, `source.blend`, `recipe.json`, `report.json`, 8 külgvaadet, pealtvaade, impostori atlas ja `preview.png`.
- `far.glb`: kaks ristuvat tekstuuriga siluetti + pealtvaate kaart, 6 kolmnurka. Kaheksa vaadet on atlasel, kuid käesolev ristkaart kasutab neist kahte. See ei ole veel kaheksasuunaliselt vahetuv billboard.

## Kontrollid

`validate.py`: binary GLB päised/pikkused, lõplikud indeksid ja koordinaadid, tegelikud kolmnurgad, SHA256, maandatud near/mid, sisseehitatud pildid, kaugmaterjali alpha-mask ja mittetühi läbipaistev impostor. Khronose glTF validaator annab eraldi vead ja hoiatused.

`test-placement.mjs`: 12000 deterministlikku paigutust, ühise world/detail koordinaaditeisenduse pööratavus ning päris InstancedMeshi maatriksi adapter.

`experiments/sapling-trees/benchmark.cjs`: 300/3000/12000 puud, kolm kaamerakaugust, soojendus ning 5-sekundiline mõõteaken; aeglasel tarkvaralisel GPU-l oodatakse kuni 10 sekundit juurde, et koguda vähemalt viis kaadrit. Raportis on tegelik kaadrite arv ja `lowSampleCount`; väikese valimi p95 on ebatäpne. Salvestab FPS, keskmine/p95 kaadriaeg, draw calls, triangles, heap (kui API on olemas), Three.js ressursiloendurid ning geomeetria/tekstuuride/instantsmaatriksite mäluhinnangu. VRAM-i täpset kulu WebGL avalik API ei anna.

Actions kasutab **SwiftShader tarkvaralist GPU-d**. Selle FPS pole telefoni ega kasutaja RTX 2080 Superi tulemus. Mõõda sama testvaadet päris seadmes ja salvesta JSON nupuga.

## Paigutus ja integratsiooni piir

`experiments/sapling-trees/forest.js` kasutab olemasolevat `forest-clumps-v270.js` välja. `placementsFromInstances()` võtab vastu mängu olemasoleva metsa instantsid; `projectPlacements()` projitseerib sama maailmakoordinaatide loendi detailvaatesse. LOD ei muuda puude asukohti. Katsemetsad kasutavad eraldi kontrollitavat kandidaatide loendit sama alusvälja peal.

Põhimängu `atlas-biomes-v47.js`, `spatial-batches-v86.js`, `world-details.js` ja käivitaja jäid puutumata. Adapteri olemasolu ei tähenda, et uus mets oleks mõlema päris mängukaardi renderduses juba ühendatud. See samm järgneb visuaalsele heakskiidule. CCORE tööriistade töövoog säilib väikeobjektidele.

## Litsentsid

Saplingu lähtekood GPL-3.0-or-later; kaasasolevate tree-gen preset'ide päistes on GPL-3.0-only. Töövoog laeb need algallikast ja ei peida nende päritolu. Tekstuuriatlaste uus joonistuskood on hoidlas. Toodetud geomeetria on generaatori väljund; Saplingu programmi lähtekoodi litsents ei muuda automaatselt renderdatud mudelit programmi tuletiseks. Lähtematerjali ja retseptide päritolu säilitatakse.

## Väljundi taastamine

`sapling-benchmark.yml` taastab 30 päriselt genereeritud puu failid tootmiskäivituse 42189504137 Actionsi artefaktist, kontrollib need uuesti ning teeb ajaliselt piiratud mõõtmised. See ei asenda Blenderi tootmist teise generaatoriga. Aluseks olnud tootmiskood: bd06d602bcb09edefd0f15a088a29da8938bdc6b.

Olemasolevate päris paigutusfunktsioonide eraldi test: `tests/sapling-trees/existing-placement.mjs`; kasutab kaardi tegelikke eri x/z skaalasid 4.5 ja 3.9. Kõik 23 nõutud CI kiirkontrolli läbisid; raport `reports/sapling-trees-regression.json`.

## Lõppkontroll 2026-11-06

30 puud / 90 GLB-d on arendusharus salvestatud. Khronose kontroll: 0 viga, 0 hoiatust. 23 CI kiirkontrolli gruppi läbisid. Lähimudelid 2293–2536, keskmised 294–312 ning kaugmudelid 6 kolmnurka.

Mõõteraport: `reports/sapling-trees-browser.json`; 9 kaamerakatset, Chromium 141, 1280×800, SwiftShader. Tulemused 0.077–1.682 FPS ning ainult 2–9 kaadrit katse kohta: väike valim ja tarkvaraline GPU ei anna usaldusväärset päris seadme FPS-i ega p95 hinnangut. 12 000 puu kaugvaates 61 draw call'i ja 72 002 kolmnurka koos maapinnaga. Varade mäluhinnang 102.3–106.5 MiB; see pole mõõdetud VRAM. JS heap raporteeriti 33.1 MB.

Mobiili/RTX riistvarakatse ja põhikaartide lõplik renderdusse ühendamine on tegemata. Visuaalne heakskiit ei tähenda automaatselt jõudluse heakskiitu. Põhiharu on puutumata.
