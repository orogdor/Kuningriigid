# Kuningriigid V59 — liiklusest kujunevad teed ja sujuv maailmakaart

- **Maailmakaart:** üksik läbimine salvestab ainult nähtamatu kulumisjälje; umbes neli järjestikust armee läbimist samal lõigul annavad esimese nähtava jalgraja. Kaubavedu koormab rada rohkem. Hilisemad teetasemed vajavad suuremat liiklust, kasutamata rajad kuluvad aegamisi.
- Nähtamatu kulumisjälg ei käivita iga sammu järel kallist teede ümberjoonistamist. 1,5× kiirusboonus avaneb vaid reaalselt välja kujunenud rajal.
- **Detailkaart:** ühe kohaliku läbimise järel teed ei kuvata. Sama koridori korduv kasutamine kasvatab teed ning varem eraldi kuvatud rattad/jäljed seotakse maapinna kõrgust järgivaks ribaks.
- **Maailma- ja detailkaardi seos:** liiklusest tekkinud nähtav maailmatee joonistatakse ka ruudu detailkaardile. Detailtee otsib läbitava marsruudi, hoidudes hoonetest ja tõketest; avastamata naaberruudu teid ei paljastata.
- **Sujuvad üksused:** asunikud, armeed, kaubavankrid, rongid ja laevad joonistatakse ruutude vahel liikumas vastavalt nende tegelikule liikumiskellale. Lahingu- ja mängureeglite jaoks säilib ruudupõhine loogiline asukoht.
- Salvestusvorming jääb samaks: maailmateede `worldRoads` ning detailkaartide `world.heat` jäävad salvestatuks. Olemasoleva salvestuse rada võib uue kõrgema nähtavuslävendi tõttu paista nõrgem.
- Mobiilibrauseri aegunud moodulite vältimiseks tõsteti olulised impordid V59 peale.

## Kontrollid
- `TEST_V59.mjs` läbitud: 1 läbimine ei tekita nähtavat teed, 4 armee läbimist tekitavad, salvestatud liikluskoormuse alusel tekivad detailriba geomeetriad ja üksused liiguvad sujuvalt.
- `TEST_V57.mjs` ja `TEST_V58.mjs` läbitud.
- V56 avastaja/teede regressioon seemnega 17 läbitud: 117 külastatud ruutu, 8 kaheruudulist tagasipõrget, 327 avastatud ruutu ning 180 liiklusjälge.

Eraldi WebGL-kuvatõmmistega testi tulemused kirjeldatakse vajaduse korral eraldi; Node.js-i läbimine üksi ei taga visuaalset täiuslikkust.
