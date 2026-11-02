# V280 — kiviaja testmängu parandused

Kiviaja pikkus jäeti samaks. Testmängu põhjal parandati järgmised asjad:

**Toit ja tootmine**
- Kütt ja kalur toodavad 50% rohkem (9 asemel 6). Põllumaja vajab ainult **puidutöökoda** ja 30 puitu
  (enne oli vaja saeveskit ja laudu, mida kiviajal polnud).
- Põllumaja juurde rajatakse kuni 4 põldu korraga (enne 2), seega uus talu jääb harvemini tühjaks.
- Ehitusmaterjali ladu mahutab 240 iga peamaja kohta (enne oli väiksem); lisanduvad laod +300.

**Vesi**
- Jõest, järvest ja järve väljavoolust tuuakse vett kuni 4 ruudu kauguselt.
- Kui veekogu pole lähedal, tuuakse vett kaugest allikast: vajadus on kaetud, aga tootlikkus on 20%
  väiksem (enne jäi linn ilma veeta ja rahvas suri välja).

**Uurimine**
- Esimene uuring on alati **tule kasutamine**.
- AI ei jää kunagi uuringuta: kui plaanitud uuringut pole, valitakse odavaim avatud tehnoloogia.
- Kaubandusmenüüs on uus kaart **Kuningriigi kassa** nupuga „Kiirenda uuringut (40 kulda → +12 punkti)“.
  AI kasutab kassat ise, kui tal on vähemalt 150 kulda.

**AI riigid**
- Igal AI riigil on iseloom: **sõjakas** (värbab varem, uurib sõda), **ehitaja** (ehitus/ladu) või **kaupleja**
  (savi, kaubandus).
- AI kaupleb lähima kaupmeeste külaga: nälja korral müüb puitu/kivi ja ostab toitu.
- AI ei ehita kiviajal tühje maju (uus maja alles siis, kui ruumi jääb vähem kui 2 inimesele).
- Uus asunik tuleb kiviajal varem (rahvaarv ≥6 ja piisavalt toitu).

**Kaitse ja röövlid**
- Palisaadi ehitamist alustatakse ainult siis, kui on tõeline oht: röövlite küla 26 ruudu kaugusel, võõras
  armee 10 ruudu kaugusel või pärast rahuaega suur linn. Enne ehitati müüre juba esimestel minutitel.
- Röövlite küla ründab kuni 28 ruudu kaugusele (enne 22), et röövlid oleksid päriselt oht.

**Rahvaste ränne**
- Rände ajal näidatakse maailmakaardil 3 soovitatud linnakohta (rohelised numbrid 1–3). Hinnatakse vett,
  metsa, kivi, ulukeid, vilja, rannikut ja kaugust.
- Kui ränne lõpeb ja kohta pole valitud, rajatakse linn parimale soovitusele.

**Maailm**
- Kivi- ja maagileiukohad ei teki enam liivale ega rannikumadalikule (ainult kõvale maale).

**Testid**
- `tests/stone-age-playthrough-v280.mjs`: 45-minutiline AI-mäng. Kontrollib, et AI ei ole üle 90 s ilma
  uuringuta, et tuli leitakse, et rahvas ei sure välja, et puitu jagub ja et kõik kolm iseloomu esinevad.

Märkus: AI jõuab nüüd pronksiaega umbes 55–70 minutiga (enne umbes 90 minutiga), sest majandus enam ei
kokku kuku. Mängija enda kiviaja pikkust ei muudetud.
