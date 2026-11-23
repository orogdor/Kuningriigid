# Godoti pordi tööjärg

23.11.2026: kogu Godoti projekt on `godot-port-lahtekood` harus sirvitavate failidena. Windowsi ja Androidi ekspordiseaded ning GitHubi ehitustöövoog on lisatud. Käivituse parandusega versiooni Windowsi ja Androidi proovipakid valmisid edukalt GitHub Actionsis, töövoog: https://github.com/orogdor/Kuningriigid/actions/runs/45124400474 .

Sisuuenduste kontroll laadib alla ainult selle hoidla väljalaskelt pakutud paki, kontrollib SHA-256 ning rakendab sobiva uuenduse järgmisel käivitamisel. Eksporditud Windowsi prooviprogrammiga kontrolliti päriselt GitHubi kanaliga ühendamist, muudetud koodi käivitamist ja vale kontrollsumma tagasilükkamist. Androidi seadmel ning väljalaske avaldamist otsast lõpuni ei ole seda veel kontrollitud; kanal on praegu tühi.

Püsiva APK-allkirjaga väljalaskeks vajalike hoidla saladuste nimed on README failis. Proovi-APK allkiri ei ole ehituste vahel püsiv. Sisupakk ei uuenda Godoti käivitusfaili ega paigalda uut APK-d.

Mängu põhjalik tööjärg on `PORT_STATUS.md`. Port ei ole 1:1 valmis.
