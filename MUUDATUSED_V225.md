# Kuningriigid V225 – valikuline WebGPU-renderdaja (katsetus)

- Uus režiim: aadressi lõppu `?gpu=1`. Brauser jätab valiku meelde, `?gpu=0` lülitab selle välja.
- Režiim töötab ainult siis, kui brauseril on WebGPU (Chrome, Edge, uuem Safari). Muidu jääb vana WebGL ja kõik on nagu enne.
- Kasutab three.js r170 WebGPU-versiooni (`vendor/three.webgpu.js`) ja vahekihti `vendor/three-gpu-shim.js`. Mängu kood ei muutunud.
- Taevas on WebGPU jaoks ümber tehtud.
- Teada puudused WebGPU-režiimis:
  - Maastiku ruutude sujuvad üleminekud, mere lained, pilvede varjud ja tuulega õõtsuvad taimed on lihtsamad, sest WebGPU eirab `onBeforeCompile` muudatusi.
  - Need tuleb ükshaaval TSL-i ümber kirjutada.
- Mänguloogika ja salvestused ei muutunud.
