# Kuningriigid V51 – mänguloogika ja juhtimise uuendus

Põhineb töötaval V50 versioonil. 3D-inimeste ja Mudelitehase mudelid on muutmata.

## 10 täiustust

1. **Sõjaudu / vastase nähtavus.** Vastaste praegused üksused, linnad, otserünnaku käsk, kiire avamisnupp ja maailmaressursside ikoonid ei näita enam avastamata asukohti. Intel-mälus näidatakse eraldi *viimast teadaolevat* asukohta, mitte praegust vaadet.
2. **Ehitaja staatus ja realistlikum ajaprognoos.** Ajahinnang võtab arvesse ajastu ehitaja tugevust, materjalide koormate arvu ja esimest kohalejõudmist. Hinnang on ligikaudne, mitte garanteeritud saabumisaeg.
3. **AI taastumine ja defitsiidid.** AI salvestab olulisemad tootmis- ja ressursiprobleemid, taastab ehitajate minimaalse arvu ning hädaolukorras taastab elutähtsate tootmishoonete töö. AI väldib samaaegselt liiga paljude ehituste alustamist, uurib maailma ega ründa nähtamatut linna.
4. **Järgmise tegevuse soovitused.** Maailmakaardil kuvatakse kuni kolm soovitust aktiivse linna majanduse, materjalide, teaduse ja ehitusseisu järgi.
5. **Sõjaväe grupid.** Peaarmee saab jagada kaheks; eraldi armeed liiguvad iseseisvalt, neil on oma valikunupud, kaitsepositsioon, ning neid saab samas ruudus taas ühendada. Lahingus osalevad vaid konkreetsel ruudul asuvad üksused. Meretransport jääb V50 ühtse peaarmee käsu juurde.
6. **Mitme linna juhtimine.** Avatav linnade ülevaade näitab iga oma linna elanikke, pooleliolevaid ehitusi ja kõige olulisemat probleemi ning avab linna ühe puudutusega.
7. **Teeleidmise taastumine.** Liikujate vahemälu tühjendatakse ka siis, kui sihtmärgini marsruuti ei leidu pikemalt kui neli sekundit. Senine A*-teeleidmine ja teede arvestus säilivad.
8. **Mobiili renderdus.** Püsiva alla 26 FPS koormuse korral vähendatakse ajutiselt sisemist renderdamiseraldust, kõrge FPS korral taastatakse see. See on kaitsemehhanism, mitte mõõdetud 30 FPS garantii.
9. **Salvestused.** Kolm käsitsi salvestuskohta, eksport ja import JSON-failina. V50 `version: 4` salvestusstruktuur on säilitatud ja import valideerib kuju enne laadimist.
10. **Regressioonitestid.** TEST_V51.mjs kontrollib sõjaudu, armeerühmi, salvestusversiooni, ehitajate profiile, teaduse eeldusi ja mitme seemne pikemaid simulatsioone. GitHub Actions paigaldustöövoog käivitab need automaatselt.

## Testitud
- Kõik JS failid: `node --check`.
- V50 inimeste/GLB-loogika test: `node TEST_V50.mjs`.
- V51 reeglite test ja kolm AI simulatsiooni (`17`, `78`, `321`), vähemalt 2400 mängusekundit; lisaks seemne `17` 3600-sekundiline jooks.
- Brauseri WebGL visuaalne test **ei õnnestunud**, sest kohalik Chromium blokeeris kasutatava 127.0.0.1 aadressi `ERR_BLOCKED_BY_ADMINISTRATOR`. Vajab eraldi kasutajapoolset visuaalset kontrolli.

## Piirangud
- Armée kaitsepositsioon hoiab üksuse paigal, kuid ei ole uus detailne formeerimis-AI.
- Ehitusaeg ja mobiili FPS on hinnangud, mitte välise seadme mõõtetulemused.
- AI pikad testid ei tõesta kõigi võimalikud maailmaseemnete või mänguseisude töötamist.
