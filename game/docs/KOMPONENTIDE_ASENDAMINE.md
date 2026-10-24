# V131 -> Godot 4 mootorifunktsioonide audit

Lähteseis: GitHubi commit `26562368f56a32616651a266ed2d8c87f06d43d1` (V131).

| JS fail/funktsioon | Godoti lahendus | Staatus v0.3 | Mida EI tohi kaduma lasta |
|---|---|---|---|
| `vendor/three.module.js`, `T.Scene`, `T.WebGLRenderer` | `Node3D`, `RenderingServer`, Godoti renderer | mootori asendus | Samad valguse, varjude, resolutsiooni seaded tuleb võrdsustada enne FPS võrdlust |
| `T.PerspectiveCamera`, input-gestures | `Camera3D`, `InputEventScreenDrag`, `InputEventMagnifyGesture` | olemasolev kaamera, parandatud pinch | Originaalne kaamera FOV, mõõtkava ja kaartide vahetus on teistsugused |
| `MeshStandardMaterial`, `BoxGeometry`, `BufferGeometry` | `StandardMaterial3D`, `BoxMesh`, `ArrayMesh` | baastugi | Dünaamilised hoonemudelid alles eraldi ekspordiks |
| `.glb` mudelid V50 ja world1000 | `GLTFDocument.append_from_buffer()` | lisatud allalaadimine + vahemälu | Vajab esimesel avamisel internetti; GLB-d ZIP-is ei sisaldu |
| `soldier-batch-v90.js` | `MultiMeshInstance3D` | GLB võrgud grupeeritakse materjaliti | Skinned animatsioonid ei ole veel üle viidud; need on staatilised mesh-batchid |
| `campaign.js` maailmakaardi BFS | sama neljasuunaline BFS `campaign_port.gd` | üle kantud | Godoti AStar erineb võrdsete teede korral; A* ainult valikuline võrdlustest |
| `roads.js` | `roads_port.gd` + native `ArrayMesh` | osaline | Teejälje kasvu ja kulumise läved jäävad identseks |
| `counties-v126.js` | `counties_port.gd` + native pindade joonistus | osaline | Maakonna piirid/linnade kaugused peavad ühtima |
| `snapshot-v131.js`, Worker | Godoti `JSON`/`FileAccess` ja Thread | ainult eraldi katsesalvestus | V4 salvestuse 1:1 import veel puudub |
| `civilization-core.js`, AI, lahingud | GDScript või natiivne laiend | SUURELT OSALT PUUDU | Mängureegleid ei tohi vaikimisi asendada Godoti füüsikaga |
| `navigation.js` detailkaardi tööliste teed | NavigationServer3D või oma A* | PUUDU | Takistuste muutusnumbrid, 3 korra rajaõpe ja determinism säilitada |
| `hud-v*.js`, HTML/CSS | Godot Control/Container | ainult test-HUD | Täielik mobiili UI ja tehnoloogiapuu puudu |

## Olulised piirangud

1. Godoti sisse ehitatud lahendus ei tee **iseseisvalt** V131 majandust, tehnoloogiaid, armeede taktikat ega AI otsuseid.
2. Godoti `NavigationAgent3D` takistuse vältimine ei asenda V131 lahingu ja armee möödumise reegleid ning võib muuta tulemusi.
3. V0.3 uutest GLB-mudelitest kuvatakse **staatiline lähtepoos**; see ei ole identne Three.js-i animeeritud sõduritega.
4. Godoti `MultiMesh` vähendab draw call'e, kuid ka see EI anna automaatselt võrreldavat FPS-i: renderduse nähtavus, varjud, animatsioonid ja koormus peavad vastama V131-le.
5. Kõik varad on lukustatud V131 commiti külge, mitte liikuva `main` haru külge.
