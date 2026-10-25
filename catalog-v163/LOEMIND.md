# Kiviaja mudelite kataloog (V163)

Kõik kiviajal mängus kasutatavad mudelid nii, nagu mäng neid praegu renderdab. Vaata neid, et otsustada, mida ükshaaval uuesti teha.

- `kiviaeg_1_hooned.png` – kiviajal ehitatavad hooned (`BUILD_AGE = 0`), sh palisaad ja vahitorn
- `kiviaeg_2_elamud.png` – elamu kõik 8 kiviaja varianti
- `kiviaeg_3_inimesed.png` – töölised ja tsiviilisikud
- `kiviaeg_4_sodurid.png` – kiviaja väeosad (`TROOPS.age = 0`)
- `kiviaeg_5_loodus.png` – puu, ulukid, kala, marjad ja maardlad
- `kiviaeg_6_maakaart.png` – maakaardi puud, kivid, kiviaja asulad ja üksused
- `tiles/` – iga mudel eraldi PNG-na, `tiles/index.json` sisaldab ID-d, nime ja mõõte

Mõõdud on detailkaardi ühikutes (1 ühik ≈ 1,05 m). Maakaardi mudelid on maakaardi ühikutes.

Kataloogi uuendamiseks (näiteks pärast mõne mudeli vahetamist): käivita staatiline server pordil 8765 ja seejärel
`node tools/catalog-v163/render.mjs`. Kokkuvõttelehed tehakse PIL-iga, vaata AI_LOGI.md.

Mudelid tulevad mängu enda funktsioonidest `gameDebug.catalogV163` kaudu:
- `townBuildingModel`, `createSoldier`, `createWildlife`, `addTree`, `createDepositPile`;
- `world-models-v152.js` funktsioonid `getWorldModel` ja `settlementGeometry`;
- `map-units.js` funktsioon `createWorldUnit`.
