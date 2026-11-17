# V356 – kõrguskaardiga maapind ja teed (detailkaart)

## Miks
Kasutaja soovis, et maapinna tekstuurid ja teed kasutaksid kõrguskaarti, et teed ja muu maastik oleksid ilusamad.

## Mis muutus
- **Maapinna fototekstuurid (`ground-materials-v232.js`)**: muru, mulla ja metsapinnase vahel kasutatakse nüüd kõrgusega segamist (height blend). Iga foto heledus on selle kõrgus. Üleminekul võidab kõrgem pind piksli kaupa: muld paistab murutuustide vahelt ja muru kasvab mulla peale. Varem oli see udune ristsegamine. Samad kaalud kehtivad värvile, normaalile ja karedusele (`groundColor232(uv, inout w)`).
- **Teed (`landscape-v149.js`, `roadMaterial`, ainult detailkaart)**:
  - Igal teepinnal on oma kõrgusprofiil `rH` ja selle analüütiline kalle `rG`:
    - jalgrada: sisse tallatud keskosa;
    - vankritee: rööpad;
    - kruusatee: ümarad kivikesed kumeral teeharjal, servades kraavid;
    - munakivi: iga kivi on madal kuppel;
    - tahutud kivid: padjakujulised, sügavate vahedega.
  - Sellest kõrgusest arvutatakse reljeef (normaal). Arvutus käib ahelreegliga läbi sujuva tee uv-koordinaadi, mitte müra ekraanituletistena. Nii ei teki kolmnurkade servadele täppe, mis V161 ajal telefonides probleem oli. Kaugemal, kus üks piksel katab mitu kivi, reljeef hääbub.
  - Tee serv on kõrgusega segatud: kõrgemad kivid ja teehari paistavad läbi muru, lohkudesse kasvab muru (oma tuustide kõrgusega). Varem oli serv ühtlane hajutus. Sillutatud teedel jääb serv kindlaks.
- Maailmakaart ei muutunud. Teede geomeetria, navigatsioon ja salvestused ei muutunud.
- Vahemälu võtmed: `landscape-v149.js?v=356`, `ground-materials-v232.js?v=356`. `tests/sea-depth-v352.mjs` lubab nüüd ka uuemat `landscape-v149` võtit.

## Kontrollid
- `preview-road-relief-v356.html` (`?view=wide|close|stones`): kõik teepinnad päris maastikumaterjaliga. Pildid on kaustas `previews/road-relief-v356-*.png` (SwiftShader).
- Läbisid: `node --check landscape-v149.js`, `tests/sea-depth-v352.mjs`, `tests/territory-chunks-v351.mjs`, `tests/coast-v286.mjs`, `scripts/test-nature-v229.mjs` (detailmaastiku shader), `tests/shared-water-v326.mjs`, `node scripts/test.mjs traffic`.
- Tegemata: päris seadmes FPS ja telefoni ekraanil kontroll. Lisakulu on üks varjundi haru teepikslile ning maapinnal sama arv tekstuuriproove kui enne.
