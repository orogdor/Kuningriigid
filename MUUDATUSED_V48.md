# Kuningriigid V48 – kohandatud 1000/3 kerged 3D-mudelid

- 8 eraldi GLB-mudelit: lehtpuu, kuusk, palm, kaktus, kaljupaljand, elamu, turg ja tuulik.
- Kõigi mudelite algsed nelinurksed võrguosad jäävad alla **1000 nelinurga mudeli kohta**. Kolmnurkade arv GLB-s on suurem, sest glTF trianguleerib nelinurksed tahud.
- Maailmakaardi taimestik kasutab V48 3D-kujusid, mitte V47 lihtsaid koonuseid ja ikoosadreid. GPU instantsimine ühendab ühe mudelitüübi üheks joonistuskäsuks.
- Linna detailvaates on ressursipuud samuti V48 puumudelid. Maailmakaardi mõne ajaloolise linna siluetti täiendavad omaette 3D-elamud, turuplats ja tuulik.
- Kolm graafikataset säilivad; säästlikul ja keskmisel tasemel eemaldatakse osi ja vähendatakse objektide arvu jõudluse hoidmiseks.
- Erihoonete, sõdurite, majanduse ega AI mängureegleid ei muudetud. Olemasolevad salvestused jäävad loetavaks.
- 3D-mudelite testimise leht: `MUDELID_V48.html`. Mudelid asuvad `models-v48/*.glb` ning lähtefail `tools/generate_models_v48.py`.

## Mudelitehase töövoo olek

Mudelitehas 0.1.2 GitHubi töövoog leiti, kuid seda ei saa esitada kui suvalise objekti automaatgeneraatorit. Ametlik 0.1.2 nõuab uue mudeli enne meshi koostamist kolmes sõltumatus vaates kontrollitud punktipilve. Antud mudelid on **omaette protseduurilise nelinurkvõrgu retseptiga** ja ei ole sertifitseeritud Mudelitehas 0.1.2 täistöövoo rekonstruktsioonid. GLB-d ja masinloetav geomeetria on siiski päris mängu mudelid, mitte pildid.

## Kontrollid

- Programmiline geomeetria- ja GLB eksport ning piirangute kontroll.
- 3 kvaliteeditaseme ja 7 ajastu mudelite loomise Node/Three.js test.
- Täielik browser/WebGL kontroll on sõltuv testikeskkonna ligipääsust ja tuleb eraldi kinnitada.
