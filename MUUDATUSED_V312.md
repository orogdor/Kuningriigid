# V312 · ehituspildid ja avaramad suhtlusmenüüd

- Ehituskaardi sisupilt lisatakse juba kaardi loomisel. Alumise riba kujundaja ei pea ootama eraldi MutationObserveri järelkaunistust. Olemasoleva hoonepildi puudumisel kasutatakse selle hoone uurimuse illustratsiooni; üldist haamripilti ehituskaardi sisuna ei kasutata.
- Teatel on ainult alumine ankur ja kuni 72 px kõrgus. Vana ülemise ja alumise ankru koosmõju venitas selle suureks. Ehitamise juhis jääb väikeseks ning dubleeriv staatuseriba on illustreeritud vaates peidetud.
- Kaubandus ja diplomaatia avanevad kuni kolme kaardi kõrguse paneelina, väikese ekraani korral piirab kõrgust vaba ekraaniruum. Igal riigil ja kauplejal on oma nime, teabe ning tegevustega plokk; rida kerib küljele, tegevused vajadusel ploki sees üles-alla. Tagasi ja Escape taastavad põhimenüü.
- Viis vanemat UI testi kasutavad nüüd Windowsiga ühilduvat failitee teisendust. Kontrollid ei muutu sisult.

Kontroll: päris kohalik Chromiumi 3D-mäng `?ui=art&demo=stonetown`, 1200×800, 915×364 ja 390×844; ehituskaartide pildid, ehituse valik, teate kõrgus, diplomaatia käsu tulemus ja laiendatud menüüde piirid. Kaubanduse callback ja otsing kontrolliti lisaks deterministlikus UI kontrollvaates. Tulemused: `reports/ui-v312-browser.json`. CI quick-check 96 käsku ning V312 pildi- ja süntaksikontrollid läbisid (`reports/ui-v312-ci.json`, kokku 101). Kohalikus Windowsi koopias taastati Three.js ametlikud LF reavahetused; renderdusmootori sisu ei muudetud.
