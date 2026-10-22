# V114: kindlustused ja piiramine

Kiviajal on puitvall. Pronksiajast kuni mängu lõpuni on valikus puitvall,
madal kivivall ja kõrge kivivall. Väravahoone on samuti pronksiajast saadaval.
Need on mängu mõõtkavas tüübid, mitte ühe kindla rahva ehitiste koopiad.

| Vall | Müürikäigu kõrgus | Vastupidavus | Alt tuleva käsitulirelva/noole kahjustus |
|---|---:|---:|---:|
| Puitvall | 2,4 m | 420 | 55% |
| Madal kivivall | 3,8 m | 900 | 45% |
| Kõrge kivivall | 6,4 m | 1800 | 35% |

Kõrgused, elud ja protsendid on mängureeglid, mitte ajaloolised mõõtmised.
Vanad salvestused säilitavad müüri kahjustuse osakaalu. Kõrge kivivall ei vaja rauda.
Müürikäigud on kasutatavad ka tavamängu linnalahingutes. Eri kõrgusega käigud
vajavad eraldi treppi või ründaja ronimisvahendit; mehed ei hüppa kõrguste vahel.

## Rünnak

- Mõõgad, odad ja nooled ei lõhu kivimüüri. Kirved kahjustavad puitu teistest
  jalaväerelvadest tõhusamalt. Lähivõitlus eeldab kontakti, mitte vana +6 m ulatust.
- Redel ja torn viivad üksikud jalaväelased müürikäigule. Nende mõõtmed ja
  ronimisaeg sõltuvad müüri kõrgusest. Ratsavägi ei saa redelist üles.
- Kaetud müürilõhkuja maksab 55 puitu, ehitamine 90 pärissekundit. See valib
  värava või puitvalli; kivikardina vastu on rammi mõju väike.
- Õõnestamise varjualune maksab 30 puitu, ettevalmistus 60 pärissekundit.
  Seejärel on vaja vähemalt nelja lähedal olevat meeskonnaliiget, täiskiirusel
  12 meest. Töö võtab madala müüri puhul 240 ja kõrge puhul 480 pärissekundit.
  Need on lahingu jaoks tihendatud kestused, mitte ajaloolise piiramise päevad.
- Vaenlase lähivägi peatab rammi või õõnestajate töö. Lähedal olevad müürikaitsjad
  kahjustavad töötavat rammi/varjualust; meeskonda saab vibudega rünnata.
- Kiviviskajad kahjustavad müüre vähem kui kahurid. Ründaja peab avama lokaalse
  läbimurde või müüri ületama. Läbimurre säilib linna salvestuses.
- Terved müürid takistavad läbi nende tulistamist ja lähivõitlust; parapett
  vähendab alt tulevate laskude kahjustust. Kivimürsud kasutavad kaarlendu.
- Kindlustatud linna võit ei tule raekoja kaugelt elutuks pommitamisest:
  ründajad peavad jõudma linnasüdamesse ja sealse vastupanu lõpetama.
- Vastase ründav AI tellib piiramisvahendeid oma linnade päris puiduvarust.

Pronksiaja testlinnal on ees madal ning tagaküljel kõrge kivivall.
Varem tellitud kaks katapulti jäävad testilahingusse teadliku anakronistliku
mängumehaanika testina. Neid ei esitata Kadeši ega pronksiaja ajaloolise relvana.

## Ajalooline alus ja piirid

Metropolitani muuseumi Assüüria piiramisreljeef näitab redeliga odamehi ja
neid toetavaid vibukütte; muuseumi selgitus käsitleb ka ramme, piiramismasinaid,
õõnestamist ning kaitsjate vastutegevust:
https://www.metmuseum.org/art/collection/search/322622

English Heritage käsitleb blokaadi, tormijooksu, õõnestamist ja suurtükkide
mõju keskaegsetele kindlustustele:
https://www.english-heritage.org.uk/learn/story-of-england/medieval/siege-warfare/

See versioon parandab taktikalise rünnaku mudelit. Pikaajaline strateegiline
blokaad, nälg, vastukaevandamine, kraavide täitmine ja püssirohuajastu
bastionkindlused ei ole veel simuleeritud.

## Kontroll

TEST_V114 kontrollib ajastuid, materjale, salvestuse teisendust, mudelite
kõrgusi, kivimüüri puutumatust käsirelvadele, varjet ja tulejoont,
meeskonnaga värava lõhkumist/õõnestamist, läbimurde säilimist ning päris
navigeerimisega 24 mehe ronimist kõrgele müürile.
V111–V113 regressioonid kontrollivad linnalahingut, 48 mehe redeli/torniga
ronimist, müürikäike, katapultide rususid ja lokaalseid läbimurdeid.
