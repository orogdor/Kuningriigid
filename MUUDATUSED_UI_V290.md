# V290 – pildipõhise maailmakaardi HUD-i esimene etapp

## Valmis
- Kinnitatud 1672×941 kujunduspildist eraldati 19 ehtsat WebP-faili kataloogi ui-art-v290: ülariba, avastused, minimap, juhtpaneel, kuus illustreeritud kaarti ja juhtnupud.
- hud-v290.js on eraldi HUD; läbipaistvad klõpsualad kutsuvad olemasolevaid mängukäske (linnad, ehitamine, väed, kaubandus, diplomaatia, päevik, teadus, kaardivahetus, paus ja suum).
- Tegelik minimap canvas tõstetakse pildiraami ning taastatakse vana liidese juurde naastes.
- Aktiivne avastus, tegelikud ressursid, ajastu ja valitud üksus uuenevad mängu andmetest. Algse pildi näidisnumbrid ja avastustekst on eemaldatud.
- Kohanduv asetus 1672×941 masteri järgi; tahvlil ja telefonis eraldi paigutus, puutega avatavad kõrvalpaneelid.

## Turvaline testirežiim
- V290: https://orogdor.github.io/Kuningriigid/?ui=picture&v=290
- V289: https://orogdor.github.io/Kuningriigid/?ui=painted&v=289
- Klassikaline: https://orogdor.github.io/Kuningriigid/?ui=classic&v=289
- Uus UI ei asenda automaatselt V289-t enne kasutaja kontrolli.

## Kontroll
- Node JavaScripti süntaksikontroll ja tests/ui-v290.mjs (19 tegelikku RIFF/WEBP faili, funktsioonide seosed, versioonitekst ja meediapäringud).
- Inline Chromiumi HTML-eelvaade renderdati mõõtudel 1672×941, 1366×768, 1024×768, 390×844, 844×390 ja 2560×1440: kõigil kuuel kaardil laeti pilt, minimap liikus oma raami, JavaScripti pageerror oli 0.
- Need on sünteetilise mänguseisundiga testid, mitte GitHub Pagesi täieliku mängu live-kontroll.

## Järgmised tööd
1. Testi päris mängus menüüde avamine, sulgemine ja minimap.
2. Tee sama pildisüsteemiga linna-, ehitus-, väe-, diplomaatia-, kaubandus- ja seadete sisemised menüüd.
3. Kontrolli detailkaardi ja maailmakaardi vahetust ning mängu salvestusi, seejärel võrdle lõppkuva referentspildiga.