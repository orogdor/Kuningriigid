# V276 — külad kahte tüüpi, kauplemine, röövretked, rahuaeg, jõekaldad

- **Parandus (V274 viga)**: puude looduslik uuenemine viskas mängus vea iga 30 s järel, kui linn oli olemas
  (otsis hooneid valest kohast). Parandatud ja testiga kaetud.
- **Külad** on tehtud samadest kiviaja hoonetest kui mängija linnad (maailmakaardil V269 mudelid,
  detailkaardil mängija enda hoonemudelid) — kaks tüüpi (`villages-v276.js`):
  - **Röövlite küla**: palisaadiring väravaga, 4 vahitorni, sõdalaste laager ja lasketiir. Pärast rahuaega
    saadab ~7 min tagant röövsalga lähima linna poole (kuni 14 ruutu) — saad **hoiatuse** kohe, kui salk teele
    asub; salk on maailmakaardil näha. Palisaad/vahitorn või ≥ 2 sõdalast linnas lööb nad tagasi, muidu viivad
    nad 25 % toidust, puidust, kivist ja kullast (kuni 60 igast). Skaut ei saa röövlite küla hõivata.
  - **Kaupmeeste küla**: avatud küla keldrite, talude ja potiahjuga. „Linn“-nupu nimekirjas on jaotis
    „Kaubavahetus“: müü puitu, kivi, savinõusid; osta toitu, savi, laudu — sinu lähim linn kuni 22 ruudu kaugusel.
- **Rahuaeg**: uues mängus ei saa keegi kedagi rünnata esimese 20 minuti jooksul.
- **Hoiatus**: kui võõras armee (mitte skaut) on sinu linnast ≤ 5 ruudu kaugusel, tuleb teade (iga armee kohta
  kord 3 minuti jooksul).
- **Kiviaja armeed** on maailmakaardil 3× väiksemad.
- **Jõekaldad**: kalamehe onni (ja laeva jõe ääres sadama) saab ehitada ka jõe kaldale; jõgedes on kala
  (madal, kaldalt püütav; detailkaardil kalaparved jõe sängis).
Testid: `tests/villages-v276.mjs`, `tests/river-bank-v276.mjs` (CI-s), rände test kontrollib nüüd ka linna esimesi minuteid.
