# Kuningriigid V127 — AI linnade ja armeede kontroll

Kontrollitud lähtekood: kohalik V127, commit 0444e3d. Kaardiseeme 12501. Viimane täielikult salvestatud vaatlus: **308. käik**. Üks käik = 60 mängusekundit. Mängureegleid selle auditi ajal ei muudetud.

Katse kasutab tavalist majandus-, teadus-, ehitus- ja värbamisloogikat. Ka Kadaka mängijapoolt juhiti testis AI-ga. Päriskampaanias ei lisatud tasuta ressursse, avastusi ega sõdureid. Eraldi seitsme ajastu reeglikatsetes anti eeltingimused ette; nende tulemusi ei loeta kampaanias saavutatud arenguks.

Vaatluskatse peatati pärast kinnitatud planeerimisvigade leidmist. Kõik neli riiki jõudsid keskaega ja kaks renessanssi; tööstus- ning moodsa ajastu orgaanilist kampaaniat selle katsega ei kinnitatud. Nende ajastulukke kontrolliti eraldi reeglikatsetega.

Brauseri 3D-vaadet ja päris lahingute käiku see test ei kontrolli. Müüride hinnang põhineb hoonete tüüpidel, asukohtadel ja AI ehituskoodil.

## Peamised tulemused

- Ajastu, avastuste ja eeltingimuste rikkumisi õnnestunud ehitus- või maismaaväe värbamiskäskudes: **0** (1025 ehituskäsku ja 27 värbamiskäsku). Kõigi seitsme ajastu eraldi kontrollis oli tulevikuüksuste ja tulevikuhoonete lubamisi **0**.
- Linnu kokku **39**. Elanikke **682**. Viljapõlde **14**, neist valmis **14**. Põllutalusid **38**, neist valmis **38**. Loomafarme **30**.
- Valmis põllutalu ilma kasutatava valmis põlluta: **24**. Nendest **24** asuvad viljaka põllumaa tunnuseta ruudul. AI ehitab talumaja, kuid põllu automaatika jätab sellise ruudu vahele.
- Elusaid avastajaid armeedes ja müürigarnisonides kokku **20**. Päris lahinguüksuste värbamiskäske kogu vaadeldud kampaanias **11**; avastajate värbamiskäske **16**.
- Müürilõike ja väravaid kokku **25**, torne **9**. AI ehitab üldjuhul igast müüritüübist ühe hoone ning ei sea kaitseringi, väravate või tornide ühenduste plaani. Olemasolev müür ei tähenda suletud kaitseringi.
- Püsivad torni kaitsjad ei uuene üle rauaaja: kood valib alates rauaajast alati `iron_archer`. See jääb nii ka renessansis, tööstusajal ja moodsas ajas. Torni viit kaitsjat ei ole lisatud allpool väljaarmee sõdurite arvule.
- Põllutöö süsteem puudutab praegu vilja: lina-, siidi- ja muud maardlapõhised istandused ning aiad on endiselt varasema ühendatud tootmishoone loogikaga. Nende arv on eraldi allpool.

Värbamiskäsk tähendab tasutud väljaõppetellimust, mitte tingimata juba valmis salka. Laevastiku ehitust ega lahinguid selles aruandes ei hinnata.

## Riigid kontrollhetkel

| Riik | Ajastu | Linnu | Elanikke | Väljaarmee salgad / mehi | Müürigarnisoni salgad / mehi | Valmis talud / põllud / loomafarmid |
|---|---|---:|---:|---:|---:|---:|
| Kadaka (AI juhitud mängijapool) | Keskaeg | 12 | 209 | 5 / 5 | 3 / 3 | 12 / 3 / 11 |
| Ida | Renessanss | 10 | 178 | 6 / 75 | 2 / 25 | 10 / 3 / 7 |
| Põhja | Keskaeg | 6 | 105 | 3 / 3 | 2 / 2 | 5 / 3 / 5 |
| Lõuna | Renessanss | 11 | 190 | 3 / 3 | 0 / 0 | 11 / 5 / 7 |

Meeste arv on mängu üksusesuuruse järgi: avastaja = 1; tavaline jala- või laskurväe salk = 24; ratsaväe ja tehnika suurus sõltub üksusetüübist. „Mehi” on mängumudeli arvestus, mitte ajaloolise pataljoni suurus.

## Linnad: põllumajandus ja kaitse

Kaardiruudud on siin kasutajaliidese kujul **veerg:rida, alates 1-st**. Kohalikud x,z koordinaadid on detailkaardi mänguühikutes. Loendites on ainult hp > 0 ehitised. „v/e” = valmis / ehitamisel.

| ID | Riik / linn | Kaardiruut | Ajastu | Elanikke | Elamuid v/e | Talusid v/e | Põlde v/e | Põllupind | Loomafarme v/e | Kaitserajatised |
|---:|---|---|---|---:|---:|---:|---:|---:|---:|---|
| 3 | Kadakaküla 1 | 88:106 | Keskaeg | 19 | 5/0 | 1/0 | 1/0 | 256 | 1/0 | Vahitorn × 1; Puitvall × 1; Madal kivivall × 1 |
| 7 | Kadakaküla 2 | 93:106 | Keskaeg | 19 | 5/0 | 1/0 | 0/0 | 0 | 1/0 | Puitvall × 1 |
| 10 | Kadakaküla 3 | 88:102 | Keskaeg | 19 | 5/0 | 1/0 | 0/0 | 0 | 1/0 | Vahitorn × 1; Puitvall × 1; Madal kivivall × 1; Kivist kaitsetorn × 1 |
| 13 | Kadakaküla 4 | 85:105 | Keskaeg | 22 | 6/0 | 1/0 | 0/0 | 0 | 1/0 | Vahitorn × 1; Puitvall × 1; Madal kivivall × 1 |
| 15 | Kadakaküla 5 | 93:102 | Keskaeg | 22 | 6/0 | 1/0 | 0/0 | 0 | 1/0 | Puitvall × 1 |
| 17 | Kadakaküla 6 | 96:104 | Keskaeg | 19 | 5/0 | 1/0 | 1/0 | 256 | 1/0 | Puitvall × 1 |
| 21 | Kadakaküla 7 | 87:109 | Keskaeg | 19 | 5/0 | 1/0 | 0/0 | 0 | 1/0 | Puitvall × 1 |
| 26 | Kadakaküla 8 | 83:108 | Keskaeg | 16 | 4/0 | 1/0 | 0/0 | 0 | 1/0 | Madal kivivall × 1 |
| 30 | Kadakaküla 9 | 90:110 | Keskaeg | 18 | 6/0 | 1/0 | 0/0 | 0 | 1/0 | Puuduvad |
| 35 | Kadakaküla 10 | 85:101 | Keskaeg | 16 | 5/0 | 1/0 | 1/0 | 256 | 0/0 | Puuduvad |
| 37 | Kadakaküla 11 | 89:98 | Keskaeg | 10 | 3/0 | 1/0 | 0/0 | 0 | 1/0 | Puuduvad |
| 38 | Kadakaküla 12 | 82:104 | Keskaeg | 10 | 2/0 | 1/0 | 0/0 | 0 | 1/0 | Puuduvad |
| 2 | Idaküla 1 | 84:26 | Renessanss | 16 | 4/0 | 1/0 | 1/0 | 256 | 1/0 | Vahitorn × 1; Puitvall × 1 |
| 4 | Idaküla 2 | 81:25 | Renessanss | 16 | 4/0 | 1/0 | 1/0 | 256 | 1/0 | Vahitorn × 1; Puitvall × 1 |
| 5 | Idaküla 3 | 85:23 | Renessanss | 16 | 4/0 | 1/0 | 0/0 | 0 | 1/0 | Puitvall × 1; Vahitorn × 1 |
| 9 | Idaküla 4 | 88:26 | Renessanss | 22 | 6/0 | 1/0 | 0/0 | 0 | 1/0 | Vahitorn × 1; Puitvall × 1; Madal kivivall × 1 |
| 19 | Idaküla 5 | 91:23 | Renessanss | 13 | 4/0 | 1/0 | 0/0 | 0 | 0/0 | Puuduvad |
| 20 | Idaküla 6 | 91:19 | Renessanss | 19 | 5/0 | 1/0 | 0/0 | 0 | 1/0 | Puuduvad |
| 23 | Idaküla 7 | 86:19 | Renessanss | 21 | 7/0 | 1/0 | 0/0 | 0 | 0/0 | Puuduvad |
| 25 | Idaküla 8 | 92:26 | Renessanss | 16 | 4/0 | 1/0 | 0/0 | 0 | 1/0 | Puuduvad |
| 29 | Idaküla 9 | 90:29 | Renessanss | 21 | 7/0 | 1/0 | 1/0 | 256 | 1/0 | Puuduvad |
| 33 | Idaküla 10 | 88:22 | Renessanss | 18 | 6/0 | 1/0 | 0/0 | 0 | 0/0 | Puuduvad |
| 0 | Põhjaküla 1 | 192:113 | Keskaeg | 19 | 5/0 | 1/0 | 1/0 | 256 | 1/0 | Vahitorn × 1; Puitvall × 1 |
| 6 | Põhjaküla 2 | 195:112 | Keskaeg | 19 | 5/0 | 1/0 | 1/0 | 256 | 1/0 | Puitvall × 1 |
| 11 | Põhjaküla 3 | 188:113 | Keskaeg | 22 | 6/0 | 1/0 | 1/0 | 256 | 1/0 | Puitvall × 1 |
| 14 | Põhjaküla 4 | 185:112 | Keskaeg | 19 | 5/0 | 1/0 | 0/0 | 0 | 1/0 | Puitvall × 1 |
| 31 | Põhjaküla 5 | 182:110 | Keskaeg | 10 | 2/0 | 1/0 | 0/0 | 0 | 1/0 | Puuduvad |
| 32 | Põhjaküla 6 | 183:115 | Keskaeg | 16 | 5/0 | 0/0 | 0/0 | 0 | 0/0 | Puuduvad |
| 1 | Lõunaküla 1 | 134:82 | Renessanss | 19 | 5/0 | 1/0 | 1/0 | 256 | 1/0 | Puitvall × 1 |
| 8 | Lõunaküla 2 | 138:82 | Renessanss | 16 | 4/0 | 1/0 | 0/0 | 0 | 1/0 | Puuduvad |
| 12 | Lõunaküla 3 | 133:85 | Renessanss | 22 | 6/0 | 1/0 | 1/0 | 256 | 1/0 | Puitvall × 1 |
| 16 | Lõunaküla 4 | 137:85 | Renessanss | 22 | 6/0 | 1/0 | 0/0 | 0 | 1/0 | Puitvall × 1; Madal kivivall × 1 |
| 18 | Lõunaküla 5 | 141:81 | Renessanss | 22 | 6/0 | 1/0 | 1/0 | 256 | 1/0 | Puuduvad |
| 22 | Lõunaküla 6 | 134:89 | Renessanss | 19 | 5/0 | 1/0 | 0/0 | 0 | 1/0 | Puitvall × 1 |
| 24 | Lõunaküla 7 | 142:84 | Renessanss | 22 | 6/0 | 1/0 | 0/0 | 0 | 1/0 | Puuduvad |
| 27 | Lõunaküla 8 | 145:85 | Renessanss | 13 | 5/0 | 1/0 | 1/0 | 256 | 0/0 | Puuduvad |
| 28 | Lõunaküla 9 | 141:87 | Renessanss | 13 | 5/0 | 1/0 | 1/0 | 256 | 0/0 | Puuduvad |
| 34 | Lõunaküla 10 | 138:88 | Renessanss | 7 | 4/0 | 1/0 | 0/0 | 0 | 0/0 | Puuduvad |
| 36 | Lõunaküla 11 | 130:86 | Renessanss | 15 | 4/1 | 1/0 | 0/0 | 0 | 0/0 | Puuduvad |

Põllupind sisaldab märgitud põldude laiuse × sügavuse summat, ka pooleliolevaid põlde; see ei ole hektarite arv.

## Armeede täpne koosseis

### Kadaka — Keskaeg

- Armee 0, ruut 88:106: **5 salka / 5 meest**. Avastaja × 5.
- Müürigarnison ruudul 88:106, detail x,z = 6, -24: Avastaja, 1 meest; Puitvall.
- Müürigarnison ruudul 88:102, detail x,z = 0, -24: Avastaja, 1 meest; Puitvall.
- Müürigarnison ruudul 93:106, detail x,z = 0, -18: Avastaja, 1 meest; Puitvall.
- Vananenud väljaarmee salgud, mille järglane on juba avastatud: 0.
- Valmis aktiivseid torne: 4; reeglijärgne algkoosseis kuni 20 tornikaitsjat. Nende tegelikku individuaalset lahinguseisundit see katse ei mõõtnud.

### Ida — Renessanss

- Armee 0, ruut 84:26: **5 salka / 51 meest**. Avastaja × 3; Heiteodamees × 2.
- Armee 4, ruut 81:25: **1 salka / 24 meest**. Heiteodamees × 1.
- Müürigarnison ruudul 84:26, detail x,z = -18, -30: Avastaja, 1 meest; Puitvall.
- Müürigarnison ruudul 81:25, detail x,z = -30, -12: Heiteodamees, 24 meest; Puitvall.
- Vananenud väljaarmee salgud, mille järglane on juba avastatud: 3.
- Valmis aktiivseid torne: 4; reeglijärgne algkoosseis kuni 20 tornikaitsjat. Nende tegelikku individuaalset lahinguseisundit see katse ei mõõtnud.

### Põhja — Keskaeg

- Armee 0, ruut 192:113: **3 salka / 3 meest**. Avastaja × 3.
- Müürigarnison ruudul 192:113, detail x,z = 6, -12: Avastaja, 1 meest; Puitvall.
- Müürigarnison ruudul 195:112, detail x,z = -30, -6: Avastaja, 1 meest; Puitvall.
- Vananenud väljaarmee salgud, mille järglane on juba avastatud: 0.
- Valmis aktiivseid torne: 1; reeglijärgne algkoosseis kuni 5 tornikaitsjat. Nende tegelikku individuaalset lahinguseisundit see katse ei mõõtnud.

### Lõuna — Renessanss

- Armee 0, ruut 134:82: **3 salka / 3 meest**. Avastaja × 3.
- Püsivaid müürigarnisone ei olnud.
- Vananenud väljaarmee salgud, mille järglane on juba avastatud: 0.
- Valmis aktiivseid torne: 0; reeglijärgne algkoosseis kuni 0 tornikaitsjat. Nende tegelikku individuaalset lahinguseisundit see katse ei mõõtnud.

## Iga linna ehitised ja täpsed asukohad

### Kadakaküla 1 — ID 3, ruut 88:106

Keskaeg; 19 elanikku; majandusroll food. Ressursid: grain 38.14, meat 25.8, fish 0, water 100, iron 7.6, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 88:106 | linnaala | -18, -18 | valmis | 0 | Valmis |
| Kaev (well) | 88:106 | linnaala | -30, -18 | valmis | 1 | Toodab · 100% |
| Metsamaja (lumber) | 88:106 | linnaala | 6, 18 | valmis | 0 | Ladu täis: Puit |
| Elamu (house) | 88:106 | linnaala | -18, -30 | valmis | 0 | Valmis |
| Kivimurd (quarry) | 88:106 | linnaala | -18, 18 | valmis | 0 | Ladu täis: Kivi |
| Metsamaja (lumber) | 88:106 | linnaala | -30, -30 | valmis | 0 | Ladu täis: Puit |
| Põllutalu · farmerihoone (farm) | 88:106 | linnaala | -18, -6 | valmis | 4 | Hoburakend ja hõlmader |
| Põld · lohista ala (field) | 88:106 | linnaala | -76, -60 | valmis | 0 | 16 × 16 |
| Elamu (house) | 88:106 | linnaala | -6, -18 | valmis | 0 | Valmis |
| Jahimehe onn (hunter) | 88:106 | linnaala | -42, -30 | valmis | 2 | Ladu täis: Liha |
| Õpikoda (study) | 88:106 | linnaala | -30, -6 | valmis | 1 | Õpetlased uurivad |
| Savivõtukoht (claypit) | 88:106 | linnaala | -9, 36 | valmis | 0 | Ladu täis: Savi |
| Pottsepatöökoda (pottery_kiln) | 88:106 | linnaala | -6, -30 | valmis | 2 | Ladu täis: Keraamika |
| Puusepatöökoda (saw) | 88:106 | linnaala | -6, -6 | valmis | 0 | Ladu täis: Lauad |
| Köögiviljaaed (vegetable_garden) | 88:106 | linnaala | -42, -18 | valmis | 1 | Ladu täis: Köögiviljad |
| Kiviraiduri töökoda (mason) | 88:106 | linnaala | -18, -42 | valmis | 0 | Ladu täis: Tahutud kivi |
| Loomafarm (pasture) | 88:106 | linnaala | -18, 6 | valmis | 2 | Ladu täis: Liha |
| Elamu (house) | 88:106 | linnaala | 6, -18 | valmis | 0 | Valmis |
| Sõdalaste laager (barracks) | 88:106 | linnaala | -42, -6 | valmis | 0 | Valmis |
| Vahitorn (watchtower) | 88:106 | linnaala | -30, -42 | valmis | 1 | Valmis |
| Puitvall (palisade) | 88:106 | linnaala | 6, -24 | valmis | 0 | Valmis |
| Vibuküttide harjutusplats (archery) | 88:106 | linnaala | -30, 6 | valmis | 0 | Valmis |
| Vankritöökoda (cartwright) | 88:106 | linnaala | -6, -42 | valmis | 2 | Toodab · 100% |
| Elamu (house) | 88:106 | linnaala | -6, 6 | valmis | 0 | Valmis |
| Metsniku maja (forester) | 88:106 | linnaala | 6, -6 | valmis | 2 | Otsib istutuskohta |
| Madal kivivall (stonewall) | 88:106 | linnaala | 6, -30 | valmis | 0 | Valmis |
| Elamu (house) | 88:106 | linnaala | 6, -36 | valmis | 0 | Valmis |

### Kadakaküla 2 — ID 7, ruut 93:106

Keskaeg; 19 elanikku; majandusroll energy. Ressursid: grain 9.87, meat 59.4, fish 0, water 93.2, iron 1.9, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 93:106 | linnaala | -18, -12 | valmis | 0 | Valmis |
| Kaev (well) | 93:106 | linnaala | -30, -12 | valmis | 1 | Toodab · 100% |
| Metsamaja (lumber) | 93:106 | linnaala | -54, -24 | valmis | 0 | Ladu täis: Puit |
| Jahimehe onn (hunter) | 93:106 | linnaala | -12, 0 | valmis | 2 | Toob saaki |
| Õpikoda (study) | 93:106 | linnaala | -18, -24 | valmis | 1 | Õpetlased uurivad |
| Elamu (house) | 93:106 | linnaala | -6, -12 | valmis | 0 | Valmis |
| Põllutalu · farmerihoone (farm) | 93:106 | linnaala | -30, -24 | valmis | 4 | Ladu täis: Vili |
| Elamu (house) | 93:106 | linnaala | -6, -24 | valmis | 0 | Valmis |
| Savivõtukoht (claypit) | 93:106 | linnaala | -27, 0 | valmis | 0 | Ladu täis: Savi |
| Pottsepatöökoda (pottery_kiln) | 93:106 | linnaala | 0, 0 | valmis | 2 | Toodab · 100% |
| Puusepatöökoda (saw) | 93:106 | linnaala | -42, -12 | valmis | 0 | Ladu täis: Lauad |
| Vasekaevandus (coppermine) | 93:106 | linnaala | -18, -45 | valmis | 0 | Ladu täis: Vask |
| Tinakaevandus (tinmine) | 93:106 | linnaala | -9, 45 | valmis | 0 | Ladu täis: Tina |
| Loomafarm (pasture) | 93:106 | linnaala | -18, 12 | valmis | 2 | Ladu täis: Liha |
| Elamu (house) | 93:106 | linnaala | 6, -12 | valmis | 0 | Valmis |
| Puitvall (palisade) | 93:106 | linnaala | 0, -18 | valmis | 0 | Valmis |
| Elamu (house) | 93:106 | linnaala | -42, -24 | valmis | 0 | Valmis |
| Vankritöökoda (cartwright) | 93:106 | linnaala | -30, -36 | valmis | 1.75 | Toodab · 89% |
| Kangakoda (weaver) | 93:106 | linnaala | -42, 0 | valmis | 0.25 | Toodab · 31% |
| Metsniku maja (forester) | 93:106 | linnaala | -30, 12 | valmis | 2 | Otsib istutuskohta |
| Materjaliladu (warehouse) | 93:106 | linnaala | -6, -36 | valmis | 1 | Valmis |
| Kirjutuskoda (scriptorium) | 93:106 | linnaala | -6, 12 | valmis | 2 | Õpetlased uurivad |
| Elamu (house) | 93:106 | linnaala | 6, -24 | valmis | 0 | Valmis |

### Kadakaküla 3 — ID 10, ruut 88:102

Keskaeg; 19 elanikku; majandusroll industry. Ressursid: grain 9.39, meat 213.5, fish 0, water 30.55, iron 0, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 88:102 | linnaala | -18, -18 | valmis | 0 | Valmis |
| Metsamaja (lumber) | 88:102 | linnaala | -30, 24 | valmis | 0 | Ladu täis: Puit |
| Jahimehe onn (hunter) | 88:102 | linnaala | -42, -42 | valmis | 2 | Jahib ulukeid |
| Elamu (house) | 88:102 | linnaala | -30, -18 | valmis | 0 | Valmis |
| Kivimurd (quarry) | 88:102 | linnaala | 18, -18 | valmis | 0 | Ladu täis: Kivi |
| Õpikoda (study) | 88:102 | linnaala | -18, -30 | valmis | 1 | Õpetlased uurivad |
| Põllutalu · farmerihoone (farm) | 88:102 | linnaala | -18, -6 | valmis | 4 | Ladu täis: Vili |
| Elamu (house) | 88:102 | linnaala | -6, -18 | valmis | 0 | Valmis |
| Puusepatöökoda (saw) | 88:102 | linnaala | -30, -30 | valmis | 0 | Ladu täis: Lauad |
| Kiviraiduri töökoda (mason) | 88:102 | linnaala | -30, -6 | valmis | 0.25 | Toodab · 17% |
| Elamu (house) | 88:102 | linnaala | -6, -30 | valmis | 0 | Valmis |
| Loomafarm (pasture) | 88:102 | linnaala | -6, -6 | valmis | 0.25 | Toodab · 17% |
| Elamu (house) | 88:102 | linnaala | -42, -18 | valmis | 0 | Valmis |
| Sõdalaste laager (barracks) | 88:102 | linnaala | -18, -42 | valmis | 0 | Valmis |
| Vahitorn (watchtower) | 88:102 | linnaala | -18, 6 | valmis | 0.25 | Valmis |
| Puitvall (palisade) | 88:102 | linnaala | 0, -24 | valmis | 0 | Valmis |
| Vibuküttide harjutusplats (archery) | 88:102 | linnaala | 6, -12 | valmis | 0 | Valmis |
| Madal kivivall (stonewall) | 88:102 | linnaala | -6, -36 | valmis | 0 | Valmis |
| Kangakoda (weaver) | 88:102 | linnaala | -42, -30 | valmis | 0 | Ootab: Lina |
| Elamu (house) | 88:102 | linnaala | -42, -6 | valmis | 0 | Valmis |
| Metsniku maja (forester) | 88:102 | linnaala | -30, -42 | valmis | 2 | Otsib istutuskohta |
| Materjaliladu (warehouse) | 88:102 | linnaala | -30, 6 | valmis | 1 | Valmis |
| Toidukelder (cellar) | 88:102 | linnaala | -6, 6 | valmis | 0 | Valmis |
| Kirjutuskoda (scriptorium) | 88:102 | linnaala | 6, -36 | valmis | 2 | Õpetlased uurivad |
| Kivist kaitsetorn (stonetower) | 88:102 | linnaala | 6, 0 | valmis | 0.25 | Valmis |
| Turg (market) | 88:102 | linnaala | -6, -48 | valmis | 2 | Valmis |
| Jahimehe onn (hunter) | 88:102 | linnaala | 24, 6 | valmis | 2 | Jahib ulukeid |
| Jahimehe onn (hunter) | 88:102 | linnaala | 24, -30 | valmis | 2 | Jahib ulukeid |
| Rauakaevandus (mine) | 88:102 | linnaala | 18, 18 | valmis | 0 | Ladu täis: Maak |

### Kadakaküla 4 — ID 13, ruut 85:105

Keskaeg; 22 elanikku; majandusroll industry. Ressursid: grain 9.34, meat 35.7, fish 0, water 100, iron 0, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 85:105 | linnaala | -18, -18 | valmis | 0 | Valmis |
| Kaev (well) | 85:105 | linnaala | -30, -18 | valmis | 0 | Ladu täis: Vesi |
| Metsamaja (lumber) | 85:105 | linnaala | -60, -18 | valmis | 0 | Ladu täis: Puit |
| Põllutalu · farmerihoone (farm) | 85:105 | linnaala | -18, -30 | valmis | 4 | Ootab eraldi rajatud põldu samal ruudul |
| Kivimurd (quarry) | 85:105 | linnaala | 18, 18 | valmis | 0 | Ladu täis: Kivi |
| Õpikoda (study) | 85:105 | linnaala | -18, -6 | valmis | 1 | Õpetlased uurivad |
| Elamu (house) | 85:105 | linnaala | -6, -18 | valmis | 0 | Valmis |
| Elamu (house) | 85:105 | linnaala | -30, -30 | valmis | 0 | Valmis |
| Puusepatöökoda (saw) | 85:105 | linnaala | -30, -6 | valmis | 0 | Ladu täis: Lauad |
| Vasekaevandus (coppermine) | 85:105 | linnaala | 9, -36 | valmis | 0 | Ladu täis: Vask |
| Tinakaevandus (tinmine) | 85:105 | linnaala | 0, 27 | valmis | 0 | Ladu täis: Tina |
| Kiviraiduri töökoda (mason) | 85:105 | linnaala | -6, -30 | valmis | 0 | Ladu täis: Tahutud kivi |
| Elamu (house) | 85:105 | linnaala | -6, -6 | valmis | 0 | Valmis |
| Loomafarm (pasture) | 85:105 | linnaala | -42, -18 | valmis | 2 | Toodab · 100% |
| Elamu (house) | 85:105 | linnaala | -18, -42 | valmis | 0 | Valmis |
| Sõdalaste laager (barracks) | 85:105 | linnaala | -18, 6 | valmis | 0 | Valmis |
| Vahitorn (watchtower) | 85:105 | linnaala | 6, -18 | valmis | 1 | Valmis |
| Puitvall (palisade) | 85:105 | linnaala | -30, -36 | valmis | 0 | Valmis |
| Vibuküttide harjutusplats (archery) | 85:105 | linnaala | -42, -30 | valmis | 0 | Valmis |
| Kangakoda (weaver) | 85:105 | linnaala | -42, -6 | valmis | 0 | Ootab: Lina |
| Metsniku maja (forester) | 85:105 | linnaala | -30, 6 | valmis | 2 | Otsib istutuskohta |
| Elamu (house) | 85:105 | linnaala | -30, -42 | valmis | 0 | Valmis |
| Materjaliladu (warehouse) | 85:105 | linnaala | -6, -42 | valmis | 1 | Valmis |
| Madal kivivall (stonewall) | 85:105 | linnaala | 0, 0 | valmis | 0 | Valmis |
| Toidukelder (cellar) | 85:105 | linnaala | -6, 12 | valmis | 0 | Valmis |
| Elamu (house) | 85:105 | linnaala | 6, -6 | valmis | 0 | Valmis |
| Rauakaevandus (mine) | 85:105 | linnaala | 18, -18 | valmis | 0 | Ladu täis: Maak |

### Kadakaküla 5 — ID 15, ruut 93:102

Keskaeg; 22 elanikku; majandusroll energy. Ressursid: grain 5.52, meat 148.3, fish 0, water 37.1, iron 0, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 93:102 | linnaala | -18, -18 | valmis | 0 | Valmis |
| Metsamaja (lumber) | 93:102 | linnaala | 18, -30 | valmis | 0 | Ladu täis: Puit |
| Jahimehe onn (hunter) | 93:102 | linnaala | 6, -24 | valmis | 2 | Läheb jahile |
| Elamu (house) | 93:102 | linnaala | -30, -18 | valmis | 0 | Valmis |
| Õpikoda (study) | 93:102 | linnaala | -18, -30 | valmis | 1 | Õpetlased uurivad |
| Põllutalu · farmerihoone (farm) | 93:102 | linnaala | -18, -6 | valmis | 4 | Ootab eraldi rajatud põldu samal ruudul |
| Elamu (house) | 93:102 | linnaala | -6, -18 | valmis | 0 | Valmis |
| Puusepatöökoda (saw) | 93:102 | linnaala | -30, -30 | valmis | 0 | Ladu täis: Lauad |
| Kangakoda (weaver) | 93:102 | linnaala | -30, -6 | valmis | 0 | Ootab: Lina |
| Elamu (house) | 93:102 | linnaala | -6, -30 | valmis | 0 | Valmis |
| Loomafarm (pasture) | 93:102 | linnaala | -6, -6 | valmis | 2 | Toodab · 100% |
| Elamu (house) | 93:102 | linnaala | -42, -18 | valmis | 0 | Valmis |
| Puitvall (palisade) | 93:102 | linnaala | -6, -36 | valmis | 0 | Valmis |
| Metsniku maja (forester) | 93:102 | linnaala | -18, -42 | valmis | 2 | Otsib istutuskohta |
| Elamu (house) | 93:102 | linnaala | -18, 6 | valmis | 0 | Valmis |
| Materjaliladu (warehouse) | 93:102 | linnaala | 6, -12 | valmis | 1 | Valmis |
| Toidukelder (cellar) | 93:102 | linnaala | -42, -30 | valmis | 0 | Valmis |
| Kirjutuskoda (scriptorium) | 93:102 | linnaala | -42, -6 | valmis | 2 | Õpetlased uurivad |
| Turg (market) | 93:102 | linnaala | -30, -42 | valmis | 2 | Valmis |
| Käsiveski (mill) | 93:102 | linnaala | -30, 6 | valmis | 0 | Ootab: Vili |
| Elamu (house) | 93:102 | linnaala | -6, -42 | valmis | 0 | Valmis |
| Söepõletaja (coal) | 93:102 | linnaala | 0, 6 | valmis | 0 | Ladu täis: Süsi |
| Juveliir (jeweler) | 93:102 | linnaala | 6, -36 | valmis | 0 | Ootab: Vääriskivid |

### Kadakaküla 6 — ID 17, ruut 96:104

Keskaeg; 19 elanikku; majandusroll energy. Ressursid: grain 9.02, meat 91.7, fish 0, water 98.2, iron 2.85, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 96:104 | linnaala | -18, -18 | valmis | 0 | Valmis |
| Kaev (well) | 96:104 | linnaala | -30, -18 | valmis | 0 | Ladu täis: Vesi |
| Metsamaja (lumber) | 96:104 | linnaala | -66, -30 | valmis | 0 | Ladu täis: Puit |
| Jahimehe onn (hunter) | 96:104 | linnaala | 12, -42 | valmis | 2 | Ladu täis: Liha |
| Elamu (house) | 96:104 | linnaala | -18, -30 | valmis | 0 | Valmis |
| Õpikoda (study) | 96:104 | linnaala | -18, -6 | valmis | 1 | Õpetlased uurivad |
| Põllutalu · farmerihoone (farm) | 96:104 | linnaala | -6, -18 | valmis | 4 | Hoburakend ja hõlmader |
| Põld · lohista ala (field) | 96:104 | linnaala | -76, -60 | valmis | 0 | 16 × 16 |
| Puusepatöökoda (saw) | 96:104 | linnaala | -30, -30 | valmis | 0 | Ladu täis: Lauad |
| Elamu (house) | 96:104 | linnaala | -30, -6 | valmis | 0 | Valmis |
| Köögiviljaaed (vegetable_garden) | 96:104 | linnaala | -6, -6 | valmis | 1 | Ladu täis: Köögiviljad |
| Kangakoda (weaver) | 96:104 | linnaala | -6, -36 | valmis | 0 | Ootab: Lina |
| Loomafarm (pasture) | 96:104 | linnaala | -42, -18 | valmis | 2 | Ladu täis: Liha |
| Metsamaja (lumber) | 96:104 | linnaala | 30, -54 | valmis | 0 | Ladu täis: Puit |
| Elamu (house) | 96:104 | linnaala | -18, -42 | valmis | 0 | Valmis |
| Puitvall (palisade) | 96:104 | linnaala | -30, -12 | valmis | 0 | Valmis |
| Elamu (house) | 96:104 | linnaala | -18, 6 | valmis | 0 | Valmis |
| Metsniku maja (forester) | 96:104 | linnaala | 6, -18 | valmis | 2 | Naaseb istutamast |
| Materjaliladu (warehouse) | 96:104 | linnaala | -42, -30 | valmis | 1 | Valmis |
| Toidukelder (cellar) | 96:104 | linnaala | -42, -6 | valmis | 0 | Valmis |
| Kirjutuskoda (scriptorium) | 96:104 | linnaala | -30, -42 | valmis | 2 | Õpetlased uurivad |
| Turg (market) | 96:104 | linnaala | -30, 6 | valmis | 2 | Valmis |
| Käsiveski (mill) | 96:104 | linnaala | -6, 6 | valmis | 0 | Ootab: Vili |
| Elamu (house) | 96:104 | linnaala | 6, -30 | valmis | 0 | Valmis |
| Pagariäri (bakery) | 96:104 | linnaala | 6, -6 | valmis | 0 | Ootab: Jahu |
| Söepõletaja (coal) | 96:104 | linnaala | -6, -48 | valmis | 0 | Ladu täis: Süsi |

### Kadakaküla 7 — ID 21, ruut 87:109

Keskaeg; 19 elanikku; majandusroll energy. Ressursid: grain 9.85, meat 72.25, fish 0, water 100, iron 0, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 87:109 | linnaala | -18, -12 | valmis | 0 | Valmis |
| Kaev (well) | 87:109 | linnaala | -30, -12 | valmis | 0 | Ladu täis: Vesi |
| Metsamaja (lumber) | 87:109 | linnaala | 6, 30 | valmis | 0 | Ladu täis: Puit |
| Jahimehe onn (hunter) | 87:109 | linnaala | -24, 0 | valmis | 2 | Ladu täis: Liha |
| Õpikoda (study) | 87:109 | linnaala | -18, -24 | valmis | 1 | Õpetlased uurivad |
| Elamu (house) | 87:109 | linnaala | -6, -12 | valmis | 0 | Valmis |
| Põllutalu · farmerihoone (farm) | 87:109 | linnaala | -12, 0 | valmis | 4 | Ladu täis: Vili |
| Puusepatöökoda (saw) | 87:109 | linnaala | -30, -24 | valmis | 0 | Ladu täis: Lauad |
| Kangakoda (weaver) | 87:109 | linnaala | -6, -24 | valmis | 0 | Ootab: Lina |
| Savivõtukoht (claypit) | 87:109 | linnaala | -36, 18 | valmis | 0 | Ladu täis: Savi |
| Jahimehe onn (hunter) | 87:109 | linnaala | -18, 12 | valmis | 2 | Ladu täis: Liha |
| Elamu (house) | 87:109 | linnaala | -36, 0 | valmis | 0 | Valmis |
| Pottsepatöökoda (pottery_kiln) | 87:109 | linnaala | 0, 0 | valmis | 2 | Toodab · 100% |
| Loomafarm (pasture) | 87:109 | linnaala | -42, -12 | valmis | 2 | Ladu täis: Liha |
| Vasekaevandus (coppermine) | 87:109 | linnaala | 0, -36 | valmis | 0 | Ladu täis: Vask |
| Tinakaevandus (tinmine) | 87:109 | linnaala | -18, -36 | valmis | 2.75 | Kaevandab |
| Elamu (house) | 87:109 | linnaala | 6, -12 | valmis | 0 | Valmis |
| Puitvall (palisade) | 87:109 | linnaala | 6, -18 | valmis | 0 | Valmis |
| Vankritöökoda (cartwright) | 87:109 | linnaala | -42, -24 | valmis | 0.25 | Toodab · 17% |
| Metsniku maja (forester) | 87:109 | linnaala | -30, -36 | valmis | 2 | Naaseb istutamast |
| Elamu (house) | 87:109 | linnaala | -6, 12 | valmis | 0 | Valmis |
| Materjaliladu (warehouse) | 87:109 | linnaala | -48, 0 | valmis | 1 | Valmis |
| Elamu (house) | 87:109 | linnaala | 6, -24 | valmis | 0 | Valmis |

### Kadakaküla 8 — ID 26, ruut 83:108

Keskaeg; 16 elanikku; majandusroll food. Ressursid: grain 3.17, meat 241, fish 0, water 24.05, iron 0, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 83:108 | linnaala | -18, -18 | valmis | 0 | Valmis |
| Metsamaja (lumber) | 83:108 | linnaala | 0, -30 | valmis | 2 | Toob saaki |
| Jahimehe onn (hunter) | 83:108 | linnaala | 30, 24 | valmis | 2 | Jahib ulukeid |
| Kivimurd (quarry) | 83:108 | linnaala | 18, 18 | valmis | 0 | Ladu täis: Kivi |
| Elamu (house) | 83:108 | linnaala | -30, -18 | valmis | 0 | Valmis |
| Puusepatöökoda (saw) | 83:108 | linnaala | -18, -30 | valmis | 0 | Ladu täis: Lauad |
| Õpikoda (study) | 83:108 | linnaala | -6, -18 | valmis | 1 | Õpetlased uurivad |
| Sõdalaste laager (barracks) | 83:108 | linnaala | -18, -6 | valmis | 0 | Valmis |
| Põllutalu · farmerihoone (farm) | 83:108 | linnaala | -30, -30 | valmis | 4 | Ladu täis: Vili |
| Loomafarm (pasture) | 83:108 | linnaala | -30, -6 | valmis | 0.25 | Toodab · 17% |
| Linapõld (flax_farm) | 83:108 | linnaala | -6, -6 | valmis | 0.25 | Toodab · 31% |
| Elamu (house) | 83:108 | linnaala | -42, -18 | valmis | 0 | Valmis |
| Metsniku maja (forester) | 83:108 | linnaala | -18, -42 | valmis | 0.75 | Naaseb istutamast |
| Kangakoda (weaver) | 83:108 | linnaala | -18, 6 | valmis | 0.25 | Toodab · 31% |
| Vibuküttide harjutusplats (archery) | 83:108 | linnaala | 6, -18 | valmis | 0 | Valmis |
| Jahimehe onn (hunter) | 83:108 | linnaala | -6, 18 | valmis | 2 | Läheb jahile |
| Kirjutuskoda (scriptorium) | 83:108 | linnaala | -42, -30 | valmis | 0.25 | Õpetlased uurivad |
| Käsiveski (mill) | 83:108 | linnaala | -42, -6 | valmis | 0 | Ootab: Vili |
| Elamu (house) | 83:108 | linnaala | -30, -42 | valmis | 0 | Valmis |
| Kiviraiduri töökoda (mason) | 83:108 | linnaala | -30, 6 | valmis | 0.25 | Toodab · 17% |
| Materjaliladu (warehouse) | 83:108 | linnaala | -6, -42 | valmis | 1 | Valmis |
| Toidukelder (cellar) | 83:108 | linnaala | -6, 6 | valmis | 0 | Valmis |
| Elamu (house) | 83:108 | linnaala | 6, -6 | valmis | 0 | Valmis |
| Söepõletaja (coal) | 83:108 | linnaala | 12, -30 | valmis | 0 | Ladu täis: Süsi |
| Madal kivivall (stonewall) | 83:108 | linnaala | -30, -48 | valmis | 0 | Valmis |
| Jahimehe onn (hunter) | 83:108 | linnaala | 6, 24 | valmis | 2 | Toob saaki |

### Kadakaküla 9 — ID 30, ruut 90:110

Keskaeg; 18 elanikku; majandusroll energy. Ressursid: grain 4.25, meat 27.4, fish 0, water 100, iron 0, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 90:110 | linnaala | -18, -18 | valmis | 0 | Valmis |
| Kaev (well) | 90:110 | linnaala | -30, -18 | valmis | 1 | Toodab · 100% |
| Metsamaja (lumber) | 90:110 | linnaala | 30, -18 | valmis | 0 | Ladu täis: Puit |
| Elamu (house) | 90:110 | linnaala | -18, -30 | valmis | 0 | Valmis |
| Kirjutuskoda (scriptorium) | 90:110 | linnaala | -18, -6 | valmis | 2 | Õpetlased uurivad |
| Põllutalu · farmerihoone (farm) | 90:110 | linnaala | -6, -18 | valmis | 4 | Ladu täis: Vili |
| Elamu (house) | 90:110 | linnaala | -30, -30 | valmis | 0 | Valmis |
| Puusepatöökoda (saw) | 90:110 | linnaala | -30, -6 | valmis | 0 | Ladu täis: Lauad |
| Loomafarm (pasture) | 90:110 | linnaala | -6, -30 | valmis | 2 | Toodab · 100% |
| Söepõletaja (coal) | 90:110 | linnaala | -6, 0 | valmis | 0 | Ladu täis: Süsi |
| Käsiveski (mill) | 90:110 | linnaala | -42, -18 | valmis | 0 | Ootab: Vili |
| Elamu (house) | 90:110 | linnaala | -18, -42 | valmis | 0 | Valmis |
| Elamu (house) | 90:110 | linnaala | -18, 6 | valmis | 0 | Valmis |
| Elamu (house) | 90:110 | linnaala | 6, -18 | valmis | 0 | Valmis |
| Elamu (house) | 90:110 | linnaala | -42, -30 | valmis | 0 | Valmis |

### Kadakaküla 10 — ID 35, ruut 85:101

Keskaeg; 16 elanikku; majandusroll energy. Ressursid: grain 19.16, meat 20.8, fish 0, water 16.8, iron 8.2, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 85:101 | linnaala | -18, -12 | valmis | 0 | Valmis |
| Metsamaja (lumber) | 85:101 | linnaala | -30, -30 | valmis | 2 | Raiub puud |
| Jahimehe onn (hunter) | 85:101 | linnaala | -48, 18 | valmis | 2 | Jahib ulukeid |
| Elamu (house) | 85:101 | linnaala | -30, -12 | valmis | 0 | Valmis |
| Puusepatöökoda (saw) | 85:101 | linnaala | -18, -24 | valmis | 0 | Ladu täis: Lauad |
| Kirjutuskoda (scriptorium) | 85:101 | linnaala | -18, 0 | valmis | 1 | Õpetlased uurivad |
| Jahimehe onn (hunter) | 85:101 | linnaala | 30, 0 | valmis | 2 | Jahib ulukeid |
| Põllutalu · farmerihoone (farm) | 85:101 | linnaala | -6, -12 | valmis | 4 | Hoburakend ja hõlmader |
| Söepõletaja (coal) | 85:101 | linnaala | -30, 0 | valmis | 0 | Ladu täis: Süsi |
| Põld · lohista ala (field) | 85:101 | linnaala | -76, -60 | valmis | 0 | 16 × 16 |
| Jahimehe onn (hunter) | 85:101 | linnaala | -48, 6 | valmis | 2 | Toob saaki |
| Elamu (house) | 85:101 | linnaala | -6, -24 | valmis | 0 | Valmis |
| Elamu (house) | 85:101 | linnaala | -6, 0 | valmis | 0 | Valmis |
| Elamu (house) | 85:101 | linnaala | -42, -12 | valmis | 0 | Valmis |
| Elamu (house) | 85:101 | linnaala | -18, 12 | valmis | 0 | Valmis |
| Rauasulatus (smelter) | 85:101 | linnaala | 6, -12 | valmis | 3 | Toodab · 100% |

### Kadakaküla 11 — ID 37, ruut 89:98

Keskaeg; 10 elanikku; majandusroll energy. Ressursid: grain 0, meat 10.2, fish 0, water 95.5, iron 8.2, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 89:98 | linnaala | -18, -18 | valmis | 0 | Valmis |
| Kaev (well) | 89:98 | linnaala | -30, -18 | valmis | 1 | Toodab · 100% |
| Metsamaja (lumber) | 89:98 | linnaala | -66, -30 | valmis | 0 | Ladu täis: Puit |
| Põllutalu · farmerihoone (farm) | 89:98 | linnaala | -18, -30 | valmis | 4 | Ootab eraldi rajatud põldu samal ruudul |
| Elamu (house) | 89:98 | linnaala | -18, -6 | valmis | 0 | Valmis |
| Kivimurd (quarry) | 89:98 | linnaala | 18, 18 | valmis | 0 | Ladu täis: Kivi |
| Puusepatöökoda (saw) | 89:98 | linnaala | -6, -18 | valmis | 3 | Toodab · 100% |
| Söepõletaja (coal) | 89:98 | linnaala | -30, -30 | valmis | 0.5 | Toodab · 31% |
| Rauakaevandus (mine) | 89:98 | linnaala | 8.63532669700362, -6.698219426252763 | valmis | 0 | Ladu täis: Maak |
| Rauasulatus (smelter) | 89:98 | linnaala | -30, -6 | valmis | 0.25 | Toodab · 12% |
| Käsiveski (mill) | 89:98 | linnaala | -6, -30 | valmis | 0 | Ootab: Vili |
| Metsniku maja (forester) | 89:98 | linnaala | -6, -6 | valmis | 0.25 | Otsib istutuskohta |
| Pagariäri (bakery) | 89:98 | linnaala | -18, -42 | valmis | 0 | Ootab: Jahu |
| Sõdalaste laager (barracks) | 89:98 | linnaala | -18, 6 | valmis | 0 | Valmis |
| Viljapuuaed (orchard) | 89:98 | linnaala | -42, -24 | valmis | 0.25 | Toodab · 31% |
| Elamu (house) | 89:98 | linnaala | 6, -18 | valmis | 0 | Valmis |
| Juustukoda (dairy) | 89:98 | linnaala | -42, -12 | valmis | 0 | Ootab: Vili |
| Kangakoda (weaver) | 89:98 | linnaala | -30, -42 | valmis | 0 | Ootab: Lina |
| Juveliir (jeweler) | 89:98 | linnaala | -6, -42 | valmis | 0 | Ootab: Vääriskivid |
| Siidikudumiskoda (silk_weaver) | 89:98 | linnaala | -6, 6 | valmis | 0 | Ootab: Siid |
| Tall (stable) | 89:98 | linnaala | 6, -30 | valmis | 0 | Valmis |
| Loomafarm (pasture) | 89:98 | linnaala | -30, 6 | valmis | 0.25 | Toodab · 17% |
| Kiviraiduri töökoda (mason) | 89:98 | linnaala | -42, -36 | valmis | 0.25 | Toodab · 17% |
| Tinakaevandus (tinmine) | 89:98 | linnaala | 27, -9 | valmis | 0.25 | Kaevandab |
| Elamu (house) | 89:98 | linnaala | -42, 0 | valmis | 0 | Valmis |

### Kadakaküla 12 — ID 38, ruut 82:104

Keskaeg; 10 elanikku; majandusroll industry. Ressursid: grain 0, meat 51.95, fish 0, water 14.7, iron 8.4, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 82:104 | linnaala | -18, -12 | valmis | 0 | Valmis |
| Metsamaja (lumber) | 82:104 | linnaala | 24, -54 | valmis | 2 | Raiub puud |
| Jahimehe onn (hunter) | 82:104 | linnaala | -48, -12 | valmis | 2 | Läheb jahile |
| Kivimurd (quarry) | 82:104 | linnaala | 18, -18 | valmis | 3 | Kaevandab |
| Elamu (house) | 82:104 | linnaala | -30, -12 | valmis | 0 | Valmis |
| Puusepatöökoda (saw) | 82:104 | linnaala | -18, -24 | valmis | 0.25 | Toodab · 12% |
| Söepõletaja (coal) | 82:104 | linnaala | -6, -12 | valmis | 0.25 | Toodab · 17% |
| Rauasulatus (smelter) | 82:104 | linnaala | -24, 0 | valmis | 0.25 | Toodab · 12% |
| Metsniku maja (forester) | 82:104 | linnaala | -12, 0 | valmis | 0.25 | Naaseb istutamast |
| Põllutalu · farmerihoone (farm) | 82:104 | linnaala | -30, -24 | valmis | 0.25 | Ootab eraldi rajatud põldu samal ruudul |
| Käsiveski (mill) | 82:104 | linnaala | -6, -24 | valmis | 0 | Ootab: Vili |
| Sõdalaste laager (barracks) | 82:104 | linnaala | -36, 0 | valmis | 0 | Valmis |
| Elamu (house) | 82:104 | linnaala | 0, 0 | valmis | 0 | Valmis |
| Juustukoda (dairy) | 82:104 | linnaala | -18, -36 | valmis | 0 | Ootab: Vili |
| Kangakoda (weaver) | 82:104 | linnaala | -18, 12 | valmis | 0 | Ootab: Lina |
| Juveliir (jeweler) | 82:104 | linnaala | 6, -12 | valmis | 0 | Ootab: Vääriskivid |
| Vibuküttide harjutusplats (archery) | 82:104 | linnaala | -42, -24 | valmis | 0 | Valmis |
| Siidikudumiskoda (silk_weaver) | 82:104 | linnaala | -30, -36 | valmis | 0 | Ootab: Siid |
| Loomafarm (pasture) | 82:104 | linnaala | -30, 12 | valmis | 0.25 | Toodab · 17% |
| Kiviraiduri töökoda (mason) | 82:104 | linnaala | -6, -36 | valmis | 0.25 | Toodab · 17% |
| Materjaliladu (warehouse) | 82:104 | linnaala | 6, -24 | valmis | 0.25 | Valmis |
| Toidukelder (cellar) | 82:104 | linnaala | 0, 12 | ehitamisel | 1 | Ehitab · 100% tööjõud |
| Turg (market) | 82:104 | linnaala | -48, 0 | ehitamisel | 0 | Ootab tööjõudu |

### Idaküla 1 — ID 2, ruut 84:26

Renessanss; 16 elanikku; majandusroll food. Ressursid: grain 19.94, meat 94.55, fish 0, water 100, iron 0, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 84:26 | linnaala | -18, -12 | valmis | 0 | Valmis |
| Kaev (well) | 84:26 | linnaala | -30, -12 | valmis | 0 | Ladu täis: Vesi |
| Metsamaja (lumber) | 84:26 | linnaala | -12, -42 | valmis | 2 | Läheb metsa |
| Elamu (house) | 84:26 | linnaala | -18, -24 | valmis | 0 | Valmis |
| Elamu (house) | 84:26 | linnaala | -18, 0 | valmis | 0 | Valmis |
| Jahimehe onn (hunter) | 84:26 | linnaala | 6, 18 | valmis | 2 | Jahib ulukeid |
| Õpikoda (study) | 84:26 | linnaala | -6, -12 | valmis | 1 | Õpetlased uurivad |
| Puusepatöökoda (saw) | 84:26 | linnaala | -30, -24 | valmis | 3 | Toodab · 100% |
| Kangakoda (weaver) | 84:26 | linnaala | -30, 0 | valmis | 0 | Ootab tööjõudu |
| Kiviraiduri töökoda (mason) | 84:26 | linnaala | -6, -24 | valmis | 0 | Ootab tööjõudu |
| Elamu (house) | 84:26 | linnaala | -6, 0 | valmis | 0 | Valmis |
| Loomafarm (pasture) | 84:26 | linnaala | -42, -12 | valmis | 0 | Ootab tööjõudu |
| Vahitorn (watchtower) | 84:26 | linnaala | -18, 12 | valmis | 1 | Valmis |
| Puitvall (palisade) | 84:26 | linnaala | -18, -30 | valmis | 0 | Valmis |
| Elamu (house) | 84:26 | linnaala | 6, -12 | valmis | 0 | Valmis |
| Metsniku maja (forester) | 84:26 | linnaala | -42, -24 | valmis | 0 | Ootab tööjõudu |
| Materjaliladu (warehouse) | 84:26 | linnaala | -42, 0 | valmis | 0 | Ootab tööjõudu |
| Metsamaja (lumber) | 84:26 | linnaala | -30, 18 | valmis | 2 | Toob saaki |
| Kirjutuskoda (scriptorium) | 84:26 | linnaala | -30, -36 | valmis | 0 | Ootab tööjõudu |
| Toidukelder (cellar) | 84:26 | linnaala | -6, 12 | valmis | 0 | Valmis |
| Käsiveski (mill) | 84:26 | linnaala | 6, -24 | valmis | 1 | Toodab · 55% |
| Turg (market) | 84:26 | linnaala | 6, 0 | valmis | 0 | Ootab tööjõudu |
| Sõdalaste laager (barracks) | 84:26 | linnaala | 0, -36 | valmis | 0 | Valmis |
| Põllutalu · farmerihoone (farm) | 84:27 | linnaala | -48, -42 | valmis | 0 | Hoburakend ja hõlmader |
| Põld · lohista ala (field) | 84:27 | linnaala | -76, -60 | valmis | 0 | 16 × 16 |
| Köögiviljaaed (vegetable_garden) | 84:27 | linnaala | -48, -30 | valmis | 0 | Ootab tööjõudu |
| Viljapuuaed (orchard) | 84:27 | linnaala | -48, -18 | valmis | 0 | Ootab tööjõudu |
| Kivimurd (quarry) | 84:25 | linnaala | 18, -18 | valmis | 3 | Kaevandab |
| Linapõld (flax_farm) | 84:25 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Rauakaevandus (mine) | 84:25 | linnaala | 11.52180712822883, 5.843333476113912 | valmis | 0 | Ladu täis: Maak |
| Vääriskivikaevandus (gem_mine) | 85:25 | linnaala | -45, 0 | valmis | 0 | Ootab tööjõudu |
| Siidikasvandus (silk_farm) | 86:25 | maakond | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Vürtsiaed (spice_garden) | 85:26 | linnaala | -48, -42 | ehitamisel | 1 | Ehitab · 100% tööjõud |

### Idaküla 2 — ID 4, ruut 81:25

Renessanss; 16 elanikku; majandusroll energy. Ressursid: grain 9.4, meat 18.85, fish 0, water 100, iron 0, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 81:25 | linnaala | -18, -18 | valmis | 0 | Valmis |
| Kaev (well) | 81:25 | linnaala | -30, -18 | valmis | 0 | Ladu täis: Vesi |
| Metsamaja (lumber) | 81:25 | linnaala | -54, -54 | valmis | 2 | Raiub puud |
| Jahimehe onn (hunter) | 81:25 | linnaala | -30, 0 | valmis | 2 | Ladu täis: Liha |
| Elamu (house) | 81:25 | linnaala | -18, -30 | valmis | 0 | Valmis |
| Põllutalu · farmerihoone (farm) | 81:25 | linnaala | -18, -6 | valmis | 4 | Hoburakend ja hõlmader |
| Õpikoda (study) | 81:25 | linnaala | -6, -18 | valmis | 1 | Õpetlased uurivad |
| Metsamaja (lumber) | 81:25 | linnaala | 30, -54 | valmis | 2 | Läheb metsa |
| Elamu (house) | 81:25 | linnaala | -30, -30 | valmis | 0 | Valmis |
| Põld · lohista ala (field) | 81:25 | linnaala | -76, -60 | valmis | 0 | 16 × 16 |
| Puusepatöökoda (saw) | 81:25 | linnaala | -6, -30 | valmis | 0 | Ladu täis: Lauad |
| Kangakoda (weaver) | 81:25 | linnaala | -6, -6 | valmis | 0 | Ootab tööjõudu |
| Kiviraiduri töökoda (mason) | 81:25 | linnaala | -42, -18 | valmis | 0 | Ootab tööjõudu |
| Loomafarm (pasture) | 81:25 | linnaala | -18, -42 | valmis | 0 | Ootab tööjõudu |
| Elamu (house) | 81:25 | linnaala | -18, 6 | valmis | 0 | Valmis |
| Vahitorn (watchtower) | 81:25 | linnaala | 6, -18 | valmis | 1 | Valmis |
| Puitvall (palisade) | 81:25 | linnaala | -30, -12 | valmis | 0 | Valmis |
| Sõdalaste laager (barracks) | 81:25 | linnaala | -42, -30 | valmis | 0 | Valmis |
| Vibuküttide harjutusplats (archery) | 81:25 | linnaala | -42, -6 | valmis | 0 | Valmis |
| Elamu (house) | 81:25 | linnaala | -30, -42 | valmis | 0 | Valmis |
| Metsniku maja (forester) | 81:25 | linnaala | -6, -42 | valmis | 0 | Ootab tööjõudu |
| Materjaliladu (warehouse) | 81:25 | linnaala | -6, 6 | valmis | 0 | Ootab tööjõudu |
| Kirjutuskoda (scriptorium) | 81:25 | linnaala | 6, -30 | valmis | 0 | Ootab tööjõudu |
| Käsiveski (mill) | 81:25 | linnaala | 6, -6 | valmis | 0 | Ootab: Vili |
| Kivimurd (quarry) | 80:25 | linnaala | 18, 18 | valmis | 3 | Kaevandab |
| Köögiviljaaed (vegetable_garden) | 82:26 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Rauakaevandus (mine) | 81:26 | linnaala | 2.8800858105751104, -1.42205906558047 | valmis | 0 | Ladu täis: Maak |
| Värvitaimeaed (dye_garden) | 81:26 | linnaala | -48, -42 | ehitamisel | 1 | Ehitab · 100% tööjõud |
| Vääriskivikaevandus (gem_mine) | 79:26 | maakond | -36, 9 | valmis | 0 | Ladu täis: Vääriskivid |
| Vürtsiaed (spice_garden) | 82:25 | linnaala | -48, -42 | ehitamisel | 0 | Ootab tööjõudu |
| Siidikasvandus (silk_farm) | 80:26 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |

### Idaküla 3 — ID 5, ruut 85:23

Renessanss; 16 elanikku; majandusroll food. Ressursid: grain 5.11, meat 144.9, fish 0, water 100, iron 0, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 85:23 | linnaala | -18, -18 | valmis | 0 | Valmis |
| Kaev (well) | 85:23 | linnaala | -18, -30 | valmis | 0 | Ladu täis: Vesi |
| Metsamaja (lumber) | 85:23 | linnaala | -6, -36 | valmis | 0 | Ladu täis: Puit |
| Õpikoda (study) | 85:23 | linnaala | -18, -6 | valmis | 1 | Õpetlased uurivad |
| Jahimehe onn (hunter) | 85:23 | linnaala | -48, 12 | valmis | 0 | Ladu täis: Liha |
| Elamu (house) | 85:23 | linnaala | -6, -18 | valmis | 0 | Valmis |
| Savivõtukoht (claypit) | 85:23 | linnaala | 18, -18 | valmis | 0 | Ladu täis: Savi |
| Pottsepatöökoda (pottery_kiln) | 85:23 | linnaala | -30, -24 | valmis | 2 | Toodab · 100% |
| Elamu (house) | 85:23 | linnaala | -30, -12 | valmis | 0 | Valmis |
| Põllutalu · farmerihoone (farm) | 85:23 | linnaala | -6, -6 | valmis | 0 | Ladu täis: Vili |
| Puusepatöökoda (saw) | 85:23 | linnaala | -30, -36 | valmis | 0 | Ladu täis: Lauad |
| Kangakoda (weaver) | 85:23 | linnaala | -30, 0 | valmis | 1 | Toodab · 100% |
| Loomafarm (pasture) | 85:23 | linnaala | -42, -18 | valmis | 0 | Ladu täis: Liha |
| Elamu (house) | 85:23 | linnaala | -18, -42 | valmis | 0 | Valmis |
| Puitvall (palisade) | 85:23 | linnaala | -6, -24 | valmis | 0 | Valmis |
| Kiviraiduri töökoda (mason) | 85:23 | linnaala | -18, 6 | valmis | 2 | Toodab · 100% |
| Vahitorn (watchtower) | 85:23 | linnaala | 6, -18 | valmis | 1 | Valmis |
| Metsniku maja (forester) | 85:23 | linnaala | -42, -30 | valmis | 2 | Otsib istutuskohta |
| Elamu (house) | 85:23 | linnaala | -42, -6 | valmis | 0 | Valmis |
| Materjaliladu (warehouse) | 85:23 | linnaala | -6, 6 | valmis | 1 | Valmis |
| Kirjutuskoda (scriptorium) | 85:23 | linnaala | 6, -30 | valmis | 2 | Õpetlased uurivad |
| Käsiveski (mill) | 85:23 | linnaala | 6, -6 | valmis | 0 | Ladu täis: Jahu |
| Pagariäri (bakery) | 85:23 | linnaala | -30, -48 | valmis | 0 | Ladu täis: Teraviljatoit |
| Toidukelder (cellar) | 85:23 | linnaala | -30, 12 | valmis | 0 | Valmis |
| Turg (market) | 85:23 | linnaala | -6, -48 | valmis | 2 | Valmis |
| Kivimurd (quarry) | 84:23 | linnaala | 18, 18 | valmis | 0 | Ladu täis: Kivi |
| Linapõld (flax_farm) | 84:23 | linnaala | -48, -42 | valmis | 1 | Toodab · 100% |
| Köögiviljaaed (vegetable_garden) | 85:22 | linnaala | -48, -42 | valmis | 0 | Ladu täis: Köögiviljad |
| Rauakaevandus (mine) | 86:23 | linnaala | 27, 0 | valmis | 0 | Ladu täis: Maak |
| Siidikasvandus (silk_farm) | 86:23 | linnaala | -48, -42 | valmis | 1 | Toodab · 100% |
| Viljapuuaed (orchard) | 87:22 | maakond | -48, -42 | valmis | 0 | Ladu täis: Puuviljad |
| Vääriskivikaevandus (gem_mine) | 87:24 | maakond | -27, -9 | valmis | 0 | Ootab tööjõudu |

### Idaküla 4 — ID 9, ruut 88:26

Renessanss; 22 elanikku; majandusroll energy. Ressursid: grain 8.61, meat 80.95, fish 0, water 33.25, iron 0, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 88:26 | linnaala | -18, -12 | valmis | 0 | Valmis |
| Metsamaja (lumber) | 88:26 | linnaala | -54, -36 | valmis | 2 | Toob saaki |
| Elamu (house) | 88:26 | linnaala | -30, -12 | valmis | 0 | Valmis |
| Õpikoda (study) | 88:26 | linnaala | -18, -24 | valmis | 1 | Õpetlased uurivad |
| Põllutalu · farmerihoone (farm) | 88:26 | linnaala | -18, 0 | valmis | 4 | Ootab eraldi rajatud põldu samal ruudul |
| Elamu (house) | 88:26 | linnaala | -6, -12 | valmis | 0 | Valmis |
| Puusepatöökoda (saw) | 88:26 | linnaala | -30, -24 | valmis | 0 | Ladu täis: Lauad |
| Kangakoda (weaver) | 88:26 | linnaala | -30, 0 | valmis | 1 | Toodab · 100% |
| Kiviraiduri töökoda (mason) | 88:26 | linnaala | -6, -24 | valmis | 2 | Toodab · 100% |
| Elamu (house) | 88:26 | linnaala | -6, 0 | valmis | 0 | Valmis |
| Loomafarm (pasture) | 88:26 | linnaala | -42, -12 | valmis | 0 | Ootab tööjõudu |
| Vahitorn (watchtower) | 88:26 | linnaala | -18, -36 | valmis | 1 | Valmis |
| Elamu (house) | 88:26 | linnaala | -18, 12 | valmis | 0 | Valmis |
| Puitvall (palisade) | 88:26 | linnaala | 0, -6 | valmis | 0 | Valmis |
| Madal kivivall (stonewall) | 88:26 | linnaala | 6, -12 | valmis | 0 | Valmis |
| Metsniku maja (forester) | 88:26 | linnaala | -42, -24 | valmis | 2 | Otsib istutuskohta |
| Materjaliladu (warehouse) | 88:26 | linnaala | -42, 0 | valmis | 1 | Valmis |
| Toidukelder (cellar) | 88:26 | linnaala | -30, -36 | valmis | 0 | Valmis |
| Kirjutuskoda (scriptorium) | 88:26 | linnaala | -30, 12 | valmis | 2 | Õpetlased uurivad |
| Käsiveski (mill) | 88:26 | linnaala | -6, -36 | valmis | 0 | Ootab: Vili |
| Elamu (house) | 88:26 | linnaala | 6, -18 | valmis | 0 | Valmis |
| Turg (market) | 88:26 | linnaala | -6, 12 | valmis | 2 | Valmis |
| Elamu (house) | 88:26 | linnaala | 6, 0 | valmis | 0 | Valmis |
| Söepõletaja (coal) | 88:26 | linnaala | 6, -30 | valmis | 0 | Ladu täis: Süsi |
| Kivimurd (quarry) | 88:25 | linnaala | -18, 18 | valmis | 3 | Kaevandab |
| Rauakaevandus (mine) | 88:25 | linnaala | 3.780675191919727, -5.220032596189412 | valmis | 0 | Ladu täis: Maak |
| Värvitaimeaed (dye_garden) | 88:25 | linnaala | -48, -42 | ehitamisel | 1 | Ehitab · 100% tööjõud |
| Köögiviljaaed (vegetable_garden) | 87:27 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Linapõld (flax_farm) | 87:26 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Vääriskivikaevandus (gem_mine) | 89:27 | linnaala | -27, -45 | valmis | 0 | Ootab tööjõudu |
| Siidikasvandus (silk_farm) | 89:26 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |

### Idaküla 5 — ID 19, ruut 91:23

Renessanss; 13 elanikku; majandusroll energy. Ressursid: grain 9.5, meat 18.95, fish 0, water 91.15, iron 97.65, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 91:23 | linnaala | -18, -18 | valmis | 0 | Valmis |
| Kaev (well) | 91:23 | linnaala | -30, -18 | valmis | 1 | Toodab · 100% |
| Õpikoda (study) | 91:23 | linnaala | -18, -30 | valmis | 0.25 | Õpetlased uurivad |
| Elamu (house) | 91:23 | linnaala | -18, -6 | valmis | 0 | Valmis |
| Metsamaja (lumber) | 91:23 | linnaala | 18, -24 | valmis | 2 | Läheb metsa |
| Jahimehe onn (hunter) | 91:23 | linnaala | 6, 24 | valmis | 2 | Jahib ulukeid |
| Elamu (house) | 91:23 | linnaala | -6, -18 | valmis | 0 | Valmis |
| Kivimurd (quarry) | 91:23 | linnaala | 18, 18 | valmis | 3 | Kaevandab |
| Puusepatöökoda (saw) | 91:23 | linnaala | -30, -30 | valmis | 2.25 | Toodab · 78% |
| Kirjutuskoda (scriptorium) | 91:23 | linnaala | -30, -6 | valmis | 0 | Ootab tööjõudu |
| Savivõtukoht (claypit) | 91:23 | linnaala | 9, -36 | valmis | 0 | Ootab tööjõudu |
| Kiviraiduri töökoda (mason) | 91:23 | linnaala | -6, -30 | valmis | 0 | Ootab tööjõudu |
| Söepõletaja (coal) | 91:23 | linnaala | -6, -6 | valmis | 0 | Ladu täis: Süsi |
| Rauasulatus (smelter) | 91:23 | linnaala | -42, -18 | valmis | 0.25 | Toodab · 12% |
| Akadeemia (academy) | 91:23 | linnaala | -18, -42 | valmis | 0 | Ootab tööjõudu |
| Sõdalaste laager (barracks) | 91:23 | linnaala | -18, 6 | valmis | 0 | Valmis |
| Tinakaevandus (tinmine) | 91:23 | linnaala | 0, 36 | valmis | 0 | Ootab tööjõudu |
| Elamu (house) | 91:23 | linnaala | 6, -18 | valmis | 0 | Valmis |
| Põllutalu · farmerihoone (farm) | 91:23 | linnaala | -42, -30 | valmis | 0 | Ootab tööjõudu |
| Juustukoda (dairy) | 91:23 | linnaala | -30, -42 | valmis | 0 | Ootab tööjõudu |
| Metsniku maja (forester) | 91:23 | linnaala | -30, 6 | valmis | 0 | Ootab tööjõudu |
| Kangakoda (weaver) | 91:23 | linnaala | -6, -42 | valmis | 0 | Ootab tööjõudu |
| Metsamaja (lumber) | 91:23 | linnaala | -18, 24 | valmis | 2 | Raiub puud |
| Juveliir (jeweler) | 91:23 | linnaala | 6, -6 | valmis | 0 | Ootab: Vask |
| Elamu (house) | 91:23 | linnaala | -42, -6 | valmis | 0 | Valmis |
| Siidikudumiskoda (silk_weaver) | 91:23 | linnaala | 0, 6 | valmis | 0 | Ootab tööjõudu |
| Köögiviljaaed (vegetable_garden) | 92:23 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Linapõld (flax_farm) | 90:22 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Rauakaevandus (mine) | 91:22 | linnaala | -0.6631946056586457, 10.653513090132947 | valmis | 0 | Ladu täis: Maak |
| Vääriskivikaevandus (gem_mine) | 91:22 | linnaala | 36, 18 | valmis | 0 | Ootab tööjõudu |
| Viljapuuaed (orchard) | 90:23 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Siidikasvandus (silk_farm) | 92:22 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Vürtsiaed (spice_garden) | 93:24 | maakond | -48, -42 | ehitamisel | 0.25 | Ehitab · 31% tööjõud |
| Värvitaimeaed (dye_garden) | 93:22 | maakond | -48, -42 | ehitamisel | 0 | Ootab tööjõudu |

### Idaküla 6 — ID 20, ruut 91:19

Renessanss; 19 elanikku; majandusroll industry. Ressursid: grain 6.35, meat 173.6, fish 0, water 37.35, iron 408.55, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 91:19 | linnaala | -18, -18 | valmis | 0 | Valmis |
| Metsamaja (lumber) | 91:19 | linnaala | -60, -60 | valmis | 2 | Läheb metsa |
| Elamu (house) | 91:19 | linnaala | -30, -18 | valmis | 0 | Valmis |
| Õpikoda (study) | 91:19 | linnaala | -18, -30 | valmis | 1 | Õpetlased uurivad |
| Jahimehe onn (hunter) | 91:19 | linnaala | -30, 6 | valmis | 2 | Jahib ulukeid |
| Jahimehe onn (hunter) | 91:19 | linnaala | -42, -42 | valmis | 2 | Läheb jahile |
| Elamu (house) | 91:19 | linnaala | -18, -6 | valmis | 0 | Valmis |
| Puusepatöökoda (saw) | 91:19 | linnaala | -6, -18 | valmis | 0 | Ladu täis: Lauad |
| Kangakoda (weaver) | 91:19 | linnaala | -30, -30 | valmis | 0 | Ootab tööjõudu |
| Elamu (house) | 91:19 | linnaala | -30, -6 | valmis | 0 | Valmis |
| Kivimurd (quarry) | 91:19 | linnaala | 18, 18 | valmis | 3 | Kaevandab |
| Metsniku maja (forester) | 91:19 | linnaala | -6, -30 | valmis | 0 | Ootab tööjõudu |
| Kirjutuskoda (scriptorium) | 91:19 | linnaala | -6, -6 | valmis | 0 | Ootab tööjõudu |
| Põllutalu · farmerihoone (farm) | 91:19 | linnaala | -42, -18 | valmis | 3 | Ladu täis: Vili |
| Toidukelder (cellar) | 91:19 | linnaala | -18, -42 | valmis | 0 | Valmis |
| Elamu (house) | 91:19 | linnaala | -18, 6 | valmis | 0 | Valmis |
| Loomafarm (pasture) | 91:19 | linnaala | 6, -18 | valmis | 0 | Ootab tööjõudu |
| Kiviraiduri töökoda (mason) | 91:19 | linnaala | -42, -30 | valmis | 0 | Ootab tööjõudu |
| Tinakaevandus (tinmine) | 91:19 | linnaala | 54, 18 | valmis | 0 | Ootab tööjõudu |
| Materjaliladu (warehouse) | 91:19 | linnaala | -42, -6 | valmis | 0 | Ootab tööjõudu |
| Käsiveski (mill) | 91:19 | linnaala | -30, -42 | valmis | 0 | Ootab: Vili |
| Elamu (house) | 91:19 | linnaala | -6, -42 | valmis | 0 | Valmis |
| Söepõletaja (coal) | 91:19 | linnaala | 6, -30 | valmis | 2 | Toodab · 100% |
| Rauasulatus (smelter) | 91:19 | linnaala | 0, 6 | valmis | 3 | Toodab · 100% |
| Akadeemia (academy) | 91:19 | linnaala | 6, -6 | valmis | 0 | Ootab tööjõudu |
| Köögiviljaaed (vegetable_garden) | 90:19 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Linapõld (flax_farm) | 90:20 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Rauakaevandus (mine) | 92:19 | linnaala | -10.227563491835099, 2.86628949434089 | valmis | 0 | Ladu täis: Maak |
| Vürtsiaed (spice_garden) | 92:19 | linnaala | -48, -42 | ehitamisel | 1 | Ehitab · 100% tööjõud |
| Viljapuuaed (orchard) | 93:18 | maakond | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Vääriskivikaevandus (gem_mine) | 91:20 | linnaala | 9, 45 | valmis | 0 | Ootab tööjõudu |
| Siidikasvandus (silk_farm) | 92:20 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Värvitaimeaed (dye_garden) | 91:17 | maakond | -48, -42 | ehitamisel | 0 | Ootab tööjõudu |

### Idaküla 7 — ID 23, ruut 86:19

Renessanss; 21 elanikku; majandusroll port. Ressursid: grain 9.11, meat 19.15, fish 0, water 100, iron 7.6, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 86:19 | linnaala | -18, -18 | valmis | 0 | Valmis |
| Kaev (well) | 86:19 | linnaala | -30, -18 | valmis | 0 | Ladu täis: Vesi |
| Õpikoda (study) | 86:19 | linnaala | -18, -30 | valmis | 1 | Õpetlased uurivad |
| Elamu (house) | 86:19 | linnaala | -18, -6 | valmis | 0 | Valmis |
| Metsamaja (lumber) | 86:19 | linnaala | 24, 18 | valmis | 2 | Läheb metsa |
| Kirjutuskoda (scriptorium) | 86:19 | linnaala | -6, -18 | valmis | 2 | Õpetlased uurivad |
| Elamu (house) | 86:19 | linnaala | -30, -30 | valmis | 0 | Valmis |
| Puusepatöökoda (saw) | 86:19 | linnaala | -30, -6 | valmis | 0 | Ladu täis: Lauad |
| Söepõletaja (coal) | 86:19 | linnaala | -6, -30 | valmis | 0 | Ladu täis: Süsi |
| Elamu (house) | 86:19 | linnaala | -6, -6 | valmis | 0 | Valmis |
| Põllutalu · farmerihoone (farm) | 86:19 | linnaala | -42, -18 | valmis | 4 | Ladu täis: Vili |
| Elamu (house) | 86:19 | linnaala | -18, -42 | valmis | 0 | Valmis |
| Elamu (house) | 86:19 | linnaala | -18, 6 | valmis | 0 | Valmis |
| Elamu (house) | 86:19 | linnaala | 6, -18 | valmis | 0 | Valmis |
| Elamu (house) | 86:19 | linnaala | -42, -30 | valmis | 0 | Valmis |
| Köögiviljaaed (vegetable_garden) | 87:19 | linnaala | -48, -42 | valmis | 1 | Ladu täis: Köögiviljad |
| Siidikasvandus (silk_farm) | 87:19 | linnaala | -48, -30 | valmis | 0 | Ladu täis: Siid |
| Linapõld (flax_farm) | 86:21 | maakond | -48, -42 | valmis | 1 | Toodab · 100% |
| Viljapuuaed (orchard) | 87:20 | linnaala | -48, -42 | valmis | 1 | Ladu täis: Puuviljad |
| Vääriskivikaevandus (gem_mine) | 88:18 | maakond | 9, 45 | valmis | 0 | Ladu täis: Vääriskivid |
| Värvitaimeaed (dye_garden) | 88:19 | maakond | -48, -42 | ehitamisel | 1 | Ehitab · 100% tööjõud |

### Idaküla 8 — ID 25, ruut 92:26

Renessanss; 16 elanikku; majandusroll industry. Ressursid: grain 1.09, meat 26.25, fish 0, water 31.7, iron 120, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 92:26 | linnaala | -18, -18 | valmis | 0 | Valmis |
| Metsamaja (lumber) | 92:26 | linnaala | -12, -42 | valmis | 2 | Läheb metsa |
| Õpikoda (study) | 92:26 | linnaala | -30, -18 | valmis | 1 | Õpetlased uurivad |
| Elamu (house) | 92:26 | linnaala | -18, -30 | valmis | 0 | Valmis |
| Jahimehe onn (hunter) | 92:26 | linnaala | 12, 12 | valmis | 2 | Jahib ulukeid |
| Kivimurd (quarry) | 92:26 | linnaala | 18, -18 | valmis | 3 | Kaevandab |
| Puusepatöökoda (saw) | 92:26 | linnaala | -18, -6 | valmis | 0 | Ladu täis: Lauad |
| Kirjutuskoda (scriptorium) | 92:26 | linnaala | -6, -24 | valmis | 2 | Õpetlased uurivad |
| Metsniku maja (forester) | 92:26 | linnaala | -30, -30 | valmis | 1 | Naaseb istutamast |
| Elamu (house) | 92:26 | linnaala | -6, -12 | valmis | 0 | Valmis |
| Põllutalu · farmerihoone (farm) | 92:26 | linnaala | -30, -6 | valmis | 4 | Ootab eraldi rajatud põldu samal ruudul |
| Söepõletaja (coal) | 92:26 | linnaala | -6, 0 | valmis | 0 | Ladu täis: Süsi |
| Rauasulatus (smelter) | 92:26 | linnaala | -42, -18 | valmis | 0 | Ladu täis: Raud |
| Sõdalaste laager (barracks) | 92:26 | linnaala | -18, 6 | valmis | 0 | Valmis |
| Elamu (house) | 92:26 | linnaala | 6, -18 | valmis | 0 | Valmis |
| Juustukoda (dairy) | 92:26 | linnaala | -24, -42 | valmis | 0 | Ootab: Vili |
| Kangakoda (weaver) | 92:26 | linnaala | 0, -36 | valmis | 0 | Ootab: Lina |
| Juveliir (jeweler) | 92:26 | linnaala | -42, -30 | valmis | 0 | Ootab: Vask |
| Siidikudumiskoda (silk_weaver) | 92:26 | linnaala | -30, 6 | valmis | 0 | Ootab tööjõudu |
| Tall (stable) | 92:26 | linnaala | 6, -6 | valmis | 0 | Valmis |
| Elamu (house) | 92:26 | linnaala | -42, -6 | valmis | 0 | Valmis |
| Loomafarm (pasture) | 92:26 | linnaala | -36, -42 | valmis | 0 | Ootab tööjõudu |
| Kiviraiduri töökoda (mason) | 92:26 | linnaala | 12, -30 | valmis | 0 | Ootab tööjõudu |
| Vasekaevandus (coppermine) | 92:26 | linnaala | 27, 9 | valmis | 0 | Ootab tööjõudu |
| Toidukelder (cellar) | 92:26 | linnaala | -6, 12 | valmis | 0 | Valmis |
| Köögiviljaaed (vegetable_garden) | 91:25 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Linapõld (flax_farm) | 92:28 | maakond | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Rauakaevandus (mine) | 93:26 | linnaala | -18, -18 | valmis | 0 | Ladu täis: Maak |
| Viljapuuaed (orchard) | 93:26 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Vääriskivikaevandus (gem_mine) | 93:28 | maakond | 45, -18 | ehitamisel | 1 | Ehitab · 100% tööjõud |
| Siidikasvandus (silk_farm) | 94:28 | maakond | -48, -42 | ehitamisel | 0 | Ootab tööjõudu |
| Vürtsiaed (spice_garden) | 92:25 | linnaala | -48, -42 | ehitamisel | 0 | Ootab tööjõudu |
| Värvitaimeaed (dye_garden) | 91:27 | linnaala | -48, -42 | ehitamisel | 0 | Ootab tööjõudu |

### Idaküla 9 — ID 29, ruut 90:29

Renessanss; 21 elanikku; majandusroll industry. Ressursid: grain 10.55, meat 15.4, fish 0, water 30, iron 294, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 90:29 | linnaala | -18, -12 | valmis | 0 | Valmis |
| Metsamaja (lumber) | 90:29 | linnaala | 18, -42 | valmis | 2 | Raiub puud |
| Elamu (house) | 90:29 | linnaala | -30, -12 | valmis | 0 | Valmis |
| Põllutalu · farmerihoone (farm) | 90:29 | linnaala | -18, -24 | valmis | 4 | Hoburakend ja hõlmader |
| Põld · lohista ala (field) | 90:29 | linnaala | -76, -60 | valmis | 0 | 16 × 16 |
| Elamu (house) | 90:29 | linnaala | -18, 0 | valmis | 0 | Valmis |
| Kirjutuskoda (scriptorium) | 90:29 | linnaala | -6, -12 | valmis | 2 | Õpetlased uurivad |
| Puusepatöökoda (saw) | 90:29 | linnaala | -30, -24 | valmis | 0 | Ladu täis: Lauad |
| Elamu (house) | 90:29 | linnaala | -30, 0 | valmis | 0 | Valmis |
| Söepõletaja (coal) | 90:29 | linnaala | -6, -24 | valmis | 2 | Toodab · 100% |
| Elamu (house) | 90:29 | linnaala | -6, 0 | valmis | 0 | Valmis |
| Rauasulatus (smelter) | 90:29 | linnaala | -42, -12 | valmis | 3 | Toodab · 100% |
| Elamu (house) | 90:29 | linnaala | -18, -36 | valmis | 0 | Valmis |
| Loomafarm (pasture) | 90:29 | linnaala | -18, 12 | valmis | 2 | Toodab · 100% |
| Kangakoda (weaver) | 90:29 | linnaala | 6, -12 | valmis | 0 | Ootab tööjõudu |
| Juveliir (jeweler) | 90:29 | linnaala | -30, -36 | valmis | 0 | Ootab: Vask |
| Materjaliladu (warehouse) | 90:29 | linnaala | -42, -24 | valmis | 1 | Valmis |
| Elamu (house) | 90:29 | linnaala | -42, 0 | valmis | 0 | Valmis |
| Metsniku maja (forester) | 90:29 | linnaala | -30, 12 | valmis | 2 | Istutab puud |
| Metsamaja (lumber) | 90:29 | linnaala | -30, 24 | valmis | 2 | Toob saaki |
| Elamu (house) | 90:29 | linnaala | -6, -36 | valmis | 1 | Ehitab · 100% tööjõud |
| Köögiviljaaed (vegetable_garden) | 91:29 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Viljapuuaed (orchard) | 92:31 | maakond | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Vääriskivikaevandus (gem_mine) | 89:30 | linnaala | 45, 9 | valmis | 0 | Ootab tööjõudu |
| Siidikasvandus (silk_farm) | 90:30 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Vürtsiaed (spice_garden) | 90:28 | linnaala | -48, -42 | ehitamisel | 0 | Ootab tööjõudu |

### Idaküla 10 — ID 33, ruut 88:22

Renessanss; 18 elanikku; majandusroll energy. Ressursid: grain 9.5, meat 13.8, fish 0, water 93.75, iron 7.6, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 88:22 | linnaala | -18, -12 | valmis | 0 | Valmis |
| Kaev (well) | 88:22 | linnaala | -30, -12 | valmis | 1 | Toodab · 100% |
| Põllutalu · farmerihoone (farm) | 88:22 | linnaala | -18, 0 | valmis | 4 | Ladu täis: Vili |
| Elamu (house) | 88:22 | linnaala | -18, -24 | valmis | 0 | Valmis |
| Elamu (house) | 88:22 | linnaala | -6, -12 | valmis | 0 | Valmis |
| Elamu (house) | 88:22 | linnaala | -30, -24 | valmis | 0 | Valmis |
| Elamu (house) | 88:22 | linnaala | -30, 0 | valmis | 0 | Valmis |
| Elamu (house) | 88:22 | linnaala | -6, -24 | valmis | 0 | Valmis |
| Elamu (house) | 88:22 | linnaala | -6, 0 | valmis | 0 | Valmis |
| Köögiviljaaed (vegetable_garden) | 89:21 | linnaala | -48, -42 | valmis | 1 | Toodab · 100% |
| Viljapuuaed (orchard) | 87:22 | linnaala | -48, -42 | valmis | 1 | Toodab · 100% |
| Vääriskivikaevandus (gem_mine) | 87:21 | linnaala | 27, 0 | valmis | 0 | Ladu täis: Vääriskivid |
| Siidikasvandus (silk_farm) | 88:21 | linnaala | -48, -42 | valmis | 0 | Ladu täis: Siid |
| Vürtsiaed (spice_garden) | 88:20 | maakond | -48, -42 | ehitamisel | 1 | Ehitab · 100% tööjõud |

### Põhjaküla 1 — ID 0, ruut 192:113

Keskaeg; 19 elanikku; majandusroll food. Ressursid: grain 9.27, meat 20.1, fish 0, water 91.45, iron 7.6, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 192:113 | linnaala | -18, -12 | valmis | 0 | Valmis |
| Kaev (well) | 192:113 | linnaala | -30, -12 | valmis | 1 | Toodab · 100% |
| Metsamaja (lumber) | 192:113 | linnaala | -66, -54 | valmis | 0 | Ladu täis: Puit |
| Elamu (house) | 192:113 | linnaala | -18, -24 | valmis | 0 | Valmis |
| Kivimurd (quarry) | 192:113 | linnaala | 18, -18 | valmis | 0 | Ladu täis: Kivi |
| Elamu (house) | 192:113 | linnaala | -18, 0 | valmis | 0 | Valmis |
| Põllutalu · farmerihoone (farm) | 192:113 | linnaala | -6, -12 | valmis | 0 | Härjarakend ja raudader |
| Põld · lohista ala (field) | 192:113 | linnaala | -76, -28 | valmis | 0 | 16 × 16 |
| Jahimehe onn (hunter) | 192:113 | linnaala | 30, -36 | valmis | 0 | Ladu täis: Liha |
| Õpikoda (study) | 192:113 | linnaala | -30, -24 | valmis | 1 | Õpetlased uurivad |
| Puusepatöökoda (saw) | 192:113 | linnaala | -30, 0 | valmis | 0 | Ladu täis: Lauad |
| Kangakoda (weaver) | 192:113 | linnaala | -6, -24 | valmis | 1 | Toodab · 100% |
| Loomafarm (pasture) | 192:113 | linnaala | -6, 0 | valmis | 0 | Ladu täis: Liha |
| Elamu (house) | 192:113 | linnaala | -42, -12 | valmis | 0 | Valmis |
| Kiviraiduri töökoda (mason) | 192:113 | linnaala | -18, -36 | valmis | 2 | Toodab · 100% |
| Vasekaevandus (coppermine) | 192:113 | linnaala | 36, 0 | valmis | 3 | Kaevandab |
| Tinakaevandus (tinmine) | 192:113 | linnaala | 54, 0 | valmis | 3 | Kaevandab |
| Vahitorn (watchtower) | 192:113 | linnaala | -18, 12 | valmis | 1 | Valmis |
| Puitvall (palisade) | 192:113 | linnaala | 6, -12 | valmis | 0 | Valmis |
| Elamu (house) | 192:113 | linnaala | 6, -18 | valmis | 0 | Valmis |
| Sõdalaste laager (barracks) | 192:113 | linnaala | -42, -24 | valmis | 0 | Valmis |
| Vibuküttide harjutusplats (archery) | 192:113 | linnaala | -42, 0 | valmis | 0 | Valmis |
| Metsniku maja (forester) | 192:113 | linnaala | -30, -36 | valmis | 2 | Otsib istutuskohta |
| Materjaliladu (warehouse) | 192:113 | linnaala | -30, 12 | valmis | 1 | Valmis |
| Metsamaja (lumber) | 192:113 | linnaala | 18, -36 | valmis | 0 | Ladu täis: Puit |
| Kirjutuskoda (scriptorium) | 192:113 | linnaala | -6, -36 | valmis | 2 | Õpetlased uurivad |
| Käsiveski (mill) | 192:113 | linnaala | -6, 12 | valmis | 0 | Ladu täis: Jahu |
| Pagariäri (bakery) | 192:113 | linnaala | 6, 0 | valmis | 0 | Ladu täis: Teraviljatoit |
| Elamu (house) | 192:113 | linnaala | 6, -30 | valmis | 0 | Valmis |
| Köögiviljaaed (vegetable_garden) | 191:113 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Linapõld (flax_farm) | 192:112 | linnaala | -48, -42 | valmis | 1 | Toodab · 100% |
| Rauakaevandus (mine) | 192:111 | maakond | 18, 18 | valmis | 0 | Ladu täis: Maak |
| Viljapuuaed (orchard) | 191:111 | maakond | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Vääriskivikaevandus (gem_mine) | 193:112 | linnaala | -27, -45 | valmis | 0 | Ladu täis: Vääriskivid |
| Siidikasvandus (silk_farm) | 190:113 | maakond | -48, -42 | valmis | 1 | Toodab · 100% |

### Põhjaküla 2 — ID 6, ruut 195:112

Keskaeg; 19 elanikku; majandusroll energy. Ressursid: grain 4.32, meat 17.2, fish 0, water 100, iron 7.6, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 195:112 | linnaala | -18, -12 | valmis | 0 | Valmis |
| Kaev (well) | 195:112 | linnaala | -30, -12 | valmis | 0 | Ladu täis: Vesi |
| Metsamaja (lumber) | 195:112 | linnaala | -48, 24 | valmis | 0 | Ladu täis: Puit |
| Jahimehe onn (hunter) | 195:112 | linnaala | -24, -42 | valmis | 0 | Ladu täis: Liha |
| Elamu (house) | 195:112 | linnaala | -18, 0 | valmis | 0 | Valmis |
| Õpikoda (study) | 195:112 | linnaala | -6, -12 | valmis | 1 | Õpetlased uurivad |
| Põllutalu · farmerihoone (farm) | 195:112 | linnaala | -24, -24 | valmis | 0 | Härjarakend ja raudader |
| Elamu (house) | 195:112 | linnaala | -30, 0 | valmis | 0 | Valmis |
| Põld · lohista ala (field) | 195:112 | linnaala | -76, -60 | valmis | 0 | 16 × 16 |
| Puusepatöökoda (saw) | 195:112 | linnaala | -6, 0 | valmis | 0 | Ladu täis: Lauad |
| Kangakoda (weaver) | 195:112 | linnaala | -36, -24 | valmis | 1 | Ladu täis: Linane kangas |
| Elamu (house) | 195:112 | linnaala | -42, -12 | valmis | 0 | Valmis |
| Puitvall (palisade) | 195:112 | linnaala | -30, -6 | valmis | 0 | Valmis |
| Loomafarm (pasture) | 195:112 | linnaala | -18, 12 | valmis | 0 | Ladu täis: Liha |
| Elamu (house) | 195:112 | linnaala | 6, -12 | valmis | 0 | Valmis |
| Metsniku maja (forester) | 195:112 | linnaala | -42, 0 | valmis | 2 | Otsib istutuskohta |
| Materjaliladu (warehouse) | 195:112 | linnaala | -30, 12 | valmis | 1 | Valmis |
| Kirjutuskoda (scriptorium) | 195:112 | linnaala | -6, 12 | valmis | 2 | Õpetlased uurivad |
| Käsiveski (mill) | 195:112 | linnaala | 6, 0 | valmis | 0 | Ladu täis: Jahu |
| Pagariäri (bakery) | 195:112 | linnaala | -36, -36 | valmis | 0 | Ladu täis: Teraviljatoit |
| Elamu (house) | 195:112 | linnaala | -48, -24 | valmis | 0 | Valmis |
| Köögiviljaaed (vegetable_garden) | 194:112 | linnaala | -48, -42 | valmis | 0 | Ladu täis: Köögiviljad |
| Siidikasvandus (silk_farm) | 194:112 | linnaala | -48, -30 | valmis | 1 | Toodab · 100% |
| Linapõld (flax_farm) | 196:111 | linnaala | -48, -42 | valmis | 1 | Toodab · 100% |
| Viljapuuaed (orchard) | 194:113 | linnaala | -48, -42 | valmis | 0 | Ladu täis: Puuviljad |
| Vääriskivikaevandus (gem_mine) | 197:111 | maakond | -54, 18 | valmis | 0 | Ladu täis: Vääriskivid |

### Põhjaküla 3 — ID 11, ruut 188:113

Keskaeg; 22 elanikku; majandusroll energy. Ressursid: grain 22.66, meat 64.7, fish 0, water 42.95, iron 7.6, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 188:113 | linnaala | -18, -18 | valmis | 0 | Valmis |
| Metsamaja (lumber) | 188:113 | linnaala | 12, -42 | valmis | 0 | Ladu täis: Puit |
| Jahimehe onn (hunter) | 188:113 | linnaala | -42, -42 | valmis | 2 | Ladu täis: Liha |
| Õpikoda (study) | 188:113 | linnaala | -30, -18 | valmis | 1 | Õpetlased uurivad |
| Elamu (house) | 188:113 | linnaala | -18, -30 | valmis | 0 | Valmis |
| Põllutalu · farmerihoone (farm) | 188:113 | linnaala | -18, -6 | valmis | 4 | Hoburakend ja hõlmader |
| Põld · lohista ala (field) | 188:113 | linnaala | -76, -60 | valmis | 0 | 16 × 16 |
| Jahimehe onn (hunter) | 188:113 | linnaala | 6, 0 | valmis | 2 | Ladu täis: Liha |
| Elamu (house) | 188:113 | linnaala | -6, -18 | valmis | 0 | Valmis |
| Puusepatöökoda (saw) | 188:113 | linnaala | -30, -30 | valmis | 0 | Ladu täis: Lauad |
| Linapõld (flax_farm) | 188:113 | linnaala | -30, -6 | valmis | 1 | Toodab · 100% |
| Kangakoda (weaver) | 188:113 | linnaala | -6, -30 | valmis | 1 | Toodab · 100% |
| Elamu (house) | 188:113 | linnaala | -6, -6 | valmis | 0 | Valmis |
| Loomafarm (pasture) | 188:113 | linnaala | -42, -18 | valmis | 2 | Ladu täis: Liha |
| Puitvall (palisade) | 188:113 | linnaala | -18, -36 | valmis | 0 | Valmis |
| Elamu (house) | 188:113 | linnaala | -18, -42 | valmis | 0 | Valmis |
| Metsniku maja (forester) | 188:113 | linnaala | -18, 6 | valmis | 2 | Otsib istutuskohta |
| Materjaliladu (warehouse) | 188:113 | linnaala | 6, -18 | valmis | 1 | Valmis |
| Toidukelder (cellar) | 188:113 | linnaala | -42, -30 | valmis | 0 | Valmis |
| Elamu (house) | 188:113 | linnaala | -42, -6 | valmis | 0 | Valmis |
| Kirjutuskoda (scriptorium) | 188:113 | linnaala | -30, -42 | valmis | 2 | Õpetlased uurivad |
| Käsiveski (mill) | 188:113 | linnaala | -30, 6 | valmis | 2 | Toodab · 100% |
| Turg (market) | 188:113 | linnaala | -6, -42 | valmis | 2 | Valmis |
| Metsamaja (lumber) | 188:113 | linnaala | -60, -24 | valmis | 0 | Ladu täis: Puit |
| Söepõletaja (coal) | 188:113 | linnaala | -6, 6 | valmis | 0 | Ladu täis: Süsi |
| Elamu (house) | 188:113 | linnaala | 6, -30 | valmis | 0 | Valmis |
| Köögiviljaaed (vegetable_garden) | 188:112 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Viljapuuaed (orchard) | 189:112 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Vääriskivikaevandus (gem_mine) | 189:113 | linnaala | 36, 9 | valmis | 0 | Ootab tööjõudu |

### Põhjaküla 4 — ID 14, ruut 185:112

Keskaeg; 19 elanikku; majandusroll energy. Ressursid: grain 9.74, meat 150.25, fish 0, water 100, iron 7.6, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 185:112 | linnaala | -18, -18 | valmis | 0 | Valmis |
| Kaev (well) | 185:112 | linnaala | -30, -18 | valmis | 1 | Toodab · 100% |
| Metsamaja (lumber) | 185:112 | linnaala | -12, -48 | valmis | 2 | Toob saaki |
| Õpikoda (study) | 185:112 | linnaala | -18, -30 | valmis | 1 | Õpetlased uurivad |
| Jahimehe onn (hunter) | 185:112 | linnaala | 6, -12 | valmis | 2 | Ladu täis: Liha |
| Elamu (house) | 185:112 | linnaala | -18, -6 | valmis | 0 | Valmis |
| Põllutalu · farmerihoone (farm) | 185:112 | linnaala | -6, -18 | valmis | 4 | Ladu täis: Vili |
| Puusepatöökoda (saw) | 185:112 | linnaala | -30, -30 | valmis | 0 | Ladu täis: Lauad |
| Elamu (house) | 185:112 | linnaala | -30, -6 | valmis | 0 | Valmis |
| Kangakoda (weaver) | 185:112 | linnaala | -6, -30 | valmis | 0 | Ootab tööjõudu |
| Loomafarm (pasture) | 185:112 | linnaala | -6, -6 | valmis | 0 | Ootab tööjõudu |
| Elamu (house) | 185:112 | linnaala | -42, -18 | valmis | 0 | Valmis |
| Puitvall (palisade) | 185:112 | linnaala | -30, -12 | valmis | 0 | Valmis |
| Elamu (house) | 185:112 | linnaala | -18, 6 | valmis | 0 | Valmis |
| Metsniku maja (forester) | 185:112 | linnaala | -24, -42 | valmis | 2 | Naaseb istutamast |
| Materjaliladu (warehouse) | 185:112 | linnaala | 6, -24 | valmis | 1 | Valmis |
| Toidukelder (cellar) | 185:112 | linnaala | -42, -30 | valmis | 0 | Valmis |
| Kirjutuskoda (scriptorium) | 185:112 | linnaala | -42, -6 | valmis | 2 | Õpetlased uurivad |
| Käsiveski (mill) | 185:112 | linnaala | -30, 6 | valmis | 0 | Ootab: Vili |
| Turg (market) | 185:112 | linnaala | -6, 6 | valmis | 2 | Valmis |
| Pagariäri (bakery) | 185:112 | linnaala | -36, -42 | valmis | 2 | Toodab · 100% |
| Elamu (house) | 185:112 | linnaala | 0, -42 | valmis | 0 | Valmis |
| Juveliir (jeweler) | 185:112 | linnaala | 6, 0 | valmis | 0 | Ootab tööjõudu |
| Köögiviljaaed (vegetable_garden) | 185:111 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Linapõld (flax_farm) | 183:112 | maakond | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Viljapuuaed (orchard) | 185:113 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Vääriskivikaevandus (gem_mine) | 184:112 | linnaala | 27, 18 | valmis | 0 | Ootab tööjõudu |
| Siidikasvandus (silk_farm) | 184:111 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |

### Põhjaküla 5 — ID 31, ruut 182:110

Keskaeg; 10 elanikku; majandusroll industry. Ressursid: grain 0, meat 181.45, fish 0, water 14.7, iron 120, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 182:110 | linnaala | -18, -18 | valmis | 0 | Valmis |
| Metsamaja (lumber) | 182:110 | linnaala | 30, -24 | valmis | 0 | Ladu täis: Puit |
| Elamu (house) | 182:110 | linnaala | -30, -18 | valmis | 0 | Valmis |
| Jahimehe onn (hunter) | 182:110 | linnaala | -24, -42 | valmis | 2 | Jahib ulukeid |
| Jahimehe onn (hunter) | 182:110 | linnaala | 12, 24 | valmis | 2 | Jahib ulukeid |
| Kivimurd (quarry) | 182:110 | linnaala | 18, -18 | valmis | 0 | Ladu täis: Kivi |
| Puusepatöökoda (saw) | 182:110 | linnaala | -18, -30 | valmis | 0 | Ladu täis: Lauad |
| Elamu (house) | 182:110 | linnaala | -6, -18 | valmis | 0 | Valmis |
| Kirjutuskoda (scriptorium) | 182:110 | linnaala | -24, -6 | valmis | 1 | Õpetlased uurivad |
| Söepõletaja (coal) | 182:110 | linnaala | -12, -6 | valmis | 0 | Ladu täis: Süsi |
| Metsniku maja (forester) | 182:110 | linnaala | -30, -30 | valmis | 0 | Ootab tööjõudu |
| Kangakoda (weaver) | 182:110 | linnaala | -6, -30 | valmis | 0 | Ootab tööjõudu |
| Põllutalu · farmerihoone (farm) | 182:110 | linnaala | -36, -6 | valmis | 4 | Ootab eraldi rajatud põldu samal ruudul |
| Juveliir (jeweler) | 182:110 | linnaala | 0, -6 | valmis | 0 | Ootab tööjõudu |
| Loomafarm (pasture) | 182:110 | linnaala | -42, -18 | valmis | 0 | Ootab tööjõudu |
| Toidukelder (cellar) | 182:110 | linnaala | -18, 6 | valmis | 0 | Valmis |
| Rauasulatus (smelter) | 182:110 | linnaala | 6, -18 | valmis | 0 | Ladu täis: Raud |
| Sõdalaste laager (barracks) | 182:110 | linnaala | -12, -42 | valmis | 0 | Valmis |
| Köögiviljaaed (vegetable_garden) | 181:110 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Linapõld (flax_farm) | 181:110 | linnaala | -48, -30 | valmis | 0 | Ootab tööjõudu |
| Viljapuuaed (orchard) | 182:107 | maakond | -48, -42 | ehitamisel | 1 | Ehitab · 100% tööjõud |
| Vääriskivikaevandus (gem_mine) | 181:109 | linnaala | -27, 0 | ehitamisel | 0 | Ootab tööjõudu |
| Rauakaevandus (mine) | 182:109 | linnaala | 18, 18 | valmis | 0 | Ladu täis: Maak |
| Siidikasvandus (silk_farm) | 182:109 | linnaala | -48, -42 | ehitamisel | 0 | Ootab tööjõudu |

### Põhjaküla 6 — ID 32, ruut 183:115

Keskaeg; 16 elanikku; majandusroll food. Ressursid: grain 0, meat 17.55, fish 0, water 93.85, iron 7.6, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 183:115 | linnaala | -18, -18 | valmis | 0 | Valmis |
| Kaev (well) | 183:115 | linnaala | -30, -18 | valmis | 1 | Toodab · 100% |
| Elamu (house) | 183:115 | linnaala | -18, -30 | valmis | 0 | Valmis |
| Jahimehe onn (hunter) | 183:115 | linnaala | -48, -36 | valmis | 2 | Läheb jahile |
| Metsamaja (lumber) | 183:115 | linnaala | 18, -54 | valmis | 0 | Ladu täis: Puit |
| Elamu (house) | 183:115 | linnaala | -18, -6 | valmis | 0 | Valmis |
| Puusepatöökoda (saw) | 183:115 | linnaala | -6, -18 | valmis | 0 | Ladu täis: Lauad |
| Söepõletaja (coal) | 183:115 | linnaala | -30, -30 | valmis | 0 | Ladu täis: Süsi |
| Elamu (house) | 183:115 | linnaala | -6, -30 | valmis | 0 | Valmis |
| Elamu (house) | 183:115 | linnaala | -6, -6 | valmis | 0 | Valmis |
| Elamu (house) | 183:115 | linnaala | -36, -6 | valmis | 0 | Valmis |
| Köögiviljaaed (vegetable_garden) | 182:115 | linnaala | -48, -42 | valmis | 1 | Toodab · 100% |
| Viljapuuaed (orchard) | 180:114 | maakond | -48, -42 | valmis | 1 | Ladu täis: Puuviljad |
| Linapõld (flax_farm) | 183:114 | linnaala | -48, -42 | valmis | 0 | Ladu täis: Lina |
| Vääriskivikaevandus (gem_mine) | 184:114 | linnaala | -18, 18 | valmis | 0 | Ladu täis: Vääriskivid |
| Siidikasvandus (silk_farm) | 184:115 | linnaala | -48, -42 | valmis | 0 | Ladu täis: Siid |

### Lõunaküla 1 — ID 1, ruut 134:82

Renessanss; 19 elanikku; majandusroll energy. Ressursid: grain 15.81, meat 118.95, fish 0, water 98.2, iron 7.6, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 134:82 | linnaala | -18, -18 | valmis | 0 | Valmis |
| Kaev (well) | 134:82 | linnaala | -30, -18 | valmis | 1 | Ladu täis: Vesi |
| Metsamaja (lumber) | 134:82 | linnaala | 24, -48 | valmis | 0 | Ladu täis: Puit |
| Elamu (house) | 134:82 | linnaala | -18, -30 | valmis | 0 | Valmis |
| Kivimurd (quarry) | 134:82 | linnaala | -18, 18 | valmis | 0 | Ladu täis: Kivi |
| Elamu (house) | 134:82 | linnaala | -6, -18 | valmis | 0 | Valmis |
| Jahimehe onn (hunter) | 134:82 | linnaala | -12, 6 | valmis | 0 | Ladu täis: Liha |
| Õpikoda (study) | 134:82 | linnaala | -18, -6 | valmis | 1 | Õpetlased uurivad |
| Savivõtukoht (claypit) | 134:82 | linnaala | -54, 18 | valmis | 0 | Ladu täis: Savi |
| Pottsepatöökoda (pottery_kiln) | 134:82 | linnaala | -30, -30 | valmis | 2 | Toodab · 100% |
| Puusepatöökoda (saw) | 134:82 | linnaala | -30, -6 | valmis | 0 | Ladu täis: Lauad |
| Elamu (house) | 134:82 | linnaala | -6, -30 | valmis | 0 | Valmis |
| Kangakoda (weaver) | 134:82 | linnaala | -6, -6 | valmis | 1 | Toodab · 100% |
| Kiviraiduri töökoda (mason) | 134:82 | linnaala | -42, -18 | valmis | 2 | Toodab · 100% |
| Puitvall (palisade) | 134:82 | linnaala | -18, -36 | valmis | 0 | Valmis |
| Elamu (house) | 134:82 | linnaala | -18, -42 | valmis | 0 | Valmis |
| Loomafarm (pasture) | 134:82 | linnaala | 6, -18 | valmis | 0 | Ladu täis: Liha |
| Vasekaevandus (coppermine) | 134:82 | linnaala | -36, 18 | valmis | 3 | Kaevandab |
| Metsniku maja (forester) | 134:82 | linnaala | -24, 6 | valmis | 2 | Otsib istutuskohta |
| Tinakaevandus (tinmine) | 134:82 | linnaala | 27, 9 | valmis | 1 | Kaevandab |
| Materjaliladu (warehouse) | 134:82 | linnaala | -42, -30 | valmis | 1 | Valmis |
| Kirjutuskoda (scriptorium) | 134:82 | linnaala | -42, -6 | valmis | 2 | Õpetlased uurivad |
| Käsiveski (mill) | 134:82 | linnaala | -30, -42 | valmis | 0 | Ladu täis: Jahu |
| Toidukelder (cellar) | 134:82 | linnaala | -6, -42 | valmis | 0 | Valmis |
| Pagariäri (bakery) | 134:82 | linnaala | 6, -30 | valmis | 0 | Ladu täis: Teraviljatoit |
| Elamu (house) | 134:82 | linnaala | 6, -6 | valmis | 0 | Valmis |
| Turg (market) | 134:82 | linnaala | -36, 6 | valmis | 2 | Valmis |
| Söepõletaja (coal) | 134:82 | linnaala | 0, 6 | valmis | 0 | Ladu täis: Süsi |
| Metsamaja (lumber) | 134:82 | linnaala | -6, 24 | valmis | 0 | Ootab tööjõudu |
| Põllutalu · farmerihoone (farm) | 134:83 | linnaala | -48, -42 | valmis | 0 | Hoburakend ja hõlmader |
| Põld · lohista ala (field) | 134:83 | linnaala | -76, -60 | valmis | 0 | 16 × 16 |
| Köögiviljaaed (vegetable_garden) | 134:83 | linnaala | -48, -30 | valmis | 0 | Ootab tööjõudu |
| Linapõld (flax_farm) | 134:83 | linnaala | -48, -18 | valmis | 0 | Ootab tööjõudu |
| Viljapuuaed (orchard) | 135:82 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Vääriskivikaevandus (gem_mine) | 135:83 | linnaala | 27, 0 | valmis | 0 | Ootab tööjõudu |
| Siidikasvandus (silk_farm) | 136:83 | maakond | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Vürtsiaed (spice_garden) | 136:82 | maakond | -48, -42 | ehitamisel | 1 | Ehitab · 100% tööjõud |

### Lõunaküla 2 — ID 8, ruut 138:82

Renessanss; 16 elanikku; majandusroll energy. Ressursid: grain 16.44, meat 87.2, fish 0, water 93.5, iron 7.6, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 138:82 | linnaala | -18, -18 | valmis | 0 | Valmis |
| Kaev (well) | 138:82 | linnaala | -30, -18 | valmis | 1 | Toodab · 100% |
| Metsamaja (lumber) | 138:82 | linnaala | 0, -48 | valmis | 0 | Ladu täis: Puit |
| Jahimehe onn (hunter) | 138:82 | linnaala | 0, 0 | valmis | 0 | Ootab tööjõudu |
| Elamu (house) | 138:82 | linnaala | -18, -30 | valmis | 0 | Valmis |
| Õpikoda (study) | 138:82 | linnaala | -18, -6 | valmis | 1 | Õpetlased uurivad |
| Põllutalu · farmerihoone (farm) | 138:82 | linnaala | -6, -18 | valmis | 0 | Ootab tööjõudu |
| Elamu (house) | 138:82 | linnaala | -30, -30 | valmis | 0 | Valmis |
| Puusepatöökoda (saw) | 138:82 | linnaala | -30, -6 | valmis | 0 | Ladu täis: Lauad |
| Kangakoda (weaver) | 138:82 | linnaala | -6, -30 | valmis | 1 | Toodab · 100% |
| Loomafarm (pasture) | 138:82 | linnaala | -42, -18 | valmis | 0 | Ootab tööjõudu |
| Elamu (house) | 138:82 | linnaala | -18, -42 | valmis | 0 | Valmis |
| Jahimehe onn (hunter) | 138:82 | linnaala | -18, 18 | valmis | 0 | Ootab tööjõudu |
| Jahimehe onn (hunter) | 138:82 | linnaala | 24, -6 | valmis | 0 | Ootab tööjõudu |
| Metsniku maja (forester) | 138:82 | linnaala | -18, 6 | valmis | 2 | Naaseb istutamast |
| Materjaliladu (warehouse) | 138:82 | linnaala | 6, -18 | valmis | 1 | Valmis |
| Elamu (house) | 138:82 | linnaala | -42, -30 | valmis | 0 | Valmis |
| Kirjutuskoda (scriptorium) | 138:82 | linnaala | -42, -6 | valmis | 2 | Õpetlased uurivad |
| Käsiveski (mill) | 138:82 | linnaala | -30, -42 | valmis | 0 | Ootab tööjõudu |
| Toidukelder (cellar) | 138:82 | linnaala | -30, 6 | valmis | 0 | Valmis |
| Pagariäri (bakery) | 138:82 | linnaala | 6, -30 | valmis | 0 | Ootab tööjõudu |
| Turg (market) | 138:82 | linnaala | -6, 12 | valmis | 2 | Valmis |
| Köögiviljaaed (vegetable_garden) | 139:82 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Vääriskivikaevandus (gem_mine) | 139:82 | linnaala | -45, 9 | valmis | 0 | Ladu täis: Vääriskivid |
| Linapõld (flax_farm) | 139:84 | maakond | -48, -42 | valmis | 1 | Toodab · 100% |
| Viljapuuaed (orchard) | 137:81 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Siidikasvandus (silk_farm) | 137:80 | maakond | -48, -42 | valmis | 1 | Toodab · 100% |
| Vürtsiaed (spice_garden) | 138:81 | linnaala | -48, -42 | ehitamisel | 1 | Ehitab · 100% tööjõud |
| Värvitaimeaed (dye_garden) | 138:80 | maakond | -48, -42 | ehitamisel | 0 | Ootab tööjõudu |

### Lõunaküla 3 — ID 12, ruut 133:85

Renessanss; 22 elanikku; majandusroll food. Ressursid: grain 5.85, meat 88.65, fish 0, water 100, iron 7.6, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 133:85 | linnaala | -18, -18 | valmis | 0 | Valmis |
| Kaev (well) | 133:85 | linnaala | -30, -18 | valmis | 0 | Ladu täis: Vesi |
| Metsamaja (lumber) | 133:85 | linnaala | 24, -24 | valmis | 2 | Läheb metsa |
| Õpikoda (study) | 133:85 | linnaala | -18, -30 | valmis | 1 | Õpetlased uurivad |
| Jahimehe onn (hunter) | 133:85 | linnaala | -18, -6 | valmis | 2 | Ladu täis: Liha |
| Elamu (house) | 133:85 | linnaala | -6, -18 | valmis | 0 | Valmis |
| Savivõtukoht (claypit) | 133:85 | linnaala | 36, 18 | valmis | 0 | Ladu täis: Savi |
| Põllutalu · farmerihoone (farm) | 133:85 | linnaala | -30, -30 | valmis | 4 | Hoburakend ja hõlmader |
| Pottsepatöökoda (pottery_kiln) | 133:85 | linnaala | -30, -6 | valmis | 2 | Toodab · 100% |
| Elamu (house) | 133:85 | linnaala | -6, -30 | valmis | 0 | Valmis |
| Põld · lohista ala (field) | 133:85 | linnaala | -76, -60 | valmis | 0 | 16 × 16 |
| Puusepatöökoda (saw) | 133:85 | linnaala | -6, -6 | valmis | 0 | Ladu täis: Lauad |
| Kangakoda (weaver) | 133:85 | linnaala | -42, -18 | valmis | 1 | Toodab · 100% |
| Elamu (house) | 133:85 | linnaala | -18, -42 | valmis | 0 | Valmis |
| Loomafarm (pasture) | 133:85 | linnaala | -18, 6 | valmis | 2 | Ladu täis: Liha |
| Puitvall (palisade) | 133:85 | linnaala | 0, -24 | valmis | 0 | Valmis |
| Elamu (house) | 133:85 | linnaala | 6, -18 | valmis | 0 | Valmis |
| Metsniku maja (forester) | 133:85 | linnaala | -42, -30 | valmis | 2 | Otsib istutuskohta |
| Materjaliladu (warehouse) | 133:85 | linnaala | -42, -6 | valmis | 1 | Valmis |
| Kirjutuskoda (scriptorium) | 133:85 | linnaala | -30, -42 | valmis | 2 | Õpetlased uurivad |
| Käsiveski (mill) | 133:85 | linnaala | -30, 6 | valmis | 2 | Toodab · 100% |
| Pagariäri (bakery) | 133:85 | linnaala | -6, -42 | valmis | 0 | Ootab: Jahu |
| Elamu (house) | 133:85 | linnaala | -6, 6 | valmis | 0 | Valmis |
| Toidukelder (cellar) | 133:85 | linnaala | 6, -6 | valmis | 0 | Valmis |
| Elamu (house) | 133:85 | linnaala | 6, -30 | valmis | 0 | Valmis |
| Köögiviljaaed (vegetable_garden) | 133:84 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Värvitaimeaed (dye_garden) | 133:84 | linnaala | -48, -30 | ehitamisel | 1 | Ehitab · 100% tööjõud |
| Linapõld (flax_farm) | 135:85 | maakond | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Viljapuuaed (orchard) | 132:85 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Vääriskivikaevandus (gem_mine) | 131:84 | maakond | 18, 45 | valmis | 0 | Ladu täis: Vääriskivid |
| Siidikasvandus (silk_farm) | 132:84 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Vürtsiaed (spice_garden) | 132:86 | linnaala | -48, -42 | ehitamisel | 0 | Ootab tööjõudu |

### Lõunaküla 4 — ID 16, ruut 137:85

Renessanss; 22 elanikku; majandusroll industry. Ressursid: grain 8.33, meat 49.3, fish 0, water 38.7, iron 0, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 137:85 | linnaala | -18, -18 | valmis | 0 | Valmis |
| Metsamaja (lumber) | 137:85 | linnaala | -18, 24 | valmis | 2 | Raiub puud |
| Elamu (house) | 137:85 | linnaala | -30, -18 | valmis | 0 | Valmis |
| Õpikoda (study) | 137:85 | linnaala | -18, -30 | valmis | 1 | Õpetlased uurivad |
| Põllutalu · farmerihoone (farm) | 137:85 | linnaala | -18, -6 | valmis | 4 | Ootab eraldi rajatud põldu samal ruudul |
| Kivimurd (quarry) | 137:85 | linnaala | 9.1, -22.5 | valmis | 0 | Ladu täis: Kivi |
| Elamu (house) | 137:85 | linnaala | -6, -18 | valmis | 0 | Valmis |
| Puusepatöökoda (saw) | 137:85 | linnaala | -30, -30 | valmis | 0 | Ladu täis: Lauad |
| Kangakoda (weaver) | 137:85 | linnaala | -30, -6 | valmis | 1 | Toodab · 100% |
| Kiviraiduri töökoda (mason) | 137:85 | linnaala | -6, 0 | valmis | 2 | Toodab · 100% |
| Elamu (house) | 137:85 | linnaala | -6, -30 | valmis | 0 | Valmis |
| Loomafarm (pasture) | 137:85 | linnaala | -42, -18 | valmis | 2 | Toodab · 100% |
| Puitvall (palisade) | 137:85 | linnaala | 0, -24 | valmis | 0 | Valmis |
| Vasekaevandus (coppermine) | 137:85 | linnaala | 18, -45 | valmis | 0 | Ladu täis: Vask |
| Tinakaevandus (tinmine) | 137:85 | linnaala | -9, -45 | valmis | 2 | Kaevandab |
| Elamu (house) | 137:85 | linnaala | -18, 6 | valmis | 0 | Valmis |
| Metsniku maja (forester) | 137:85 | linnaala | -24, -42 | valmis | 2 | Naaseb istutamast |
| Materjaliladu (warehouse) | 137:85 | linnaala | -42, -30 | valmis | 1 | Valmis |
| Kirjutuskoda (scriptorium) | 137:85 | linnaala | -42, -6 | valmis | 2 | Õpetlased uurivad |
| Käsiveski (mill) | 137:85 | linnaala | -30, 6 | valmis | 0 | Ootab: Vili |
| Toidukelder (cellar) | 137:85 | linnaala | 6, -6 | valmis | 0 | Valmis |
| Turg (market) | 137:85 | linnaala | -36, -42 | valmis | 2 | Valmis |
| Elamu (house) | 137:85 | linnaala | 6, -36 | valmis | 0 | Valmis |
| Elamu (house) | 137:85 | linnaala | -6, 12 | valmis | 0 | Valmis |
| Madal kivivall (stonewall) | 137:85 | linnaala | -6, -36 | valmis | 0 | Valmis |
| Köögiviljaaed (vegetable_garden) | 137:84 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Rauakaevandus (mine) | 137:84 | linnaala | -18, -18 | valmis | 0 | Ladu täis: Maak |
| Vürtsiaed (spice_garden) | 137:84 | linnaala | -48, -30 | ehitamisel | 1 | Ehitab · 100% tööjõud |
| Viljapuuaed (orchard) | 136:84 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Vääriskivikaevandus (gem_mine) | 136:85 | linnaala | -9, -27 | valmis | 0 | Ootab tööjõudu |
| Siidikasvandus (silk_farm) | 136:86 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Värvitaimeaed (dye_garden) | 138:85 | linnaala | -48, -42 | ehitamisel | 0 | Ootab tööjõudu |

### Lõunaküla 5 — ID 18, ruut 141:81

Renessanss; 22 elanikku; majandusroll food. Ressursid: grain 9.93, meat 65.85, fish 0, water 43.35, iron 7.7, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 141:81 | linnaala | -18, -12 | valmis | 0 | Valmis |
| Metsamaja (lumber) | 141:81 | linnaala | -6, -18 | valmis | 2 | Toob saaki |
| Jahimehe onn (hunter) | 141:81 | linnaala | -24, 0 | valmis | 2 | Ladu täis: Liha |
| Elamu (house) | 141:81 | linnaala | -30, -12 | valmis | 0 | Valmis |
| Õpikoda (study) | 141:81 | linnaala | -18, -24 | valmis | 1 | Õpetlased uurivad |
| Põllutalu · farmerihoone (farm) | 141:81 | linnaala | -12, 0 | valmis | 4 | Hoburakend ja hõlmader |
| Elamu (house) | 141:81 | linnaala | -30, -24 | valmis | 0 | Valmis |
| Põld · lohista ala (field) | 141:81 | linnaala | -76, -60 | valmis | 0 | 16 × 16 |
| Puusepatöökoda (saw) | 141:81 | linnaala | 0, -6 | valmis | 0 | Ladu täis: Lauad |
| Loomafarm (pasture) | 141:81 | linnaala | -36, 0 | valmis | 2 | Ladu täis: Liha |
| Kangakoda (weaver) | 141:81 | linnaala | -6, -30 | valmis | 1 | Toodab · 100% |
| Elamu (house) | 141:81 | linnaala | -42, -12 | valmis | 0 | Valmis |
| Metsamaja (lumber) | 141:81 | linnaala | -30, -36 | valmis | 2 | Läheb metsa |
| Metsniku maja (forester) | 141:81 | linnaala | -18, -36 | valmis | 2 | Otsib istutuskohta |
| Elamu (house) | 141:81 | linnaala | -18, 12 | valmis | 0 | Valmis |
| Materjaliladu (warehouse) | 141:81 | linnaala | 6, -18 | valmis | 1 | Valmis |
| Kirjutuskoda (scriptorium) | 141:81 | linnaala | 0, 6 | valmis | 2 | Õpetlased uurivad |
| Käsiveski (mill) | 141:81 | linnaala | -42, -24 | valmis | 0 | Ootab: Vili |
| Toidukelder (cellar) | 141:81 | linnaala | -30, 12 | valmis | 0 | Valmis |
| Turg (market) | 141:81 | linnaala | 6, -30 | valmis | 2 | Valmis |
| Elamu (house) | 141:81 | linnaala | 12, -6 | valmis | 0 | Valmis |
| Söepõletaja (coal) | 141:81 | linnaala | -48, 0 | valmis | 0 | Ladu täis: Süsi |
| Juveliir (jeweler) | 141:81 | linnaala | -6, -42 | valmis | 0 | Ootab tööjõudu |
| Elamu (house) | 141:81 | linnaala | -6, 18 | valmis | 0 | Valmis |
| Köögiviljaaed (vegetable_garden) | 140:81 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Linapõld (flax_farm) | 140:81 | linnaala | -48, -30 | valmis | 0 | Ootab tööjõudu |
| Viljapuuaed (orchard) | 141:80 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Siidikasvandus (silk_farm) | 142:81 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Vürtsiaed (spice_garden) | 142:80 | linnaala | -48, -42 | ehitamisel | 1 | Ehitab · 100% tööjõud |
| Värvitaimeaed (dye_garden) | 141:82 | linnaala | -48, -42 | ehitamisel | 0 | Ootab tööjõudu |

### Lõunaküla 6 — ID 22, ruut 134:89

Renessanss; 19 elanikku; majandusroll timber. Ressursid: grain 0.33, meat 102.6, fish 0, water 100, iron 7.6, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 134:89 | linnaala | -18, -18 | valmis | 0 | Valmis |
| Kaev (well) | 134:89 | linnaala | -30, -18 | valmis | 0 | Ladu täis: Vesi |
| Metsamaja (lumber) | 134:89 | linnaala | -42, -36 | valmis | 2 | Raiub puud |
| Kivimurd (quarry) | 134:89 | linnaala | -18, 18 | valmis | 0 | Ladu täis: Kivi |
| Elamu (house) | 134:89 | linnaala | -18, -30 | valmis | 0 | Valmis |
| Õpikoda (study) | 134:89 | linnaala | -18, -6 | valmis | 1 | Õpetlased uurivad |
| Põllutalu · farmerihoone (farm) | 134:89 | linnaala | -6, -18 | valmis | 4 | Ootab eraldi rajatud põldu samal ruudul |
| Puusepatöökoda (saw) | 134:89 | linnaala | -30, -30 | valmis | 0 | Ladu täis: Lauad |
| Kangakoda (weaver) | 134:89 | linnaala | -30, -6 | valmis | 1 | Toodab · 100% |
| Elamu (house) | 134:89 | linnaala | -6, -30 | valmis | 0 | Valmis |
| Savivõtukoht (claypit) | 134:89 | linnaala | 0, 36 | valmis | 0 | Ladu täis: Savi |
| Loomafarm (pasture) | 134:89 | linnaala | -6, -6 | valmis | 2 | Toodab · 100% |
| Pottsepatöökoda (pottery_kiln) | 134:89 | linnaala | -42, -18 | valmis | 2 | Toodab · 100% |
| Puitvall (palisade) | 134:89 | linnaala | -18, -36 | valmis | 0 | Valmis |
| Elamu (house) | 134:89 | linnaala | -18, -42 | valmis | 0 | Valmis |
| Kiviraiduri töökoda (mason) | 134:89 | linnaala | -18, 6 | valmis | 1 | Toodab · 55% |
| Metsniku maja (forester) | 134:89 | linnaala | 6, -18 | valmis | 2 | Otsib istutuskohta |
| Materjaliladu (warehouse) | 134:89 | linnaala | -42, -6 | valmis | 1 | Valmis |
| Kirjutuskoda (scriptorium) | 134:89 | linnaala | -30, -42 | valmis | 2 | Õpetlased uurivad |
| Käsiveski (mill) | 134:89 | linnaala | -30, 6 | valmis | 0 | Ootab: Vili |
| Pagariäri (bakery) | 134:89 | linnaala | -6, -42 | valmis | 0 | Ootab: Jahu |
| Elamu (house) | 134:89 | linnaala | -6, 6 | valmis | 0 | Valmis |
| Toidukelder (cellar) | 134:89 | linnaala | 6, -30 | valmis | 0 | Valmis |
| Elamu (house) | 134:89 | linnaala | 6, -6 | valmis | 0 | Valmis |
| Köögiviljaaed (vegetable_garden) | 133:89 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Rauakaevandus (mine) | 135:88 | linnaala | 0.5990694749198155, 8.18247837938543 | valmis | 0 | Ladu täis: Maak |
| Viljapuuaed (orchard) | 135:88 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Vääriskivikaevandus (gem_mine) | 132:90 | maakond | -18, -18 | valmis | 0 | Ootab tööjõudu |
| Siidikasvandus (silk_farm) | 133:90 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Vürtsiaed (spice_garden) | 135:89 | linnaala | -48, -42 | ehitamisel | 1 | Ehitab · 100% tööjõud |
| Värvitaimeaed (dye_garden) | 134:90 | linnaala | -48, -42 | ehitamisel | 0 | Ootab tööjõudu |

### Lõunaküla 7 — ID 24, ruut 142:84

Renessanss; 22 elanikku; majandusroll food. Ressursid: grain 2.93, meat 19.2, fish 0, water 42.95, iron 344.9, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 142:84 | linnaala | -18, -12 | valmis | 0 | Valmis |
| Metsamaja (lumber) | 142:84 | linnaala | 18, 24 | valmis | 2 | Raiub puud |
| Elamu (house) | 142:84 | linnaala | -30, -12 | valmis | 0 | Valmis |
| Õpikoda (study) | 142:84 | linnaala | -18, -24 | valmis | 1 | Õpetlased uurivad |
| Jahimehe onn (hunter) | 142:84 | linnaala | 12, -42 | valmis | 0 | Ladu täis: Liha |
| Elamu (house) | 142:84 | linnaala | -18, 0 | valmis | 0 | Valmis |
| Puusepatöökoda (saw) | 142:84 | linnaala | -6, -12 | valmis | 0 | Ladu täis: Lauad |
| Kangakoda (weaver) | 142:84 | linnaala | -30, -24 | valmis | 1 | Toodab · 100% |
| Loomafarm (pasture) | 142:84 | linnaala | -30, 0 | valmis | 0 | Ladu täis: Liha |
| Kirjutuskoda (scriptorium) | 142:84 | linnaala | -6, -24 | valmis | 2 | Õpetlased uurivad |
| Elamu (house) | 142:84 | linnaala | -6, 0 | valmis | 0 | Valmis |
| Metsniku maja (forester) | 142:84 | linnaala | -42, -12 | valmis | 2 | Otsib istutuskohta |
| Söepõletaja (coal) | 142:84 | linnaala | -18, -36 | valmis | 2 | Ladu täis: Süsi |
| Elamu (house) | 142:84 | linnaala | -18, 12 | valmis | 0 | Valmis |
| Rauasulatus (smelter) | 142:84 | linnaala | 6, -12 | valmis | 3 | Toodab · 100% |
| Põllutalu · farmerihoone (farm) | 142:84 | linnaala | -42, -24 | valmis | 0 | Ladu täis: Vili |
| Elamu (house) | 142:84 | linnaala | -30, -36 | valmis | 0 | Valmis |
| Juveliir (jeweler) | 142:84 | linnaala | -30, 12 | valmis | 0 | Ootab: Vask |
| Käsiveski (mill) | 142:84 | linnaala | -6, -36 | valmis | 0 | Ladu täis: Jahu |
| Juustukoda (dairy) | 142:84 | linnaala | -6, 12 | valmis | 0 | Ladu täis: Juust |
| Siidikudumiskoda (silk_weaver) | 142:84 | linnaala | 6, -24 | valmis | 1 | Toodab · 100% |
| Elamu (house) | 142:84 | linnaala | 6, 0 | valmis | 0 | Valmis |
| Materjaliladu (warehouse) | 142:84 | linnaala | -42, 6 | valmis | 1 | Valmis |
| Köögiviljaaed (vegetable_garden) | 141:84 | linnaala | -48, -42 | valmis | 0 | Ladu täis: Köögiviljad |
| Siidikasvandus (silk_farm) | 141:84 | linnaala | -48, -30 | valmis | 1 | Toodab · 100% |
| Linapõld (flax_farm) | 143:83 | linnaala | -48, -42 | valmis | 1 | Toodab · 100% |
| Viljapuuaed (orchard) | 141:85 | linnaala | -48, -42 | valmis | 0 | Ladu täis: Puuviljad |
| Vääriskivikaevandus (gem_mine) | 140:84 | maakond | -9, 45 | valmis | 0 | Ladu täis: Vääriskivid |
| Vürtsiaed (spice_garden) | 142:85 | linnaala | -48, -42 | valmis | 0 | Ladu täis: Vürtsid |

### Lõunaküla 8 — ID 27, ruut 145:85

Renessanss; 13 elanikku; majandusroll industry. Ressursid: grain 58.7, meat 55.35, fish 0, water 19.45, iron 120, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 145:85 | linnaala | -18, -18 | valmis | 0 | Valmis |
| Metsamaja (lumber) | 145:85 | linnaala | 18, -36 | valmis | 0 | Ladu täis: Puit |
| Elamu (house) | 145:85 | linnaala | -30, -18 | valmis | 0 | Valmis |
| Õpikoda (study) | 145:85 | linnaala | -18, -30 | valmis | 1 | Õpetlased uurivad |
| Jahimehe onn (hunter) | 145:85 | linnaala | -42, 18 | valmis | 2 | Jahib ulukeid |
| Elamu (house) | 145:85 | linnaala | -18, -6 | valmis | 0 | Valmis |
| Kivimurd (quarry) | 145:85 | linnaala | 18, -18 | valmis | 0 | Ladu täis: Kivi |
| Kirjutuskoda (scriptorium) | 145:85 | linnaala | -6, -12 | valmis | 2 | Õpetlased uurivad |
| Puusepatöökoda (saw) | 145:85 | linnaala | -6, -24 | valmis | 0 | Ladu täis: Lauad |
| Elamu (house) | 145:85 | linnaala | -30, -30 | valmis | 0 | Valmis |
| Kangakoda (weaver) | 145:85 | linnaala | -30, -6 | valmis | 0 | Ootab tööjõudu |
| Elamu (house) | 145:85 | linnaala | -6, -36 | valmis | 0 | Valmis |
| Söepõletaja (coal) | 145:85 | linnaala | -42, -18 | valmis | 0 | Ladu täis: Süsi |
| Kiviraiduri töökoda (mason) | 145:85 | linnaala | -6, 0 | valmis | 0 | Ladu täis: Tahutud kivi |
| Rauasulatus (smelter) | 145:85 | linnaala | -18, -42 | valmis | 0 | Ladu täis: Raud |
| Metsniku maja (forester) | 145:85 | linnaala | -18, 6 | valmis | 2 | Otsib istutuskohta |
| Akadeemia (academy) | 145:85 | linnaala | 6, -18 | valmis | 1 | Õpetlased uurivad |
| Metsamaja (lumber) | 145:85 | linnaala | -30, -60 | valmis | 0 | Ladu täis: Puit |
| Sõdalaste laager (barracks) | 145:85 | linnaala | -42, -30 | valmis | 0 | Valmis |
| Elamu (house) | 145:85 | linnaala | -42, -6 | valmis | 0 | Valmis |
| Põllutalu · farmerihoone (farm) | 145:85 | linnaala | -30, -42 | valmis | 4 | Hoburakend ja hõlmader |
| Põld · lohista ala (field) | 145:85 | linnaala | -76, -60 | valmis | 0 | 16 × 16 |
| Juustukoda (dairy) | 145:85 | linnaala | -30, 6 | valmis | 0 | Ootab tööjõudu |
| Juveliir (jeweler) | 145:85 | linnaala | 6, -30 | valmis | 0 | Ootab tööjõudu |
| Siidikudumiskoda (silk_weaver) | 145:85 | linnaala | 6, -6 | valmis | 0 | Ootab tööjõudu |
| Toidukelder (cellar) | 145:85 | linnaala | -6, -48 | valmis | 0 | Valmis |
| Tall (stable) | 145:85 | linnaala | -6, 12 | valmis | 0 | Valmis |
| Tinakaevandus (tinmine) | 145:85 | linnaala | 36, -18 | valmis | 0 | Ladu täis: Tina |
| Köögiviljaaed (vegetable_garden) | 144:85 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Linapõld (flax_farm) | 144:85 | linnaala | -48, -30 | valmis | 0 | Ootab tööjõudu |
| Rauakaevandus (mine) | 145:84 | linnaala | 18, 18 | valmis | 0 | Ladu täis: Maak |
| Viljapuuaed (orchard) | 145:84 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Vääriskivikaevandus (gem_mine) | 144:86 | linnaala | 27, -18 | valmis | 0 | Ootab tööjõudu |
| Siidikasvandus (silk_farm) | 146:85 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Vürtsiaed (spice_garden) | 146:84 | linnaala | -48, -42 | ehitamisel | 1 | Ehitab · 100% tööjõud |
| Värvitaimeaed (dye_garden) | 147:85 | maakond | -48, -42 | ehitamisel | 0 | Ootab tööjõudu |

### Lõunaküla 9 — ID 28, ruut 141:87

Renessanss; 13 elanikku; majandusroll industry. Ressursid: grain 91.99, meat 22.25, fish 0, water 100, iron 118.6, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 141:87 | linnaala | -18, -18 | valmis | 0 | Valmis |
| Kaev (well) | 141:87 | linnaala | -30, -18 | valmis | 1 | Toodab · 100% |
| Metsamaja (lumber) | 141:87 | linnaala | 18, -48 | valmis | 2 | Toob saaki |
| Elamu (house) | 141:87 | linnaala | -18, -30 | valmis | 0 | Valmis |
| Kivimurd (quarry) | 141:87 | linnaala | -18, 18 | valmis | 0 | Ladu täis: Kivi |
| Elamu (house) | 141:87 | linnaala | -18, -6 | valmis | 0 | Valmis |
| Kirjutuskoda (scriptorium) | 141:87 | linnaala | -6, -18 | valmis | 0 | Ootab tööjõudu |
| Põllutalu · farmerihoone (farm) | 141:87 | linnaala | -30, -30 | valmis | 2 | Hoburakend ja hõlmader |
| Puusepatöökoda (saw) | 141:87 | linnaala | -30, -6 | valmis | 0 | Ladu täis: Lauad |
| Põld · lohista ala (field) | 141:87 | linnaala | -76, -60 | valmis | 0 | 16 × 16 |
| Söepõletaja (coal) | 141:87 | linnaala | -6, -30 | valmis | 2 | Toodab · 100% |
| Elamu (house) | 141:87 | linnaala | -6, -6 | valmis | 0 | Valmis |
| Rauakaevandus (mine) | 141:87 | linnaala | 18, 18 | valmis | 0 | Ladu täis: Maak |
| Rauasulatus (smelter) | 141:87 | linnaala | -42, -18 | valmis | 3 | Toodab · 100% |
| Metsniku maja (forester) | 141:87 | linnaala | -18, -42 | valmis | 0 | Ootab tööjõudu |
| Juustukoda (dairy) | 141:87 | linnaala | -18, 6 | valmis | 0 | Ootab tööjõudu |
| Metsamaja (lumber) | 141:87 | linnaala | -54, -24 | valmis | 2 | Läheb metsa |
| Elamu (house) | 141:87 | linnaala | 6, -18 | valmis | 0 | Valmis |
| Sõdalaste laager (barracks) | 141:87 | linnaala | -42, -30 | valmis | 0 | Valmis |
| Kangakoda (weaver) | 141:87 | linnaala | -30, -42 | valmis | 0 | Ootab tööjõudu |
| Vääriskivikaevandus (gem_mine) | 141:87 | linnaala | -18, 36 | valmis | 0 | Ladu täis: Vääriskivid |
| Juveliir (jeweler) | 141:87 | linnaala | -30, 6 | valmis | 0 | Ootab tööjõudu |
| Siidikudumiskoda (silk_weaver) | 141:87 | linnaala | -6, -42 | valmis | 0 | Ootab tööjõudu |
| Tall (stable) | 141:87 | linnaala | -6, 6 | valmis | 0 | Valmis |
| Toidukelder (cellar) | 141:87 | linnaala | -42, -6 | valmis | 0 | Valmis |
| Savivõtukoht (claypit) | 141:87 | linnaala | 27, 0 | valmis | 0 | Ladu täis: Savi |
| Pottsepatöökoda (pottery_kiln) | 141:87 | linnaala | 6, -30 | valmis | 0 | Ootab tööjõudu |
| Elamu (house) | 141:87 | linnaala | 6, -6 | valmis | 0 | Valmis |
| Vasekaevandus (coppermine) | 141:87 | linnaala | 0, 45 | valmis | 0 | Ladu täis: Vask |
| Köögiviljaaed (vegetable_garden) | 141:86 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Vürtsiaed (spice_garden) | 141:86 | linnaala | -48, -30 | ehitamisel | 1 | Ehitab · 100% tööjõud |
| Linapõld (flax_farm) | 140:87 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Viljapuuaed (orchard) | 140:86 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Siidikasvandus (silk_farm) | 142:87 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Värvitaimeaed (dye_garden) | 141:88 | linnaala | -48, -42 | ehitamisel | 0 | Ootab tööjõudu |

### Lõunaküla 10 — ID 34, ruut 138:88

Renessanss; 7 elanikku; majandusroll energy. Ressursid: grain 3.5, meat 10.35, fish 0, water 100, iron 100.4, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 138:88 | linnaala | -18, -12 | valmis | 0 | Valmis |
| Kaev (well) | 138:88 | linnaala | -30, -12 | valmis | 0 | Ladu täis: Vesi |
| Metsamaja (lumber) | 138:88 | linnaala | -42, 24 | valmis | 2 | Läheb metsa |
| Jahimehe onn (hunter) | 138:88 | linnaala | 24, -42 | valmis | 2 | Jahib ulukeid |
| Elamu (house) | 138:88 | linnaala | -18, -24 | valmis | 0 | Valmis |
| Kivimurd (quarry) | 138:88 | linnaala | 18, -18 | valmis | 0 | Ladu täis: Kivi |
| Puusepatöökoda (saw) | 138:88 | linnaala | -18, 0 | valmis | 0 | Ladu täis: Lauad |
| Elamu (house) | 138:88 | linnaala | -6, -12 | valmis | 0 | Valmis |
| Söepõletaja (coal) | 138:88 | linnaala | -30, -24 | valmis | 0 | Ladu täis: Süsi |
| Rauakaevandus (mine) | 138:88 | linnaala | 15.837226253352128, 8.454742755657207 | valmis | 0 | Ladu täis: Maak |
| Rauasulatus (smelter) | 138:88 | linnaala | -30, 0 | valmis | 2.75 | Toodab · 93% |
| Sõdalaste laager (barracks) | 138:88 | linnaala | -6, -24 | valmis | 0 | Valmis |
| Elamu (house) | 138:88 | linnaala | -6, 0 | valmis | 0 | Valmis |
| Põllutalu · farmerihoone (farm) | 138:88 | linnaala | -42, -12 | valmis | 0 | Ootab tööjõudu |
| Juustukoda (dairy) | 138:88 | linnaala | -18, 12 | valmis | 0 | Ootab tööjõudu |
| Tall (stable) | 138:88 | linnaala | 6, -12 | valmis | 0 | Valmis |
| Elamu (house) | 138:88 | linnaala | -24, -36 | valmis | 0 | Valmis |
| Kangakoda (weaver) | 138:88 | linnaala | -12, -36 | valmis | 0 | Ootab tööjõudu |
| Juveliir (jeweler) | 138:88 | linnaala | -42, -24 | valmis | 0 | Ootab tööjõudu |
| Metsniku maja (forester) | 138:88 | linnaala | -42, 0 | valmis | 0 | Ootab tööjõudu |
| Köögiviljaaed (vegetable_garden) | 139:88 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Vääriskivikaevandus (gem_mine) | 139:88 | linnaala | 27, 45 | valmis | 0 | Ladu täis: Vääriskivid |
| Linapõld (flax_farm) | 137:89 | linnaala | -48, -42 | valmis | 0 | Ootab tööjõudu |
| Viljapuuaed (orchard) | 137:87 | linnaala | -48, -42 | ehitamisel | 0.25 | Ehitab · 31% tööjõud |
| Siidikasvandus (silk_farm) | 139:89 | linnaala | -48, -42 | ehitamisel | 0 | Ootab tööjõudu |
| Vürtsiaed (spice_garden) | 138:87 | linnaala | -48, -42 | ehitamisel | 0 | Ootab tööjõudu |

### Lõunaküla 11 — ID 36, ruut 130:86

Renessanss; 15 elanikku; majandusroll port. Ressursid: grain 0, meat 17.3, fish 0, water 100, iron 7.6, steel 0, machines 0, fuel 0.

| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |
|---|---|---|---|---|---:|---|
| Algusmaja · 3 töölist (hall) | 130:86 | linnaala | -18, -18 | valmis | 0 | Valmis |
| Kaev (well) | 130:86 | linnaala | -30, -18 | valmis | 0 | Ladu täis: Vesi |
| Metsamaja (lumber) | 130:86 | linnaala | -12, 24 | valmis | 0 | Ladu täis: Puit |
| Elamu (house) | 130:86 | linnaala | -18, -30 | valmis | 0 | Valmis |
| Puusepatöökoda (saw) | 130:86 | linnaala | -18, -6 | valmis | 0 | Ladu täis: Lauad |
| Söepõletaja (coal) | 130:86 | linnaala | -6, -18 | valmis | 0 | Ladu täis: Süsi |
| Savivõtukoht (claypit) | 130:86 | linnaala | 18, 18 | valmis | 0 | Ladu täis: Savi |
| Põllutalu · farmerihoone (farm) | 130:86 | linnaala | -30, -30 | valmis | 4 | Ladu täis: Vili |
| Elamu (house) | 130:86 | linnaala | -30, -6 | valmis | 0 | Valmis |
| Elamu (house) | 130:86 | linnaala | -6, -30 | valmis | 0 | Valmis |
| Elamu (house) | 130:86 | linnaala | -6, -6 | valmis | 0 | Valmis |
| Elamu (house) | 130:86 | linnaala | -42, -18 | ehitamisel | 1 | Ehitab · 100% tööjõud |
| Köögiviljaaed (vegetable_garden) | 131:86 | linnaala | -48, -42 | valmis | 1 | Ladu täis: Köögiviljad |
| Viljapuuaed (orchard) | 131:86 | linnaala | -48, -30 | valmis | 1 | Ladu täis: Puuviljad |
| Linapõld (flax_farm) | 131:87 | linnaala | -48, -42 | valmis | 1 | Toodab · 100% |
| Vääriskivikaevandus (gem_mine) | 130:88 | maakond | 9, -45 | valmis | 0 | Ladu täis: Vääriskivid |
| Siidikasvandus (silk_farm) | 131:88 | maakond | -48, -42 | valmis | 1 | Toodab · 100% |
| Vürtsiaed (spice_garden) | 129:87 | linnaala | -48, -42 | ehitamisel | 0 | Ootab tööjõudu |

## Muud põllumajandushooned

| Tüüp | Arv | Valmis |
|---|---:|---:|
| Köögiviljaaed (vegetable_garden) | 29 | 29 |
| Viljapuuaed (orchard) | 26 | 24 |
| Vürtsiaed (spice_garden) | 18 | 1 |
| Linapõld (flax_farm) | 23 | 23 |
| Vääriskivikaevandus (gem_mine) | 26 | 24 |
| Siidikasvandus (silk_farm) | 26 | 23 |
| Värvitaimeaed (dye_garden) | 13 | 0 |

## Kõigi ajastute lubatud uued üksused

Järgnev tabel on eraldi reeglikontroll, mitte väide, et AI päriskampaanias need kõik valmis värbas. Ressursid, tööjõud ja eeltingimuste hooned anti selles kontrollis ette. Vana üksus võib jääda armeesse ka hilisemas ajastus; uue tellimist kontrollitakse eraldi.

| Ajastu | Reeglitega lubatud üksused pärast ajastu avastusi | Tulevikuüksuste / -hoonete vigu |
|---|---|---:|
| Kiviaeg | Avastaja; Kiviviskajad; Puuodamehed; Kivikirvemehed; Vibukütid | 0 |
| Pronksiaeg | Avastaja; Pronksodamees; Pronkskirvemees; Pronksiaja vibukütt; Sõjavanker | 0 |
| Rauaaeg | Avastaja; Raudmõõgamehed; Ratsavägi; Müürilõhkuja; Piiramistorn; Varane kiviviskemasin; Rauaaja vibukütt; Heiteodamees | 0 |
| Keskaeg | Avastaja; Ristvibumees; Hellebardimees; Rüütel; Raskeratsavägi; Soomustatud jalaväelane; Katapult; Müürilõhkuja; Piiramistorn | 0 |
| Renessanss | Avastaja; Musketärid; Piigimees; Arkebuusimees; Kürassiir; Välisuurtükk | 0 |
| Tööstusajastu | Avastaja; Püssimehed; Rivijalavägi; Ratsalaskur; Vintraudne suurtükk | 0 |
| Moodne ajastu | Avastaja; Motoriseeritud jalavägi; Vintraudne suurtükk; Moodne jalavägi; Kuulipildujameeskond; Tank; Tankitõrjerühm | 0 |

## Katse kulg

| Käik | Ajastud Kadaka / Ida / Põhja / Lõuna | Linnu | Talusid | Põlde | Kaitserajatisi | Elusaid üksusi |
|---:|---|---:|---:|---:|---:|---:|
| 25 | Kiviaeg / Kiviaeg / Kiviaeg / Kiviaeg | 4 | 0 | 0 | 0 | 4 |
| 50 | Kiviaeg / Kiviaeg / Kiviaeg / Kiviaeg | 4 | 4 | 4 | 0 | 4 |
| 75 | Kiviaeg / Kiviaeg / Kiviaeg / Kiviaeg | 4 | 4 | 4 | 0 | 9 |
| 100 | Kiviaeg / Kiviaeg / Kiviaeg / Kiviaeg | 9 | 5 | 4 | 0 | 13 |
| 124 | Kiviaeg / Pronksiaeg / Kiviaeg / Kiviaeg | 18 | 16 | 6 | 0 | 15 |
| 125 | Kiviaeg / Pronksiaeg / Kiviaeg / Kiviaeg | 21 | 16 | 6 | 0 | 15 |
| 132 | Kiviaeg / Pronksiaeg / Pronksiaeg / Kiviaeg | 23 | 18 | 7 | 0 | 15 |
| 135 | Pronksiaeg / Pronksiaeg / Pronksiaeg / Kiviaeg | 24 | 20 | 9 | 0 | 16 |
| 137 | Pronksiaeg / Pronksiaeg / Pronksiaeg / Pronksiaeg | 25 | 20 | 9 | 0 | 16 |
| 150 | Pronksiaeg / Pronksiaeg / Pronksiaeg / Pronksiaeg | 25 | 21 | 10 | 5 | 17 |
| 175 | Pronksiaeg / Pronksiaeg / Pronksiaeg / Pronksiaeg | 28 | 23 | 10 | 31 | 20 |
| 191 | Pronksiaeg / Rauaaeg / Pronksiaeg / Pronksiaeg | 31 | 25 | 10 | 32 | 20 |
| 197 | Pronksiaeg / Rauaaeg / Pronksiaeg / Rauaaeg | 31 | 26 | 11 | 32 | 20 |
| 200 | Pronksiaeg / Rauaaeg / Pronksiaeg / Rauaaeg | 31 | 26 | 11 | 32 | 20 |
| 201 | Rauaaeg / Rauaaeg / Pronksiaeg / Rauaaeg | 31 | 26 | 11 | 32 | 20 |
| 205 | Rauaaeg / Rauaaeg / Rauaaeg / Rauaaeg | 31 | 26 | 11 | 32 | 20 |
| 225 | Rauaaeg / Rauaaeg / Rauaaeg / Rauaaeg | 36 | 30 | 13 | 33 | 20 |
| 236 | Rauaaeg / Rauaaeg / Rauaaeg / Keskaeg | 38 | 33 | 13 | 34 | 20 |
| 237 | Rauaaeg / Keskaeg / Rauaaeg / Keskaeg | 38 | 34 | 13 | 34 | 20 |
| 250 | Rauaaeg / Keskaeg / Rauaaeg / Keskaeg | 38 | 35 | 14 | 34 | 22 |
| 260 | Rauaaeg / Keskaeg / Keskaeg / Keskaeg | 38 | 35 | 14 | 34 | 22 |
| 275 | Rauaaeg / Keskaeg / Keskaeg / Keskaeg | 39 | 37 | 14 | 34 | 22 |
| 287 | Keskaeg / Keskaeg / Keskaeg / Keskaeg | 39 | 38 | 14 | 34 | 24 |
| 300 | Keskaeg / Keskaeg / Keskaeg / Keskaeg | 39 | 38 | 14 | 34 | 24 |
| 303 | Keskaeg / Keskaeg / Keskaeg / Renessanss | 39 | 38 | 14 | 34 | 24 |
| 308 | Keskaeg / Renessanss / Keskaeg / Renessanss | 39 | 38 | 14 | 34 | 24 |

## Järeldused ja vajalikud parandused

1. Lahinguväe planeerimisel tuleb avastajad lahinguväe värbamisvalikust, lahinguväe limiidist ja ründejõu võrdlusest välja jätta. Praegu on avastajal ajastupiirang küll õige, kuid AI kasutab teda lahinguväe täitena.
2. AI peab kavandama eraldi jala-, laskur-, ratsa- ning piiramisväe osakaalu ja ehitama selleks vajalikud väljaõppehooned. Praegune valik järjestab esmalt ajastu üksused kahju järgi ning kasutab seejärel fikseeritud varuvalikuid.
3. Põllutalu asukoht ja põllu sobivus tuleb otsustada koos. Viljatu keskusruudu korral peab AI rajama talu ning põllud maakonna viljakale ruudule; pelgalt keskusruudule talumaja lisamine jätab tootmise seisma.
4. Kindlustustele on vaja terviklikku ümber linna kulgevat plaani: müürijoon, pööratud külglõigud, väravad, ühendatud tornid ja läbipääsud. Praegune ehitusvalik ei taga isegi kõigi kaitseehitiste valmimisel sellist plaani.
5. Tornikaitsjate varustus tuleb siduda hilisemate ajastute ja avastustega. Praegu jääb varustus alates rauaajast muutumatuks.
6. Kui kogu põllumajandus peab kasutama eraldi põlde, vajavad sama teisendust ka lina- ja muud istandused. V127 eraldab ainult tavalise viljapõllu.

Auditi tulemus: **ajastulukud läbivad kontrolli, kuid AI tegelikud linnad ja armeed ei ole veel terviklikult ajastule vastavad ega hästi planeeritud.** Test ei tõesta kõigi riikide jõudmist moodsasse aega ega kindlustuste edukust päris lahingus.
