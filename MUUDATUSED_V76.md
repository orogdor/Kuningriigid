# Kuningriigid V76 – elavad külad

V76 lisab **külaelanike igapäevaelu** nii V75 maailmas olevatesse sõbralikesse küladesse kui ka mängija rajatud linnade detailkaartidele.

## Tegevused
- Täiskasvanud **räägivad omavahel**: kaks külaelanikku tulevad samasse kohta ning pöörduvad teineteise poole.
- Elanikud **jalutavad**, **käivad külas**, **kannavad korve**, **söövad**, **puhkavad pingil** ja aeg-ajalt **teevad väikseid toimetusi**.
- Väiksemad tegelased on **lapsed**, kes jooksevad, mängivad ja aeg-ajalt puhkavad.
- Hommikul liigutakse kodude juurest küla poole; päeva jooksul tegevused vahelduvad; õhtul kogunetakse lõkke juurde, süüakse ja vesteldakse; öösel minnakse kodudesse ja magatakse.
- Valvur on külas nähtaval nii päeval kui ka öösel (öösel jääb valvur aktiivseks).
- Kui samal ruudul käib lahing või sinna jõuab võõras vaenulik armee, lähevad elanikud **põgenemisrežiimi**.

## Tehniline lahendus
- `village-life-v76.js` on deterministlik, ainult visuaalne elanike simulatsioon, mis kasutab juba mängus olevaid V50 inimese 3D-mudeleid ja kõndimisanimatsioone.
- Päevarütm on 24 mänguminutit; kell on seotud juba olemasoleva mänguajaga `game.s.time`. Uues mängus algab küla nähtav päev hommikust.
- Ühes aktiivses külas on graafikaprofiili järgi: **säästlik 4**, **keskmine 6**, **kõrge 9** kujutatud elanikku. Naaberruutudel on 1–3 tegelast, et kaardi kõrvalala ei hakkaks mobiili koormama.
- NPC-d ja lõke luuakse ainult avastatud küla/linnaruudu detailvaates. Maailmakaardile naastes eemaldatakse need renderduspuust.
- Inimesed kasutavad jagatud mudeligeomeetriat ja materjale; küla olemasolevad 3D-hooned ja V75 objektiasukohad jäävad muutmata.
- Need elanikud on **ambient-NPC-d**: nad ei tarbi linna toitu, ei võta töökohti, ei muuda rahvaarvu ja ei ole iseseisvad lahinguüksused. Valvuri 3D-animatsioon ei lisa automaatselt uusi lahinguvägesid.

## Salvestused ja ühilduvus
- V76 ei lisa ega eemalda ühtegi välja `game.s` salvestuses. `version: 4` jääb täpselt samaks.
- Varasemad V74/V75 salvestused peaksid jätkuma; V73 varukoopiatoe loogika on alles.
- Testid: `TEST_V76.mjs`, `TEST_V76_UI.mjs`, `TEST_V75.mjs`, `TEST_V73.mjs` ja `TEST_V72.mjs`.
- Väärtuse muutmisel `low/medium/high` kohandatakse korraga nähtavate NPC-de hulka.

**Piirang:** V76 ei lisa eraldi iseseisvat maailmakaardi karavanisüsteemi, uut sõjaväe AI-d ega füüsikalist ukse avamise animatsiooni. Need on eraldi tulevased funktsioonid.
