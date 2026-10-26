# Kuningriigid V173 – etapp 3.2b, päriselt tekkivad teed

26. oktoober 2026.

## Põhimuudatus

**Teede automaatne tekkimine jäi alles.** V173 jätab täielikult alles kaks olemasolevat liiklusepõhist süsteemi:
- `navigation.js` ja `town-streets-v80.js`: linna detailkaardil tekitavad jalakäijad ja töötegijad korduvalt käies nähtava raja. Mõne läbimise kulumine on esialgu nähtamatu ning kasutamata rada aja jooksul hajub.
- `roads.js`: maailmakaardi teid tekitavad asunikud, kaubakaravanid ja armeed, korduv kasutamine tugevdab tee taset ning seisma jäänud tee kulub. Teed annavad alles siis liikumisboonuse, kui läveväärtus on täidetud.

**V173 ei lisa ettejoonistatud asfaltteid, ei lisa nähtavatele tänavatele tasuta kuumust ega keela mängu loomulike käiguradade tekkimist.**

### 3.2b muudatused

- `living-streets-v173.js`: puhas, salvestuse suhtes ainult lugemisrežiimiga abifunktsioon; kaardistab liiklusest tekkinud nähtavad sissekäidud rajad V4 `world.heat` ja `heatLast` alusel. Arvestab kulumisega (vana kasutamata rada ei jää igavesti keelutsooniks).
- `historic-urban-v138.js`: uute elamute, ühiskondlike ja töökojahoonete kandidaadid väldivad päriselt nähtava raja koridori ja hoone katuse ümbrust. Kiviaja planeeritud peatänava jaoks arvestatakse lisaks hoone *nurki*, mitte üksnes keskpunkti. Põllud ja tootmismaardlate ehitushinnad ning valikureeglid jäävad muutmata.
- `detail-roads.js`: teeribade külgede geomeetria kohandatakse olemasolevate hoonete tegelike põrandaplaanidega; vajadusel muutub üks teelõik hoone ääres kitsamaks. Parandus ei kustuta `world.heat`-liiklusandmeid.
- Mängulink `?demo=ai-stone-v173` avab uue, päris AI mängust saadud kiviaja testlinna kohe mängija valduses ja alguses pausil.
- `scripts/make-ai-stone-v173.mjs`: uus AI simulatsioon, mis ei lisa tasuta hooneid, ressursse ega tehnoloogiaid.

## Testid ja vahetu liikluse tõestus

- [V173 teede ja linnaplaneeringu regressioon](https://github.com/orogdor/Kuningriigid/actions/runs/40311411881): **PASS**.
- `TEST_V173_STREETS.mjs`: kolm päriselt ühendatud maja-suunalist jalakäigusuhet tekitasid aja jooksul **120 nähtavat rajarakku**; enne liiklust nähtavaid radu ei olnud. Uus kandidaatotsing ei muutnud salvestatud liiklusandmeid.
- V173 päris Sogni AI salvestuse avamisel: **178 nähtavat käigurajarakku** ja maailmakaardil **25 liiklusega teeühendust**; AI ehituskohtade lugemine neid ei kustutanud.
- `TEST_V59.mjs`: **PASS**, teed tekivad ainult piisava liikumise tulemusel ning maailma- ja detailkaardil, teede kiirusboonus on seotud kasutusega.
- `TEST_V80.mjs`: **PASS**, **1203** nähtavat tänavarakku pronksiaja testsalvestuses ning **3634** teekolmnurka hoonetega kattumata.
- V172/v138/v139/v163 linnaplaneerimise testid, V168 kindlustuste läbipääsud ning V73 vanade salvestuste test: **PASS**.
- 48 käigu päris AI linnakasv: **PASS**.
- [V173 mängitava testlinna genereerimine](https://github.com/orogdor/Kuningriigid/actions/runs/40311116040): **PASS**.
- [V173 päris WebGL arvuti ja mobiili ülevõtmistest](https://github.com/orogdor/Kuningriigid/actions/runs/40311234086): **2/2 PASS**, esimene mängukaader ja mängu jätkamine kinnitatud.

## V173 mängitav AI asula – Sogn

- Seeme **142023**, viimase kiviaja seis **107. käigu lõpus**, riigi vanus 0.
- AI jõudis iseseisvalt pronksiaega 108. käigul.
- **11 elanikku, 11 elamut, 42/42 valmis ehitist**, täielik **20/20** palisaadirõngas.
- Elamute keskmine kaugus peamajast **34,88 m**. Võrdluseks: V172 Sogn käigul 95 **30,69 m**, V171 Sogn käigul 102 **41,47 m**. Seisud pärinevad eri käikudelt ja elamuarv erineb: see ei ole sama mänguhetke kontrollitud A/B võrdlus.
- Nähtavate käiguradade säilitamine seab uutele kruntidele rangemad piirangud; kiviaja linnakasvu ja jõudlust tuleb edasi tasakaalustada.

## Mängulink

[**Kuningriigid V173: kiviaja lõpu Sogni üle võtmine**](https://orogdor.github.io/Kuningriigid/?v=173-20261026&demo=ai-stone-v173)

Mängus vahetatakse ainult AI ja mängija kontroll riigi üle; olemasolev tavapärane autosalvestus jääb eraldi. Vajuta ▶, et jätkata.

## Piirid

- Chromiumi telefonivaade oli 390 × 844 CSS px; päris Androidi GPU FPS-mõõtmist ei ole.
- V173 kaitseb olemasolevaid jalakäiguteid uute AI ehituskohtade valimisel. Kõigi käsitsi ehitamiste võimalikku mõju vanadele radadele ning kogu maailma kaubanduse liiklusintensiivsust tuleb vajadusel edasi uurida.
- See väljalase keskendub liiklusest tekkivate radade kaitsele ja renderdamisele. Hoonete suunamise või hoovide uued visuaalsed kaunistused jäid tulevaseks tööks.
