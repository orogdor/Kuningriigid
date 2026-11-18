# V358 – Food cellar, uus geomeetria (2026-11-18)

## Põhjus
Vana pronksiaegse toidukeldri `cellarChamber` ehitas liiga suure mullakatte, mille ristlõiked ei lõppenud keldri seintel. Muld nägi välja nagu seinte kohal rippuv eraldi koorik. Kivivõlv, otsaseinad ja katus ei moodustanud ühtset konstruktsiooni.

## Muudatused
- `majaehitaja/index.html` `cellarChamber` kirjutati uuesti. Ristlõike aluseks on ehitise tegelik piirjoon ja ukse suund.
- Alumised kivimüürid ning ukse piidad, kivist sillus ja lävepakk töötavad ka katust peites.
- Katus on elliptiline kivist silindervõlv: eraldi sisepind, välispind ja suletud esi- ning tagumine otsasein.
- Kivivõlvile järgneb vahetult õhuke, maheda kõrgusvariatsiooniga muld- ja mätaskate. See lõpeb enne sissepääsufassaadi ega rippu üle katuse.
- Eemaldati vana lai, hoonest väljapoole ulatuv mullavall; kõik muud hoonetüübid jäävad samaks.
- `house-builder-v355.js` genereeriti uuesti ametliku skriptiga `node tools/house-builder-v355/build.mjs`.
- `house-designs-v354.js` mudeli vahemälu versioon tõsteti `358a` peale, et vana mudel ei jääks IndexedDB-st nähtavale. Sama versiooniga uuendati mooduli päringut ja vastavat testi.

## Kontrollid
- Windowsi eraldatud testkataloogis: `node --check house-builder-v355.js` ja `node tests/house-builder-v355.mjs` edukad.
- Chrome'i võrdlustestis sai kujundaja iframe'i eksport täpselt sama geomeetria, materjalikirjeldused, tekstuuriviited ja kokkupõrkeandmed kui otse moodulis: `cellar` ja `cellar@2` mõlemad läbisid.
- GitHub Actionsi ajutine ühekordne regenereerimise töö: run `44245487008`, edukas. Ajutine töövoog ja parandusskript eemaldati pärast genereeritud failide salvestamist.
- Päris mängus täieliku tekstuurikomplektiga visuaalset ülevaatust ega Windowsi native-mootori FPS-katset selles muudatuses ei tehtud.

## Edasine hooldus
Keldri geomeetriat tuleb muuta kujundaja lähtefailis ja seejärel käivitada `node tools/house-builder-v355/build.mjs`; genereeritud `house-builder-v355.js` ei ole iseseisev lähtefail.
