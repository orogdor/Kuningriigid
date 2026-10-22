# V116: ajastukohased üksused ja vanade variantide asendamine

## Ajastud

- Pronksiaeg: pronksodamehed, pronkskirvemehed, vibukütid ja sõjavankrid.
  Pronksiaja väli- ja linnalahingust eemaldati katapuldid ning tavaratsavägi.
- Rauaaeg: tavaratsavägi, varane kiviviskemasin ja torniballista. Kaetud rammid,
  suured piiramistornid ja nende töökoda avanevad varase piiramistehnika uurimisega.
  Heiterelvad vajavad lisaks antiikset heiterelvastust.
- Keskaeg: täiustatud katapult, ristvibumees, rüütel, raskeratsavägi,
  soomustatud jalavägi ja hellebardimees.
- Renessanss: piigimees, arkebuusimees, musketär, kürassiir ja välisuurtükk.
- Tööstusaeg: rivijalavägi, püssimees, ratsalaskur ja vintraudne suurtükk.
- Moodne ajastu: moodne jalavägi, motoriseeritud jalavägi, kuulipildujameeskond,
  tank ja tankitõrjerühm.

See on laiade mänguajastute ja tehnoloogiate jaotus, mitte väide, et iga lihtne
relv või masin leiutati alles vastaval ajal. Lihtsad rammid ja redelid on
heiterelvastusest vanemad. Selle mängu kaetud raske rammi ja suure torni mudel
on paigutatud rauaaega. Pronksiajal jäävad laager, redel ja õõnestamine.

Katapultide arengu ajalooliseks orientiiriks on neljas sajand eKr, rauaaja
antiikmaailm. Tornide suurtükiväe arengut käsitlev teadusartikkel:
https://www.journals.uchicago.edu/doi/10.2307/505291

Assüüria piiramisreljeefide muuseumiselgitus käsitleb redelirünnakut,
kattevibu, ramme ja õõnestamist:
https://www.metmuseum.org/art/collection/search/322622

## Asendamine

Uue variandi riiklik avastamine sulgeb vana variandi uue ehitamise/värbamise
kõigis selle riigi linnades. See ei sõltu sellest, kas uues linnas on uus töökoda
juba olemas või kas materjale jätkub. Reegel rakendub nii menüüle, otsesele
mängukäsule kui ka AI valikule; tagasilükatud käsk ei kuluta varusid.

Üksuste ahelad on eraldi relvaliikide järgi (näiteks puuodamees → pronksodamees
→ raudmõõgamees → soomustatud jalavägi; kiviaja vibu → pronksvibu → rauaaja vibu
→ ristvibu → püssirohurelvad). Varane kiviviskemasin asendub keskaegse katapuldiga,
seejärel välisuurtüki ja vintraudse suurtükiga. Avastaja ja automaatsed linnakaitsjad
säilivad oma eraldi ülesandes.

Hoonete tegelikud asendusahelad:
- õpikoda → kirjutuskoda → akadeemia → ülikool → polütehnikum → uurimislabor;
- puidust vahitorn → kivist kaitsetorn;
- vibulasketiir → ristvibude harjutusplats.

Uuem kool täidab vanema kooli hoonenõude. Uue kooli ehitamiseks ei nõuta
selle enam ehitada lubamata eelkäijat. Nii saab uue hilise ajastu linna
teadustööle panna ilma ummikuta.

Metsatöökoht toodab puitu, saeveski laudu; kivimurd kivi ja kiviraidur tahutud
kivi. Need on üksteist vajavad tootmisahelad ja jäävad eraldi. Samuti ei asenda
põld jahimeest ega uus toiduliik vana toiduliiki. Kolm vallitüüpi jäävad varasema
soovi järgi eri kuluga taktikalisteks valikuteks. Sama tüübi ajastupõhine
arhitektuur ja tööriistauuendused kasutavad olemasolevat uuendusmehhanismi.

Olemasolevaid sõdureid, hooneid ja juba tasutud tööjärjekordi ei kustutata.
Vanad salvestused säilivad. Vana sisemine ID `bronze_catapult` tähistab nüüd
rauaaja varast kiviviskemasinat; nimi ja uurimisnõue on õiged. `bronze_cavalry`
säilib ainult vanade üksuste laadimiseks, uut sellist üksust ei värvata.

## Stsenaariumid ja kontroll

`?demo=bronze-siege`: pronksiaeg ilma katapultide ja ballistadeta.
`?demo=iron-siege`: rauaaja üksused, kiviviskemasinad ja torniballistad.
Mõlemad on valitavad algmenüü testide juures.

TEST_V116 kontrollib ajastuid, tehnoloogiaid, riigiülest vananemist,
API keelde enne kulutamist, uue linna hooneahelaid ja nelja üksust iga ajastu kohta.
TEST_V116_UI kontrollib mõlema ajastu lahingut, nähtavaid torne/piiramisvalikuid
ning telefonis vanade üksuste ja koolide kadumist menüüst. Varasemad masinate
regressioonitestid töötavad nüüd teadlikult rauaaja testandmetega.
