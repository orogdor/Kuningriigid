# AI tööloki – Kuningriigid

See fail on mõeldud teistele tehisintellektidele (nt ChatGPT) ja inimestele, kes jätkavad sama projektiga.
Iga AI lisab oma töö kohta uue kirje faili lõppu. Uusim kirje on alati viimane.
Kirjuta lühidalt: mis muutus, millised failid, kuidas testida, mis jäi pooleli.

---

## 2026-10-24 · Claude (Anthropic) · V148 – uued sõdurite 3D-mudelid ja animatsioonid

### Ülesanne (kasutaja sõnadega kokku võetud)
- Teha sõduritele uued, ilusamad ja realistlikumad 3D-mudelid quad-töövoos (nagu V48–V50 "mudeliruudud").
- Teha sõduritele uued animatsioonid.
- Mudelid teha **ühikute kirjelduste järgi** (nimi, ajastu, relv, roll), mitte vanade mudelite kuju järgi.
- Kontrollida, et mudelid oleksid anatoomiliselt korrektsed ja korralikud GLB-failid.
- **Muud mängus mitte muuta.**

### Mis tehti
- 28 sõdurit said uue mudeli: scout, militia, slinger, spearman, axeman, archer, bronze_spearman, bronze_axeman,
  bronze_archer, bronze_cavalry, infantry, cavalry, iron_archer, javelinman, man_at_arms, halberdier, crossbowman,
  knight, heavy_cavalry, pikeman, arquebusier, musketeer, cuirassier, rifleman, line_infantry, dragoon,
  modern_infantry, rocket_team. Ratsaväel on uus anatoomiline hobune koos sadula, valjaste ja jalustega
  (rüütlil vapikattega sõjaratsu).
- Iga ühiku kirjeldus, millest mudel tehti, on failis `tools/soldiers_v148/roster.py` (`DESCRIPTIONS`)
  ja `models-v148/manifest.json`.
- Animatsioonid: `idle`, `walk`, `run`, `attack`, `hit`, `death`; vajadusel `attack_sword` (vibu-/ristvibumehe
  mõõgaga), `attack_gun` (ratsanik tulirelvaga), `brace` (odasein), `shield_wall` (kilbisein),
  `dismounted` ja `dismounted_attack` (ratsalaskur jala).
- **Muutmata jäid:** masinad ja meeskonnaga relvad (sõjavanker, katapuldid, müürilõhkuja, piiramistorn,
  välisuurtükk, vintraudne suurtükk, kuulipilduja meeskond, tank, motoriseeritud jalavägi), tsiviilisikud ja
  töölised, mängureeglid, lahinguloogika ja salvestused. Need kasutavad endiselt vanu mudeleid ja koodi.

### Muudetud olemasolevad failid (ainult need kolm)
1. `visuals.js` – `createSoldier()` suunab V148-ga sõdurid uude moodulisse,
   `animateSoldier()` kutsub `animateV148Soldier()`, kui `rig.v148` on tõene. Vana kood jäi alles varuvariandiks.
2. `index.html` – import-map: `./visuals.js` ja `./visuals.js?v=117a` → `./visuals.js?v=148a` (puhvri värskendus).
3. `AI_LOGI.md` – see fail (uus).

### Uued failid
| Fail | Sisu |
|---|---|
| `soldier-models-v148.js` | Mängu runtime: laeb mudelipaki, ehitab luustiku ja geomeetria, mängib klippe. |
| `models-v148/soldiers-v148-high.bin` | Detailne pakk (graafika "high", arvuti vaikimisi). |
| `models-v148/soldiers-v148-low.bin` | Kerge pakk (graafika "medium" ja "low", telefoni vaikimisi). |
| `models-v148/glb/<kind>.glb` | 28 GLB-faili (glTF 2.0, skelett + skin + kõik animatsioonid). Blender/Godot/three.js. |
| `models-v148/manifest.json` | Kirjeldused, quad-arvud, klippide nimekiri, kontrollide tulemused. |
| `tools/soldiers_v148/*.py` | Generaator (Python 3 + numpy + scipy). Vt allpool. |
| `tools/soldiers_v148/preview.html` | Mudelivaataja: mängu pakk või GLB-failid, iga animatsioon, eri vaated. |
| `TEST_V148.mjs` | Node-test: pakid, luud, liigeste piirid, GLB päised, kontrollid. |
| `TEST_V148_BROWSER.mjs` | Brauseritest: kümme V124 lahingut (kiviaeg … moodne aeg), vead, animatsioon. |
| `MUUDATUSED_V148.md` | Lühike muudatuste kokkuvõte eesti keeles. |

### Kuidas mudelid on tehtud (arhitektuur)
- Ühikud: meetrid, +Y üles, kuju vaatab +Z suunas, tegelase vasak pool on +X (glTF tava).
- Mees 1,76 m, 7,5 pea pikkust. Õlaliigesed 0,372 m vahega, puusaliigesed 0,18 m, õlavars 0,30 m, küünarvars 0,265 m.
  Rusikas ulatub reie keskele.
- Kõik pinnad on quad-loftid (`geom.py`). Iga osa on kinnine ja ühtlaselt väljapoole suunatud ruumala; see on kontrollitud.
- Luustik (sama nimi mängus ja GLB-s): `root, body, chest, head, upperArm_L/R, forearm_L/R, hand_L/R,
  thigh_L/R, shin_L/R`. Hobusel on lisaks `horse, horseNeck, horseHead, horseTail, horseLeg_FL/FR/HL/HR,
  horseShin_FL/FR/HL/HR`.
  Iga tipp kuulub täpselt ühele luule (jäik skin, kaal 1). Mängu vana rig-liides `body, head, arms, legs, horseLegs`
  on säilinud, nii et teised failid (nt `village-life-v76.js`) töötavad edasi.
- **Relvad määravad poosi:** igas võtmepoosis on kirjas, kus relv on. Käed lahendatakse pöördkinemaatikaga
  (`ik.py`, scipy least_squares, anatoomilised liigeste piirid). Seetõttu hoiavad kahekäerelvad (hellebard, piik,
  musket, ristvibu, granaadiheitja) päriselt mõlemas käes.
- Jalad on maas lahendatud, mitte arvatud: igas kõnni-, jooksu- ja rünnakukaadris arvutatakse jala madalaim
  punkt ja puusad nihutatakse nii, et toetav jalg on täpselt maapinnal. Hobusel kehtib sama kabjade kohta.
- Värvid: tipuvärvid ja kaks materjali (`cloth`, `metal`). Värvid `TEAM`, `TEAM_D` ja `TEAM_L` asendatakse mängus
  armee värviga. GLB-s on eraldi materjal `team_color`; muuda selle `baseColorFactor` väärtust.
- Klassid (`grade`): `elite` lisab sildiga `elite` osad, `mobilized` eemaldab sildiga `armor` osad.
  Peade variandid (habe, juuksed) on siltidega `v0/v1/v2` ja valitakse sõduri asukoha järgi.
- Mängupakk on gzip-iga pakitud (≈1,1 MB high / 0,65 MB low; mäng pakib lahti `DecompressionStream`-iga). Lahtipakitud sisu (`KSV1`): 8-baidine päis, JSON ja binaar. Positsioonid on int16 (1/8000 m), normaalid int8 ja
  indeksid uint16. Iga tükk on kirjeldatud kujul `[bone, group, tags, mat, color, posOffset, nrmOffset, vertCount, idxOffset, idxCount]`.
  Klipid on JSON-is: `{d: kestus, loop, f: [{r: {luu: [x,y,z] Euler XYZ}, t: {luu: [dx,dy,dz]}}]}`.
- Runtime (`soldier-models-v148.js`) kasutab top-level awaiti. Kui pakki ei saa laadida (nt Node-testid),
  kasutatakse automaatselt vanu mudeleid.
- Lülitatavad relvagrupid: `bowWeapon`, `swordWeapon`, `swordSheath`, `mountedGun`, `sideWeapon`.

### Mudelite uuesti genereerimine
```
python3 tools/soldiers_v148/generate.py            # kõik 28 (≈4 min, paralleelselt)
python3 tools/soldiers_v148/generate.py knight     # ETTEVAATUST: kirjutab pakid üle ainult nende ühikutega
python3 tools/soldiers_v148/tune.py thrust gun bow # pöördkinemaatika ulatuvuse kiirkontroll stiilide kaupa
```
Generaator kontrollib automaatselt:
- kinnised ja väljapoole suunatud võrgud;
- pikkus ja pea proportsioon;
- käte ulatus ja sümmeetria;
- põlve, küünarnuki, randme, puusa ja õla piirid igas kaadris;
- jalgade ja kapjade maapinnakontakt;
- ratsaniku istumine sadulas ja jalad jalustes;
- käte täpsus relval;
- range glTF 2.0 struktuurikontroll (aktsessorid, min/max, kaalud, liigesed, animatsioonide ajad, kvaternioonid).

Tulemus on failis `models-v148/manifest.json` väljal `checks` (`"ok"`).

### Testimine
```
python3 -m http.server 8765 --bind 127.0.0.1     # repo juurkaustas
node TEST_V148.mjs
CHROME_PATH=... node TEST_V148_BROWSER.mjs       # vajab playwrighti
# vaataja: http://127.0.0.1:8765/tools/soldiers_v148/preview.html?anim=attack&view=three
#          lisa &src=glb, et näha GLB-faile, &lod=low kerge paki jaoks, &kinds=knight,musketeer
```

### Mõõdetud tulemused
- `TEST_V148.mjs`: PASS. 28 mudelit ja 183 klippi; kõik generaatori kontrollid "ok".
- `TEST_V148_BROWSER.mjs`: vt `MUUDATUSED_V148.md`. Lahingud avanevad uute mudelitega, need animeeruvad ja
  lehel pole vigu.
- Quad-arvud ühe kuju kohta: jalaväelane umbes 2500–4000 (high) ja 1500–2400 (low); ratsanik koos hobusega
  4700–6900 / 2900–4300.
- Kolmnurgad 480 mehega keskaja lahingus: vanad mudelid umbes 0,96 milj.; V148 high umbes 3,4 milj.;
  V148 low umbes 1,8 milj. Joonistuskutseid on 228 (vanadel 38), sest iga luu ja materjal on eraldi
  instantsitud võrk.

### Teadaolevad piirangud ja ideed edasiseks
- Lahingus on soovituslik mõõta FPS-i päris telefonis. Kui see on madal, vähenda `rig.py` → `Model.n()` LOD1
  segmente või ühenda `cloth` ja `metal` üheks materjaliks (joonistuskutsed väheneksid umbes poole võrra).
- Vibunöör ei veni tõmbamisel (jäik geomeetria).
- Riietus on jäik luu küljes (seelikud ei deformeeru); kõndimisel võivad jalad seelikust veidi läbi minna.
- GLB-s on ainult `standard` klass ja pea variant `v0`. Eliit/mobiliseeritud ja teised pead on ainult mängupakis.
- Generaatori osaline käivitus kirjutab pakid üle. Lõpus käivita alati kõik ühikud.
- Seda versiooni pole GitHubi lükatud. Kasutaja otsustab, millal avaldada.

---

## 2026-10-24 · Claude (Anthropic) · V149 – jõed, teed ja mäed ilusamaks (maailma- ja detailkaart)

### Ülesanne
Teha jõed, teed ja mäed maailmakaardil ja detailkaardil võimalikult realistlikuks, ilma et ressursikasutus liiga palju kasvaks.

### Põhimõte
Muudeti **ainult välimust**. Jõgede ja teede keskjooned, maastiku kõrgused, navigatsioon, ehituskohad ja salvestused jäid samaks
(`continuous-landscape.js`, `world-geography.js` ja `landscape-shared.js` jäid puutumata). Tekstuure ei laadita alla, kõik on protseduuriline
varjutaja. Kolmnurkade arv jäi samaks ja teede joonistuskutseid on vähem (üks võrk kahe asemel).

### Uus fail
- `landscape-v149.js`:
  - `terrainMaterial` – mägede kalju, rusukalded, alpiniit ja lumi kalde ja kõrguse järgi; detailkaardil lisaks lähivaate tera
    ja kivikesed, mis kaovad kaugelt vaadates (`fwidth`), et vältida virvendust.
  - `waterMaterial` – voolusuunas liikuvad lainetused, sügavusvärv, vahutriibud madalikul ja helgid; aeg tuleb ühisest
    `LANDSCAPE_TIME`-ist, mida uuendab `onBeforeRender`.
  - `roadMaterial` – teetase 1 = roopaline pinnastee, 2 = kruus, 3 = munakivi, 4 = kiviplaatidest maantee; servad sulavad pehmelt maastikku.
  - `trailMaterial` – tallatud rajad pehmete servadega.
  - `mountainShade` – mäeruutude tipuvärv.
  - `smoothedOverview` – maailmakaardi mäetippude kerge silumine, et mäeharjad ei oleks sakilised.
  - `bakeRelief` – org ja nõod tumedamad, harjad heledamad; arvutatakse üks kord võrgu ehitamisel.

### Muudetud failid
- `civilization.js`:
  - impordib `landscape-v149.js` (vana `landscape-material-v85.js` jäi alles, aga seda enam ei kasutata);
  - `atlasTerrainHeight` kasutab `smoothedOverview`-d;
  - `mountainTint` asemel on `mountainShade`;
  - maastik saab `bakeRelief`-i ja `terrainMaterial`-i;
  - `localTrails` kasutab `trailMaterial(true)`-d.
- `continuous-landscape-visual.js`:
  - vee materjal ja atribuudid `aFlow` (voolusuund lähima jõelõigu järgi) ning `aShore`;
  - kaldad on märjad ja tumedad ning sulavad tipu-alfaga maastikku;
  - teed on üks valgustatud riba UV-ga (risti −1,5…1,5, piki meetrites) ja atribuudiga `aLevel`;
  - maailmakaardi teed on laiemaks joonistatud.
- `detail-roads.js` – raja ribad saavad UV ja `trailMaterial`-i, segmendid kattuvad veidi, et rada oleks ühtlane.
- `boot-v83.js` ja `index.html` – puhvri värskendus (`civilization.js?v=149a`, import-mapis `continuous-landscape-visual` ja `detail-roads` → `?v=149a`).

### Testid
- `TEST_V149_BROWSER.mjs` (uus) on PASS nii high kui ka low graafikaga: maailma- ja detailkaart kasutavad V149 varjutajaid ja lehel pole vigu.
- Varasemad testid on endiselt PASS: `TEST_V143_BROWSER`, `TEST_V147`, `TEST_V147_BROWSER`, `TEST_V148`, `TEST_V148_BROWSER` (lahingud #1 ja #6).
- Laadimisaeg tarkvaralise graafikaga: umbes 12,2 s → 12,9 s (+5%, sh varjutajate kompileerimine).

### Häälestamine
Värvid ja piirid on `landscape-v149.js` GLSL-plokkides:
- lumepiir: `snowLine=118`;
- kalju algus: `rockAt`;
- alpiniit: 70–105 m;
- teede värvid: `dirt`, `rock`;
- vesi: `deep` ja `shallowCol` failis `continuous-landscape-visual.js`.

Maastiku kõrgused on mägedes umbes 54–158 (mediaan 94) ja madalikul mediaan 17.

### Teadaolevad piirangud
- Detailkaardi udu (`T.Fog('#b7c9bd',260,700)`) teeb kõrged mäed kaugelt heledamaks. Seda ei muudetud, sest see on mängu üldine välimus.
- Vana `landscape-material-v85.js` jäi faili alles, kuid seda enam ei kasutata.
- Seda versiooni pole GitHubi lükatud.

## V150 – maastiku ruudud ära (Claude, 2026-10-24)

Kasutaja soov: „Maastiku ruudud kohutavad – tee need uuesti nii, et maakera tunduks ilusam ja loogilisem.“
Muudetud on ainult välimust. Mänguandmed (`cell.biome`, jõed, teed, kõrgused, navigeerimine, salvestused) on samad.

### Mis muutus
- `landscape-v149.js` (lõpus V150 plokk):
  - `smoothBiomeColor()` – biomi värv sulandub 4 lähima ruudu vahel (smoothstep-bilineaarne, domeeni-väänatud müraga), mere ruute vahele ei võeta. Ruudu servad kaovad ja alad sulavad loomulikult üksteiseks.
  - `farmlandTint()` – viljaruutudel on kollaste plaatide asemel maalitud põllumosaiik (ribad, kõrred, kesa, hekid), mis hajub servades.
  - `detailGroundColor()` – detailkaardi maapinna värv tuleb sama sujuva segamise kaudu.
  - `cellRegion()`, `regionContour()`, `regionFill()` – riigi- ja linnapiirid leitakse sujuvast väljast *marching squares* abil. Piirid on ümarad, mitte trepikujulised.
- `atlas-style.js` – `atlasColor` kasutab sujuvat segamist ja põllumosaiiki; viljaplaate enam ei joonistata (`plots.count=0`); `territory()` joonistab ümarad täited ja piirijooned.
- `civilization.js`:
  - detailkaardi värv tuleb `detailGroundColor()` kaudu;
  - `refreshFogCover()` – avastamata ala pärgament on nüüd üks tasand, mille läbipaistvust juhib 220×165 „avastatud“ DataTexture (lineaarne filter + väike väänamine). Udu serv on pehme ja rannajoonelaadne, mitte ruuduline. Geomeetria uuid jääb samaks (V88 test) ja uuendused kirjutavad ainult muutunud tekselid;
  - 50 m ruudustik (`atlasGrid`) on heledam (opacity ≤ .065) ja hajub välja, kui zoom > 180…330. Kaugelt pole ruudustikku näha.
- Import: kõik kohad kasutavad `./landscape-v149.js?v=150a`; `civilization.js?v=150a`, `atlas-style` ja teised import-mapi kirjed → `?v=150a`.

### Testid
PASS: `TEST_V88_EXPLORATION_UI`, `TEST_V149_BROWSER` (high + low), `TEST_V143_BROWSER`, `TEST_V148`.

### Häälestamine
- Biomi sulandumise laius: väänamise amplituud `*46` / `*12` failis `smoothBiomeColor`.
- Udu serva pehmus: `smoothstep(.30,.62,seen)` ja väänamine `*38.0` / `*10.0` failis `refreshFogCover`.
- Ruudustiku nähtavus: `fadeAtlasGrid` failis `civilization.js`.

## V152 – jõesuudmed, virvendus, uued maailmakaardi mudelid (Claude, 2026-10-24)

Märkus: ChatGPT kasutas samal päeval nime V151 (keskaja I test), seega on see Claude'i töö nimega V152.

Kasutaja: „Jõgi ei jõua mereni, maa-ala värv virvendab. Maakera kaart nõuab uusi ilusamaid 3D mudeleid.“
Muudetud on ainult välimust. Mänguandmed, kaart ja salvestused on samad.

### Virvendus (põhjus ja parandus)
- Põhjus: kaamera `near=.1` ja `far=20000`. Maailmakaardi kauguselt lahutas sügavuspuhver ainult umbes 0,6 m, mistõttu maastik, meri, jõekaldad ja territooriumi täide z-võitlesid (z-fighting). Lisaks liikus merepind igal kaadril ±0,045 m üles-alla ja rannajoon „roomas“.
- Parandus: `civilization.js` → `fitDepthRange()` (enne `renderer.render`), `camera.near = clamp(zoom*.04, .1, 40)`. Merepind on nüüd paigal (`y=.72`). Territooriumi täide on `+.45` kõrgusel ja kasutab `polygonOffset`-i.
- Kontrollitud kaadrite erinevuspildiga: vanal maal oli müra, uuel ainult servad.

### Jõesuudmed
- `continuous-landscape-visual.js`: vee lõikepiir on `shore=.30-atlasHeight` (enne 1.12). Funktsioon `mouthBlend()` (atlasHeight .30…4.0) laseb veepinna suudme juures meretasemele (`.78`) ja segab värvi madala mere tooniga (`seaCol '#62a6a3'`). Nii voolab jõgi merre ega lõpe rannas.
- Riigipiirid (`atlas-style.js` `territory()`) nägid välja nagu tumedate kallastega türkiissinine jõgi. Nüüd on need kriipsjoon (kreemjas serv + meeskonna värv) ja sissepoole hajuv meeskonnavärvi helk. Nimed `national border N` ja `national border outline` on alles (V143 test).

### Uued mudelid – `world-models-v152.js` (uus fail)
- Protseduurilised tipuvärvidega mudelid, ehitatakse koodis ja neid jagavad kõik instantsid: `oak`, `lime`, `birch`, `pine`, `spruce`, `palm`, `cactus`, `rock`, `shrub`. Igal on LOD `high/medium/low`; kolmnurkade eelarve on testis.
- `settlementGeometry(team, era)` – üks ühendatud linnamudel ajastu kohta (0–6): viilkatusega majad (aeg 0: koonusekujulised onnid), keskne maamärk (pikkmaja / tempel / kirik koos torniga / vabrik korstnatega / kõrghooned), tänavaristi, puitpalissaad või kivimüür tornidega. Meeskonna värv on maamärgil ja mõnel katusel.
- `atlas-biomes-v47.js` kasutab V152 liike biomi järgi segatuna, lisatud on põõsad ja puudele väike värvivariatsioon.
- `civilization.js`: vana V46 metsa koonused/dodekaeedrid on asendatud V152 kuuse/männi/tamme/pärna/kasega.
- `atlas-style.js`: kivimaardlate kivid on V152 `rock`; `createCityMiniature` kasutab `settlementGeometry`-t.
- `spatial-batches-v86.js`: valikuline LOD (`mesh.userData.lodGeometries={high,low}`). Fookuse lähedal (zoom < 640) olevad tükid saavad detailse mudeli, kaugemad kerge. `updateSpatialBatches(zoom, focus)`.
- Koormus (kõrge kvaliteet, ai-iron-v143): kaugvaade 2,85M → 2,30M kolmnurka, keskmine 2,81M → 2,94M, lähivaade 2,64M → 2,57M. Joonistuskutseid on vähem.
- `landscape-v149.js` `farmlandTint` vaikimisi tugevus .55 → .34 (lähivaates olid kollased laigud).

### Testid
- Uus `TEST_V152.mjs` (Node mudelikontroll + brauser: V152 mudelid on maailmakaardil, vigu pole, near-tasand järgib suumi).
- PASS: `TEST_V48` (uuendatud V152 jaoks: kuni 9 liiki ja asulamudel), `TEST_V88_EXPLORATION_UI`, `TEST_V143_BROWSER`, `TEST_V148`, `TEST_V149_BROWSER`, `TEST_V152`.
- Mudelite eelvaade: `artifacts-v152/models.html?m=nature` või `?m=city` (kaust on gitignore'is).
- Versioonid: `index.html` / `boot-v83.js` → `?v=152a`; `landscape-v149.js?v=152a`; `world-models-v152.js?v=152a`; `atlas-biomes-v47.js?v=152a`.

## V153 – detailkaardi kõrgused sujuvaks (Claude, 2026-10-24)

Kasutaja: „Kõrguste vahe detailkaardil on nagu ümmargused lained, mitte sujuv.“
Muudetud on ainult visuaalset kõrgust (`continuous-landscape.js`). Mängu enda detailkõrgused (`world-details.js` `detailHeight`, küpsetatud kõrgused) ja kaardiandmed on samad.

### Põhjus
- `baseHeight()` lisas siinuspõhiseid mustreid: `crest`, `fold`, `spine`, `fracture`, `ledge` ja eriti `coastal` (sin⁴ ribad kõigil madalikel kõrgusega 3…21 m). Need kordusid korrapäraselt ja detailkaardil (4,5× suurendus) paistsid need ümarate kontsentriliste lainetena.
- `game.atlasHeight` on smoothstep-bilineaarne interpolatsioon, millel on iga 50 m ruudu keskel tasane koht. Tulemuseks olid astmelised kühmud ehk terrassid.

### Parandus
- Uus `smoothAtlasHeight(game,x,z)`: kuup-B-splain 4×4 ruudu kõrgusest (C2-sujuv, ei tee üle- ega alavisset). Meretaseme lähedal (|h| < 1,5…5,5) sulandub see tagasi algsesse kõrgusse, et rannajooned jääksid paika.
- `baseHeight()`:
  - madalikul domeeni-väänatud õrn lainjus (±1,3 m, rannad tasased);
  - mägedes *ridged multifractal* müra (3 oktaavi `game.smooth`-iga) ja katkendlikud astangud. Korduvaid siinusmustreid enam pole.
- Jõe veetase (`prep` → `waterHeight`) kasutab samuti `smoothAtlasHeight`-i.
- Kõrgusjaotus jäi peaaegu samaks (seeme 142023):
  - mäed p5/p50/p95: 56/94/144 → 60/94/139;
  - madalik: 4/19/66 → 3/18/65.
  Lumepiir ja kaljuvärvid töötavad endiselt.
- `index.html`: `continuous-landscape.js` → `?v=153a`.

### Testid
PASS: `TEST_V67`, `TEST_V48`, `TEST_V152`, `TEST_V88_EXPLORATION_UI`, `TEST_V149_BROWSER`, `TEST_V143_BROWSER`, `TEST_V151_BROWSER`.

## V154 – uued hoonemudelid detailkaardil (Claude, 2026-10-24)

Kasutaja: „Tee hoonetele uued ilusad 3D-mudelid, et need oleksid silmaga eristatavad. Linnas kõige rohkem kasutatud majadele tee erinevaid variatsioone, et vaheldust oleks piisavalt ja ei jääks korduvat tunnet.“
Muudetud on ainult välimust. Hooneandmed, jalajäljed (`navigation.js` `FOOTPRINTS`), uksed, tootmine ja salvestused on samad.

### Uus fail `town-models-v154.js`
- Iga mudel ehitatakse koodis üheks ühendatud võrguks. Pöörlevad osad (tuuleveski tiivad) on eraldi pivot-sõlmes `root.userData.animations` all ja suits on `root.userData.smoke`, nii et `buildings.js` `animateBuilding` töötab muutmata.
- Üks jagatud materjal `TOWN_MATERIAL`: tipuvärv + atribuut `aMat` (materjalikanal). Varjutaja joonistab mustri objektiruumis:
  - krohv, lauad, palgid, müüritis, tellis, katusekivid, roog, kiltkivi;
  - klaas (madal karedus), metall, palk/tala, muld, lehestik, riie.
  Tekstuure ei laadita.
- Majad `createTownModelV154('house', team, age, seed)` – variandid ajastu järgi:
  - kiviaeg 8: ümaronn, nahktelk, kaksikonn, madal onn; lõkkease, kuivatusrestid, potid;
  - pronksi- ja rauaaeg 12: vitspunutis/savi, rehielamu, ümarmaja, palkmaja, juurdeehitis, aidaga; ilmed vahelduvad, rauaajal kivisokkel;
  - keskaeg 16: 1–3 korrust, sõrestik + krohv, esiletõstetud ülemine korrus, kivist alumine korrus, kivi-/kiltkivi-/roogkatus, viil tänava poole või küljele, katuseakna, korstna, kuuri, varikatusega;
  - renessanss 16: Hansa-stiilis kitsad kõrged viilmajad, astmeline / kellukakujuline / kolmnurkne viil või kelpkatus, pastelsed fassaadid, valged raamid, erker;
  - tööstusaeg 12: telliskivist ridamaja, erkeraken, mansardkatus katuseakendega, krohvitud linnamaja, laudisega veranda-maja;
  - moodne aeg 16: rõdudega kortermaja, aknalindiga maja, paneelmaja, kõrghoone (harva), villa, viilkatuse ja garaažiga pereelamu, telliskivist kortermaja.
  Iga variandi sees juhib seemne põhine `rng` mõõte, värvipaletti, aknaluuke, korstnat, lisaehitisi ja pisiasju (tünnid, kastid, põõsad, aiad).
- `buildingSeed(b)` (positsioonist) valib maja variandi, nii et sama maja näeb alati ühesugune välja.
- Teised hooned (`SIG`, 66 tüüpi koos aliastega) saavad ajastu stiilis kere ja tunnuseseme:
  - saeveski: saeraam ja lauad; tuuleveski: pöörlevad tiivad (keskajast alates, pronksiajal käsikivi);
  - pagar: kuppelahi; sepp: avatud ääsi ja alasi; sulatusahi: torn; söemiilid;
  - kasarmud: harjutusnukud; vibulaskeväli: märklauad; tall: boksid ja koplid; kaev: katusega;
  - õppehooned: kellatorn / sammaskäik / kuppel; turg: värviliste varikatustega letid;
  - ladu: suured väravad; kelder: muldkünkas; kõrts: silt, lauad ja latern; kabel: torn;
  - aiad: eri värvi peenrad; viljapuuaed; tööstushooned: saehambakatus ja korstnad jne.
- Kasutamata jäävad (vanad mudelid jäävad alles): müürid/väravad/tornid, põld/talu/karjamaa, kaevandused ja kaevanduskohad (`MINERAL_BUILDINGS`), ranna-ehitised (`fisher`, `harbor`), sild ja `keep`.

### Integreerimine
- `civilization.js` `townBuildingModel(type, team, age, stage, seed)`: kui `createTownModelV154` toetab tüüpi, kasutatakse uut mudelit, muidu vana `createAgeBuilding`. Mõlemad kutsekohad annavad `buildingSeed(b)`.
- `boot-v83.js` / `index.html` → `?v=154a`.
- Koormus: keskaja demo 905 → 559 joonistuskutset, kolmnurki umbes sama palju (~0,5M). Moodsa demo kolmnurgad 881k → 904k (+3%), joonistuskutsed 2221 → 901.

### Testid
- Uus `TEST_V154.mjs`: kõik tüübid ja ajastud ehituvad, kolmnurkade eelarve ja mahtumine krundile, majavariandid on erinevad, müürid ja kaevandused jäävad vanaks, veski animatsioon ainult keskajast alates, brauseris vigu pole ja majad varieeruvad.
- Eelvaade: `artifacts-v154/town.html?m=houses&age=3`, `?m=types&age=1&labels=1` ja `?m=ages` (gitignore'is).

## V155 – kasutajaliides loogilisemaks ja ilusamaks (Claude, 2026-10-24)

Kasutaja: „Tee UI loogilisemaks ja ilusamaks.“ Kasutaja valikud: liides jääb inglise keelde (V120 otsus), parandada tuleb kõike ühtlaselt.
Mänguloogika, salvestused ja elementide id-d on samad.

### Keel (ainult inglise keel, ilma eestikeelsete lekete)
- `localization.js`:
  - **viga parandatud**: alamstringi regex escape'is kasutati `'\\\\'+c`, mis tekitas kaks kaldkriipsu. Seetõttu ei tõlgitud kunagi ühtegi paari, mille allikas sisaldab `. ( ) + ?` jne (nt „… ▶ jätkab mängu.“). Nüüd on `'\\'+c` ja asendus käib funktsiooniga (`$` sihttekstis on ohutu);
  - lisatud `locale-en-v155.js` (`ENGLISH_V155_PAIRS`): uuenduse prefiksid (Bronze-Tool, Iron-Tool, Master, Renaissance, Industrial, Modern), kaubahooned ja kaubad, ehitusvihjed, päeviku read („Construction:“, „A new resident arrived“), tööriistavihjed / aria-label'id, lahingukaart, väeliikide nimed, demode pealkirjad ja menüütekstid.
- Keelevalija (ainult üks valik) on peidetud (`header .game-language`).
- Skanner (kõik nähtavad tekstid + title / aria-label viies demos ja kõigis paneelides) leiab pärast muudatust ainult linnanimed (nt „Idaküla“).

### Paigutus ja välimus – `ui-v155.css` (laaditakse viimasena)
- Ühtsed tokenid (`--v155-*`). Kõik HUD-paneelid on ühesuguse klaasja tausta, joone, raadiuse ja varjuga, nuppudel on ühtne stiil.
- Ülemine riba: ressursikiibid kujul „väärtus /mahutavus + silt“. Riigi kogusumma on vihjes (`title`), mitte „(713)“ numbris.
  - `civilization.js` kiibi märgistus: `<b>linn</b><em>/cap</em><i>riik</i><small>silt</small>`.
- Töölauaarvuti tööriistariba (≥ 901×581) on keskel, igal nupul ikoon ja silt. Rühmad on eraldajatega:
  - World · City;
  - Build · Research · Army · Explore · Journal;
  - Help · Menu;
  - Center · Zoom · Zoom.
  Järjekord on CSS `order`-iga (DOM ja id-d samad). Ujuv suumipaar on töölaual peidetud (dubleeris). Mobiili V74 riba jäi samaks, ühtlustatud on ainult värvid.
- Linnapaneel:
  - pealkiri on ainult linna nimi; uus `#citypanelsub` rida: „11 residents · 147 tiles · Energy town · Iron Age“;
  - `renderCityHealth()` joonistab nüüd armatuurlaua: 6 näitajat (elanikud + kasvuriba, toit, vesi, töölised, tootlikkus, kaubandus), hoiatused kiipidena ja kokkuklapitavad „City details“ (töökojad, ehitusala, järjekord, linna ulatus „N × N“, maakond, maastik, vajadused, turg, raudtee, õhuvedu). Lahtioleku olek jääb meelde (`renderCityHealth.open`) ja DOM uueneb ainult siis, kui HTML muutub;
  - `#cityhealth` ja `#laborsummary` on nüüd `div` (sisaldavad ruudustikku).
- Tööliste vaheleht (`labor-ui.js`): tekstimüüri asemel näitajad (töötab / vaba, leib, vili, puit, kivi, teadus) ja üks märkuserida.
- Maailmakaardi tegevuspaneel: sulgemisnupp on nurgas, „City Overview“ täislaiuses ja tegevused kahes veerus.
- Toast / vihjed on ülaosas keskel, külgpaneelidest eemal.
- Versioonid: `ui-v155.css?v=155a`, `civilization.js?v=155a`, `boot-v83.js?v=155a`, `labor-ui.js?v=155a`, `localization.js?v=155a`.

### Testid
- PASS: `TEST_V120_LOCALE`, `TEST_V123_UI`, `TEST_V143_BROWSER` (kontrollib „N × N“ `#cityhealth` tekstis), `TEST_V151_BROWSER`, `TEST_V153_BROWSER` ja teised allpool loetletud.
- Vanad UI-testid (V115–V124 UI) kukkusid läbi juba enne seda muudatust, sest kontrollivad vana versioonipealkirja (`/V117/`, `/Kingdoms V120/`) – need ei ole V155 regressioonid.
- Täielikult: `TEST_V147_BROWSER`, `TEST_V88_EXPLORATION_UI`, `TEST_V149_BROWSER`, `TEST_V152`, `TEST_V154` PASS.

## V156 – detailkaardi maapind elavamaks (Claude, 2026-10-24)

Kasutaja: „Detailkaartidel tundub maapind tühi, igav ja halva tekstuuriga.“ Muudetud on ainult välimust.

### Maapinna varjutaja (`landscape-v149.js` `terrainMaterial`, ainult detailvaade)
- Muster on nüüd detailkaardi kohalikes ühikutes (`vL156L = position.xz`), mitte maailmameetrites, nii et peen detail on mängijale nähtavas mõõdus.
- Kihid:
  - niiskemad ja kuivemad heinamaa toonilaigud;
  - rohupuhmad kahes mõõdus ja puhmaste tumedamad tuumad;
  - peen rohutekstuur;
  - harvad paljad mullalaigud;
  - metslillede täpid (valge, kollane, lilla) triivudes;
  - kivikesed mullal ja kõrgemal.
- Kõik kehtib ainult „rohelisel“ pinnal (`grassy`: roheline > punane), nii et liiv, kalju, lumi ja vesi jäävad samaks. Peen detail hajub välja, kus see sakiks (`fwidth`).
- Reljeefivalgus: mustri kõrgusest (`t156Bump`) arvutatakse ekraaniruumi tuletistega normaali kalle (bump), tugevus 0,32.
- Programmi võti `terrain-v149-v156-…` (V149 testi `terrain` loendus kehtib).

### Uus taimkate `ground-detail-v156.js` (asendab detailvaates `graphics-v46` `createGroundCover`-i)
- Instantseeritud (1 joonistuskutse liigi kohta):
  - rohupuhmad (7 kitsenevat kõrt, tipp heledam) ja kõrge rohi;
  - metslilled kuues värvis (iga värv eraldi partii, et varred jääksid roheliseks);
  - kivid samblaga, põõsad, sõnajalad;
  - metsas ja niidul kännud, langenud palgid ja seened.
- Paigutus on klasterdatud müraväljadega: niidud, lagendikud, lilletriivud, kivised kohad. Biomi järgi: kuival maal kuivem toon ja vähem lilli, mäestikus rohkem kive, metsas rohkem sõnajalgu ja kände.
- Väldib jõgesid (kõrgus −100), maailmateid (`roadNetwork` → kohalikud lõigud, poollaius tee taseme järgi + 1,4) ja hoonete krunte (`buildingClearance` + 0,5). Uus `groundAvoidance(cell)` asub failis `civilization.js`.
- Eelarve (kolmnurgad / joonistuskutsed): madal ~35k / 13, keskmine ~100k / 13, kõrge ~200k / 13.

### Testid
Uus `TEST_V156.mjs` (eelarve, teedele ja kruntidele ei kasva midagi, jõgi ja mägi jäävad tühjaks). Brauseritestid on loetletud allpool.
PASS: `TEST_V156`, `TEST_V67`, `TEST_V149_BROWSER`, `TEST_V143_BROWSER`, `TEST_V88_EXPLORATION_UI`, `TEST_V154`, `TEST_V151_BROWSER`, `TEST_V123_UI`.

## V157 – maailmakaardi maapind, rändajad detailkaardil, teed majadest mööda (Claude, 2026-10-24)

Kasutaja: „Maailmakaardi maa tekstuur on kole ja tühi. Kõik üksused, kaupmehed jne peaksid maailmakaardilt avades olema ka detailkaardil õigel ruudul. Maailmakaardi teed on koledad ja detailkaardil lähevad läbi majade ja muude asjade.“
Muudetud on ainult välimust. Mänguloogika, teede võrk, navigeerimine ja salvestused on samad.

### Maailmakaardi maapind (`landscape-v149.js` `terrainMaterial`, world)
- Rohumaa toonid kolmes mõõtkavas: kuivem / lopsakam / nõmm, lisaks peen mustriline variatsioon.
- **Põllumosaiik asulate ümber**:
  - uus `CULTIVATION` DataTexture (1 tekseli kohta kaardiruut, lineaarne filter) ja `setCultivation(values)`;
  - `civilization.js` `refreshCultivation()` (iga `worldSync`, muutub koos `territoryStamp`-iga): linnaala 1, maakond 0,6, mets × 0,35, kõrb × 0,4;
  - varjutaja joonistab seal põllud (17 × 10,5 m, suund vahetub 90 m piirkondade kaupa): nisu, roheline vili, künnimaa, karjamaa, kõrrepõld, vaod ja hekid. Hekid hajuvad kauguses (`fwidth`).
- Maailmakaardi teed:
  - kitsamad (`[0,.85,1.1,1.4,1.75]`);
  - pinnas pehmema tooniga;
  - sillutatud tee on sile hallikaspruun riba ilma kivimustrita (maailmavaates nägi muster välja nagu redel).

### Teed detailkaardil (`continuous-landscape-visual.js`)
- `createUnifiedRoadNetwork(game, scope, tile, obstacles)`: detailvaates kasutab `steerAroundPlots()` tee kesktelge:
  - tihendab selle ~0,45 m sammuga kohalikesse ühikutesse;
  - lükkab punktid välja hoonekruntidest (`buildingClearance` + tee poollaius + 1,2);
  - silub ja kordab kuni 8 korda.
  Kaardist väljaspool olevaid punkte ei muudeta.
- `civilization.js` `plotRects(cell)`: aktiivse ja 8 naaberruudu hoonekrundid (müürilõigud välja arvatud). Tee ehitatakse uuesti, kui krundid muutuvad (`roadStamp` sisaldab kruntide templit).
- Kesktelg on testi jaoks kättesaadav: `group.userData.centrelines`.

### Rändajad detailkaardil (`detail-travellers-v157.js`, uus)
- Liikvel olevad asunikud (3 inimest pampude ja lipuga), maismaa kaubakaravanid (härg / hobune, vanker kaupade ja meeskonnavärvi kattega, kutsar) ja merekaubalaevad.
- Asukoht on sama, mis maailmakaardi markeril (`worldTravelSample`), projitseeritud kohalikesse ühikutesse (`worldToLocal`). Rändajad on nähtavad kogu 3 × 3 detailkaardil ja liiguvad sama tempoga. Seisvad rändajad ootavad linnasüdamest veidi eemal.
- Armeed näidati detailkaardil juba enne (`inspection()` / laagrid). Õhu- ja raudteeveod jäävad ainult maailmakaardile.

### Testid
- Uus `TEST_V157.mjs`: teede kesktelg on kruntidest väljas (≤ 2% punkte; keskaeg 1/1047, moodne aeg 3/627) ja karavan on detailkaardil nähtav.
- PASS: `TEST_V67`, `TEST_V156`, `TEST_V154`, `TEST_V149_BROWSER`, `TEST_V143_BROWSER`, `TEST_V88_EXPLORATION_UI`, `TEST_V151_BROWSER`, `TEST_V152`, `TEST_V123_UI`, `TEST_V133_BROWSER`.
- Debug: `gameDebug.v157()` → `{roads, plots, travellers}`.

## V158 – valgus, atmosfäär, sildid, elu, meri ja vanad mudelid (Claude, 2026-10-24)

Kasutaja palus parandada „mis veel hoiab välimust tagasi“ nimekirja. Muudetud on ainult välimust.

### Valgus ja atmosfäär – `atmosphere-v158.js` (uus)
- Varasem valgustus (poolkera + 2 suunavalgust) on asendatud:
  - soe päike, mille varjukast järgib kaamera fookust (varem oli detailkaardi varjukast fikseeritud ±85 ühikut keskel, seega mujal varje polnud);
  - poolkeravalgus ja nõrk täitevalgus;
  - ACES-toonivastendus (säritus 1,02).
- Gradientiga taevakuppel mõlemas stseenis. Detailkaardil on kauge maa „seelik“ (RingGeometry 330…5200, y −1,4), mis hajub udusse. Seelik on rannikul merevärvi (`setSkirt`).
- Maailmakaardil heidavad puud, metsad ja asulad varje, kui zoom < 480 ja kvaliteet ei ole „low“. Varjukaardile renderdatakse ainult lähedased tükid.
- Pilvede varjud: mõlema vaate maastikuvarjutajas `uT158Cloud` (`CLOUD_TIME`), samad maailmaruumi pilved.
- `addWind(material)`: puud, põõsad ja rohi õõtsuvad tuules (instantsi asukohast faas). Asulad kasutavad liikumatut `SETTLEMENT_MATERIAL`-i.
- `createBirds()`: väikesed linnuparved liuglevad fookuse kohal mõlemas vaates.

### Meri – `sea-v158.js` (uus)
- `seaMaterial`: värv sügavuse järgi (`aDepth` maailmameetrites), virvendus + päikesepeegeldus (normaali kalle), rannalained ja vaht.
- Maailmakaardi meretasand kasutab seda (`aDepth = .72 − atlasHeight`).
- **Detailkaardil polnud varem merepinda üldse** (meri oli hallikasroheline maapind). Nüüd tekib rannikuruutudel `createDetailSea` (tasand meretasemel, sügavus kohalikust maapinnast).

### Linnasildid (`atlas-style.js` `cityBanner`)
- Väike tume ümarate nurkadega silt: meeskonnavärvi kilp, nimi ja „👥 elanikud“. Ekraanil on see püsiva suurusega (`sizeAttenuation:false`), seega ei kata enam lähivaates linna. Eestikeelset „el. / elanikku“ teksti pole.

### Vanad mudelid uueks
- Maardlad (`createDepositPile`) on `world-models-v152.js` `depositGeometry`: kivi, raud (roostepunased sooned), vask (roheline malahhiit), tina, savi (madal küngas + loik), vääriskivid (lillad kristallid), nafta (tõrvalomp).
- Kaevanduskohad (`createMiningSite`) on `miningSiteGeometry`:
  - karjäär: kaljusein astangute, plokkide, kraana ja vankriga;
  - kaevandus: tunnelisuu künkas, rööpad ja maagivanker; sügav kaevandus (aeg ≥ 3): pukktorn ratta, masinamaja ja korstnaga;
  - saviauk: märg auk, savihunnikud ja kuivavad tellised;
  - kõigil on rusukuhi ja tööriistakuur.
  `userData` lipud (`extractionSite`, `underground`…) jäid samaks.
- Talu (`createFarmhouseModel`) ja põld (`createFieldModel`) on `town-models-v154.js` `farmhouseGeometry` / `fieldGeometry`: talumaja ajastu stiilis, küün, heinakuhjad, aed, joogiküna, vanker; põld vagude, viljaridade ja aiaga.

### Versioonid
`civilization.js?v=158b`, `atlas-style` → 158b, `landscape-v149.js?v=158a`, `world-models-v152.js?v=158a`, `ground-detail-v156.js?v=158a`, `site-models-v88.js?v=158a`, `farm-visuals-v127.js?v=158a`, `town-models-v154.js?v=158a` (kõik importijad sama spetsifikaatoriga).

### Testid
- PASS: `TEST_V48`, `TEST_V152`, `TEST_V154`, `TEST_V156`, `TEST_V67`, `TEST_V149_BROWSER`, `TEST_V143_BROWSER`, `TEST_V88_EXPLORATION_UI`, `TEST_V151_BROWSER`, `TEST_V157`, `TEST_V123_UI`, `TEST_V148_BROWSER`.
- `TEST_V88_SITES` kukub läbi ka ilma selle muudatuseta, sh V152 kõrgustega (rannakrundi kõrguse kontroll) – see ei ole V158 regressioon.
