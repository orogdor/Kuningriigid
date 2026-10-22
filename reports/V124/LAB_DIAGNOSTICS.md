# Kuningriigid V124 — põhjalikumad lahingutehnilised leiud

## Kontrollitud käitumine

Kõik kümme V123 mootoriga koostatud katselahingut avanesid korrektselt, tegelike sõdurite ja tõelise maastikuga. Kõik algseisud on deterministlikud ja salvestatud eraldi V4 JSON-faili kataloogis `replays/V124/`. Laadimiskontroll tehti ka päris Chromiumi brauseris: stseenid 1 (390 × 844), 7 ja 10 (1366 × 768), paus ja allalaadimine.

90-sekundilise automaatse katse lõppedes ei olnud ükski stsenaarium lõplikult lahendatud. `TOP10_BATTLES.json` aruande «casualties» arv näitab **algselt lahingus osalenud miinus lõpuks lahinguväljal alles olevad elusad mehed**: arvestusse võivad sattuda surnud ning põgenenud; see pole iseenesest täpne hukkunute loend. Lisaks tuleb arvestada lahingureservi, kui üldvägede arv ületab 500-mehelise mahupiiri.

## Kriitiline leid: moodne sõjavägi ei lähe vastasega kontakti

Eraldi `TEST_V124_MODERN_DIAG.mjs` jooksutas modernse lahingu #10 täiendavalt **200 simulatsioonisekundini**:
- Meeskond 0: 240 aktiivset võitlejat, meeskond 1: 240.
- Esialgsed keskmised X-positsioonid `-147.51` ja `+147.53`: vägede vahe oli ligikaudu **295 kohalikku ühikut**.
- Pärast 30 sekundit `-147.10` ja `+147.26`.
- Pärast 90 sekundit `-147.10` ja `+147.26`.
- Pärast 180 sekundit `-147.08` ja `+147.21`.
- Simuleeritud 200 sekundi jooksul polnud kummalgi poolel ühtegi registreeritud tabamust, kaotust ega võitjat.
- Üksuste `moving` olek oli sageli tõene (9–10 salka), kuid tegelik keskmine asukoht praktiliselt ei muutunud.

**Järeldus:** probleem pole üksnes liiga lühikeses 90-sekundilises testis ega üksuste tugevuses. Vähemalt selles konkreetses lahingus on üksiksõdurite asukoha muutumine sõidusuuna või rajaleidmise/taktikalise rivi eesmärgiga vastuolus. Kontrollida tuleb `tacticalGoal`, `marchingGoal`, `keepAdvance`, `formation` hoidmist ja `battleNavigation` takistusi. Algseis on reprodutseeritav: https://orogdor.github.io/Kuningriigid/?v=124-20261023&demo=v124-10

## Metoodika ausad piirangud

- Need 10 on **eraldi teadlikult korraldatud lahingukatsed**, mitte 10 tegelikult toimunud kampaanialahingut. Automaatses ilma renderdajata majandustestis ei kutsuta käikude ajal välja brauseri kokkupõrkelahingute algatusloogikat.
- Täpne **lahingu lähteolukord** (maailmaseeme, maastik, üksused, individuaalsed sõdurid, HP, varustus, kogemus, paigutus, sõjaline seisund) on uuesti avatav. Täpselt sama **lõpptulemust** ei saa lubada, sest kasutaja mängukäsud võivad erineda.
- Kampaania ajastukronoloogia ja majanduse üksikasjad on eraldi `CAMPAIGN_REPORT.md` ning `campaign.json` failides, kui pikk jooks lõpetatakse.
