# V131 → Godot 4: natiivmootori asenduste arvestus (0.4)

Lähteversioon: GitHub `orogdor/Kuningriigid`, commit `26562368f56a32616651a266ed2d8c87f06d43d1`. Uuemate veebiversioonide muudatusi see ZIP ei sisalda.

| V131 osa | Godoti rakendus | Täpsus |
|---|---|---|
| Three.js `Scene`, `Camera`, valgustus | `Node3D`, `Camera3D`, `WorldEnvironment`, `DirectionalLight3D` | Mootori asendus, mitte välimus 1:1 |
| `Mesh`, korduvad hooned/sõdurid | `MeshInstance3D`, `MultiMeshInstance3D`, `SurfaceTool` | Staatiline renderdus; animatsioonid puuduvad |
| V50 GLB sõdur/tööline, world1000 GLB küla/mets/kivi | `GLTFDocument` + `HTTPRequest` + `FileAccess` | Originaalfailid laaditakse võrgust V131 commitist, pole ZIP-is |
| `campaign.js` neljasuunaline maailmakaardi BFS | `campaign_port.gd` (säilitatud) | Tee eelistus/sammude järjekord porditud |
| Godoti `AStarGrid2D` | `native_grid_path.gd`, valikuline | EI OLE samaväärne V131 BFS-iga |
| `roads.js` | `roads_port.gd` | Liikluse lävendid ja kulumine porditud |
| `counties-v126.js` | `counties_port.gd` | Osaline ruutude loogika |
| `economy.js` hoonete põhidefinitsioonid | `economy_port.gd` | 17 põhihoone kulud, eeldused, tootmissisendid |
| `research.js` hoone avastuse kontroll | `building_rules_port.gd` | Valitud ehitiste tehnoloogialukud |
| `labor.js` | `building_rules_port.gd` | Elamumaht ja tööjõu efektiivsuse valem |
| V131 linna detailkaart / hoonete valik | `native_city_buildings.gd` | Ainult natiivsed testiproksid, mitte originaalne detailkaart |
| V131 simuleeritud linnamajandus | `preview_sim_port.gd` | Osaliselt ühildatud katsemajandus; tootmine on lihtsustatud, ei ole 1:1 |

## Konkreetsed 0.4 parandused

1. Hoone ehitamise katse kontrollib nüüd hoone eeltingimusi, vajalikku tehnoloogiat, ressursse ja 12 ootel ehitise piiri üle sama riigi linnade.
2. Põhiehitiste kulude/saaduste definitsioon sisaldab nüüd valitud algse V131 `economy.js` andmeid; need ei ole uus välja mõeldud hoonete nimekiri.
3. Tööjõu efektiivsuse funktsioon `pow(min(1,assigned/required),.85)` ja halli/elamu elamumaht on V131 `labor.js` järgi.
4. Kõigis 14 proovialal on natiivse Godoti `MultiMeshInstance3D`-ga kerge ehituspaigutuse visualiseering. Hooned paiknevad kunstlikus spiraalis, et kontrollida erinevat vormi, mitte V131 tegelikel koordinaatidel.
5. Koormuskatse jääb 150/500/1200 tegelase ning 20 sekundi kaadriaja mõõtmise juurde.

## Kindlad piirangud

- Godoti binaar pole siin kättesaadav; automaatsed Godoti reeglitestid ei ole **käivitatud**. Paketi staatilised kontrollid ei asenda Godoti kompileerimist ega telefoni läbimängu.
- Ei sisalda Androidi APK-d, algse V131 V4 salvestuse laadimist ega võrreldavat terviklikku linnamajandust.
- V131 võrdlemiseks tuleb portida tegelik maailmaseis, ressursideposiidid, töötajate logistikakäigud, sõja-AI, linnade täpsed 3D-mudelid ja animatsioonid.
