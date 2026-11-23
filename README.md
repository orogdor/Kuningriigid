# Kuningriigid Godotis

See on Kuningriikide pooleliolev Godoti port. Lähtekood, mudelid ja tekstuurid on selles harus tavapäraste failidena; 1:1 vastavus veebimänguga ei ole veel valmis. Godot 4.7.2 projekt asub hoidla juures (`project.godot`). Ava projekt redaktoris ja oota esimest varade importi.

Windowsi ja Androidi ekspordiseaded asuvad failis `export_presets.cfg`. GitHub Actions ehitab lähtekooduharu muudatustest Windowsi EXE koos PCK-ga ja Androidi prooviversiooni APK ning lisab need ehituse artefaktidena. Kontrolli jooksu tulemust vahekaardilt Actions; artefakt ei ole automaatselt avaldatud väljalase.

Androidi prooviversioon kasutab iga ehituse jaoks ajutist allkirja: järgmist sellist APK-d ei saa eelmise peale turvaliselt uuendada. Püsivate APK-uuenduste jaoks tuleb enne levitamist kasutada sama kaitstud allkirjastusvõtit ja suurendada Androidi versioonikoodi. Võtit ja paroole ei tohi hoidlasse lisada.

Mängu sisuuenduste kanal saab alla laadida versioonile 0.1.0 sobiva Windowsi või Androidi andmepaki, kontrollib SHA-256 ning rakendab paki järgmisel käivitamisel. See uuendab mängu sisu ja skripte, mitte Godoti käivitusfaili ega Androidi õigusi; nende muutmiseks on vaja uut EXE/APK paketti. Esialgne kanal on tühi. Väljalaske ehitamise töövoog käivitub `godot-content-*` sildiga ning uuendab kanali alles pärast pakkide avaldamist; kogu avaldamisahel vajab veel päris väljalaskega kontrolli.

Mängu juhised ja senine tööjärg: `ALUSTA_SIIST.txt` ja `PORT_STATUS.md`.

## Väljalase ja Androidi allkirjastus

Püsiva allkirjaga APK ja Windowsi pakkimise ning sisuuenduse avaldamise töövoog käivitub `godot-content-*` sildi lisamisel. Enne selle kasutamist tuleb hoidla Actionsi saladustesse lisada `GODOT_ANDROID_KEYSTORE_BASE64` (keystore'i fail base64-na), `GODOT_ANDROID_KEY_ALIAS` ja `GODOT_ANDROID_KEY_PASSWORD`. Keystore'i ja võtme parool peavad Godotis olema samad. Sama võti tuleb säilitada kõigi järgnevate APK-väljalasete jaoks. Töövoog katkestab enne avaldamist, kui need saladused puuduvad; prooviversioonide ajutine võti ei sobi pärisväljalasete uuendamiseks.

Töövoog pakib Windowsi EXE koos andmefailiga, allkirjastab APK, teeb mõlema platvormi sisupakid ja avaldab uuenduskanali alles pärast pakkide avaldamist. Seda avaldamisteed ei ole veel päris väljalaskega otsast lõpuni kontrollitud. Andmepakid ei asenda Godoti käivitusfaili ega paigalda uut APK-d; seda nõudvad muudatused tuleb kasutajale eraldi paigaldusena jagada.
