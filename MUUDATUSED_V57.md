# Kuningriigid V57 — viis uut World Atlas 1000 GLB mudelit

- Uued 3D objektid: väikesed külad, iidsed varemed, kaljupaljandid, jõesillad ja metsagrupid.
- Kõik päris GLB-failid (1000 nelinurkse alggeomeetria piirang), koondfailid `assets/world1000/` kaustas.
- Uus `world-props.js`: GLB-de asünkroonne laadimine, templated külad/varemed ning metsade/kaljude/sildade GPU instancing.
- Uued 3D-objektid ilmuvad alles pärast maa avastamist (säilib olemasolev sõjaudu ja ühekordne leiupreemia).
- Olemasolevad linnad, vastased, teed, liikumine ja salvestused jäävad muutmata.
- Algusmenüüsse lisatud 3D-mudelite vaatur `MUDELID_WORLD1000.html`, käivitamiseks vajalikud GLB-d mängu enda `assets/world1000/` kaustas.
- Regressioonitestid: V50, V51, V53, V55 ning uus V57 GLB ja instancingu laadimistest läbisid. V56 pikk ühine testikäsk ületas keskkonna ajapiiri. WebGL-pildipõhist testi ei teostatud.

**Mudelitehas sertifitseerimine:** protseduurilised quad-OBJ allikad on auditeeritud; puuduvad vähemalt kolme sõltumatu vaate referentsid, mistõttu Mudelitehas 0.1.2 multiview-sertifikaati ei väideta. Põhiretseptid lisati GitHubi `orogdor/blender-cloud-test` alla.
