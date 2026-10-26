# Kuningriigid V170a – etapp 3.1, hoonemudelite esimene väljalase

Kuupäev: 2026-10-26.

## Tehtud: 3.1a, kiviaja elamud ja peamaja

- `town-models-v154.js`: 12 deterministlikku, eristuvat kiviaja elamu siluetti varasema 8 variandi asemel.
- Mudelitüübid: eri suurusega ümaronnid, nahktelk, pikkhooned, puitseinad, savipunutisseinad, madalad turfkatused, varjualused ja lisaruumiga majad.
- `hall`: 4 asukohaseemnest sõltuvat kiviaja/pronksiaja saalhoone vormi; peamaja eristub elamust.
- Mudelid on ainult esitlusgraafika. Salvestuse vormi, hoone hinda ega tootmisreegleid ei muudeta.

## Tehtud: 3.1b, linna keskuse teenindushooned

- `well`: ka kiviajal katusega kaev, puidust vänt ja ämber.
- `market`: kiviaja ja pronksiaja vahetusplats puitpostide, rookatuse ja laudadega, hilisematel ajastutel säilib varikatustega turumudel.
- `warehouse`: puitdetailidega aidamudel, märgatav suur laadimisuks ja varukastid.
- `cellar`: madal mullaga kaetud kelder, ukseava ja maa-alust hoidlat meenutav siluett.

## Tehniline lahendus

- Kasutatakse senist `createTownModelV154` geomeetriate vahemälu ning ühiseid materjale.
- Elamute 12 varianti põhinevad ehitiste püsival `buildingSeed`-il.
- Peamajade 4 varianti lisavad vahemälule variante, kuid ei muuda ehituskohtade, AI ega rajaleidmise andmeid.
- `civilization.js` laadib `town-models-v154.js?v=170a`; `boot-v83.js` ja `index.html` said V170a versiooniviited.

## Tehtud kontrollid

- Uue JavaScripti süntaksikontroll (läbis).
- Importkaardi JSON-i süntaksikontroll (läbis).
- Mudeligeneraatori käivituskatse Three.js API asendusklassidega: 180 eri hoone-/ajastukombinatsiooni, kõik lõid mitte-tühja geomeetria.
- GitHubis kontrollitud V170a versiooninimi ning uus mudelimooduli aadress.

**Piirang:** asendusklassidel tehtud mudelitest ei võrdu päris WebGL renderdamise ega telefoni jõudluskontrolliga. GitHub Pagesi avaliku lehe laadimist ja V169 täielikku AI-simulatsiooni pole V170a jaoks veel kinnitatud.

## Järgmine töö

- 3.1c: tootmishoonete ja sõdalaste laagri eristuvam visuaal, vajaduse korral eraldi farmi/kaevanduse renderdajad.
- 3.1d: kõigi mudelite pildikontroll, brauseri- ja mobiilikatse, FPS ning V169 regressioonid.
- Etapid 3.2–3.5 ei kuulu V170a väljalaskesse.
