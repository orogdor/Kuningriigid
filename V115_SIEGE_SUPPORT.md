# V115: tornide ballistad ja piiramislaagri varustus

- Kaitsetorni katusel on nähtav ballista. Aknast vibulaskmine jääb alles.
  Täielik tornitööline hoiab mõlemad relvad töös; mehitamata või hävinud torn ei tulista.
  Ballista ulatus on 50 mängumeetrit, lask 24 kahjustust, laadimine 12 pärissekundit.
  Raske nool lendab 0,7 simulatsioonisekundit ja tabab üht meest; liikuv sihtmärk
  võib tabamiskohast eemalduda. Vanad lahingutornid saavad uue relva laadimisel.
- Müüril olev mees saab 15% kaitset lähivõitluse ja kivimürsu vastu. Alt tulevate
  noolte vastu jääb varjestus puitvallil 45%, madalal kivivallil 55% ning kõrgel
  kivivallil 65%; ballista vastu 35%. Boonus rakendub üks kord tegelikule mehele.
- Nii mängija kui vastase automaatjuhtimisel salgad ehitavad ise laagri,
  redeli, rammi, kõrge müüri puhul torni ja õõnestamise varjualuse. Eelistatakse
  jalaväest ehitajaid. Manuaalsed salgad ja mängija otsese käsuga hõivatud salgad
  ei saa automaatset ehituskäsku. Üheaegselt valmib kuni kaks rajatist.
- Piiramislaager maksab 80 puitu ja vajab ehitaja kohalejõudmise järel 60
  pärissekundit. Ühele poolele saab ühes lahingus teha ühe laagri. Puit võetakse
  riigi tegelikust linnalaost; laager ei teki tasuta.
- Valmis laager toodab ühe katapuldikivi iga 15 pärissekundi järel ehk täpselt
  neli minutis. Esialgne kivivaru on null. Katapuldid jagavad sama piiratud varu;
  kohapeal saab katapuldi täita kuni kuue kivini.
- Vibumehed täiendavad nooli laagrist kuni nelja noole võrra mehe kohta sekundis.
  Laagri noolekastidel ei ole eraldi arvulist varu. Automaatne üksus läheb
  20% või väiksema laskemoona korral laagrisse ja naaseb täis varuga.
  Müüril olevad vibumehed laskuvad sobivat redelit või treppi mööda alla ning
  ronivad pärast laadimist tagasi. Manuaalse üksuse saab mängija ise laagrisse viia. Kõik mehed peavad jõudma
  üheksa meetri kaugusele; eemalt laskemoona ei anta.
- Varustuslaagriga armee tühi katapult ootab kive, laskemoona lõppemine ei sunni
  teda põgenema. Tegelik moraalipõgenemine jääb jõusse. Laagri hävitamisel kaob
  selle varustus; vaenlase lähedal olevad väed saavad laagrit rüüstada.

Kõik arvud ja ballistad pronksiaja testis on mängumehaanika valikud, mitte
pronksiaja täpne ajalooline rekonstruktsioon.

TEST_V115 kontrollib tootmist pärisaja järgi, ühist kivivaru, kaugusnõuet,
noolevaru taastamist, ballista lennuaega ja mehitamist, müürikaitset, mõlema poole
AI-d, manuaalsete käskude säilimist ning päris navigeerimisega laagri ehitamist
ja vibuküttide tagasitulekut. TEST_V115_UI kontrollib töölaual ja telefonis kümmet
ballistat ning laagri nupu kaudu ehitamist ja mudeli kuvamist.

TEST_V115_AUTO mängib 180 pärissekundit kogu piiramise automaatjuhtimisel,
koos kaitsjate, ballistade, ehitajate ja laskemoonaga. Kontrollib ka koordinaatide
kehtivust ja 500 mehe piiri.
