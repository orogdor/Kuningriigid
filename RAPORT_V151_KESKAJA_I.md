# Kuningriigid V151 — keskaja I etapi testiraport

**Testitud kood:** Claude'i V148 sõdurid + V149 ja V150 maastikud koos V147 mängumajanduse ja kaitse-AI-ga, ainult regressioonitestide ühilduvusparandused.
**Kontrollitud seis:** 2026-10-24, maailmaseeme `142023`.
**Stopp:** esimene AI riik jõudis keskaja algusesse (ajastu indeks 3) **153. käigul**. Kõik hooned, ressursid ja avastused tekkisid tavalise AI simuleerimise kaudu.
**Tulemus:** simulatsioon, maailma salvestuse kontroll, 44 reeglitesti, V147 linnakaitse test, V148 mudelite andmetest, V143 pärandsalvestuse avamine, V149 kõrge/madala kvaliteedi graafikatest, V148 näidislahingud 1 ja 6 (sh mobiil), ning V151 mobiili-/arvutibrauseri test läbisid. Avaliku V151 JSON-i valideerimine GitHub Pagesis läbis.

## Maailm ajastuvahetuse hetkel

| Näitaja | Tulemus |
|---|---:|
| Mängukäik | 153 |
| Linnu | 14 |
| Elanikke | 154 |
| Hooneid kokku | 268 |
| Valmis / pooleli | 229 / 39 |
| Elumaju | 99 |
| Turge | 4 (4 linnas 14-st) |
| Haridushooneid | 19 (9 linnas) |
| Talusid / põlde | 10 / 6 |
| Kaevandusi ja karjääre | 23 |
| Kaubasaadetisi teel | 12 |
| Arvestatud lahinguüksusi | 3 |
| Kaitseehitisi kokku | 2 (1 valmis) |
| Kiviraiduritega linnu | 2 |

| AI riik | Ajastu | Linnu | Elanikke | Avastusi | Järgmine uurimus | Lahinguüksusi |
|---|---|---:|---:|---:|---|---:|
| Idaküla (1) | Keskaeg (3) | 7 | 88 | 65 | heavy_plough | 3 |
| Põhjaküla (2) | Rauaaeg (2) | 5 | 44 | 60 | military_supply | 0 |
| Lõunaküla (3) | Pronksiaeg (1) | 2 | 22 | 34 | archery | 0 |

## Elanikkonna ja ajastute kronoloogia

| Käik | Linnu | Elanikke | Riikide ajastud (1/2/3) |
|---:|---:|---:|---|
| 20 | 3 | 18 | 0/0/0 |
| 40 | 3 | 17 | 0/0/0 |
| 60 | 3 | 25 | 0/0/0 |
| 80 | 8 | 50 | 0/0/0 |
| 100 | 9 | 80 | 1/0/0 |
| 120 | 12 | 114 | 2/1/0 |
| 140 | 14 | 144 | 2/2/1 |
| 153 | 14 | 154 | 3/2/1 |

## Linna ülevõtmise salvestus: Idaküla 1

AI riik 1, keskaja I etapp, **16 elanikku**, kõik 16 tööjõus arvestatud, **29 hoonet** (26 valmis, 3 pooleli), **10 elumaja**, turg, 2 haridusasutust, 2 talu ja põld, 2 kaevandus-/karjääritüüpi, puidutootmine ja saeveski, kiviraidur rajamisel, 1 valmis puitvall. Linnapind **9 × 9**, kogu linna omanduses 243 ruutu koos maakonnaga. Toiduvaru mõõdik 51,12; puitu 67,03 ja kivi 120; kulda 1127.

**Mängitav link:** https://orogdor.github.io/Kuningriigid/?v=151-20261024&demo=ai-medieval-v151

## Regressioonikontrollid

- **44 reeglitesti:** läbitud. Varasemate V138/V139/V67 kontrollide eeldused kohandati kehtivate 12×12 linnapiiride, V146 materjalivarude ning Claude'i V149 teekatte nelja ristlõike tipu jaoks. Mängureegleid ja Claude'i visuaalifaile nende paranduste käigus ei muudetud.
- **V148 sõdurid:** 28 mudelit, 183 animatsiooniklippi, mudeli andmete kontroll läbitud. Brauseris katsetati lahingusalvestusi 1 ja 6, sealhulgas mobiilivaadet, mitte kõiki 10 salvestust.
- **V149/V150 maastik:** V149 shaders maailma- ja detailkaardil ning kõrge/madala kvaliteediga vaated läbisid. V150 üleminekuid ei hinnatud eraldi kunstilise kvaliteedi võrdlusega.
- **Mängu avamine:** V151 Androidi mõõdus (390×844) ja arvuti (1280×800) vaade avasid Idaküla 1 õigel käigul ja ajastul; salvestatud kasutaja mängu ei kirjutatud üle ja brauserivigu ei registreeritud.
- **V143 taandühilduvus:** vanem rauaaja salvestus avanes mõlemas vaates, riigipiirid nähtavad.
- **Avaldamine:** avalik V151 fail kontrollitud üle HTTPS-i, JSON-i sisu sisaldab käiku 153 ja mängitavat AI linna.

## Analüüs ja prioriteedid

1. **Sõjavägi on liiga väike:** 154 elaniku kohta ainult kolm lahinguüksust, kahes riigis mitte ühtegi. AI kasarmu- ja värbamisloogika vajab tugevdamist.
2. **Turud jäävad maha:** 10 linnal 14-st turg puudub; linna kasvu mitmekesisus ja kauplemisvõime jäävad alaarendatuks.
3. **Kaitseringid on varases keskajas napid:** üks puitvall valmis, üks kivimüür pooleli, tornid ja väravahooned puuduvad. V147 hilisemates käikudes nende rajamine toimis, kuid keskaja alguses on see vähene.
4. **AI areng on riigiti ebaühtlane:** esimese riigi keskaja alguses on kolmas riik veel pronksiajas. Oluline eristada õiglast varieeruvust ja ressursi puudusest kinni jäänud riiki.
5. **Ajaline tempo:** esimene pronksiaeg oli nähtav hiljemalt 100. käigul, rauaaeg hiljemalt 120. ning keskaeg 153. käigul. Varasema sihi „pronksi 30. käiguks” täitmine ei ole kinnitatud ning selle maailmaseemne testis ei olnud pronksiaega 80. käigul.

**Võrdlus:** V147 varasemal sama seemne 153. käigu ajal oli samuti 14 linna ja 154 elanikku. See toetab järeldust, et Claude'i visuaalipaketid ei muutnud selles testis AI põhisimulatsiooni.

**Piirang:** test on üks deterministlik maailmaseeme, mitte kõigi kaartide, lahinguliikide ja mobiilseadmete ammendav valideerimine. Keskaja I etapp on esimene üleminek, mitte keskaja keskpunkt. V151 päästetud linna saab kasutaja ise jätkata.
