# V354 katse – majaehitaja hooned mängus

Haru `test/majaehitus`. Peaharu ei muudetud.

## Mis muutus

- **Kujundaja ehitusmenüüs.** Kujundatava hoone kaardil on väike ✎ ikoon (kuldne, kui tüübil on kavand). See avab kogu majaehitaja kasutajaliidese mängu kohal, mäng on selle ajal pausil. „Salvesta ja ehita” salvestab kavandi hoonetüübile (`s.houseDesignTemplatesV354`) ja valib ehituskoha. Iga järgmine selle tüübi hoone saab kavandi koopia (`houseDesignV354`), juba ehitatud hooned jäävad samaks. „Taasta algne” eemaldab tüübi kavandi, „Sulge” või Esc sulgeb.
- **Peamaja** ei ole ehitusmenüüs, seda kujundatakse hoone infost („✎ Kujunda hoone”).
- **Kokkupõrge kujundaja järgi.** FPV-kõndija põrkab kujundaja hoone seintega (kujundaja jalutusrežiimi seinad, uksed jäävad lahti), mitte enam kogu krundi ristkülikuga: majja saab uksest sisse minna. Elanike ja sõdurite navigatsioon kasutab endiselt krundi ristkülikut.
- **Uued majad.** Kiviaja, pronksiaja ja rauaaja tavahooned kasutavad detailkaardil majaehitaja mudeleid koos tekstuuridega (`majaehitaja/textures/`, keskmine resolutsioon). Hoone suurus sobitatakse mängu krundiga.
- **Kaugel vana mudel.** Iga hoone on `THREE.LOD`: lähedal kujundaja mudel, kaugel senine kergem mängumudel. Vahetuse kaugus sõltub graafika nähtavuskaugusest: lähedal 140, keskmine 240, kaugel 380, ultra 560.
- **Lüliti.** Graafikamenüüs on „Majaehitaja hooned (katse)”. Lüliti olek salvestub brauserisse. URL `?houses=old` käivitab vanade mudelitega.
- **Vanaks jäävad:** müürid, väravad, tornid, põllud, karjamaa, sild, turg, kalur, sadam ning ajastud alates keskajast. Nende kuju sõltub mängureeglitest (joonistatud müürid, kaldajoon, tornivalvurid).

## Kuidas see töötab

1. `house-designs-v354.js` avab peidetud kujundaja (`majaehitaja/index.html?embed=1&worker=1&textures=medium`).
2. Mäng küsib hoonet (`model`, kujundaja ID või kavand). Kujundaja ehitab hoone, ootab tekstuurid ära ja ehitab selle uuesti, et vahepeal käivitunud plaani pisipilt ei segaks.
3. Võrgud ühendatakse materjalide kaupa (≈15–25 draw call'i hoone kohta) ja saadetakse puhvritena. Failitekstuurid lähevad aadressina, lõuendtekstuurid ImageBitmapina.
4. Mäng teeb neist ühised geomeetriad ja materjalid. Kõik sama tüüpi hooned kasutavad sama mudelit.
5. Kui mudel valmib, muutub hoone tempel ja detailkaart vahetab hoone välja.

## Failid

- `house-designs-v354.js` – uus.
- `majaehitaja/index.html` – `exportModel`, töölehe päringud, hoone ID avamisel, peidetud lingid.
- `civilization.js` – kujundaja mudel `townBuildingModel`-is, templid, kujundaja aken, graafikamenüü lüliti, `gameDebug` abifunktsioonid. Reavahetused taas LF.
- `building-inspector-v82.js` – kujundamise nupp (peamaja).
- `index.html` – `building-inspector-v82.js` vahemälu võti.
- Testid: `tests/house-designs-v354.mjs`, `tests/house-designs-v354-browser.cjs`, `tests/house-designs-v354-view.html`.

## Testid

- `node tests/house-designs-v354.mjs`
- `node tests/house-designs-v354-browser.cjs` (Playwright + Chrome, SwiftShader): Stonetown'is ehitati 13 kujundaja mudelit, vigu 0. Peamaja kavand salvestati mängu kohal avatud kujundajas (kivisein, mätaskatus) ja peamaja vahetus kaardil.
- Kiirkontroll (`.github/workflows/v128.yml` käsud) 127/127.

## Pooleli

- Kujundaja mudelid on üksikasjalikud: kiviaja maja ≈100 000 kolmnurka, pronksiaja peamaja ≈25 000. Päris seadmel FPS mõõtmata. Vajadusel saab lisada lihtsustatud keskmise taseme.
- Kujundaja shaderiefektid (stohhastiline tekstuur, fresko vöö, makrovarjund) on mängus tavalised tekstuurid.
- Mudelid ehitatakse igal käivitusel uuesti (SwiftShaderis 3–6 s hoone kohta, päris videokaardil kiiremini). Selle aja on ekraanil vana mudel.
- Kavandatud hoone mudel ei muuda mängureegleid (mahutavus, hind, ehitusaeg).
- NativeThreeBridge'i (APK/EXE) liides kontrollimata.
