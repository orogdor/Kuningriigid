# Kuningriigid V245 – WebGPU joonistab pildi

## Viga
WebGPU-režiimis (`?gpu=1` või menüüs Graafika → Renderdusmootor → WebGPU) käivitus renderdaja, aga ekraan jäi tühjaks.
Kasutaja arvutis (NVIDIA, Turing) näitas graafikakaart:
`Binding size (166784) … is larger than the maximum uniform buffer binding size (65536)`.
Üks vigane objektirühm muutis kehtetuks terve kaadri, nii et ühtegi kaadrit ei joonistatud.

## Põhjus
three.js r170 viga: instancing'u puhul otsustatakse objektide **praeguse** arvu järgi (`mesh.count <= 1000`), kas maatriksid lähevad 64 KB uniform-puhvrisse, aga puhvrisse seotakse kogu massiiv. Mängu ruumilised plokid ja V244 kasvav puude puhver hoiavad rohkem kohti, kui hetkel joonistatakse. WebGL-is seda piirangut pole.

## Parandus
`vendor/three.webgpu.js` otsustab nüüd massiivi mahu järgi ning dünaamilised puhvrid kasutavad alati atribuudi rada. Parandus on failis märgitud kommentaariga „Kuningriigid V245 patch“.

## Kontroll kasutaja arvutis (Claude'i rakenduse brauser, NVIDIA)
- Enne parandust: 0 joonistuskäsku, iga kaader lükati tagasi.
- Pärast parandust: maailmakaart 1 146 joonistuskäsku ja 4,6 mln kolmnurka, pilt on olemas ja vigu ei tule.

Mänguloogika ja salvestused ei muutunud. WebGL jääb vaikimisi režiimiks.
