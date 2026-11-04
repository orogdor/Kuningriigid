# V302 — viis iseseisvat joonistatud UI-detaili

V301 ühe väljalõigatud pildi asemel on uus graafika igale alale eraldi: `ui-art-v302/header.webp`, `research.webp`, `minimap.webp`, `dock.webp`, `selection.webp`. Kõik viis on loodud eraldiseisvate piltidena, mitte ekraanitõmmisest lõigatud. Igal failil on läbipaistev välisala.

- Ülariba 1672×78, vasak avastuste paneel 240×342, vasak minikaardi paneel 343×318, alumised kuus kaarti 944×143, parempoolne valikupaneel 382×318.
- Alumine keskmine dokk on 20% madalam ning kuus pärgamendist kaarti jäävad teadlikult ilma ikoonide ja tekstita; praegused nupud ei kao DOM-ist ja on hiljem uuesti kujundatavad.
- Keskne 3D-maailm ei saa taustapilti: kõik viis asset'it asuvad ainult ekraani servades. Minikaardi canvas ja valitud üksuse portree on eraldi sisukihid.
- CSS peidab vana V301 ühetaustalise pildi ja dekoratiivsete elementide dubleeritud graafika. Üksuste, teaduse, zoomi ja menüü tegelikku käsuloogikat ei muudeta.
- Mobiilil ja väikeses aknas jätkub V298/V301 varasem paigutus; töölaual kasutatakse eraldi V302 illustratsioone.

Test: `node tests/ui-v302-pieces.mjs`. Päris brauseri visuaalne kontroll tuleb teha pärast Pagesi avaldamist; see test on staatiline ega tõenda pikslitäpset joondust.