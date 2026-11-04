# Kuningriigid V301 — üks pilditaust, 20% madalam alumine paneel

Kasutaja esitatud ja kinnitatud illustratsioonist valmistati puhas 1672×941 kasutajaliidese alus. Väikeseid fragmente ega vanu eraldi taustaraame enam töölaua pildirežiimis ei laota uue tausta peale.

- `ui-art-v301/backdrop.webp` on ~94 kB läbipaistva keskosaga veebipilt, mis säilitab referentspildi kuld-sinised üla-, vasak- ja parempoolsed raamid ning kuus tühja pärgamendikaarti all. 3D-maailm/minikaart ei ole staatiliseks pildiks asendatud.
- Alumine osa alates lähtematerjali y=510 on tihendatud vertikaalselt 80%-le kõrgusest ja kinnitatud ekraani alumisse serva. Töölaua alumised klõpsualad liiguvad samadesse uutesse kohtadesse.
- `hud-v301-background.js` jagab sama pildi kaheks kuvakihiks: ülemine ankur jääb üles, alumine alla; 1672×941 lähtekoordinaadid ja külgede suhe säilivad. V298 juhtpaneeli käsud jäävad alles.
- Kuus kaarti saavad eraldi V300 pildiikoonid ja olemasolevad toimivad käsud. Valiku kontekstinupud, mängu minikaardi canvas, reaalne teaduse nimi, resursside arvud ning valitud üksuse portree ja nimi jätkavad päris mänguinfo kasutamist.
- Pildile juba maalitud tühjad raamid ei dubleeru enam vanade dekoratiivsete sprite'idega. Väikese ekraani ning puuteekraaniga mängijatele jääb senine V298 kohanduv paigutus, sest nende kuvasuhe ei vasta 1672×941 referentsile.
- Vana UI saab taastada `?ui=classic` abil; uus pildirežiim on `?ui=art`.

## Piirang ja kontroll
- V301 muudab ainult illustreeritud HUD-i välimust, mitte 3D-maailma, AI-d, salvestusi ega mängukäske.
- Automaatkontroll `tests/ui-v301-background.mjs` kontrollib failivormingut, pildi läbipaistvust, 6 kaarti, laadimisjärjekorda, mobiilse paigutuse säilimist ning JS süntaksit.
- Täielik 1:1 visuaalne kontroll avaldatud mängu Chromiumi/Androidi ekraanidel tuleb eraldi kinnitada; pildikihistamise test ei taga iseenesest kõigi ekraanisuuruste pikslitäpsust.