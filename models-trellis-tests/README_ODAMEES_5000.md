# TRELLIS.2 odamees – 5000 kolmnurga katse

Lähtefail: Hugging Face `Orogdor/Kuningriigid-TRELLIS2-StoneAge/odamees_trellis2_original.glb`.

## Võrdlus
| Näitaja | Originaal | Uus |
|---|---:|---:|
| Kolmnurgad | 99 950 | 5 000 |
| GLB suurus | 3 570 468 baiti | 446 592 baiti |
| Ühendatud komponendid | 6 | 6 |
| Suurim ühendatud osa | 96 982 (97,031%) | 4 883 (97,66%) |
| Pinnapindala (mudeli ühikutes²) | 0,23800 | 0,23969 |
| Nullpindalaga kolmnurgad | 0 | 0 |
| UV-koordinaadid ja PBR-tekstuurid | Jah | Jah |
| Luustik/animatsioon | Ei | Ei |

## Töötlus
Blender 4.3.2. Algne GLB imporditi ja dubleeritud tipud ühendati 0,000005 mudeliühiku täpsusega, säilitades UV-seam'id. Rakendati **Decimate > Collapse**, siht umbes 5000 kolmnurka. GLB imporditi uuesti ning kolmnurki kontrolliti eksporditud failis: täpselt 5000.

Mudeli kõrgus originaalkoordinaatides on umbes 0,389 ühikut, seega mängu laadimisel tuleb kõrgus eraldi normaliseerida. Võrdluspildil on mõlemad võrdse suurendusega.

**Testmudel, mitte vaikimisi mängus olev sõdalane**. Puuduvad luustik ja animatsioon, nõuab enne mängu integreerimist rig'imist ning visuaalset kontrolli mängukaameras.

Failid:
- `models-trellis-tests/odamees_trellis2_5000.glb`
- `previews/odamees_trellis2_5000_vs_original.jpg`
- `tools/odamees_trellis_5000_blender.py`
