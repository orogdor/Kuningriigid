# V131 — nähtamatud optimeerimised

Tehtud on kokkulepitud punktid 1–7, 9 ja 11. Uut mudelite ühendamist ega ajutiste objektide taaskasutusfondi pole lisatud (punktid 8 ja 10).

1. **Navigatsiooni muutusnumbrid.** Hoonete kirjeldus arvutatakse uuesti tegeliku muutuse korral. Liikumise korduvad kontrollid võrdlevad muutusnumbrit. V130 takistuse- ja rajaõppe kehtivuse reeglid säilivad.
2. **Linna- ja maakonnaalad.** Omanikukaart arvutatakse uuesti ainult asjakohase muutuse korral. Linnade asukoha ja ID registrid ning piirkondade loendid on vahemälus.
3. **Ruumiline register.** Ressursside ning ehituskohtade lähedased hooned leitakse ruumilistest ämbritest. Alles jäävad samad täpsed kaugus- ja kokkupõrketingimused ning algne objektide järjestus, ka võrdsete kauguste korral.
4. **Koondandmed.** Linnade hooneloendid, valmimata ehitised, elamiskohad, laomahud ja valmis ehitiste päringud säilivad vahemälus. Teadus kasutab sama hooneloendit. Riiklikud tootmistehnoloogia kordajad arvutatakse uuesti avastuste muutumisel; tootmine, tööjõud ja hinnad säilivad.
5. **Rajaotsingu töömälu.** A* suurte arvumassiivide mälu kasutatakse korduvatel otsingutel uuesti. Kõik tööandmed lähtestatakse ning otsingu järjekord, tee kaalud ja sõjaväe käitumine säilivad.
6. **Menüüde osaline uuendamine.** Ressursiriba, linnade loend, laevade tegevused, tegevusnupud, ehituskaardid ja ehitusjärjekord säilitavad DOM-elemendid ning muudavad ainult muutunud teksti ja atribuute. Uued tegevuskäsud seotakse olemasolevate nuppudega; tõlked ja kerimisasend säilivad.
7. **Kõrguste vahemälu.** Korduvate täpsete koordinaatide maapinnakõrgused säilivad piiratud suurusega vahemälus. Koordinaate ei ümardata ega maastiku detailsust vähendata. Ühekordne navigatsioonivõrgu eelarvutus ei koorma seda vahemälu.
9. **Liikumatute mudelite maatriksid.** Staatilised hooneosad kasutavad juba arvutatud teisendusi. Hoone juur uueneb teisenduse muutumisel; liikuvad mehhanismid, suits, tornikaitsja ja katuseballista jäävad dünaamiliseks. Mudelite geomeetriat, materjale ja nähtavat detailsust ei muudeta.
11. **Taustasalvestus.** Mänguseisust võetakse terviklik koopia ning JSON-i kodeerimine toimub Web Worker'is. Automaat- ja käsisalvestus ning eksport kasutavad seda teenust. V4 vorming ja varukoopiareeglid säilivad. Vana asünkroonne tulemus ei kirjuta üle uuemat päringut või laaditavat mängu. Worker'i puudumisel on varulahendus; lehe sulgemisel lõpetatakse pooleliolev automaatsalvestus vajadusel sünkroonselt.

Salvestuse koopia tegemine ja localStorage'i kirjutus toimuvad endiselt põhikäituslõimes. Kõik pausid ei saa seetõttu kaduda. Rajamälu ja muud vahemälud on käitusaja andmed ning neid salvestusse ei lisata.

## Kontrollitud samaväärsus ja mõõtmine

Võrdlusalus: avaldatud V130, commit `61281bdf375b03b5f1433f06e3331f3fd5f2e0a6`. Mõlemale versioonile anti täpselt sama rauaaja mänguseis.

- 10 × 12 sekundi simulatsioon: kõik salvestatavad mänguandmed olid võrdsed, kaasa arvatud töötajate asukohad, majandus, AI, armee, ehitised ja teejäljed.
- 100 × 0,1 sekundi simulatsioon: samuti täpselt võrdsed mänguandmed.
- Ühes Node'i mõõtmises vastavalt 5359,9 → 3395,5 ms ja 3544,9 → 2871,3 ms (ligikaudu 37% ja 19% vähem arvutusaega). Need ei ole telefoni FPS-i mõõtmised ega garantii iga mänguolukorra kohta.
- Täpsed tulemused ja lõppseisude kontrollsummad: `reports/performance-v131/comparison.json`. Korratav võrdlus: `node scripts/compare-v131.mjs <V130 lähtekoodi kaust>`.
- `TEST_V131.mjs` kontrollib vahemälu tühistamist, ruumilise otsingu täpsust, elamis- ja laomahte, tootmisboonuseid, A* töömälu, kõrgusi, staatilisi maatrikseid ja terviklikku taustasalvestust.
- V125–V130 regressioonid ning avaldamise kontrollid. Brauseritest kontrollib telefoni ja arvuti vaadet, korduvate menüüuuenduste elemendiidentiteeti, ehitusnupu toimimist, päris Worker'i salvestuse samaväärsust ja tavalise mängu automaatsalvestuse varukoopiat.
