# Kuningriigid V246 – WebGPU maailmakaart on taas nähtav

## Viga
WebGPU-režiimis (`?gpu=1`) näitas maailmakaart ainult udu (pärgamenti). Avastatud ala ega maastikku ei olnud näha.

## Põhjus
WebGPU-renderdaja eirab `onBeforeCompile` GLSL-muudatusi.
- **Udu kate** (`civilization.js`, `refreshFogCover`): avastatud ala auk tehti `onBeforeCompile`-ga. Ilma selleta jäi alles läbipaistmatu pärgamenttasand üle kogu kaardi.
- **Meri** (`sea-v158.js`, `seaMaterial`): värv, läbipaistvus ja rannaserva lõige olid samuti `onBeforeCompile`-s. WebGPU-s joonistati meri läbipaistmatu valge kihina, ka randade peale.

## Parandus
WebGPU-režiimis (`T.GPU_MODE_V225`) ehitatakse mõlemad materjalid TSL-sõlmedena samade valemitega:
- Udu kate: sama müraga moonutatud „avastatud“ tekstuuri mask (`opacityNode`) ja kerge toon (`colorNode`).
- Meri: sügavuse järgi värv, lainetus, kaldavaht, märja serva lõige (`opacityNode` + `alphaTest`) ja normaali võbelus.

WebGL-i kood ei muutunud.

## Kontrollid
- Mäng `?gpu=1`, uus mäng (Chromium + SwiftShader WebGPU, backend `webgpu`): enne parandust ainult udu, pärast parandust on avastatud ala koos maastiku, jõe ja üksustega nähtav ning vigu ei ole.
- `tests/webgpu-v246/sea.html?gpu=0` ja `?gpu=1`: sügavusgradiendiga meri näeb mõlemas režiimis peaaegu ühesugune välja, rand paistab läbi.
- WebGL (vaikimisi): maailmakaart on endine.
- `node scripts/test.mjs traffic`: PASS.

## Teadaolev erinevus
three r170 WebGPU rakendab toonivastenduse (ACES) kogu kaadrile ega arvesta `toneMapped:false`. Seetõttu on udu pärgament WebGPU-s hallikam kui WebGL-is. Teised `onBeforeCompile`-efektid (maastiku üleminekud, pilvede varjud, tuul) puuduvad WebGPU-s endiselt.
