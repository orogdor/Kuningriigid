# Kuningriigid V131 Godot 0.7 – tehniline seis

Lähtesüsteem: GitHub orogdor/Kuningriigid commit `26562368f56a32616651a266ed2d8c87f06d43d1`.

## Koodi sisse viidud

- `scripts/core/cargo_port.gd`: V131 `economy.js` põhjal kohalik veojärjekord, otseteeline liikumine, lao/keldri valik, lao täitumine, viivitusega tarne, salvestatav andmeolek.
- `scripts/core/production_port.gd`: valikuline `transport=true` lülitab vahetu lao krediidi asemel asünkroonse veo sisse; eraldi reeglitestide jaoks jääb vana otsetoetamine.
- `scripts/adapters/native_cargo_view.gd`: veoste natiivne Godot MultiMesh 3D-kuvamine.
- `scripts/core/preview_ai_port.gd`: toidu-, vee-, puidu- ning majapuuduse reaktsioon enne ehitusjärjekorda; tehnoloogia ja tooraine kontroll.
- `scripts/core/preview_sim_port.gd`: toodangu veoahel integreeritud 1 sekundi simulatsioonisammuga.
- 18 uut kontrollväidet; kokku 107 Godot-käivitusega testi.

## Järgmised vajalikud tööd

- V131 detailkaartide mõõtkava, päris majade asukohad, tänavagraaf ja `nav.moveCitizen()` – praegused veosed liiguvad lihtsustatud otsejoonel.
- V131 ehitajate füüsiline jaotus ja maardlate arvutus.
- Täielik mitme linna AI prioriseerimine, kaubandus (sh riikidevaheline), armee ja lahingud.
- **Godot 4 käivituskontroll**, mida siin ilma mootorita teha ei õnnestu.

## Kinnitus

Tehtud: kontrolliti kohalikke failiviiteid, JavaScripti lähtekoodi vastavust, ZIP terviklust ja Python-põhiseid struktuuriväiteid.
Ei tehtud: GDScript kompileerimine, Godot 4/Android käivitus, 107 kontrolli käivitamine ning V131-ga 1:1 jõudlusvõrdlus.
