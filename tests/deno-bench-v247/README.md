# V247 kiirtest: three.js Chrome'is vs Denos (ilma brauserita)

Sama väike stseen joonistatakse mõlemas keskkonnas 1920×1080 eraldusvõimega: maastik, 20 000 puud, 500 maja ja päikesevarjud (umbes 1 800 joonistuskäsku ja 1,5 mln kolmnurka). Mõõdetakse 300 kaadrit, kumbki ilma vsync-piiranguta.
Mänguloogikat ja kasutajaliidest testis ei ole. Võrreldakse ainult 3D-joonistamist.

## 1. Chrome
Ava: https://orogdor.github.io/Kuningriigid/tests/deno-bench-v247/bench.html
Oota umbes 10–30 sekundit, kuni tulemused ilmuvad.

## 2. Deno
Paigalda Deno (PowerShell):
```
winget install DenoLand.Deno
```
Ava uus PowerShelli aken ja käivita:
```
deno run -A https://orogdor.github.io/Kuningriigid/tests/deno-bench-v247/bench-deno.js
```
Kohalikus koopias: `deno run -A tests/deno-bench-v247/bench-deno.js`.
Valikuline `--ppm kaader.ppm` salvestab viimase kaadri pildina.

## Tulemuste lugemine
- `fps`: kaadreid sekundis. Suurem on parem.
- `frameMedianMs`: tüüpiline kaadri aeg (protsessor + graafikakaart).
- `cpuMedianMs`: kui kaua JavaScript ja three.js kaadrit ette valmistavad.
- `drawCalls` peab mõlemas olema sama, siis on stseen sama.

Kui Deno `fps` on Chrome'ist selgelt suurem (näiteks üle 30%), tasub brauserita versiooni kaaluda. Kui vahe on väike, piisab Tauri/Electroni rakendusest.

`--quick` (Denos) ja `?quick` (brauseris) teevad väga väikese kontrolljooksu masinatele, kus päris graafikakaarti pole.
