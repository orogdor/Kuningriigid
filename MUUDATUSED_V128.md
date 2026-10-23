# V128 — ajastuga arenev AI ja rauaaja ülevõtmistest

Avastajad on lahinguväe värbamisest ja tugevuse limiidist eemaldatud. AI planeerib jala-, laskur-, ratsa- ja piiramisväge eraldi rollide järgi. Järgmisse ajastusse liikumine ootab tegelikult valmis lahinguväge; optional teadus peatub ajastu keskpaigas, kuni uus varustus ja väljaõpe järele jõuavad. Olulised sõjaväe tootmise avastused jäävad avatuks. Mitteaktiivse uurimise õpetlaste tööjõud vabaneb.

Vana armee täitumisel õpetatakse olemasolevaid linnas viibivaid salku tasuliselt ümber. Ümberõpe kulutab uue üksuse materjalid ja tegeliku väljaõppeaja, säilitab salga ning ei võta teist korda rahvast. Mängija saab sama toimingut kasutada valitud vananenud üksuse tegevustest. Vigastuste osakaal ja armee kogemus säilivad.

Standardsete maismaaüksuste materjalikulu on ligikaudu 35% väiksem. Kerge salga värbamine kulutab 1, ratsa-, piiramis- või sõidukiüksus 2 tööjõuühikut senise 3 asemel. Väljaõppeajad vähenesid ligikaudu 25%. Hinnad ja reeglid kehtivad võrdselt AI-le ning mängijale.

Põllutalu vajab 2 töötajat ja on odavam. AI rajab selle viljakale ruudule ning lisab päris eraldi põllu. Vase-, tina-, raua- ja relvatootmine saab kõrgema prioriteedi; maakonna maardlaid kasutatakse ka vase ja tina jaoks. Kasarm ei vaja kunstlikult oma kivimurdu, kiviraidur ega pronksisulatus oma kaevandusi: töökojad kasutavad reaalselt kohale toodud sisendeid. AI tellib kaupmeestelt ehitamiseks puuduvaid materjale. Täis keskuse korral otsitakse ehituskohta ka linna teistel linnaruududel, maakonna kolme hoone reeglit säilitades.

Kindlustused ehitatakse ette määratud kaitsevöö kohtadele, kahe väravaava ja pööratud külglõikudega. Väravate keskel on oma üksustele läbitav koridor. Ring valmib järk-järgult ning maastik või ressursipuudus võib jätta osi pooleli. Tornikaitsjad saavad avastuste järgi hilisematel ajastutel ristvibud, musketid või vintpüssid.

## Praegused näidishinnad

| Ehitis | Materjalid | Ehitamise baasaeg |
|---|---|---:|
| Põllutalu · farmerihoone | wood 25, stone 13 | 36 |
| Sõdalaste laager | wood 35, stone 15 | 48 |
| Vibuküttide harjutusplats | plank 33, stone 17 | 38 |
| Tall | plank 53, stone 36 | 48 |
| Rauasulatus | plank 36, stone 29 | 46 |
| Relvasepp | plank 38, stone 32 | 46 |
| Puitvall | wood 12, stone 2 | 25 |
| Madal kivivall | stone 24, cutstone 8, wood 4 | 41 |
| Väravahoone | stone 44, cutstone 17, plank 9 | 91 |

## Ülevõtmistesti lähtekoht

Seeme 12501; käik **388**. Ülevõetav riik on **Ida**. Rauaaja avastusi on teada **9/17** — keskpaik tähendab siin rauaaja tehnoloogiapuu edenemist, mitte kogu mängu käikude arvu.

Seis pärineb tavalisest AI kampaaniast, mida jätkati paranduste kontrollimiseks samast salvestusest. Ressursse, tehnoloogiaid, ehitisi ega sõdureid ei lisatud tasuta. Viimase tasulise ümberõppe kontroll jätkus 375. käigu säilitatud seisust; testsalvestus võeti 388. käigul. Kõiki nelja riiki juhtis salvestuse tegemiseni AI, sh tavaline mängijapool. Ülevõtmisel vahetatakse ainult riikide indeksid ja omand; majandus, uurimine, sõdurid ning avastatud kaart säilivad.

| Riik | Ajastu | Linnu | Elanikke | Lahingusalku | Talusid / põlde / loomafarme |
|---|---|---:|---:|---:|---:|
| Kadaka | Keskaeg | 12 | 287 | 37 | 3 / 3 / 12 |
| Ida | Rauaaeg | 8 | 218 | 24 | 4 / 4 / 8 |
| Põhja | Rauaaeg | 4 | 124 | 16 | 3 / 3 / 4 |
| Lõuna | Rauaaeg | 7 | 194 | 22 | 3 / 3 / 7 |

Ida üksused: Avastaja × 1; Kivikirvemehed × 3; Kiviviskajad × 1; Ratsavägi × 5; Pronkskirvemees × 5; Pronksiaja vibukütt × 6; Raudmõõgamehed × 2; Müürilõhkuja × 1; Heiteodamees × 1.

Test avaneb pausil ning mängija juhib endist Ida riiki. ▶ jätkab mängu. Kõik teised riigid jätkavad AI juhtimisel. Testi laadimine ei kirjuta üle tavalise mängu automaatsalvestust; ekspordinupust saab oma testiseisu alla laadida.

## Kontrollid

- V128 reeglitestid: hinnad, rahvakulu, segaväe valik, ajastu valmisolek, õpetlaste/uurimise paus, tornikaitsjate relvad, kaitsevöö suunad, värava läbipääs, tasuline ümberõpe ja üksuste arvu säilimine ning ülevõtmise omandi/ressursside/avastuste vastavus.
- V127, V126 ja V125 regressioonikontrollid.
- Päris kampaania tellimuste ajastu- ja eeltingimuste kontroll: vigu ei leitud.
- Brauserikontrolli käitab V128 töövoog lauaarvuti ja telefoni vaates; tõendusfailid säilitatakse GitHub Actionsi artefaktina.
- See katse ei ole uus 900 käigu kampaania ega tõend kõigi riikide moodsasse aega jõudmise või kõigi lahingute toimimise kohta.
