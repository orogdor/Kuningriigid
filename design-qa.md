## V311 · ehitistest oli nähtaval ainult esimene

Viga taasesitati päris vana ui-v121.css stiiliga: #tray flex-direction oli column; kaevu, puuraiduri ja ülejäänud ehitiste top oli järgmistes vertikaalsetes ridades ning riba overflow lõikas need ära. Varasem kontrollvaade ei laadinud seda vana stiili ja jättis vea leidmata.

Parandus määrab ainult illustreeritud alumise riba #tray suunaks row ja keelab reamurdmise piisava selektori tugevusega. Mõõdud, pildid ja mängureeglid säilivad. Kontrollvaade laadib nüüd kõik index.html stiilid samas järjekorras ning kasutab ehituse avamisel ka hud-city-open kehaklassi. Uus CI test kontrollib, et ükski mängu stiil pole kontrollvaatest puudu.

Brauseris 915×364 on kõik 7 näidisehitist samal kõrgusel (top 254.921875), x kasvab 259.671875 → 627.921875. Valiti kaev ja viimane kivimurd, mõlema algne callback vastas õige nimega. Püstvaates 390×844 keriti viimase kaardini: scrollLeft 566, kõik top 674; kivimurru callback toimis. Tõendid reports/ui-v311-check.json ja previews/ui-v311-building-row.png. Kasutatakse päris HUD- ja ehituskaardifaile koos näidisandmetega; 3D-paigutust selles vaates ei testita.

## V310 · maailmakaardi mõõdus ja kujundusega alamkaardid

V309 väikesed sinised alamvalikud asendati põhikaartidega samas mõõdus kullatud raami ja pärgamendialaga kaartidega. Algse nupu DOM-sõlm ja callback säilivad; visuaalse kujunduse jaoks liigutatakse selle päris pilt ja tekst raami sisse. Sama lahendus katab ehitised, üksuste nupud, linnad, armeed, kaubanduspakkumised, diplomaatia valikud ja päevikukirjed. Tagasi ja filtrid on samuti sama suured. Otsing/filtrid ei vähenda enam ülejäänud kaartide kõrgust. Põhikaartide mõõte võetakse ka menüü avamisel ja pärast akna suuruse muutmist; ResizeObserver kontrollib pööramise järgset lõplikku paigutust.

Brauseris kõik 6 menüüd 915×364: iga kaardi laius 58.28125 px, kõrgus 87.421875 px ja top 254.921875 px, täpselt põhikaartidega samad. Ehitusvalikuid võrreldi põhikaartidega lisaks 844×390, 740×320, 390×844 ja 1200×675 mõõtudes: 0 mõõtude/joondumise erinevust, Tagasi puuteala vaba, pildid laetud. Kontrolliti avatud menüü pööramist püstvaatesse (100×150, top 674), viimase ehitise valimist pärast külgkerimist, kaubanduse callback'i, diplomaatia muutmist ja päeviku kordusavamist/Escape'i.

Tõendid `reports/ui-v310-menus.json`, `reports/ui-v310-sizes.json`, `reports/ui-v310-actions.json`, `previews/ui-v310-matching-cards.png`. Test kasutab päris HUD-, nimekirja- ja ehituskaardifaile koos näidisandmetega; 3D-renderdust ega tegelikku ehitise maastikule paigutamist see vaade ei testi. Kõik 23 nõutud kohalikku CI gruppi läbisid (`reports/ui-v310-ci.json`); lõpliku V310 skripti süntaks ja V304/V306 regressioonid kontrolliti ka pärast visuaalseid parandusi.

Uus raam `ui-art-v310/card_frame.webp` on genereeritud V306 ehituskaardi stiili järgi, päris alfakanaliga, seejärel vähendatud 448×672 WebP-ks. Päris mängupildid ja tekst jäävad eraldi. Genereerimise juhis: `ui-art-v310/prompt.txt`.

## V309 · vahetuv alumine valikuriba

Kasutaja soovi järgi jääb V308 täislaiuses raam alles. Kuue põhikaardi asemele ilmub valitud menüü ja püsiv Tagasi. Päris paneelide DOM-elemendid koos algsete käsitlejatega liiguvad ajutiselt ribasse; sulgemisel taastatakse nende algne asukoht, roll ja aria-modal. Avastuspuu ja põhimenüü säilitavad senise eraldi vaate.

Brauseris kontrollitud kõik kuus valikut 915×364 mõõdus ning ehitus ja diplomaatia mõõtudes 915×364, 844×390, 740×320, 390×844 ja 1200×675: riba püsib all, põhikaardid on peidetud, HUD jääb nähtavale, Tagasi puuteala on vaba, katkisi menüüpiltide allikaid pole ning modaalne kaardiblokeering ei jää külge. Kontrollitud ka valitud linna parempoolse portree Ehita-käsu suunamist samasse ribasse ja tagasiteed, armee valimise järel põhivalikusse naasmist, värbamise alamastmesse minekut, ehitusvaliku callback'i, viimase hooneni kerimist, kauplemise callback'i, diplomaatia muutmist ning päeviku kahekordset avamist ja Escape'iga sulgemist. Leitud ja parandatud vana diplomaatia ekraanikate ning päeviku kordusavamise peidetud lapse viga.

Tõendid: `reports/ui-v309-matrix.json`, `previews/ui-v309-bottom-build.png`. Kontrollvaade kasutab päris HUD-, nimekirja- ja ehituskaardifaile, mänguandmed ja simulatsioonikäskude API on näidisandmetega. Selles vaates 3D-mootorit ei käivitata; tegelikku kaardile paigutamist ja GPU-pilti siin ei kinnitata. Kohalikud kõik 23 nõutud CI gruppi läbisid (`reports/ui-v309-ci.json`), seejärel kontrolliti lõpliku V309 skripti süntaks ning V304/V306 regressioonid uuesti.

## V308 · täislaiuses ribad

Kasutaja heakskiidetud V307 paneelide ja kaartide skaala säilib. Rõhtvaates ulatuvad üla- ja alariba kogu ohutu ekraanilaiuseni; lisalaius jääb kuue kaardi järele, enne paremat paneeli. Parempoolne ressursirühm on ankurdatud parema serva külge.

Brauseri päris HUD-failidega kontrollvaade: 915×364, 844×390, 740×320 ja 1200×675. Kõigis neljas ulatuvad mõlemad ribad servadeni; puuduvad katvad lubatud nupud ja katkised pildid. 390×844 püstvaate senised sahtlid ja keritav kaardirida säilivad; kaks kerimisalast väljas nuppu pole selles mõõtmises nähtaval. Mõõdud: `reports/ui-v308-matrix.json`. Kontrollvaade kasutab näidisandmeid ja ei käivita 3D-renderdajat.

# V307 – telefoni rõhtvaate parandus

## Allikas ja kontrolli ulatus

Kasutaja uus pilt `6784.png` näitas päris Androidi rõhtvaadet: avastuspaneel, minikaart ja valikupaneel olid peidetud, kaardirida oli liiga kõrge ning ülariba arvud liikusid piltide alla. Soovitud välimus on endiselt teine pilt `6777.png` (1672 × 941).

Eelmine V306 telefonikontroll hõlmas püstvaadet, kuid jättis selle lühikese rõhtvaate kontrollimata. V307 tõendid kasutavad eraldi kolme rõhtvaate mõõtu.

## Leitud vead ja parandused

- **P1, rõhtvaate paneelid:** `(max-height:560px)` lülitas ka laia telefoni sahtlivaatesse. Kompaktne V306 paigutus rakendub nüüd ainult püstisele kitsale ekraanile. Rõhtvaates on kõik kolm pildipaneeli ja kuus kaarti korraga nähtavad.
- **P1, skaala:** fikseeritud 150 px kaardikõrgus võttis madalast aknast liiga palju ruumi. Pildiliides sobitatakse nüüd nii nähtava laiuse kui ka `100dvh` kõrguse järgi. Väga laias aknas jäävad HUD-i külgedele vabad mänguala ribad; ringe ega pilte ei venitata.
- **P2, ülariba:** vanast kujundusest pärinesid 42 px nupukõrgus ja püstine ressursipaigutus. Rõhtvaate ressursid on taas ühel real ning mahuvad oma pildiraami sisse.
- **P1, kaardivahetus:** liiga nõrk CSS-selektor jättis keelatud jalutamisnupu kaardivahetuse nupu peale. Teine nupp paikneb nüüd oma kohal ning on maailmavaates peidetud. Kaardivahetus ja detailvaate jalutamiskäsk jõudsid brauseris õigete olemasolevate nuppudeni.
- **P2, menüüde piirid:** linna-, ehitus- ja kaardimenüüde laius/asukoht arvestavad päris telefoniakent. Sulgemisnupud jäävad nähtavasse alasse.

## Brauseritõendid

Päris HUD-i failid töötasid rakises `tests/ui-v307-browser.html`, mille iframe annab täpse CSS-viewport'i. Andmed ja minikaart on selgelt märgistatud näidisandmetena; hall keskosa ei ole uus mängugraafika.

| CSS-viewport | Olek | Kaardi kõrgus | Pildid / kaetud nähtavad nupud |
| --- | --- | --- | --- |
| 915 × 364 | 3 paneeli + 6 kaarti | 87,4 px | 0 puuduvat / 0 kaetud |
| 844 × 390 | 3 paneeli + 6 kaarti | 93,7 px | 0 / 0 |
| 740 × 320 | 3 paneeli + 6 kaarti | 76,8 px | 0 / 0 |
| 390 × 844 | püstvaate sahtlid | 150 px, keritav rida | 0 / 0 nähtavas alas |
| 1200 × 675 | 3 paneeli + 6 kaarti | 162,1 px | 0 / 0 |

- Mõõtmised: `reports/ui-v307-matrix.json`.
- Täielik telefonivaade: `previews/ui-v307-phone-landscape.png` (915 × 364, density 1).
- Lühike rõhtvaade: `previews/ui-v307-phone-short.png` (740 × 320).
- Püstvaade: `previews/ui-v307-phone-portrait.png` (390 × 844).
- Ühine pildiline võrdlus: `previews/ui-v307-phone-comparison.jpg`. Allikas on sobitatud samasse 915 × 364 alasse, et erinev küljesuhe ei moonutaks kujusid. Võrreldud on HUD-i kompositsiooni ja suurust; näidiskaardi geograafia ja 3D taust jäävad võrdlusest välja.

Brauseris kontrolliti pausi/jätkamise ikooni, ehitusmenüü avamist ja sulgemist, avastuspaneeli avamist ja sulgemist, minikaardi kaardivahetust, jalutamiskäsu ühendust detailvaates ning kaarditoimingute menüü avamist ja sulgemist. HTML-elementide tegelikud keskpunktid läbisid `elementFromPoint` kontrolli: ükski nähtav ja lubatud HUD-i nupp ei olnud teise elemendi all. Mobiiliridade väljaspool keritavat nähtavat ala paiknevaid kaarte ei loetud kaetud nuppudeks.

## Viis visuaalset pinda

- **Kirjatüüp:** senine serif/pärgamendi kujundus säilib; lühikese rõhtvaate arvudel, pealkirjal ja valiku nimel on loetavuse alampiir.
- **Paigutus:** pildiraamid ja klõpsualad skaleeruvad koos, avastus ei kattu atlasega ning kuus kaarti mahuvad ekraanile. Rõhtvaates ei ole enam kolme mobiilisahtli nupurida.
- **Värvid:** V306 tumesinine, kuld ja pärgament säilivad.
- **Pildid:** kasutatakse olemasolevaid genereeritud raame ja pilte; uut asendusgraafikat ei lisatud. Puuduvaid pilte ei leitud.
- **Sisu:** kõik ressursid, avastused ja käsud kasutavad senist V304/V306 andmesidet. Mängureegleid ei muudeta.

## Kontrollid ja piirangud

Kõik 23 CI kiirkontrolli gruppi ja V306 kunstivarade/käskude kontroll läbisid. Päris mängu käivitus jõudis uuesti Three.js renderdaja loomiseni, kuid selle pilvebrauseri GPU kontekst on keelatud (`GL_RENDERER = Disabled`). Seetõttu ei väideta, et täismängu 3D-pilti või päris Androidi riistvara oleks siin proovitud. Vastuvõtukontroll hõlmab brauseris renderdatud HUD-i, viewport'i mõõte ja klõpsuühendusi.

Eraldi maalitud kujunduse peened ornamentide/pildisisu erinevused jäävad P3-na; lahendamata P0/P1/P2 HUD-i paigutus- või klõpsuala vigu selles maatriksis ei jäänud.

final result: passed
