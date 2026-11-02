# V279 — vanu mudeleid enam ei näidata, GLB-mudelid laevad kiiremini

- **Kiviaja hooned**: vana protseduurset maja ei näidata enam ajutise asendajana — hoone ilmub kohe
  oma GLB-mudeliga, kui see on laetud. Kui laadimine ebaõnnestub, proovitakse uuesti (4 korda, 16–64 s
  vahega); alles siis, kui kõik katsed ebaõnnestuvad, näidatakse varumudelit (et hoone ei kaoks päriselt).
- **Inimesed ja sõdalased**: vana protseduurset kuju ei näidata, kuni GLB-inimene/sõdalane laeb (varu-
  kuju ainult laadimisvea korral).
- **Põhjus, miks telefonis jäid vanad mudelid**: hoonete GLB-d ootasid allalaadimise järjekorras suurte
  valikuliste failide (TRELLIS-sõdalased, sõdurimudelid, detailmudelid) taga, korraga laeti vaid 3 faili.
  Nüüd laetakse 5 korraga ja ekraanil olevate hoonete kaugmudelid on järjekorras ees (`asset-queue-v241.js`).
