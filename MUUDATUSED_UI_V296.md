# V296 – uurimismenüü avamise rikke parandus

## Miks kasutaja nägi ikka maailmakaarti
- V291 pildipõhise HUD-i teaduse avamiseks kasutati varem peidetud vana `#techtoggle` HTML-nupu `.click()` väljakutset.
- See sõltus varasema UI elemendist ja asjaolust, et sellele oleks juba sündmusekäsitleja lisatud. V293 ringid ja mobiili teaduseressurss kasutasid sama vahendusnuppu.
- Kogu V294/V295 kujunduse olemasolust hoolimata võib menüü jääda avamata. Pildilt oli näha maailmakaart, mitte avatud menüü.

## Lahendus
- Mängu tegelik `openResearch()` funktsioon on nüüd kättesaadav kui `window.openKuningriigidResearchV296`; see teeb `researchpanel.hidden=false`, renderdab uurimismenüü ja fokuseerib sulgemisnuppu.
- `hud-v291.js` kutsub tõelist funktsiooni otse avastuse põhikujunduse, järjekorraringide ja teaduse ressursi juurest.
- `hud-v293-research.js` kasutab sama funktsiooni, säilitades valitud tehnoloogia ID.
- `hud-v292-mobile.js` suunab mobiili teaduseressursi nupu sellele funktsioonile.
- Kuni mängu alglaadimine pole lõppenud, jääb varasema nupu ühilduvusvaru alles.
- Muudetud JS-i laadimisversioonid `?v=296a`, samuti `boot-v83.js` import `civilization.js?v=296a` väldivad Androidi brauseri vana failiversiooni kasutamist.

## Kontroll
- `tests/ui-research-v296.mjs` käivitab päris mängufunktsiooni isoleeritud testiga ja kontrollib, et dialoog avaneb ning `renderUI()` kutsutakse.
- Test kontrollib, et UI vahendus valib otse päris mängufunktsiooni, mitte peidetud nupu kliki.
- Olemasolevad V293–V295 tehnoloogiapuu ja viie uurimisjärjekorra testid jäävad tööle.
- Päris Androidi kasutajakogemus vajab telefonis kinnitust; automaattest ei asenda ekraanil vajutamise testi.

Link: https://orogdor.github.io/Kuningriigid/?ui=art&v=296