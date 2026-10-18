# Kuningriigid V58 — maailmaobjektide ja avastamise täpsustused

## Muudatused
- V57 viis päris GLB-objekti on mängus edasi kasutusel: küla, varemed, kaljupaljand, sild ja metsagrupp.
- Kaljude ja metsagruppide valik jaotub üle kogu kaardi: suure kaardi esimeste ridade ületäitmine on eemaldatud.
- Graafikakvaliteet määrab dekoratiivsete objektide ülempiiri (madal 50%, keskmine 75%, kõrge 100%); teetähiste seisukohalt olulised sillad säilitavad sõltumata kvaliteedist sama ülempiiri.
- Maavarade nähtavad tähised uuenevad nüüd ka siis, kui avastaja avab samas piirkonnas uusi ruute, ilma et mängija peaks kaamerat liigutama.
- Algusmenüü kirjeldus ja versioon on V58. Peamise JS-mooduli URL ja maailmaobjektide import saavad uue versiooni päringu, et vältida brauseri vana koodi kasutamist.
- Olemasolevaid mänguseisu/salvestuse formaate ei muudetud.

## Kontrollid
- Windows / Node 24: `node --check world-props.js` ja `node --check civilization.js`: läbitud.
- `node TEST_V57.mjs`: läbitud; kõik viis GLB-d laeti ning avastamata objektid jäid peidetuks.
- `node TEST_V58.mjs`: läbitud; mahupiirid, piirkondade katvus, avastamisel nähtavaks muutumine ja sillad.
- V56 regressioonitest ühe seemnega (17): läbitud — 118 külastatud ruutu, 8 tagasipõrget, 327 avastatud ruutu ja 182 teed.

**Piirang:** reaalset WebGL-kuvatõmmistega visuaaltesti ja V56 kõigi viie seemne täistesti ei tehtud.
