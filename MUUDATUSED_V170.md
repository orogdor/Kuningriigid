# Kuningriigid V170 – etapi 3.1 graafikauuendused

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

## Tehtud: 3.1c, tootmishooned ja õppelaager

V170b muudab mängu tegelikult kasutatavaid 3D-mudelite genereerijaid:

- `town-models-v154.js`: **metsatöölise hoone** (`lumber`) sai palgivirnad, saepuki, lõhkumispaku ja ajastule vastava kirve; **jahimeheonn** (`hunter`) nahkuivatuse ja odad; **sõdalaste laager** (`barracks`) harjutuspostid, odarestid ja märklaua; **õpikoda** (`study`) kiviajal tahutud tähiste ning istumiskoha; **talumudel** (`farmhouseGeometry`) viljakuivatusaluse ja käsikivi.
- `site-models-v88.js`: **kalurihoone** (`fisher`) sai muulile nähtava kala- ja võrgukuivatuse, ujukid ning maismaapoolse varustuse. Sadama (`harbor`) mudelit see ei muuda.
- `world-models-v152.js`: **kivimurru** (`quarry`) ühisesse geomeetriasse lisati raiumisastmed, tugipostid, kiviplokid ja käsi­tööriistad.
- `farm-visuals-v127.js`, `civilization.js`, `boot-v83.js`, `index.html`: ühised mudelid ja käivitaja seoti värskete `v=170b` URL-idega.

Muudatused ei tekita uusi päris hooneid ega lisa AI-le otsuseid. Hoonete maksumus, toodang, salvestused ja rajaleidmise reeglid on lähtekoodis muutmata.

### V170b kontroll

- JavaScripti süntaks: uuendatud kolme graafikamooduli ja versiooniviidete kontroll läbitud.
- Mudeligeneraatori käivituskatse Three.js API asendusklassidega: **202** edukat linnahoone, kaevanduse ja farmi varianti; pärast testasenduse `Vector3` meetodite täiendamist lisaks **14** edukat kaluri-/sadamamudelit.
- Kontrolliti, et `index.html` versioon on `Kingdoms V170b`, `civilization.js` kasutab uut farmi- ja linnamudeli URL-i ning rannikumudel laeb uuendatud kivimurru geomeetria.

**Piirang:** mudeligeneraatori asendusklassidega tehtud test ei kinnita päris Three.js WebGL-renderdust, FPS-i, GitHub Pagesi levimist ega 200 käigu AI-regressiooni. Avalikku URL-i ei õnnestunud kontrollivahendiga avada. Need jäävad etappi 3.1d.

### V170b mängulink

https://orogdor.github.io/Kuningriigid/?v=170b-20261026

## Järgmine töö

- 3.1d: kõigi mudelite pildikontroll, brauseri- ja mobiilikatse, FPS ning V169 regressioonid.
- Etapid 3.2–3.5 ei kuulu V170a väljalaskesse.
