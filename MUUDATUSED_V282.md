# V282 — graafika ja kasutajaliidese parandused (pronksiaja testmängu järgi)

**Maailmakaardi linnad**
- Linna suurendus arvutatakse ainult linna südamiku järgi (peamaja, majad, kaev, laod, kool). Kaugemad
  töökohad (metsalaager, kivimurd, jahionn, talu, kasarm, müürid) nihutatakse ruudu serva lähedale. Kiviaja
  linn on nüüd 2,3–3,8× suurem (enne ~1,1×) ja hooned joonistatakse 1,4× suuremana.
- Mets jääb kaugemate laagrite ümber alles; puud võetakse ära ainult linna südamiku alt.
- Linna nimesilt on ruudu põhjaservas (maailmakaart) ja kõrgemal peamaja taga (detailkaart), mitte linna peal.

**Maavarade märgid** (endised „valged ringid“)
- Pruunid märgid kasutajaliidese maalitud ressursipiltidega (savi, vask, tina, puit, kivi, raud, vili, vesi).
- Asuniku valimisel näidatakse ainult 3 ruudu raadiust ja kuni 2 märki ruudu kohta; metsas ei näidata puidumärki.

**Öö**
- Öösel paistab kõrgelt sinakas kuuvalgus ja ümbritsev valgus on heledam (32% vs 14%). Taevas on heledam
  sinine, tõrvikud paistavad endiselt.

**Telefon**
- Ülemine riba algab alati toiduga ja mahub ära: toit, vesi, puit, kivi, kuld, elanikud ja kell. Rühmaikoonid
  ja -nimed ning käigu/ajastu tekst on peidetud.

**Keel**
- Kasutajaliides on alati inglise keeles, kuid versioonide V262–V281 tekstid olid tõlkimata. Uus fail
  `locale-en-v282.js` sisaldab umbes 200 tõlget ning mustreid nimede ja numbritega teadete jaoks (röövretked,
  võõra armee hoiatus, kassa, kiviaja algus).
- Kauplemises on hind kullas („Buy 20 wood (12 gold)“, „Sell 20 stone (+11 gold)“). Kassas näidatakse
  avastuse nime, mitte sisemist tunnust. Armee nimekirjas on „1 man“.

**Vana rohekassinine stiil → pruun**
- Ehitusmenüü kaardid, otsingukastid, päevik ning uue mängu vorm.

**Vee teated**
- Kui vett tuuakse jõest või allikast, näitab linnaaken „from the river / from a spring“. Hoiatust „Water is
  short“ ja kaevu soovitust ei tule (kaevu avastuse korral jääb väike vihje). Ressursiaknas pole „river /100“.

**Väiksemad**
- Klõpsatud allriba nupp (nt Research) ei jää enam esile.
- Soovitatud tegevuste kast ei lõika teist kaarti pooleks.
- „Assign builders…“ tuleb ainult siis, kui ükski ehitaja ei tööta.
- „Check building material deliveries“ tuleb ainult siis, kui laos tõesti napib materjale.

**Testid**
- `tests/ui-v282.mjs`: tõlked (ka nimede ja numbritega teated), vee- ja materjaliteated.
- `tests/world-city-scale-v273.mjs`: kaugemad laagrid ei vähenda linna suurendust ja jäävad ruudu sisse.
