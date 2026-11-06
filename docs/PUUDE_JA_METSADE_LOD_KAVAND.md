# Kuningriigid – efektiivsete ilusate puude ja tihedate metsade kavand (2026-11-06)

Staatus: **ettepanek**, mitte mängu viidud lahendus. 2026-11-06 CCORE 4B katseline mänd ei sobinud; V327 looduse visuaalne kvaliteet pole heaks kiidetud. Kolmnurkade ja FPS-i eesmärke tuleb kontrollida tegelikus seadmes ja kaardil.

## Siht
Ilusad eriilmelised tamm, pärn, kask, mänd, kuusk, palm ja mitmed alavariandid. Tihedad metsad world-map'il ja detailkaardil, ilma ruuduplokkide, tugeva kordumise, hõljuvate võrade, suurte läbipaistvate ruutudeta. Maailma ja detaili metsaalasid peab määrama sama `forest-clumps-v270.js` alusväli.

## Puude algmudelite tegemine
Eelistada spetsiaalset **parametrilist puugeneraatorit** (Blender Sapling Tree Gen 1.0 või Modular Tree) läbimõeldud tüve, harude ja lehekobaratega. Sapling Tree Gen 1.0: https://extensions.blender.org/add-ons/sapling-tree-gen/ (2026-11-04 uuendatud; nõuab Blender 5.2+). Parameetrilise algmudeli kõrge detailsus sobib ainult renderdamiseks ja LOD-i lähtematerjaliks, mitte otse kauge metsa massobjektiks. Erinevad liigid peavad tõesti erinema (pärn ≠ lihtsalt tamme mudel, kuusk ≠ mänd).

## Soovitatud 4 taset
1. **Lähedal** (väike nähtavate puude hulk): tõeline tüvi + oksad ning tekstuuratlaselt lõigatud lehestikukaardid, esialgne siht 400–1200 kolmnurka puu kohta. Väldi tuhandeid üksiklehti ja massiivseid läbipaistvaid tasapindu.
2. **Keskmine**: asenda tüvi lihtsaga, võra 2–4 siluetiga kaardina eri suundades või vähendatud võramudel; umbes 20–150 kolmnurka. Vastavalt kvaliteedile ja kaugusele.
3. **Kaugel**: 1–2 kaadrile orienteeritud billboardsiluetti (2–4 kolmnurka) või parem 6–8-suunaline impostor-atlas. Kalduvalt ja pealtvaates ära näita lameda puu serva; lisa pealtvaate võrafoto või püst- ja horisontaalsed kombinatsioonid.
4. **Väga kaugel**: metsa-/võrakobara plaastrid tekstuuratlases, üks massiivne geomeetriapartii biome/chunk kohta. Puude arvu ei pea joonistama üksikobjektidena kaugelt.

Varju detail ainult lähema taseme puude juures; kaugemad varjud teha lihtsa maapinna varjutuse/varjulaikudena. Alpha-test/alpha-hash lõikematerjalid (sügavuskirjutusega), vältides sadade kattuvate poolläbipaistvate pindade sorteerimis- ja ülekirjutuskulu. Värvi/kuju/rotatsiooni/mõõdu varieerimine, õhulised erinevad ladvad, erinevad tüvepaksused.

## Rakendamine olemasolevasse Kuningriikidesse
- `atlas-biomes-v47.js` teeb juba per-liik `InstancedMesh` puud; ära asenda seda tuhandete objektidega.
- `spatial-batches-v86.js` jagab instantsid tükkideks ja valib praegu `high/low`. Laienda **near/mid/far/forest-patch** LOD ning mõõda visuaalset suurust ekraanipikslites, mitte ainult üht zoomi läve.
- `spatial-batches-v86.js` lülitab kaugel sisse ühe suure `source` InstancedMeshi: kontrolli, et kaugelt pole igast puust vaja 3D-mudelit ja et ka kaugvaatel toimib sobiv kaadripõhine culling.
- `forest-clumps-v270.js` määrab klastrid mõlemal kaardil. Säilita selle seeme/paigutus, kuid esita kauged klastrid atlas-patch'ide ja võrasiluettidena; detailkaardil samad metsapiirid ja lagendikud.
- Ühenda trunk+foliage render või väike arv jagatud materjale; atlas peab vältima rohelisi halle/valgeid ääri.
- Metsatükkide per-kaader culling ja tiheduse kohandamine: lähedal tugevam üksikpuude kuju, kaugelt visuaalselt tihedam võrapind, kuid odavam render.
- Piira varjude renderdamist, kontrolli alpha-overdraw, draw call'e, geomeetria tippude koguarvu ja mälu; väga tiheda metsa puhul võivad läbipaistvuse pikslikulud olla kallimad kui polügoonid.

## Soovitatav pilootkatse
Ühes eraldi testvaates **kuusk + tamm**, mõlemast 3 siluetivarianti, ning 300 / 3000 / 12000 puuga stseenid. Näita sama kaamerat, sama valgust, täpselt sama seemet:
A) praegune V327 puu; B) Sapling -> lehestikukaardiga 3D; C) 6–8-suunalised impostorid; D) metsakobara atlas. Võrdle piltide abil ja profileeri mobiil + PC.
Mõõdikud: FPS/p95 kaadriaeg, draw calls, triangles, tekstuurikulu/VRAM, visuaalne metsatihedus ja kuju. **Ära muuda põhiharus puid ega metsa enne kasutaja heakskiitu.**

Viited:
- https://threejs.org/docs/pages/InstancedMesh.html
- https://threejs.org/manual/pages/transparency.html
- https://extensions.blender.org/add-ons/sapling-tree-gen/
- https://extensions.blender.org/add-ons/modular-tree/
