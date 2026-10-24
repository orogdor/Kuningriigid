# Godot v2.6 – atlas-maastiku ühine geomeetria

- V131 lähtekoodi võrdlus: `landscape-shared.js`, `world-details.js`, `detail-scale-v123.js` pinnavõrk ja 225×195 detailruudud.
- `scripts/core/shared_landscape_v131.gd` loob *deterministliku, aga ligikaudse* jõevõrgu samadest 220×165 maailma kõrgustest. See EI OLE originaalse V131 jõeatlase täpne kaart.
- Jõesegmendid on maailma koordinaatides; maalimine ja A* kasutavad neid läbi ühe ja sama `segments_for` lõikamise.
- Kõrgused proovitakse ühest `height_at` funktsioonist: ranniku ja kaljude piirid on samad nii 3D maastikul kui detailnavis.
- `Ühise atlase jõgi` avab esimese nähtava jõe detailruudu. `Atlase sild` sulgeb/avab kohaliku ületuskoha. V2.5 sünteetiline sillakatse jääb regressiooniks alles.
- Sillad ei ole veel maailmakaardi teevõrgu automaatsed sõlmed. Päris V131 jõgede lähteandmed, suudmealad, jõepõhjad, kõrgusjooned ja teede kooskõlastatud sillad tuleb veel pordida.
- Testimine: eraldi Pythoni numbriline seam/clip/determinismi test ja projektis GDScript reeglikontrollid. Godot/Android runtime pole käivitatud.
