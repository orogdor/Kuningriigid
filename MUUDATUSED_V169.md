# Kuningriigid V169 – kiviaja kindlustatud küla tasakaalustus

Eesmärk: enne pronksiaega AI linnale päriselt ehitatud (mitte tasuta) puidust kaitsering, millel on kaks kasutatavat väravat, neli vahitorni ning maastikuga sobivad palisaadid.

## Parandused

- **Kogu müürikoridori kontroll:** pika palisaadilõigu keskpunkti asemel kontrollitakse kogu lõiku, et see ei läbiks jõge, järve ega muud läbimatut maastikku.
- **Rohkem asukohavariante:** planeerija võrdleb ka kuni 14 mänguühiku võrra nihutatud ringe ning väldib ehitiste ja maardlate koridore.
- **Kompaktne ajalooline südamik:** kaitsering eelistab esimest 90% keskuse ümber koondunud elumajadest. Äärelinna või tootmismaja võib jätta kaitseringist välja.
- **Turvalisem pealinna asukoht:** AI esimese linna asutamise eel kontrollitakse, kas kahe värava ja nelja torniga palisaad mahub kuivale pinnale. Kui algne rannaruut on liiga kitsas, saab AI valida maksimaalselt ühe naaberruudu kaugusel asuva sobiva koha, kus on päris puidu- ja kivivarud ning olemasolevat mööda maad juurdepääsu.
- **Ajastute tasakaal:** juba alustatud müüriringi ei jäeta pooleli pelgalt sellepärast, et küla rahvaarv ajutiselt langes. Kiviaja piduril on endiselt 110 käigu ülempiir.
- Olemasolevaid ehitisi, salvestatud linnade koordinaate ega mängija asuniku otsuseid ei muudeta. AI peab kõik puidust kaitserajatised tavapäraselt ostma ja ehitajatega valmima.

## Testimise viis

- `TEST_V169_FOUNDING.mjs`: rannaruudul olevate piirangute tuvastamine, tegeliku kuiva naaberruudu valimine, algsete maavarade nõue, mängija asuniku puutumatus.
- `TEST_V166_STONE_FORTS.mjs`: materiaalsed ehituskulud, kaks läbitavat väravat, tornid, AI ajastuvahetuse regressioon.
- `TEST_V139.mjs`, `TEST_V160.mjs`, `TEST_V163_STONE_CITY.mjs`: vanad linnaplaneeringu, pronksiaja ja elamutsooni regressioonid.
- `scripts/stone-fort-balance-v167.mjs`: 3 maailma × 3 AI pealinna × kuni 125 käiku; mõõdetakse täieliku müüriringi valmimist viimaseks kiviaja käiguks.

Täpsed arvud ja GitHub Actionsi artefaktid on `.github/workflows/stone-forts-v167.yml` testikäivituse juures.
