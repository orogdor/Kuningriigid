# Kuningriigid V73 – salvestuste töökindlus ja seadmevahetus

Põhineb V72 main harul (commit `0345cf93787a201612b185a0db2a645de7acf362`).
**Mänguloogikat, olemasolevat maailma ja salvestuse versiooni (4) ei lähtestata.**

## Muudatused
- `save-safety-v73.js` eraldab salvestamise ja taastamise kontrollid DOM-ist. Põhisalvestus asub endiselt võtmes `kingdoms-civ4`, varukoopia `kingdoms-civ4-backup`.
- Kui telefoni salvestusruum takistab varukoopia kirjutamist, üritatakse põhisalvestus ikkagi salvestada; varukoopia vea tõttu seda enam ei katkestata.
- V71/V72 salvestused, üksused, uurimised, laevad ja laeval olevad armeed säilivad.
- Varem olemasolevate kolme käsitsi salvestuskoha V51 võtmeid ei muudeta.
- Vana automaatsalvestus kopeeritakse enne uue mängu alustamist, salvestuskoha laadimist või JSON-importi varukoopiasse, kui vaba ruumi on.
- Vigane või võõra versiooni JSON-import lükatakse tagasi ilma praegust mängu kirjutamata.
- Ekspordi nime versioon V73; menüü selgitab telefonist arvutisse liikumist ning eemaldab aegunud kiirusevaliku kirjelduse.
- Mängu importide päringuversion tõsteti V73-le, et brauser ei kasutaks vana `civilization.js` puhverdatud versiooni.

## Testid
- `TEST_V73.mjs`: V72 laevatranspordi/teaduse/teede taastamine, V51 salvestuskohad, katkine põhisalvestus, vigane import, varukoopia ja põhisalvestuse kirjutamisvead.
- `TEST_V73_UI.mjs`: Playwright/Chromium Android-laadne telefonivaade 390×844 ja 844×390, desktop 1440×900, suumimine, JSON eksport/import ja vana salvestuse varukoopia.
- `TEST_V72.mjs`, `TEST_V69.mjs`, `TEST_V68.mjs` ja `TEST_V71_UI.mjs`: regressioonimehhanismid.
- `.github/workflows/v73.yml`: automaattestid haru `dev/v73-save-reliability` muudatuste korral.

**Piirang:** Playwright emuleerib mobiili ja arvuti vaateid Chromiumis; see ei asenda käsitsi testimist füüsilisel Samsung/Android-telefonil ega arvutis. Pilve salvestussünkroonimist ei lisatud: JSON eksport/import võimaldab siiski salvestuse käsitsi üle kanda.
