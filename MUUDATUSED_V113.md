# V113 — pikem lähenemine, rohkem müürikaitsjaid ja lagunemine

Alus: GitHub main V112 (`2aa7be51dfeebcaff64bd3aea8fbc3e08dec0272`). Säilitatud uuemad V101–V112 tasakaalu-, juhtimise-, piiramis- ja mudeliparandused.

- Ründav jalavägi alustab x = −132…−142, kaarikud −143 ja kaks katapulti −172. Lähim linnamüür on x = −28: jalaväe keskjoone vahe umbes 104 m varasema 23 m asemel. Ka esimeste meeste asukohad on müürist kaugel. Algkaamera näitab linna ja lähenemisala.
- Kivimüüridel 128 vibumeest varasema 64 asemel. Igas kaheksast garnisonisalgast 16 meest kahes reas. Müürikäigu vabade kohtade jaotus väldib eri salkade kokkusurumist samadesse punktidesse. Kokku 218 ründajat ja 236 kaitsjat, 454 meest alla 500 piirangu.
- Kahe katapuldi lisamine võimaldab lagunemist kohe selles stsenaariumis proovida. Need on mänguline piiramisvahendite testilisand olemasolevale Kadeši-ainelisele jalaväe/kaarikute põhikoosseisule; stsenaarium ei väida katapultide ajaloolist kasutamist Kadešis.
- Müürid ja väravad kaotavad elupunktide langedes ülemisi kive ja terviklikku kuju: 70% juures esimene kahjustus, 35% juures raskem purunemine, 0 HP juures madal rusuhunnik. Seis arvestab lahingu tegelikke müürilõikude HP-sid; rusud jäävad nähtavale ning salvestatud kahjustus säilib.
- Katapult kaotab kahjustatult heitevarre, raskema kahjustuse korral on näha katkist raami ning hävimisel jäävad alles palgid ja rattad. Surnud operaatoriga masin jääb lahingukaardile vrakina. Ühe masina kahjustamine ei muuda teise jagatud mudelgeomeetriat.
- Parandatud müüri purustava kivimürsu resolutsioon: lahingu navigatsioon antakse tabamusele kaasa. Purunenud lõik avab oma läbipääsu; ülejäänud müürid jäävad suletuks.
- Automaatsed toetavad jalaväesalgad leiavad valmis redeli/piiramistorni ka kaugemalt kui varasem 45 m. Redelit ei muudeta kaarikutele avatud maapealseks läbipääsuks.

## Kontroll

- TEST_V113: 218/236 meest, 128 müürivibumeest, kaks katapulti, kaugemad algasukohad; kahe rea mõõdud ja eraldi kohad koonduvatele salkadele; kolm purunemismudelit; sõltumatud vrakid; tegeliku kivimürsu müüritabamus; ühe müürilõigu läbipääsu avamine ja kahjustuse salvestamine.
- TEST_V112: päris alguskohtadest ehitamine, lähenemine ja 48 jalaväelase ronimine. Redeliga mõlemad salgad müüril 101,8 lahingusekundil, torniga 171,9 lahingusekundil. Testis on vastase tuli eraldatud liikumisest; reaalaeg lahingus on kaks korda pikem.
- TEST_V111: kindluslinna 36 lõiku, 2 väravat, 10 torni, müürigraafik, liikumine, piiramisvahendi hind ja kohalik läbimurre.
- TEST_V111_UI: arvuti 1440×1000 ja telefon 412×915; 128 müürikaitsjat, 46 kindluse mudelit, müüril liikumine, lõplikud koordinaadid, JavaScripti vigadeta.
- TEST_V113_UI: brauseris täisterve → kahjustatud → hävinud müür ja katapult; madalad rusud ning surnud masina nähtav vrakk, JavaScripti vigadeta. HP muutus on siin visuaalse oleku test; tegelik kivimürsu tabamus on eraldi simulatsioonitestiga kontrollitud.
