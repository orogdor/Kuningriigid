# Godoti pordi tööjärg

23.11.2026: `godot-port-lahtekood` sisaldab kogu Godoti projekti sirvitavate failidena. Lisatud Windowsi ja Androidi ekspordiseaded ja GitHubi ehitustöövoog. Ühe varasema lähtekooduseisu Windowsi ja Androidi proovieksport läbis; hilisemat käivitamisparandust sisaldava seisu ehitust tuleb jälgida eraldi.

Mängus on Windowsi ja Androidi sisuuenduste kontroll: allalaaditud pakki kontrollitakse SHA-256 abil ja uuendatud kood võetakse kasutusele järgmisel käivitamisel. Eksporditud Windowsi prooviprogrammis kontrolliti GitHubi kanaliga ühendamist, muudetud koodi käivitamist ja vigase kontrollsumma tagasilükkamist. Androidi seadmel ning päris uuendusväljalaske kogu avaldamisahelas ei ole seda veel kontrollitud. Kanalis pole veel avaldatud sisuuendusi.

Väljalaske töövoog vajab püsiva APK-allkirja jaoks hoidla saladusi; täpsed nimed on README failis. Test-APK allkiri ei ole ehituste vahel püsiv. Sisupakk ei uuenda Godoti käivitusfaili ega asenda Androidi APK-d.

Mängu põhjalik tööjärg on `PORT_STATUS.md`. Port ei ole 1:1 valmis.
