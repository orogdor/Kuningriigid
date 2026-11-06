# V331 – genereeritud maailm kuulub salvestusse

Olemasoleva mängu avamisel taastatakse maailma andmed salvestusest. Civilization ei loo uuesti maastikku, jõgesid, kliimat ega kõigi ruutude detailressursse. Uus mäng loob oma maailma ühe korra. Vanale salvestusele, kus maailmaandmeid ei olnud, tehakse ühekordne ettevalmistus; salvestuse puuduvat maailma ei asendata seejärel vaikimisi uue juhusliku maailmaga.

Suure maailma püsiv osa on sama mängu ID-ga IndexedDB-s. Automaat-, varu- ja kolm käsitsisalvestust säilitavad selle maailma viite ning mängu muutuva seisu. Varem külastatud ruutude raiumine, hooned, varud ja üksused jäävad tavapärasesse salvestusse. Vanade käsitsikohtade maailmu ei kustutata uue mängu loomisel.

Eksporditud JSON sisaldab kogu pakitud maailma ja töötab teises seadmes ilma uuesti genereerimata. Impordipiir on tõstetud 64 MiB-ni. Kui eraldi püsisalvestus ei ole saadaval, säilitatakse maailmaandmed salvestuse sees; vana mänguseis asendatakse ainult eduka salvestusega. Vigane fail, sobimatu seeme või puuduv maailm annab veateate, mitte uut maastikku.

Maailmaandmed pakitakse 256 ruudu kaupa, et vältida kogu suure maailma ajutist JSON-koopiat. Node'i fixture: 36300 ruutu ja 1858094 ressurssi, pakitud maailm ~20,35 MB ning väike kohalik viide 131 märki. Eraldi protsessides täielik loomine ~8,3s, taastamine ~2,2s. Kõigi ruutude SHA-256 säilis. See ei ole telefoni APK kogukäivitusaja ega GPU jõudluse mõõtmine: 3D-vaate ja varjutajate ettevalmistus jääb alles.

Testid: tests/generated-world-v331.mjs – kogu maailma loomine/taastamine eraldi protsessides, generaatori kõrgusekutsed taastamisel keelatud, muudetud mänguseis ja linn, eksport/import tühja andmehoidlasse, puuduv/rikutud maailm, vale seeme/mõõtmed, salvestusruumi vea iseseisev varuvariant. tests/generated-world-v331-browser.cjs kontrollib päris IndexedDB-d, kordusavamist, faili importi eraldi brauserikonteksti, uue mängu loomist ja vana käsitsikoha säilimist. Brauseri- ja täisregressioonikontroll ning avaldamine on veel pooleli.
