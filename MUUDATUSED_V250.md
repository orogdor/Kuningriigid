# Kuningriigid V250 – teed, tõrvikud, jõed ja taimestik

## Teed: üks välimus, maantee laiem ja kiirem
Liiklusest tekkivatel teedel on endiselt neli taset, aga välimus on kõigil sama (kasutaja valik „kõik teed ühesugused“):
- **Tasemed 1–3** on tavateed: kruusatee välimus ja sama laius.
- **Tase 4** on maantee: sama välimus, kuid 1,5× laiem. Liikumiskiirus on ×1,65, ehk 10% kiirem kui tavateel (×1,5). See kehtib nii maailmakaardil (`roads.js` `roadBoost`) kui ka linnas (`navigation.js` `roadBoost`).
- Muudetud on ka joonistus: `continuous-landscape-visual.js`, `road-width-v89.js` (`roadWidthScaleV250`), linna rajad (`detail-roads.js`), radade kulumisjäljed (`civilization.js`) ja minikaardi joon.

## Tõrvikud: uus mudel, +25% valgust
Vanad tõrvikud nägid välja nagu tänavalambid: peenike post ja klaaskera moodi kuma. Uued tõrvikud (`daynight-v235.js`):
- jämedam puust vars, kaks raudvõru, riidemähis, raudkorv ja söed;
- suur, nelja keelega leek, millest lendavad sädemed;
- kera asemel pehme kuma, mis on alati kaamera poole (`Sprite`);
- iga tõrviku all soe valguslaik maapinnal.

Päris valgusallikate tugevus ja ulatus tõusid 25% (`TORCH_LIGHT_V250`: tugevus 1,94, ulatus 20 m). Valgusallikaga tõrvikuid on linnas endiselt kõige rohkem 4; see on jõudluse piirang, mida testid V235 ja V236 kontrollivad. Ülejäänud tõrvikuid valgustavad maapinna valguslaik ja kuma.

## Jõed
- **Kriipsjooned on kadunud.** Need tekkisid vee varjutajas: muster arvutati korrutisest `dot(maailmakoordinaat, voolusuund)`. Kuna maailma koordinaadid on suured, tekitas iga väike suunamuutus kolmnurkade vahel mustrisse hüppe, mis paistis valgete kriipsudena. Nüüd liigub muster voolu suunas kahe ristsulandatud faasiga (flow map) ja hüppeid pole (`landscape-v149.js`). Kehtib kõigil kaartidel.
- **Vee värv:** keskel sügav, sinakasroheline ja tihedam vesi; kaldal oliivroheline ja selge, nii et jõepõhi paistab läbi. Vaht on ainult päris kalda ääres. Kehtib kõigil kaartidel.
- **Looklemine (uued maailmad, `geographyVersion 7`):** jõgi loogleb lahtrite keskpunktide vahel. Kurvi suund ja suurus muutuvad üle kaardi sujuvalt ning madalikul looklevad jõed rohkem kui mägedes. Lahtrite keskpunktid (koolmed, sillad, liitumiskohad) jäävad paigale.

## Taimestik päris maa loogikaga
**Maailmakaart** (`atlas-biomes-v47.js`, kõigil kaartidel):
- Rohumaa on pargilaadne niit puusaludega: puid on 2,6 lahtri kohta, varem 1.
- Mets, džungel ja taiga on tihedamad.
- Stepis on üksikud puud ja palju põõsaid.
- Kõrbes on kaktused, kuivad põõsad ja kivid. Jõe ääres on oaasid palmidega.
- Tundras on kääbuspõõsad ja üksikud kuused.
- Puud kasvavad salude ja lagendikena, mitte ühtlase hajusana.

**Detailkaardi maapinnakate** (`ground-detail-v156.js`, kõigil kaartidel): kate järgib nüüd nähtavat biomi. Varem vaatas see mängu biomi (`plains`, `forest`, `hills`), mistõttu kõrbes ja tundras kasvas lopsakas muru koos lilledega.
- Kõrbes on hõredad kuivad rohututid, kivid, kuivad põõsad ja kaktused (uus mudel).
- Tundras on hall-roheline madal rohi ja kivid.
- Stepis on kõrge kuiv rohi ja vähe lilli.
- Rohumaal on rohkem lilli ja põõsaid. Džunglis on rohkem sõnajalgu.

**Detailkaardi puud** (mänguressursid, ainult uued maailmad, `geographyVersion 7`): puude arv lahtris sõltub biomist (`TREES_BY_BIOME_V250`):

| Biom | Puid lahtris | Varem |
|---|---|---|
| Mets | 120 | 110 |
| Džungel | 130 | – |
| Taiga | 115 | – |
| Rohumaa | 75 | 45 (sageli 0, kui puiduvaru juhuslikult puudus) |
| Stepp | 24 | – |
| Tundra | 10 | – |
| Kõrb | 0 | – |

Puiduvaru (`deposits.wood`) on metsas, džunglis, taigas, jõeäärsel aasal ja rohumaal; stepis osaliselt.

## Ühilduvus
- Uus mäng tüübiga „Loogiline maailm“ saab `geographyVersion 7`. V248 (5) ja V249 (6) mängud jäävad oma jõgede ja puudega. Lahtrite räsi, sealhulgas puiduvaru ja ressursside arv, on V248 ja V249 kaartidel ning vanadel kaarditüüpidel sama mis enne.
- Maantee kiirus (+10%) ja kõik joonistusmuudatused kehtivad kõigis mängudes.
- Uus tööriist `tools/bump-importmap.py VERSION fail.js…` suunab muudetud failide kõik impordikujud importmap'is uuele versioonile.

## Kontrollid
- Brauser (WebGL), ekraanipildid enne ja pärast:
  - öine keskaegne linn (tõrvikud);
  - suur ja väike jõgi maailma- ja detailkaardil;
  - kõrb (seeme „sahara“) ja rohumaa (seeme „kuningas“).
- WebGPU: uus maailm töötab, ilma tagasilanguseta WebGL-ile. `demo=medieval` kukub WebGPU-s tarkvaralisel graafikal läbi sama veaga ka V249 koodiga, see on varasem viga.
- CI kiirkontrolli kõik sammud käivitati ka kohalikult: süntaksikontroll, V188–V243 testid ja `traffic`, kõik PASS. Esimene V250 avaldus kukkus CI-s läbi, sest seal oli valgusallikaga tõrvikuid 5, aga lubatud on kõige rohkem 4. Parandatud.
- `node scripts/test.mjs traffic`: PASS.
- `node scripts/test-stream-v242.mjs`, `node scripts/test-build-v243.mjs`, `node TEST_V1754_GATES.mjs`: PASS.
- `node scripts/test.mjs rules --jobs 2`: 20 testi 21-st läbisid. `TEST_V139.mjs` kukub läbi samamoodi nagu V249-s (varasem viga, `ai-defenses-v128.js:47`).
- `node tools/check-world-v248.mjs 11 22 33`: uued maailmad on mängitavad.
