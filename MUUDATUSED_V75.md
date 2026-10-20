# Kuningriigid V75 – maailmakaardi objektid detailkaardil

V75 jätkab V74 mängu ja V73 salvestussüsteemi. Mitte ühtegi kaarti, linna, uurimist, üksust ega salvestust ei lähtestata; salvestusvorming on jätkuvalt `version: 4`.

## Parandus
- **Sõbralikud külad ja muistsed varemed (43 põhiobjekti):** iga `state.landmarks` objekt on sama ruudu detailkaardil päris 3D-geomeetriana, mitte ainult kaardiikoonina. Külastatud/auhinna andnud koht ei kao ära, vaid säilitab `claimedBy` oleku.
- **Maailmakaardi metsakogumikud, kivipaljandid ja sillad/koolmed:** kasutatakse täpselt sama V58 asukohtade valiku algoritmi mõlemas kaardivaates; kvaliteediprofiil määrab mõlema vaate nähtavate dekoratsioonide hulga.
- **Mudelite jagamine:** mõlemad vaated kasutavad viit olemasolevat `assets/world1000/*.glb` faili. Kui GLB pole veel laaditud, on detailis lihtne ajutine 3D-mudel. Mudeleid ei kopeerita salvestuse sisse.
- **Aktiivne detailruut ja kaheksa naabrit:** naabrite mudelid on naaberruudu maastikul, mitte kogemata aktiivse ruudu keskel.
- **Maastiku asukohad:** juba olemasolev ühine jõgede, pinnavormide ja teede projitseerimine jääb alles.
- **Sõjaüksused, linnad ja hooned:** olemasolevat detailkaardi süsteemi ei asendatud.
- **Sõjaudu:** detailvaade ei paljasta avastamata ruutudel peidetud külasid ja varemeid.
- **Jõudlus:** kaugelseisva avastaja uued nähtavad ruudud ei põhjusta iga kord detailvaate mudelite taasloomist, kui kohalikud objektid pole muutunud.

## Testid
- `TEST_V75.mjs`: kõik maailmakaardi 3D-objektide asukohad võrreldakse detaili asukohtadega; kontrollitakse 43 küla/vareme mudelit, GLB laadimist, varasemat salvestust ja kordusavastamise olekut.
- `TEST_V75_UI.mjs`: telefoni Chromiumi emulatsioonis iga viie objektitüübi detailkaardil avamine, auhinna saanud küla püsimine ja arvutivaade.
- `.github/workflows/v75.yml`: V55/V58/V65/V72/V73 vanad testid koos uute V75 testidega.

**Füüsiline Android/PC test:** automatiseeritud Chromiumi test ei kinnita lõplikku jõudlust konkreetsel kasutaja seadmel.
