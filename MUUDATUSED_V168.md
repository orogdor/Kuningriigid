# Kuningriigid V168 – kiviaja kindlustuste tasakaalustus

V168 eesmärk: AI lõpetab kiviajal kompaktsed palisaadiringid, jätab kaks päriselt läbitavat puitväravat ja neli vahitorni ning hoiab ehitised/põllud kaitseringi koridorist eemal.

## Parandused

- Lisati **kogu palisaadilõigu geomeetriline kokkupõrkekontroll**. Pikkade 28–42 mänguühiku pikkuste müüride otstes asuvaid maju ja põlde enam ei loeta vabaks ehituskohaks ainult sellepärast, et müürilõigu keskpunkt jäi vabaks.
- **Küla asutamisel reserveeritakse tulevase puidust kaitseringi asukoht**, enne kui AI hakkab põlde ja elumaju rajama. Reserveering ei tekita ühtegi tasuta ehitist ega muuda varusid.
- Reserveeritud müürikoridoride korral valib kiviaja AI põldudele teised sobivad kohad.
- Hiljem ehitatavad majad ja töökojad arvestavad **kogu** palisaadilõigu jalajälge, mitte ainult 8 ühikut lõigu keskpunktist.
- Päris ehitamine kasutab endiselt olemasolevat puidukulu, töötajaid, ehitusjärjekorda, maastiku ja tehnoloogiate kontrolle.
- Salvestatud linnad ja pronksiaja kivimüüride loogika jäävad alles.

## 3 maailma / 9 AI pealinna – päris 125-käiguline simulatsioon

Testimaailmad: 142023, 31757 ja 81311. Iga maailm sisaldab kolme AI riiki. Arvestatud on **pealinna viimast kiviaja käiku**, mitte ehitust pronksiajal. Puuduvad kingitud ressursid, elanikud või automaatselt valmis ehitised.

| Seeme | Kiviaja pealinn | Ring valmis | Valmis / plaanis | Väravaid | Torne |
|---:|---|---|---:|---:|---:|
| 142023 | Sampola | Jah | 20/20 | 2 | 4 |
| 142023 | Vendel | Jah | 22/22 | 2 | 4 |
| 142023 | Sogn | Jah | 20/20 | 2 | 4 |
| 31757 | Ahtola | Ei | 18/22 | 2 | 4 |
| 31757 | Svea | Jah | 22/22 | 2 | 4 |
| 31757 | Kaupang | Jah | 20/20 | 2 | 4 |
| 81311 | Hiitola | Ei | 19/20 | 2 | 4 |
| 81311 | Järnsida | Jah | 20/20 | 2 | 4 |
| 81311 | Hrafnista | Jah | 20/20 | 2 | 4 |

**Tulemus: 7/9 täielikku ringi (78%)**, keskmiselt **97%**. V167 eelmises 9 pealinna testis oli **0/9** täielikku ringi ja keskmine valmidus **93%**.

**Piirang:** Ahtola ja Hiitola ringidel on veel üks või mitu sobimatu ehituskoha tõttu lõpetamata palisaadilõiku. Seega ei tohi tulemust nimetada 100% kindlaks või igas maailmas sulguvaks kaitseringiks.

## Kontrollid

- `TEST_V168_RING_CORRIDOR.mjs`: kogu palisaadilõigu, põllu ja hoone jalajälg, reservatsioon esimesest päevast.
- `TEST_V166_STONE_FORTS.mjs`: puitvärav, teekasutus, ehtne ehituskulu ja kiviaja AI.
- `TEST_V139.mjs`, `TEST_V160.mjs` ja `TEST_V163_STONE_CITY.mjs`: pronksiaja kaitse, majanduse ja varasema kiviaja planeerimise regressioonid.
- `scripts/stone-fort-balance-v167.mjs`: 3 maailma ja 9 AI pealinna, 125 käiku.
- GitHub Actions kontroll: https://github.com/orogdor/Kuningriigid/actions/runs/40238360263

## Edasine täiustamine

Järelejäänud 2 linna vajavad maastikust sõltuvat alternatiivse müürikoridori otsimist või **tasutud** põllu ümberpaigutamist. Neid ei loeta valminuks enne päris ehituse lõppu.
