# V262 — TRELLIS.2 kiviaja sõdurid luustikuga

- Kirvemees, odamees ja lingmees on nüüd mängija TRELLIS.2 mudelid (~5000 kolmnurka igaüks,
  `models-trellis-v262/`). Need asendavad V261 riietatud V221 inimese.
- Mudelitel polnud luustikku. `stone-trellis-rig-v262.js` seob iga mudeli mängu enda 17 luuga
  V221 luustikule: tipp läheb lähima luulõigu külge, jäsemed ainult oma poolel, käed ainult
  kehast väljaspool, oda vars jäigalt parema käe külge, kaalud silutakse naabertippude vahel.
  Seega kasutavad sõdurid samu kõnni-, seismis- ja rünnakuliigutusi (V222/V261).
- NVIDIA Kimodo (Hugging Face, tekstist liigutused) vajab GPU-ga Space'i, mida siit kutsuda ei saa;
  liigutused on endiselt mängu enda protseduurilised animatsioonid.
- `?trellis262=0` näitab vana V261 välimust. Kui GLB ei lae, kasutatakse samuti V261 välimust.
- Mudelite vähendamine: `tools/trellis_reduce_5000_blender.py` (lingmees) ja meshoptimizer +
  `tools/trellis_bake_5000_blender.py` (kirvemees, odamees). Eelvaade: `preview-trellis-v262.html`,
  `previews/trellis-warriors-v262.png`.
