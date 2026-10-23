# Kuningriigid V135 — AI linnade ehituse test

Kuupäev: 2026-10-23. Lähtekood: `historical-city-v135.js`, `civilization-core.js`. Teststsenaarium: `scenarios/ai-city-v135.json`.

## Tulemused (salvestatud AI simulatsioon)
- Maailmaseeme: **135023**
- Salvestuse aeg: **6300 mängusekundit = 105 täielikku käiku** (UI näitab käiku 106)
- Kõikide fraktsioonide linnu: **12**
- Vaadeldud AI fraktsioon (mängija valduses testis): **5 linna**
- Selle fraktsiooni ehitised: **38**, millest **32 valmis**, **6 ehitamisel**
- Väikseim kahe linna keskuste vahe: **9 maailmakaardi ruutu** (V134 eelmine piir 17)
- Linnade ehitised: 5 peamaja, 7 elamut, 5 puuraiet, 5 õpikoda, 4 jahimehe onni, 3 kaevu, 2 talu, 2 põldu, 2 savikaevandust, 2 kivimurdu, 1 savinõude töökoda.
- Linnade ehitiste arv: Põhjaküla 1 = 13, Põhjaküla 2 = 6, Põhjaküla 3 = 10, Põhjaküla 4 = 5, Põhjaküla 5 = 4.

## Mängi ja vaata
- [V135 — AI linnade test](https://orogdor.github.io/Kuningriigid/?v=135-20261023&demo=ai-city)
- [V135 — tavamäng](https://orogdor.github.io/Kuningriigid/?v=135-20261023)
- [AI testseisu JSON](scenarios/ai-city-v135.json)

Teststsenaariumis on olemasoleva pärismängu automaatsalvestuse kaitse, vaata/ava AI linnu, vajadusel vajuta mängu jätkamiseks ▶. Testi andmed pärinevad AI simulatsioonist, mitte käsitsi paigutatud näidismajadest.

## Tehniline piirang
Uus ehitusloogika kasutab ebakorrapäraseid, kaarduvaid ehituskohti ning järjestab linnapiirkondi keskuse ümber. Päris ehitamine läbib jätkuvalt maastiku, maardla, hoone kokkupõrke ja juurdepääsu reegleid. Kehtib **uutele AI ehitustele**, olemasolevaid salvestusi ümber ei paigutata.

**Kontroll:** arvandmed pärinevad GitHubi testseisu otsesest JSON-kontrollist. Kõiki brauserite visuaale ega füüsilise telefoni FPS-i selles aruandes kinnitatud ei ole. Automaatse reeglitesti lähtekood: `TEST_V135.mjs`.
