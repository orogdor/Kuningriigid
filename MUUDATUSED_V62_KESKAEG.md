# CIVRTS V62 – keskaegne areng ja linnusepiiramine

Lisatud V61 baasilt. Olemasolev salvestusformaat `version:4` ja automaatsalvestuse võti `kingdoms-civ4` on muutmata. Olemasolevaid linnu ega üksusi ei asendata.

## 12 uut keskaja avastust

| Avastamine | Eeldus | Avab |
|---|---|---|
| Soomusevalmistamine | Feodaalkorraldus + sepatöö | Soomustöökoda, soomustatud jalavägi |
| Ristvibud | Feodaalkorraldus + vibulaskmine | Ristvibude harjutusplats ja ristvibumees |
| Käsitöögildid | Feodaalkorraldus + puusepatöö | Gildimaja (+13% töötavatele tootmishoonetele) ja meistritöökoda |
| Vesiveskid | Feodaalkorraldus + jahvatus | Vesiveski; jõe või naaberjõe nõue |
| Tuuleveskid | Feodaalkorraldus + jahvatus | Tuuleveski; viljakas avatud maa nõue |
| Haavatute ravimine | Feodaalkorraldus + õpetuse alused | Ravitsejamaja; linnas viibivaid sõdureid ravitakse toitu kulutades |
| Linnakaubandus | Feodaalkorraldus + linnaturg | Kaubahoov (+20 kaubakohta) ja kõrts (kiirem kasv) |
| Kloostrikultuur | Feodaalkorraldus + kirjakunst | Klooster ja kirik; töötajatega annavad teaduspunkte |
| Rüütlivägi | Feodaalkorraldus + ratsavägi + soomusevalmistamine | Rüütel, raskeratsavägi ja hellebardimees |
| Linnuseehitus | Feodaalkorraldus + kivist kindlustused + kivitahumine | Linnus, peatorn, väravahoone |
| Piiramistehnika | Linnuseehitus + puusepatöö | Piiramistöökoda, katapult, müürilõhkuja, piiramistorn |
| Linnade kindlustamine | Linnuseehitus + piiramistehnika | Tugevdatud kivimüür |

**15 uut ehitist:** soomustöökoda, ristvibude harjutusplats, gildimaja, meistritöökoda, vesiveski, tuuleveski, ravitsejamaja, kaubahoov, kõrts, klooster, kirik, linnus/peatorn, väravahoone, piiramistöökoda ja tugevdatud linnamüür. Kõigil on 3D-geomeetria.

**8 uut sõjaväeüksust:** ristvibumees, hellebardimees, rüütel, raskeratsavägi, soomustatud jalaväelane, katapult, müürilõhkuja ja piiramistorn. Rüütlite ja raskeratsaväe soomus vähendab kahju, hellebard on tugevam ratsaväe vastu ning ristvibu laeb aeglasemalt, kuid läbib paremini soomust.

## Piiramine ja kaitse

- V61 puit- ja kivimüüridele lisandub tugevdatud müür (4 garnisonikohta); linnuse peatorni saab käsitsi saata 6 päris olemasolevat sõdurit.
- Piiramislahing tekitab igale olemasolevale müürilõigule ja väravahoonele eraldi HP-ga sihtmärgi. Katapult, müürilõhkuja ja piiramistorn ründavad seda märgatavalt tõhusamalt kui jalavägi.
- Vähemalt ühe müürilõigu purustamine tekitab **läbimurde**, mille järel saab rünnata linna keskset kaitset. Värav ja muud terved müürid jäävad alles.
- Müüri ja värava tegelik HP kirjutatakse lahingu lõppedes nende ehitistele tagasi; purustatud ehitis peatatakse ning selle seisund säilib pärast salvestamist ja laadimist.
- Linnus lisab piiramisel kesksele kaitsele 180 HP-d. Vahid on päris armeeüksused, tornivalvurid päris tööjõud, mitte tasuta loodavad sõdurid.

## Mängu kasutamine

1. Ava tehnoloogiapuu ja lõpeta `Feodaalkorraldus` (keskaeg); vali soovitud keskaegsed harud.
2. Ehita sobivad eeldushooned ja uus tööhoone linnakaardil, määra tööjõud.
3. Värba uusi üksusi sõjaväepaneelis; piiramisüksused vajavad valminud piiramistöökoda.
4. Saada armee maailmakaardil vastase linna ruudule. Lahingus vali **Ründa** ning piiramisüksused püüavad lõhkuda eraldi müürilõike.
5. Enda linnust kaitstes too oma sõjavägi linnaruudule, vali linnus või müür ja määra sõdurid garnisoni.

## Testid ja piirangud

- `TEST_V62_MEDIEVAL.mjs`: 12 avastust, 15 modelleeritud ehitist, 8 üksust, tööjõureeglid, teadus, linnuse garnison, eraldi sein/värav, läbimurre, ravitsejamaja, gild ja kõrts, V4 salvestus.
- Varasemad `TEST_V61.mjs`, `TEST_V60.mjs`, `TEST_V59.mjs` läbisid regressioonitestid.
- Avalik GitHub Pagesi leht: 69 avastust, 70 hoonet ja 21 ühiku liiki; brauseri JavaScripti vigu ei esinenud (favicon.ico puudub, kuid mängu ei mõjuta).
- **Piirang:** müürid on iseseisvalt purustatavad, kuid terviklikku väravate avamise/sulgemise, piiramistorniga müürile ronimise ja täiesti füüsiliselt suletud linnuseperimeetri simulatsiooni veel ei ole. Piiramistorn toimib praegu eraldi müüripurustamisüksusena.
