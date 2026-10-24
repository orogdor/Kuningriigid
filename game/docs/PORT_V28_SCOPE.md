# V2.8 – 9×9 detailkõrgused, ehitustakistused ja käimisteed

Lähteseis: port 2.7, fikseeritud V131 Maa-atlas (seed 131), SHA `26562368f56a32616651a266ed2d8c87f06d43d1`.

**Teostatud:**
- 81 kõrgusproovi detailruudu kohta; punktid on V131 `world-details.js` järgi ruudu 50×50 atlasmeetritel indeksitel 0..8. Bilineaarne interpoleerimine; 225×195 detailmõõtmed. Vahemälu kuni 64 viimati nõutud ruutu (umbes 20 KB prooviväärtusi).
- Kõrgus arvutatakse V131 arhitektuuri järgi samast küpsetatud maailmaatlasest. Kõikide naaberruutude piiriproovid on identsed.
- 3D-maastik, kohalik AStarGrid2D, linnasisesed jalakäigud ning käsitsi/AI-ga ehituskrundi otsing kasutavad sama 9×9 kõrguspinda, ranniku- ja nõlvakontrolli. Sillakoha tingimused jäävad jõevõrguga ühiseks.
- Uus mobiilimenüü käsk: Testid → „9x9 kõrguskaart: info“.
- V28 20 uut GDScripti kontrollväidet; täiendav Python-kontroll 2400 prooviraja servavastavuse kohta.

**Olulised piirangud:**
- See EI OLE V131 originaalse jooksva `bakeDetails` funktsiooni väljundit binaarbaitidena kopeeriv port: 9×9 kõrgusproovid arvutatakse küpsetatud V131 ruud **keskpunktide** interpoleerimisel ja vanad Godoti kõrguse visualiseerimisühikud (.52) jäävad alles. V131 originaalis kasutatakse peale kõrgusproovi ka väikest nihutust ja ümardust.
- Linna senised hooned ei paigutata automaatselt ümber – uus kalde/vee kontroll kehtib *uutele* hoonetele ja uutele marsruutidele. See säilitab olemasolevad salvestused.
- Päris füüsikapõhist 3D navmesh'i, mäenõlval animatsiooni, eri kõrgustel olevaid mitmekorruselisi sildu ja V131 universaalset kaartide genereerimist pole veel.
- Androidis ja Godot parseris ei ole testid käivitatud. Käivita menüüst **Reeglitest**. Kui Godot peatub, saada **esimene** parsingu viga ja failirida.
