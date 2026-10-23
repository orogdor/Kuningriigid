# V127 — põllutalu, eraldi põld ja loomafarm

Põllutalu (`farm`) on nüüd farmerite hoone, mitte hoonega ühendatud põllulapp.
Põld (`field`) on eraldi rajatis. Vali toidumenüüst põld ja lohista hiire või
ühe sõrmega ristkülik; mõlemad küljed peavad jääma 8–64 mänguühiku vahele.
Põld peab mahtuma ühele viljaka pinnasega detailruudule. Valmis põllutalu peab
olema samal ruudul. Kahe sõrmega suum katkestab poolelioleva joonistamise.

Põld ei tohi kattuda hoone, maardla, teise põllu, vee ega liiga järsu maaga.
Joonistamise ajal näitab roheline/punane eelvaade sobivust. Põllu suurus säilib
salvestuses ja seda näeb hooneinfos. Maakonnas kasutavad talumaja ja iga põld
igaüks üht kohta senisest kolmest kohast.

Farmerid kõnnivad päriselt talust põllule ja liiguvad ridade vahel. Teekond
väljaspool põldu vilja ei anna. Ilma valmis ja aktiivse põlluta talu ei tooda.
Põld seotakse lähima töötava taluga, et kaks talu sama põldu topelt ei kasutaks.
Üks talu kasutab kuni nelja farmerit. Pindala ja ajastukohane töövõime piiravad
toodangut; pelgalt suurema ristküliku märkimine ei anna piiramatut vilja.

| Ajastu / avastus | Põllutöö viis |
|---|---|
| Kiviaeg | Kõblas, käsikülv ja käsitsi koristus |
| Pronksiaeg + loomade kodustamine | Härjarakend ja puuader |
| Rauaaeg + rauast adratera ja loomade kodustamine | Härjarakend ja raudader |
| Keskaeg + raske hõlmader | Hoburakend ja hõlmader |
| Tööstusajastu + mehaaniline viljalõikaja | Hoburakendiga koristusmasin |
| Moodne aeg + sisepõlemismootor + masin + kütus | Traktor/kombain kui koondatud mängumehaanika |

Numbrilised kiirused ja pindalad on mängutasakaalu parameetrid, mitte väide
tegeliku hektaritootluse kohta. Traktor vajab talu kohta üht masinat; seda ei
võeta igal töötsüklil uuesti. Kütus kulub ainult töötamisel. Kütuse lõppedes
kasutatakse varasemat teadaolevat tööviisi.

Loomafarm (`pasture`) on eraldi loomakasvatuse hoone: liha tootmine ja vee
tarbimine, avamiseks loomade kodustamine. See ei vaja enam põllutalu ega
teraviljamaardlat. Loomadel ja põllutalul on eraldi 3D-kujud; põllu töötajatel
on tööviisile vastavad lihtsustatud tööriista-, rakendi- või traktorikujud.

AI ehitab põllu eraldi tasulise ehituskäsuga. Ebaõnnestunud kohaotsingul on
60 mängusekundi ooteaeg. Vanade salvestuste taludele lisatakse ühekordselt
16 × 16 pärandpõld, kui ruumi ja maakonna ehituskohti jätkub. Vastasel juhul
säilib talu, kuid mängija peab rajama sobiva põllu. Vanad ehitised ei kao.

## Kontrollid

- `TEST_V127.mjs`: mõõtmed, märg maa, eraldi põllu nõue, farmeri teekond,
  põllul töötamine, topeltkasutuse vältimine, avastuste ja kütuse nõuded,
  loomakasvatus, pärandteisendus, päris ehituskäsk ja salvestuse laadimine.
- `TEST_V126.mjs` ja `TEST_V125.mjs`: maakonnad ning eelmise versiooni põhireeglid.
- Uute 3D-kujude loomine ja piirdekastide lõplikkus kontrollitud Node/Three.js abil.
- JavaScripti süntaks ja `git diff --check`.
- Brauseri visuaal- ning puutejuhtimise test jäi kinnitamata: Chromium puudub
  ja Playwrighti brauseripaketi allalaadimine andis vigase ZIP-faili.

## Ajalise jaotuse taust

- [The Met: arhailine härgadega künnistseen](https://www.metmuseum.org/art/collection/search/902320).
- [Illinois State Museum: 19. sajandi põllumajandusmasinad](https://www.museum.state.il.us/exhibits/agriculture/htmls/technology/horse-drawn/tech_horse-drawn_early.html).
- [USDA: traktorite ja koristusmasinate kasutuselevõtt 20. sajandil](https://www.nass.usda.gov/Publications/Trends_in_U.S._Agriculture/Mechanization/).
