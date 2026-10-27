# V176.1 – Kaljuvärava, ühe AI linna ülevõtmine

Ava `?v=1761a&demo=ai-mountain-v176`. Salvestus avaneb automaatselt Kaljuvärava detailkaardil, mängija juhtimise all ja pausil. Nupp ▶ jätkab mängu. Testdemo kasutab olemasolevat eraldi näidismängu laadimist ega kirjuta tavalist automaatsalvestust üle.

## Testi tulemus

- Maailma seeme: 142023.
- Linnaruudul c=85, r=18; lõunanaaber c=85, r=19 on päris genereeritud läbimatu mäeruut. Maastikku ei muudetud.
- Algus: üks AI, üks linnasüda, kolm elanikku, mängu tavalised asutamisvarud. Teiste AI-de asunikud/üksused eemaldati testi algseadistusena. AI uute linnade asutamine on ainult selles stsenaariumis välja lülitatud.
- Ülevõtmine: 74. käik, kiviaeg, üheksa elanikku, seitse valmis elumaja, 64 kohalikku hoonet/rajatist.
- Maastikku järgiv kaitseplaan: 49/49 rajatist valmis, sealhulgas värav ja tornid. Tagumise kaitsekülje moodustab mägi.
- Pärast asutamist toimusid kõik ehitamised, ressursi kogumine ja uurimised tavalise `game.tick` ning AI kaudu; varusid, tehnoloogiaid ega valmis maju juurde ei antud.

Algseis, ülevõtmissalvestus ja manifest on `scenarios/ai-mountain-v176*.json`. Korratav generaator: `node scripts/make-ai-mountain-v176.mjs`. See on käsitsi käivitatav, mitte iga CI kontrolli osa.

## Testis leitud ja parandatud

Uue kontuuri ümberarvutamine tehnoloogia avastamisel võis nihutada selle vahepeal ehitatud põllule. Sobiv, majadest vaba asutamisel reserveeritud V176 kaitsekoridor säilib nüüd ehitamise alguses. Lisaks kaitseb AI põllukohavalik sama 6 m keskkoha varu, mida kontrollib tavaline hoone ehitamine; õhuke pööratud müürijupp ei jäta enam sellesse reeglisse vastuolu.

`TEST_V1761_MOUNTAIN_TAKEOVER.mjs` kontrollib algseisu, omanikku, mäe püsimist uuesti laadimisel, iga reklaamitud kaitserajatise tegelikku olemasolu ja valmidust, mängu jätkamist, koridori püsimist ning põllu varu. V176 linnaplaneerimine, V168 jalajäljed ja V175.8 müüriotsad läbisid samuti kontrolli. 3D brauseri visuaalset kontrolli kohalikus keskkonnas ei tehtud.
