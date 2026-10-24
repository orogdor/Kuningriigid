# Kuningriigid V153 — V152 täismängu test ja AI tasakaalustus

**Kontrollitud:** 2026-10-24 · maailmaseeme `142023` · Claude V152 3D/maastik säilitatud.

## Muudatused
- `ai-foundation-v88.js`: esimese turu jaoks vajaliku ülemäärase puidu- ja kivireservi asemel kontrollitakse päriselt alles jäävaid toidu-, vee- ja ehitusmaterjalivarusid.
- `ai-strategy.js`: turu ja jõuka linna esimese kasarmu ehitusprioriteet on tõstetud, et linnad ei jääks ainult tootmishoonetest koosnevateks.
- `ai-defenses-v128.js`: kiviraiduri ehitamist lubatakse kuni 3 poolelioleva hoone korral.
- V153 testmängu generaator, ülevõtmise laadija, brauseritestid ja eraldi avaliku HTTPS-faili kontroll.
- V152 jõgesid, modelle, varjutajaid, puid, asulaid ja sõdurianimatsioone ei muudetud.

## Testimetoodika
Täiesti uus päris AI mäng; tehnoloogiaid, hooneid ja varusid ei lisatud käsitsi. Mäng peatub 30 käiku pärast esimest keskaja avamist, kaasa arvatud juhul, kui mõni riik jõuab vahepeal renessanssi. Riigi ülevõtmine toimub salvestatud olekust; kasutaja olemasolevaid salvestusi ei muudeta.

| Vahepunkt | Käik | Linnad | Elanikud | Ajastud (1/2/3) |
|---|---:|---:|---:|---|
| Algus | 20 | 3 | 18 | kiviaeg/kiviaeg/kiviaeg |
| | 40 | 3 | 17 | kiviaeg/kiviaeg/kiviaeg |
| | 60 | 3 | 25 | kiviaeg/kiviaeg/kiviaeg |
| | 80 | 8 | 50 | kiviaeg/kiviaeg/kiviaeg |
| | 100 | 9 | 80 | pronks/kivi/kivi |
| | 120 | 12 | 112 | raud/pronks/kivi |
| | 140 | 14 | 140 | raud/raud/pronks |
| Esimene keskaeg | **157** | **14** | **148** | keskaeg/raud/pronks |
| | 160 | 15 | 152 | keskaeg/keskaeg/pronks |
| | 180 | 15 | 193 | renessanss/keskaeg/raud |
| Test lõpeb | **187** | **16** | **195** | renessanss/keskaeg/raud |

### Täpne varajane võrdlus V151-ga

V151 peatus esimese keskaja alguses **153. käigul**: 14 linna, 154 elanikku, 4 turgu ja 3 lahinguüksust.
V153 jõudis esimese keskaja algusse **157. käigul**: 14 linna, 148 elanikku, **7 turgu** ja 4 lahinguüksust.
**Järeldus:** turgude levik paranes juba samas arengufaasis, kuid keskaega jõudmine aeglustus nelja käigu võrra ning selles kontrollpunktis oli kuus elanikku vähem. Nende põhjal ei saa väita, et kogu tasakaal on igas mõõtmes parem.

### Maailm 187. käigul

| Näitaja | V153 |
|---|---:|
| Linnu | **16** |
| Elanikke | **195** |
| Hooneid kokku | 358 |
| Valmis / ehitamisel | 318 / 40 |
| Elumaju | 120 |
| Turge / turuga linnu | **10 / 10** |
| Haridushooneid / haridusega linnu | 26 / 9 |
| Talusid / põlde | 11 / 7 |
| Kaevandusi | 32 |
| Kiviraiduriga linnu | 7 |
| Kaitserajatisi kokku / valmis | **8 / 5** |
| Puitvalle / kivimüüre | 2 / 4 |
| Kivitorne / väravahooneid | 1 / 1 |
| Arvestatud lahinguüksusi | **14** |
| Kaubasaadetisi teel | 10 |

| Riik | Ajastu | Linnu | Elanikke | Avastusi | Lahinguüksusi |
|---|---|---:|---:|---:|---:|
| Idaküla | Renessanss | 9 | 105 | 101 | 9 |
| Põhjaküla | Keskaeg | 5 | 61 | 88 | 5 |
| Lõunaküla | Rauaaeg | 2 | 29 | 53 | **0** |

### Mängitav linn: Põhjaküla 1

187. käik, 19 elanikku, 32 hoonet (29 valmis), 11 elumaja, kolm haridusasutust, 1 talu ja põld ning 1 valmis kivimüür. Linna-ala **9×9**, koos maakonnaga 228 ruutu. Kiviraidur on valmis ning varudes on 108,35 tahutud kivi, kuid ainult **2,45 puitu**. Turgu pole — toorpuuduse kõrvaldamine vajab eraldi kaubanduse/veologistika kontrolli.

**Mängitav link:** https://orogdor.github.io/Kuningriigid/?v=153-20261024&demo=ai-medieval-v153

## Testide tulemused
- Läbitud: 44 mängureeglite kontrolli ja V147 kaitserajatiste ning V148 mudelite testid.
- Läbitud: V153 ülevõtmise brauseritestid arvutis 1280×800 ja mobiili suurusel 390×844, vigadeta, kasutaja varasemaid salvestusi rikkumata.
- Läbitud: V151 ja V143 varasemate salvestuste brauserikontrollid.
- Läbitud: V149 renderdamine, V152 maailmakaardi uued mudelid, puud ja asulad, samuti V148 näidislahingute brauseritestid.
- Läbitud: avaliku V153 mänguseisufaili HTTPS-laadimise automaattest.
- Märkus CI kohta: pikk testijooks koos salvestuse commitiga õnnestus, kuid selle töövoo paralleelne Pagesi deploy sai samaaegse avaldamise konfliktiteate. Eraldi GitHub Pagesi avaldamine lõppes edukalt; avalikku JSON-i kontrolliti seejärel iseseisva testiga.

## Veel lahendamata või nõrgad kohad
1. **Pronksiaja tempo:** 80. käigul olid kõik riigid kiviajas, kuigi varasem siht oli jõuda pronksiajani umbes 30 käiguga.
2. **Turgude ebavõrdne jaotus:** kuues linnas 16-st pole turgu. Valitud keskaegses linnas puudub tootmiseks vajalik puiduvaru — vajadus on parandada kohaliku puidutootmise taastumist ning puidu vedu oma linnade vahel.
3. **Riigi 3 sõjavägi:** vaatamata 29 elanikule puudusid sealsed arvestatud lahinguüksused.
4. **Osalised kaitseringid:** valminud oli viis kaitseehitist, kuid terviklikke kivimüüride ringe ei tekkinud.
5. **Ajastute ebaühtlus:** maailma esimene riik jõudis renessanssi, kolmas jäi rauaaega; see vajab mõõtmist mitmel seemnel.

**Soovitus:** järgmise iteratsiooni võtmeküsimused on riikidevahelise arenguerinevuse vähendamine, sõjaväe alampiiri tagamine, turuta linnade puidulogistika ja linnakaitseringi järjepidev ehitamine. Tulemused pärinevad ühest seemnest; kõikide kaartide, lahingute ja telefonide ammendavat testimist pole tehtud.
