# V83 testimise seis

## Kontrollitud

- Menüü laadimispiir: käivitus õnnestub / import või WebGL käivitus ebaõnnestub; selge veateade, taastamisnupp ning mängutegevuste blokeerimine.
- HTML-i juhtelementide unikaalsus ja olemasolevate mängunuppude säilimine.
- V73 salvestusregressioon: V4 vorming, varukoopiast taastamine, vigased impordid ja väike salvestusmaht.
- V82 hooneregressioon: 65 mudelit; hooneinfo kõigis seitsmes ajastus.
- Ühe seemnega (20261020) 60 mänguminuti majandussimulatsioon, aruanded iga viie mänguminuti järel. Käskude andmiseks kasutati ka mängijapoolel olemasolevat AI otsustusloogikat. Ressursse ei lisatud, ehitisi ei lõpetatud käsitsi ega ajastuid avatud otse. See ei ole käsitsi läbimäng ega lahingute/pildi kontroll. Samm oli 0,5 sekundit (tavaline brauser jagab aja kuni 0,1 sekundi sammudeks).

## Majandussimulatsiooni tulemused

| Mänguminut | Mängijapoole rahvaarv | Oma ehitisi (ka pooleliolevad) | Seis |
|---|---:|---:|---|
| 5 | 4 | 4 | Algmajandus töötab, esimene uurimus veel kestab |
| 10 | 6 | 5 | Toitu 4,4 ühikut, kriitiline toiduhoiatus |
| 20 | 7 | 10 | Toit taastunud 21 ühikuni, kuus avastust |
| 30 | 10 | 15 | Endiselt kiviaeg, ühe vastase toit otsas |
| 40 | 6 | 16 | Oma toit otsas, rahvastik langenud |
| 60 | 10 | 17 | Oma ja ühe vastase pronksiaeg endiselt materjalide taga; kaks vastast pronksiajas |

### Viimistlemist vajavad kinnitatud olukorrad

1. Täis laoga tootmine hoiab endiselt tööjõudu: oma kivimurd oli 120 kivi juures täis ning hoidis kolme töölist, kui toidutootmine vajas abi.
2. Toidunappus kordub; automaatne jaotus jätab palju lisatootmisi väga väikese tööjõuga tööle. Katse ei tõesta optimaalset mängijastrateegiat, kuid näitab AI ja jaotuse taastumisprobleemi.
3. Ühe vastase kivimurd ei pääsenud toorainele ligi; uus kivimurd jäi ehitusjärjekorda. Pronksiaeg ootas 15 kivi ka 60. minutil.
4. Uuritud pronksiaeg jäi mängijapoolel seitsme toiduühiku taha. Materjalide kogumist ja ajastuvahetuse põhjust peab UI arusaadavamalt näitama.

## Veel kontrollimata

- Arvuti ning telefoni 390×844 / 844×390 menüü tegelik renderdus ja puutetöövoog.
- Uue maailma loomine, menüüst jätkamine, eksport ja laadimine päris brauseris pärast muudatust.
- Käsitsi mängimine, lahingud, visuaalsed teed ning päris Androidi jõudlus.

Brauseritest TEST_V83_MENU.mjs ja GitHubi töövoog on ette valmistatud. Kohalik Chromium ei käivitunud keskkonna socket-piirangu tõttu. GitHubi saatmise lükkas automaatne kinnituskontroll tagasi; muudatused pole avaldatud.
