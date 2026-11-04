# V292 – pildipõhine HUD töötab telefonis

## Probleem
V291 mobiilirežiim päris mängus ei mahtunud ekraanile ja mõne tegevuse (eriti pausilt jätkamise) nupp kadus. Eelmine 196px kõrgune 3×2 nupuriba võttis rõhtvaates üle poole mängualast.

## Tehtud
- Jäid alles V291 kõik kuus pildipõhist menüükaarti, samad failid, samad juhtimiskäsud ja animatsioonid. Tavalisi HTML/CSS-nuppe ei ole piltide asemele lisatud.
- Rõhtvaates kuus pildikaarti ühes reas; riba vaid 70–91 CSS-pikslit kõrge. Mini- ja üksusepaneel ning väike avastuste paneel jäävad nurkadesse. Ülemine ressursiriba, maailmakaardi vahetus ja paus kohanduvad ekraani laiusega ega kattu.
- Püstvaates samad pildikaardid 3×2 paigutuses, 124–153px kõrguses alas; kaardile jääb maksimaalne pind. Avastuste, kaardi ja üksuse paneelid avanevad olemasolevate pildiikoonide kaudu.
- Uued nähtavad elemendid: puudunud suum-välja ikoon (taaskasutatud V290 pildifail) ja puutetundlikud ressursikastid. Paus ja jätka kasutavad mõlemad olemasolevat mängu pausinuppu; kumbki pole enam mobiilis blokeeritud.
- Erinevate ekraanisuurustega CSS kohandub viewporti tegelike mõõtudega, mitte 1671-pikslise kunstliku miinimumskaalaga. Töölauavaadet ei muudeta.
- Vana kasutajaliides jääb kättesaadavaks ui=classic või ui=painted abil.

## Kontroll
- V292 pildipõhine mobiili CSS ja JS: hud-v292-mobile.css ja hud-v292-mobile.js; laetud pärast V291 faile.
- Chromiumi lokaalses HTML-mängu mock-up'is kontrollitud 390×844, 360×640, 844×390, 740×360, 1024×768 ning 1671×941: 6 pilti laadisid, JS pageerror=0, kõik kaardid mahtusid vaatesse.
- Testitud oli päris nupu ID-de väljakutsumine: linn, ehitamine, sõdurid, kaubandus, päevik, diplomaatia, maailmakaardi vahetus, suum-välja, ründamine, paus ja jätka.
- Lisatud tests/ui-v292-mobile.mjs kiiretesse GitHubi testidesse.
- **Päris telefoni ning avaldatud mängu funktsionaalsus vajab siiski kasutaja testi**; ülaltoodud visuaalsed testid kasutasid kohaliku mängu/HUD-i testkeskkonda.

## Proovimiseks
https://orogdor.github.io/Kuningriigid/?ui=art&v=292
