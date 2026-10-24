# V131 → Godot 4 pordi 0.6 täpne ulatus

Lähtekood lukustatud [V131 commitile](https://github.com/orogdor/Kuningriigid/commit/26562368f56a32616651a266ed2d8c87f06d43d1). Natiivse Godoti renderingut, MultiMeshi, puutetundlikku kaamerat ja maastikuproksisid ei tõlgitud Three.js-ist 1:1 — Godot asendab mootoriosa.

## Sel korral üle kantud / parandatud

- `scripts/core/demographics_port.gd` põhineb algsel `economy.js/tickEconomy` rahvastiku minutitöötlusel: toidu ja vee kogused (0,60 / 0,45 elaniku kohta), kuld + elanike arv minutis, elamumaht, kasvuprogress `(2,3 + pop*0,28)`, varude 1,2 kasvukordaja ja kolmanda puudusminuti järel -1 elanik (min 3). **Erinevus:** pole peremajade ladustatud toitu ja turu tarneid.
- `scripts/core/production_port.gd` põhineb algse `tickEconomy` tootmistsüklil: `timer += dt * efficiency * bonus / 4,5`, iga `cycle` järel täismahus `rate` toodang, täismahus `input` kulu, ladude piirang ja vilja/jahu eripiirangud (55%/42%). **Erinevus:** valminud toodang läheb katses kohe lao arvele, mitte ei liigu kandjaga.
- `scripts/core/research_port.gd` kontrollib ajastute väravaid samamoodi nagu `research.js/techBlock`; järgnev ajastu avatakse alles selle ajastu avastuse kaudu.
- `scripts/core/research_planner_port.gd` lahendab V131 `nextResearchForGoals` eeskujul eeldused, ühest-mitmest tingimused (`oneOf`) ja ajastute väravad. AI eesmärkide järjestus järgib algse `civilization-core.js` loetelu, kuid ei sisalda sõjaväeliselt tasakaalustavaid filtreid.
- Lisatud mängupõhiste hoonete hulgast `hunter` (liha, 27 puitu pärast V33 tasakaalu), `fisher` (kala), `study`, `warehouse`, `cellar`, `market`. Teised baasdefinitsioonid on endiselt osaliselt lihtsustatud ja algse V131 täpne ehitusmajandus pole veel täielik.
- `scripts/core/labor_port.gd` lubab teadushoonetele tööjõudu määrata ka ilma tootmise `out` väljata.
- `preview_sim_port.gd` jagab pika ajasammu kuni sekundilisteks osadeks ja 12-/60-sekundiliste sündmuste piiridel; sama reeglit kasutatakse reaalajas ja +10 min kiirtestis.
- Eelnevate `v02/v05` katsesalvestuste lugemise tugi; uus fail `user://v131_godot_preview_v06.json`. See ei ole algse Three.js-i V4 salvestus.
- `tests/port_checks.gd` nüüd 89 **ettevalmistatud** väidet (+24), sealhulgas elanike kasv, puudusest tingitud kahanemine, teaduse väravad, sisenditega tootmistsüklid ja kiirtesti ajaterviklus.

## Nüüdki veel EI OLE tehtud

- V131 `civilization-core.js` kogu süsteem, päris AI `ai-strategy.js`, sõdurite üksuste liikuvus ja lahingumootor.
- 1:1 detailkaart, 3D-hoonete lõplikud mudelid, tööliste teekonnad, ressursiobjektide kaevandamine, transport ja kaubandus.
- V131 päris salvestuste lugemine, telefonis Androidi APK ning võrreldava koormusega FPS-test.

## Kontrollitavus

Projekti sidumise, ZIP-i ja 89 kontrolli olemasolu kontrollitakse Pythoni skriptidega. **Godot 4 käivitamist, parserit, GDScripti 89 testi ja Androidi jõudlust pole siin kontrollitud.** Kohalikus masinas puudub Godoti mootor ning seotud Windowsi arvuti oli kontrollimise ajal võrguühenduseta.

## Testimine Androidi Godot Editoris

1. Paki ZIP lahti ja impordi `project.godot`; käivita ▶.
2. Vajuta `Reeglitest`. Kui tulemuseks ei ole `89/89`, saada kuvatud vead.
3. Vajuta `AI sisse/välja`, siis `+10 min katseaega`. Näed rahvaarvu, tootmistsükleid ja puudusminutite arvu.
4. Vajuta `20s test`: saad mõõtmiste CSV-i Godoti `user://` kausta; see ei ole veel V131 veebimänguga üks-ühele jõudlusvõrdlus.
