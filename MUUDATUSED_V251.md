# Kuningriigid V251 – ajastule vastavad teed, päris tuli ja valgustid, uus vesi

## Teed: tasemed tagasi, pind ajastu järgi
Kasutaja soovil on teedel jälle mitu taset ja nende välimus vastab ajastule (`road-appearance-v216.js` `roadSurfaceV251`, varjutaja `landscape-v149.js` `roadMaterial`).

| Ajastu | Tase 1 | Tase 2 | Tase 3 | Tase 4 (maantee) |
|---|---|---|---|---|
| Kiviaeg | jalgrada | jalgrada | jalgrada | jalgrada |
| Pronksiaeg | jalgrada | vankritee | vankritee | vankritee |
| Rauaaeg | vankritee | kruus | kruus | kruus |
| Keskaeg | vankritee | kruus | munakivi | munakivi |
| Renessanss | vankritee | kruus | munakivi | sillutis äärekividega |
| Tööstusajastu | kruus | makadam | makadam | sillutis |
| Moodne ajastu | kruus | makadam | asfalt | asfalt keskjoonega |

Ajalooline põhjendus:
- Kiviajal polnud ratast, seega olid ainult jalgrajad.
- Rattaroopad tulevad pronksiajal.
- Ehitatud kruusateed kõrgendatud keskosa ja kraavidega tulevad rauaajal.
- Munakivi on keskaegne, tahutud sillutis ja äärekivid renessansiaegsed.
- Makadam tuleb tööstusajastul, asfalt moodsal ajastul.

**Pinnad varjutajas:**
- **Jalgrada:** sõtkutud muld, mille keskosa on kulunud.
- **Vankritee:** kaks rattaroobast ja rohtunud keskosa.
- **Kruus:** kivikesed, kõrgendatud keskosa ja tumedad kraavid.
- **Munakivi:** ebakorrapärased tihedalt kõrvuti kivid (Voronoi muster) ja mullaga vuugid.
- **Sillutis:** täisnurksed tahutud kivid nihkes ridades ja äärekivid.
- **Makadam:** killustik, rattajäljed ja äärekivid.
- **Asfalt:** paigad, valge äärejoon ja maanteel kollane katkendlik keskjoon.

Sillutatud teedel on kindel serv, sillutamata teed hajuvad rohtu.

**Laius ja kiirus:** laius kasvab tasemega (×0,78 / 0,9 / 1,05). Maantee on 1,5× laiem kui tase 3 ja jääb V250-st 10% kiiremaks (×1,65).

Eelvaade: `tests/visual-v251/roads.html?scope=detail` ja `?scope=world`.

## Päris tuli ja ajastule vastavad valgustid
**Tuli** (`daynight-v235.js`):
- Leek on animeeritud varjutaja: tõusev müra, valkjaskollane südamik, mis läheb üle oranžiks ja punasteks tippudeks, ning värelus.
- Leek joonistatakse kolmel ristuval tasandil liitsegamisega (additive). Igal tõrvikul on oma faas.
- Lisaks lendavad sädemed ja tõuseb pisut suitsu.
- WebGL kasutab GLSL-i, WebGPU sama leeki TSL-sõlmedena.

**Valgusti ajastu järgi**, ajalooliselt:
- **Kiviajast keskajani:** tõrvik.
- **Renessanss:** õlilatern postil, klaasist tahud ja väike leek sees.
- **Tööstusajastu:** malmist gaasilaterna post hõõguva süsinikuga.
- **Moodne ajastu:** kaarjas elektriline tänavavalgusti.

Lampide valgus on tugevam ja valgem: latern 2,1 / 21 m, gaas 2,6 / 24 m, elekter 3,4 / 28 m. Gaas- ja elektrivalgustil on ka valge valguslaik ja kuma.

Päris valgusallikaid on endiselt kõige rohkem 4 linna kohta (testid V235 ja V236). Linna valgustid luuakse uuesti, kui linn uude ajastusse jõuab.

Eelvaade: `tests/visual-v251/lights.html?gpu=0` ja `?gpu=1`.

## Vesi
Jõevee varjutaja (`landscape-v149.js` `waterMaterial`) on uus:
- **Lainete normaalid** arvutatakse sama voolukaardi müra kaldest. Need on maailmaruumis ja teisendatakse vaateruumi, nii et väikesed lained on päriselt valgustatud ja liiguvad vooluga.
- **Fresneli taevapeegeldus:** vesi peegeldab taevast, mida laugema nurga all vaadata, seda rohkem. Otse alla vaadates paistab vesi läbi. Peegelduse värv järgib päeva ja öö tsüklit (`WATER_SKY_V251` failis `atmosphere-v158.js`).
- **Pinna läige** on siledam (roughness 0,14).

## Kontrollid
- Brauser (WebGL), ekraanipildid:
  - seitse teepinda eelvaates;
  - keskaegne linn, millele lisati eri tasemega teed;
  - öised linnad nelja valgustiga (keskaeg, renessanss, tööstus, moodne);
  - suur ja väike jõgi enne ja pärast.
- WebGPU: uus maailm töötab ja valgustite testlehel joonistub tuli TSL-iga.
- CI kiirkontrolli kõik sammud (süntaks, V188–V243, `traffic`): PASS.
- `node scripts/test.mjs rules --jobs 2`: 20 testi 21-st läbisid. `TEST_V139` kukub läbi samamoodi nagu V250-s (varasem viga).

## Piirangud
- WebGPU-s jäävad jõe vee lained ja peegeldus ning teede ajastupinnad lihtsustatuks, sest need on `onBeforeCompile` varjutajad. Need tuleb kirjutada TSL-i.
