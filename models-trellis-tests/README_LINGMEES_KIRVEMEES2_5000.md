# Lingmees ja kirvemees (2) — TRELLIS.2, ~5000 kolmnurka

| Fail | Enne | Pärast | Meetod |
|---|---|---|---|
| `lingmees_trellis2_5000.glb` | 97 486 | 4 975 | `tools/trellis_reduce_5000_blender.py` (Blender Decimate Collapse, algsed UV-d ja tekstuurid) |
| `kirvemees2_trellis2_5000.glb` | 96 831 | 5 083 | meshoptimizer (ainult asukohad) + `tools/trellis_bake_5000_blender.py` (uued UV-d, 1024 px värvi ülekanne) |

Kirvemehe puhul jäi Blenderi collapse ~15 700 kolmnurga juures kinni, seepärast teine tee.
Värv on küpsetatud premultiplied-kujul (TRELLIS hoiab tumedat karusnahka heleda RGB + madala alfana;
mängu laadija premultiplitseerib), nii et mängus näeb mudel välja nagu originaal. Metallic-roughness
tekstuur jäi ära (ühtlane karedus 0,85). Võrdlus: `previews/trellis_5000_lingmees_kirvemees.png`.
