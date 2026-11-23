# Kuningriigid Godotis

See on Kuningriikide pooleliolev Godoti port. Lähtekood, mudelid ja tekstuurid on selles harus tavapäraste failidena; 1:1 vastavus veebimänguga ei ole veel valmis. Godot 4.7.2 projekt asub hoidla juures (`project.godot`). Ava projekt redaktoris ja oota esimest varade importi.

Windowsi ja Androidi ekspordiseaded asuvad failis `export_presets.cfg`. GitHub Actions ehitab lähtekooduharu muudatustest Windowsi EXE koos PCK-ga ja Androidi prooviversiooni APK ning lisab need ehituse artefaktidena. Kontrolli jooksu tulemust vahekaardilt Actions; artefakt ei ole automaatselt avaldatud väljalase.

Androidi prooviversioon kasutab iga ehituse jaoks ajutist allkirja: järgmist sellist APK-d ei saa eelmise peale turvaliselt uuendada. Püsivate APK-uuenduste jaoks tuleb enne levitamist kasutada sama kaitstud allkirjastusvõtit ja suurendada Androidi versioonikoodi. Võtit ja paroole ei tohi hoidlasse lisada.

Mängu sisuuenduste kanal saab alla laadida versioonile 0.1.0 sobiva Windowsi või Androidi andmepaki, kontrollib SHA-256 ning rakendab paki järgmisel käivitamisel. See uuendab mängu sisu ja skripte, mitte Godoti käivitusfaili ega Androidi õigusi; nende muutmiseks on vaja uut EXE/APK paketti. Esialgne kanal on tühi. Väljalaske ehitamise töövoog käivitub `godot-content-*` sildiga ning uuendab kanali alles pärast pakkide avaldamist; kogu avaldamisahel vajab veel päris väljalaskega kontrolli.

Mängu juhised ja senine tööjärg: `ALUSTA_SIIST.txt` ja `PORT_STATUS.md`.
