# V241 – vajaduspõhine mudelite laadimine

Alus: V240, `44c2c48371b2281795c97375cd2b2a145ab6c1d4`.
V241 vajaduspõhise laadimise muudatused sisalduvad V242 versioonis.

- Kõigi ajastute ühine sõduripakk on jagatud 28 sõduritüübi kaupa,
  mõlema graafikataseme jaoks. Ühe tüübi laadimine ei tõmba kaasa teisi.
- Kõigi mängupoolte aktiivne uurimisteema ja avastused juhivad eellaadimist.
  Uurimisjärjekorra tulevasi teemasid ei laadita ennetavalt.
- Peamaja, elamu, kaev ja metsatöölise hoone laaditakse esimesel tegelikul
  kasutusel. Kiviaja hoonete vanu asendusfaile ei laadita lisaks.
- Kiviaja inimeste ühine mudel laaditakse esimese sellise inimese loomisel.
  Pelk mooduli importimine ei laadi mudelit. Lähimudel laaditakse kaamera
  lähenemisel, nagu varem.
- Aegunud sõdurite ja kiviaja hoonete ennetav laadimine jäetakse hilisema
  ajastu puhul vahele. Kui vana üksus või hoone on maailmas päriselt nähtav,
  saab selle mudeli endiselt vajadusel laadida.
- Korraga laaditakse kuni kolm mudelipäringut. Korduvkasutus jagab sama
  pooleliolevat päringut. Ebaõnnestunud päringu kordamisel on 15 s ooteaeg.
- Ootamise või allalaadimisvea ajal säilib varasem kohalik mudel. Valmis
  mudel vahetab üksnes välimuse: asukoht, valik ja juhtimine säilivad.
  Sõdurite ühine renderdamine arvestab ka asünkroonset mudelivahetust.

Mängu põhiloogika ja protseduuriliste mudelite JavaScript jäävad alglaadimisse.
Eraldatud on välised mudelifailid; mänguserverit ega Node.js serverit pole vaja.
Olemasoleva salvestuse vorming jääb samaks.

## Kontrollimine

```text
node scripts/test-demand-v241.mjs
node scripts/test-farming-lod-v233.mjs
node scripts/test-field-green-v237.mjs
node scripts/test-scout-model-v239.mjs
node scripts/test-scout-motion-v240.mjs
node scripts/test.mjs traffic
node scripts/qa-demand-v241.cjs
```

Brauseritesti jaoks peab Puppeteer olema paigaldatud. Vajadusel määra selle
mooduli asukoht keskkonnamuutujaga `PUPPETEER_MODULE`. Test võrdleb V240
ja töökoopiat puhta brauseriprofiiliga, kontrollib arvutimängija uurimist,
mudeli vahetumist, jagatud päringuid, allalaadimisviga ja telefonivaadet.
Tulemused ja kuvatõmmised kirjutatakse kausta `artifacts-v241`.

30.10.2026 kohaliku HTTP-testi tulemus puhta brauseriprofiiliga:
V240 9 631 226 baiti → V241 5 321 223 baiti; alglaadimine vähenes
4 310 003 baiti ehk ligikaudu 45%. See on kohaliku serveri failimaht,
mitte GitHub Pagesi tihendatud võrguülekande mõõtmine. Hiljem vajalikke
mudeleid laadides kasvab loomulikult mänguseansi koguandmemaht.
Arvutivaade, telefonivaade keskmisel graafikatasemel, mudelivahetus,
arvutimängija uurimine ja ebaõnnestunud mudelipäringu varuvariant läbisid
brauserikontrolli. Mängu liikluse ning V233/V237/V239/V240 kontrollid läbisid testi.

Sõduripakkide taastootmine: `node scripts/split-soldiers-v241.mjs`.
Test võrdleb iga mudeli geomeetriaandmeid ja animatsioone V148 lähtepakiga.

## Kohalik eelvaade

```text
node scripts/serve-v241.cjs
```

Seejärel ava http://127.0.0.1:8788/.
