# V354 katse – majaehitaja hooned mängus

## Täiendus 2026-11-17 (3): kvaliteet ja detailitasemed

Igal kujundaja hoonel on kolm taset (`THREE.LOD`):

| Tase | Millal | Sisu | Tekstuurid (hoonete detail kõrge / keskmine / madal) |
|---|---|---|---|
| Lähedal | kaamera kuni 55 / 40 / 25 ühikut | kõik, ka sisustus, põrand ja tulease katusega hoone sees | high / medium / medium |
| Keskmine | sealt kuni kaugeni | ilma katusealuse sisustuseta, tipud ühendatud 7 cm ruudustikule | medium / low / low |
| Kaugel | alates 280 (nähtavuskaugus × LOD-seade) | ainult suured osad (pole kõrsi, kivikesi, tööriistu), 16 cm ruudustik | low |

- Ruudustikule ühendamisel hoitakse lahus eri suunas pinnad ja tekstuuriplaadid, nii et servad ja tekstuuri õmblused jäävad. Näiteks kiviaja peamaja 159 000 → 75 500 → 30 400 kolmnurka, elamu 102 000 → 37 000 → 15 000.
- Tekstuurifailid laaditakse alles siis, kui hoone tase esimest korda ekraanile joonistatakse, ja ainult selle taseme resolutsioonis. Seni kasutatakse sama faili juba laaditud väiksemat versiooni. Kaugel olevate hoonete pärast high-tekstuure ei laeta. Varieeruvate tekstuuride (õled, puit, kivi, savi, punutis) esimene plaat lõigatakse mängus iga taseme jaoks eraldi (512 / 256 / 128 px).
- Sisustus katusega hoone sees ei heida varju.
- Tekstuuride filtreerimise seade annab anisotroopia (1× / 2× / 4×).
- Peidetud kujundaja laeb ainult madalad tekstuurid (tal on vaja ainult failide nimesid). Mudelivahemälu versioon `354f`.
- Kontroll: `tests/house-designs-v354-lod-browser.cjs` (tasemed, kolmnurgad, laaditud failid kaugel, keskel ja lähedal).
- Seaded loetakse mängu käivitamisel; muudetud graafikaseade jõustub majadele pärast uuesti laadimist.


## Täiendus 2026-11-17 (2): kõik hooned kujundajast, uksed lahti, inglise keel

- **Vanu mudeleid kiviajast rauaajani enam ei kasutata.** Kõik hoonetüübid tulevad majaehitajast, ka müürid (sirge 7-ühikuline lõik, mille mäng venitab: puitvall, madal/kõrge kivivall, Müür II = muldvall palissaadiga), väravad, tornid, põld (venitatakse põllu suuruseks), karjamaa, kalur, sadam ja turg. Kui kujundajal pole hoone jaoks selle ajastu versiooni (nt kelder või metsnik kiviajal), võetakse lähim olemasolev. Vanaks jääb ainult sild (järgib jõekaldaid) ja ajastud alates keskajast (kujundajas neid pole).
- **Kauge tase on samast mudelist:** väikesed detailid (katuse kõrred, kivikesed, tööriistad) jäetakse ära. Vahetuskaugus: nähtavuskaugus lähedal 110, keskmine 180, kaugel 280, ultra 420.
- **Mudelite vahemälu (IndexedDB `kingdoms-house-models-v354`).** Esimesel käivitusel ehitatakse mudel kujundajas (selle aja on hoone asemel tühi koht), järgmistel kordadel loetakse see brauserist kohe. Versioonivõti `MODEL_VERSION` (`354d`).
- **Uksed on lahti:** nahkeesriie on üles rullitud, punutud uks ja laudadega uksed on lahti keeratud. Majja saab sisse kõndida.
- **Inglise keel:** majaehitaja kogu kasutajaliides on inglise keeles (`<html lang="en">`, tekstid ja teated). Mängu enda eestikeelsed jäägid on tõlgitud failis `locale-en-v354.js` (u 450 paari; külade nimed jäävad pärimusnimedeks, sõna „küla” → „village”).
- Alumised maalitud käsukaardid (linnad, ehitus, armeed, kaubandus, diplomaatia, sündmused) kasutavad inglise keeles ingliskeelse pealkirjaga koopiaid (`ui-art-v306/card_*_en.webp`, `ui-english-v354.js`). Muudes maalitud piltides võib veel eestikeelset teksti olla.
- Peidetud kujundaja suletakse 20 s pärast viimast mudelit, et tema WebGL-kontekst ei võtaks telefonis mälu.
- Graafikamenüü lüliti on eemaldatud (vanu mudeleid ei kasutata). Võrdluseks töötab URL `?houses=old`.

## Esimene osa

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

## Mobiil (354e)

- Peidetud kujundaja on vaateala sees ja laaditakse kohe (`loading=eager`); varem ekraanist kaugel olev iframe võis telefonis jääda laadimata.
- Mudelid valmivad aeglases seadmes umbes kaks korda kiiremini (pikemad tööviilud, tarbetu tekstuuriootus ära). `houseDesignStatusV354()` näitab iga mudeli aegu ja vigu.
- Kui kujundaja ei käivitu 60 s jooksul või lakkab vastamast (südamelöök iga 3 s), näidatakse ootel hoonetel vana mudelit ja mängija saab teate põhjusega.

## Jõudlus (354f)

- Sama mudeliga hooned (nt 12 elamut) joonistatakse koos, üks joonistus mudeli osa kohta. Pilt jääb samaks.
- Varjud tulevad hoone lihtsamast koopiast, mida ekraanile ei joonistata. Varjukaardi täpsus on niikuinii jämedam kui see koopia, seega varjud näevad välja samad.
- Väiksema pildi (telefon, madalam eraldusvõime, automaatne eraldusvõime) korral lähevad hooned kergemale tasemele varem, sest detail poleks niikuinii näha.
- Mängija linnade hoonete mudeleid hakatakse tegema kohe mängu alguses, mitte alles linna avamisel.
