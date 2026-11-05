# V305 – Three.js r187 / 0.187.0

Three.js r170 on uuendatud 5. novembril 2026 uusimale stabiilsele npm-väljalaskele `0.187.0` (r187, avaldatud 30. oktoobril).

## Teek ja ühilduvus

- `vendor/three.core.js`, `three.module.js`, `three.webgpu.js` ja `three.tsl.js` on ametliku npm-paketi muutmata failid. MIT-litsents on `vendor/three.LICENSE`; allikas, npm SHA-512 tervikluskood ja failide SHA-256 kontrollsummad on `vendor/three-version.json`.
- WebGL ja WebGPU kasutavad sama tuuma. WebGPU ühendus ekspordib eraldi TSL-mooduli funktsioonid; importmap suunab jagatud moodulid ühele versioonitud URL-ile. See hoiab ära vanade r170 failide ja korduvate TSL olekute segunemise brauseri vahemälus.
- WebGPU ootab endiselt `renderer.init()` lõppu ning esitab seejärel kaadri praeguse `render()` liidesega. Initsialiseerimise, seadme kadumise ja kaadri vea korral jääb alles olemasolev WebGL-i taastumistee.
- Varjud kasutavad toetatud `PCFShadowMap` liidest. Käsitsi koostatud sillamaatriks märgitakse muutunuks, et r185+ uuendaks korduvpaigutuse järel maailmamatriksi.
- V245 vana teegiparandust ei kanta uude teeki üle: r187 instantside puhvri valik arvestab tegelikku mahtu ja seadme uniform-puhvri limiiti.
- Mängu nähtav versioon ja käivituse vahemäluvõtmed on V305. Varasemate UI testide suletud versiooniloendid lubavad nüüd ka järgnevaid väljalaskeid.

## Kontrollid

- Kõik `.github/workflows/v128.yml` kiirkontrolli grupid läbisid: olemasolevad 22 gruppi ning uus Three.js ühilduvuse grupp. Sealhulgas päeva/öö, tõrvikute, avastaja, mudelite, detailalade, salvestamise, UI ja `node scripts/test.mjs traffic` kontrollid.
- `node tests/three-r187-v305.mjs`: ametlikud kontrollsummad, jagatud tuumaklassid, mängu kasutatud ekspordid, 4096 instantsi maht, silla uuesti paigutamine, WebGL mere varjutajasse lisatava koodi ankrud ja importmap.
- `node tests/three-r187-v305-tsl.mjs`: kümne päris mängumaterjali/geomeetria kombinatsiooni WGSL-koodi koostamine (meri, taevas, tuli, instantsid ja 17 luuga animeeritud GLB). Lisaks oodatud initsialiseerimine, sünkroonne kaadri esitamine ja renderdusvea suunamine taastumisteele. See test ei joonista GPU-ga ega dekodeeri tekstuuripilte.
- Brauser laadis V305 moodulid ja jõudis renderdaja loomiseni. Selles testikeskkonnas on graafikakontekst keelatud (`GL_RENDERER = Disabled`, WebGPU adapter puudub); seetõttu ei saanud 3D-pilti ega tegelikku GPU jõudlust kinnitada. Seadmega kontrolliks: `tests/three-r187-v305.html?gpu=0` ja `?gpu=1`.
- Ametlike failide segatud taanduse tõttu annab `git diff --check` mõned teegi sees olevad tühikute hoiatused; failid on kontrollsummade säilitamiseks muutmata.

## Allesolev töö

Päris graafikakaardiga tuleb üle vaadata maailm, detailkaart ja lahing mõlema renderdajaga. Varasemad WebGPU piirangud (GLSL `onBeforeCompile` jõgi, teed, maastiku lisad ja tuul) vajavad jätkuvalt omaette TSL-i portimist; teegiuuendus neid efekte automaatselt ei teisenda.
