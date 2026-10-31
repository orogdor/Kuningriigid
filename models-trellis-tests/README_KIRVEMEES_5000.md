# TRELLIS.2 kirvemees – uus 5000 kolmnurga katse

Lähtefail: Hugging Face `Orogdor/Kuningriigid-TRELLIS2-StoneAge/kirvemees_trellis2_original.glb`.

- Originaal: 99 755 kolmnurka, 73 422 GLB-tippu.
- Uus eksporditud fail: **4 999 kolmnurka**, umbes 516 kB; algsed WebP tekstuurid ja UV-koordinaadid säilitatud.
- Protsess: Blender 4.3, alguses ühendati 5 µm raadiuses ühes kohas asuvad tipud (UV-õmblused säilivad); seejärel Blenderi Decimate Collapse (siht 5000), GLB eksport.
- Geomeetriakontroll: 8 ühendatud komponenti, neist suurim 4 992 kolmnurka (99,9%); algsel mudelil oli 10 komponenti, suurim 99,8%.
- Algne pindala ~2,233, uus ~2,212 ruutühikut. Piirkarbi mõõdud on sarnased.
- Eraldi renderdatud algne ja vähendatud mudel; ei näita V259 geomeetriakatkestuste probleemi.
- **Luustik puudub**, mudelit pole mängus aktiveeritud. Järgmine samm on rig/animatsioon ja mängus jõudluskontroll.

Mudel: `models-trellis-tests/kirvemees_trellis2_5000.glb`.
Võrdluspilt: `previews/kirvemees_trellis2_5000_vs_original.jpg`.
Skript: `tools/axeman_trellis_5000_blender.py`.
