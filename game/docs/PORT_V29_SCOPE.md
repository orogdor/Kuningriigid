# Godot 2.9 — välimaastikul lahingu katse

* Maailmaruudu olemasolevad 9×9 kõrgusproovid toidavad väikese (64×50 m) lahinguvälja geomeetriat.
* Liikumine: mere- ja kalju-, jõe- ja takistusekontroll; 2m võrgul BFS-ümbersõit, iga sõduri marsruut salvestatakse.
* Nõlva liikumiskiirus ja reljeefist tulenev lihtsustatud nähtavuskontroll.
* Sillal kasutada olemasolevat atlasülesõitu (kui see paikneb valitud ruudul).
* Eraldi 192 sõduri menüütest 'Maastikulahing: 192 meest'.
* Reljeef renderdatakse SurfaceTool abil, jõed ja sillad lihtsustatud 3D-s.
* Uued CSV-mõõdikud `terrain_battle_routes`, `terrain_battle_blocked`.

**Piirangud:** see on väiksem lahingukatse, mitte täielik V131 3×3 detailruuduga lahinguväli.
Füüsikakere/CharacterBody3D ja animatsiooniga kõrguslik navmesh pole lisatud.
Piiramisareen jääb eraldi varasemaks katserežiimiks.
Lahingureeglite täielik 1:1 vastavus puudub; Godoti parserit ja Androidi käivitamist ei ole siin testitud.
