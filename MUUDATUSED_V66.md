# Kuningriigid V66 – kogu linna territoorium on üks ehitusala

## Ühine ehitusala

- **Kõik ühele linnale kuuluvad maailmaruudud** moodustavad mängureeglites ühe ehitusala. Linna keskruut ja ülejäänud territoorium ei ole enam iseseisvad väikelinnad.
- Linna kõigil ruutudel on üks **materjalivaru**, elanikkond, tööliste ja ehitajate arvestus, tehnoloogiliste ning valmis hoonete eeltingimused, ehitiste hoiustamismahud ja **üks ühine ehitusjärjekord** (kokku kuni 12 pooleliolevat ehitist).
- Füüsilised hooned ja tööobjektid asuvad edasi oma päris detailruudul. Erinevate ruutude hooned arvestatakse ühisesse linna hoonete loendisse; materjalide kulu arvestatakse **ainult ühe korra**.
- Linna ehituspaneel kuvab linna territoriaalsete ruutude arvu ja ühise ehitusala oleku. Linna üldinfo näitab kogu linna hoonete ootel tööde arvu ning ühise ehitusjärjekorra täitumist.
- Kasarm võib asuda ka **linna teisel ruudul** ja see täidab sama linna sõdurite värbamise eeltingimuse. Väljaõpetaja liigub võimalusel selle ruudu kasarmusse.
- Linna ehitusmeeskond jääb ühine. Tegelikult kaugemale minevate ehitajate teekond ja materjalide transport jätkavad senist füüsilise liikumise loogikat; jõed ning mäestik võivad vajada toimivat läbipääsu.

## Ehitamine üle ruutude piiride

- Võid valida hoone näiteks linnakeskuse detailkaardil ja **klõpsata linnale kuuluvale kõrvalruudule**, millel on ehitatav koht. Ehitis lisatakse õigesse naaberruudu detailkaarti, mitte ekslikult linnakeskusse.
- Hoone paigutuse eelvaade (ka roheline/punane märgistus) kasutab nüüd sihtkoha tegelikku detailkaarti.
- Liikudes sama linna teisele detailruudule, jääb valitud ehitusplaan alles; see tühistatakse teise linna, neutraalse maa või lahingu avamisel.
- Linna väline ruut ei sobi ehitamiseks. Ehitada saab ainult kuivale sobivale maale, seniste kokkupõrgete, kallaku ja ressursimaardlate tingimustega.

## Tehniline ühilduvus

- Uus `constructionArea(city)` koondab ühe linna territooriumi, hooned, ootel ehitused ja ressursivaru; `resolveAreaSite`, `previewInArea` ja `buildInArea` tuvastavad õige füüsilise detailruudu.
- Piirkondade lokaalsed `economy.buildings` massiivid säilitavad maailmaobjektide asukohad, kuid ei esinda eraldi linnade majandust. Piirkondadel on `constructionAreaId` ja nad jagavad vanemlinna `realms[team]` objekti.
- Salvestuse `version:4` jääb samaks. Varasemad linnad ja majandused töötavad; piirkondade sidumine taastub salvestuse uuesti avamisel.

## Testid

- `TEST_V66.mjs`: 4 kaardiseemet, ühisala **49–61 maailmaruutu**; detailnaaberruudu ehituse paiknemine; ühine ehitusjärjekord 12/12; ühekorraline materjalikulu; teise ruudu kasarm, linna värbamine ja ühekorraline elanike kulu; vanemlinna ühine majandus pärast salvestamist ja laadimist.
- `TEST_V65.mjs`, `TEST_V64.mjs`, `TEST_V63.mjs`, `TEST_V61.mjs` ja `TEST_V60.mjs` läbisid regressioonikontrolli.
- Päris GitHub Pagesi V66 brauseris ehitati linnakeskuse paneelist elamu teise maailmaruudu detailkaardile. Hoone **tekkis õigesse ruutu**, ühine järjekord sai ühe tellimuse, linnakeskuse nimekiri jäi ruumiliselt õigeks ja ühised materjalid vähenesid ühe ehitise maksumuse võrra. JavaScripti käivitusvigu ei olnud.

**Piirang:** üheks ehitusalaks ühendamine ei tee merest või mäestikust automaatselt läbitavat; eraldi maailmakaardil laienevat linna territooriumi määrab endiselt rahvaarv.
