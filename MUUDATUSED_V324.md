# V324 – uus jõesuudme geomeetria ja üks veepind

Varem joonistasid jõgi ja meri samas suudmes eraldi läbipaistvaid pindu. V318–V323 püüdsid nende serva peita kõrguse, värvi ja alfa kaudu. V324 eemaldab selle kattumise: kogu ühendatud vesi tuleb ühest lõigatud kõrgusväljast ja ühest materjalist.

- Suudme nullpunkt leitakse tegeliku loodusliku ranniku lõikest; voolusuund järgib jõe keskjoont. Kanal jätkub vee all ja laieneb sujuvalt.
- Kallas süvendatakse ümara ristlõikega. Vana kõrgendatud jõekallas eemaldub ranniku lähedal, et see ei jätkuks liivavallina merre.
- Detailruutude piiridel on sama globaalne kõrgus- ja sügavusarvutus. Meri ja jõgi ei saa moodustada kahte eri kõrgusega või eri tooniga kattuvat kihti.
- Maailmakaart kasutab kohanduvat võrku: avamerel hõredam, jõe ja suudme ümber tihedam. Detailkaart kasutab kvaliteeditaseme järgi 48/72/100 sammu ruudu kohta.
- Füüsilised jõgede arvutused ja salvestuse andmed säilivad; kiviaja koolmete koht ja madal põhi säilivad. Arvuti 5×5 detailala ning V320 taimestiku laadimise järjekorda ei muudeta.

## Kontroll

Kõik 102 senist CI kiirkäsku läbisid. Uus `tests/estuary-v324.mjs` kontrollib seemneid 77, 12345 ja 20261103: 160 suuet ja 18 420 punkti, avatud kanalid, merepinna kõrgus, puutumata salvestus, naaberruutude täpselt kattuvad servad. V314 jõekujude ja V286 madala maailma-jõesängi kontrollid läbisid. `tests/water-material-v324.mjs` kontrollib WebGL-i varjutajakoodi ühendamist ja koostab päris WebGPU WGSL-i.

`reports/estuary-v324-ci.json` sisaldab kiirkontrollide väljundit. Uue testiga saab taastada väikese pärismaailma geomeetriaandmestiku ja avada `tests/estuary-v324-preview.html`. Geomeetria vaadati üle ka eraldi Blenderi renderduses; see ei ole tõend Three.js mängu GPU-pildi kohta. Selle keskkonna Chromium ei saanud käivituda ning pilvebrauser ei pääsenud kohaliku eelvaateni. Seetõttu on päris mänguvaate ja kasutaja olemasoleva salvestuse visuaalkontroll veel vajalik.
