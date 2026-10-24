# Kuningriigid → Godot 4: pordi seis (2026-10-24)

## V5.2 / Godot Dev 130 – mobiilne lahingujärjekorra ülevaade ja tegelik lahinguraport (2026-10-24)

- `campaign_battle_brief_port.gd`: uus lugemiseks mõeldud raportimoodul loetleb aktiivse lahingu ja kuni 32 ootel mitme rinde kokkupõrget koos koordinaatide, armee ID-de, päris riiginumbrite ja tegelike elusate üksuste arvuga. Annab kokkuvõtte kampaania registreeritud, aegunud ja lõpetatud lahingutest.
- Viimase lahingu kokkuvõte kasutab ainult olemasolevat `battle_log` salvestatud tulemust: maailma koordinaadid, võitja, mehed alguses/reservis, langenud riikide kaupa, noole/kivi laskude ja tabamuste hulk, lahingu sammud, taganemised, linnavallutus ning piiramisstaatistika (müüri läbimurded ja rammilöögid). Kui andmeid pole, kuvatakse seda ausalt, mitte ei genereerita väljamõeldud arve.
- `game/scripts/main.gd`: kampaania mobiilmenüüs **LAHINGURINDED JA RAPORT**. Puuteekraanisõbralik ülekate: keskel 88% laiusest keritav tekst, rinde valik `OptionButton` kaudu ning kolm vähemalt 60 px kõrgust nuppu `UUENDA`, `NÄITA RUUTU` (valitud rinde maailmaruudule) ja `SULGE`. Paneel ei muuda lahingut ega loo uusi üksusi.
- 11 uut regressioonitesti: aktiivse ja ootel rinde täpsed andmed, maailmakaardi koordinaatide vormindamine, korrektse tühja/vanema raporti käitumine, päris kaotused/saagid, müürikahjud, viimase võidu detailid, lahingulogi JSON-salvestatavus ja raporti kõrvalmõjudeta toimimine.
- Godot Actions **913/913 regressioonitesti**, Android APK eksport, Godoti import, PCK bootstrap: https://github.com/orogdor/Kuningriigid/actions/runs/40122154925
- Avaldatud Dev 130 APK ja PCK: https://github.com/orogdor/Kuningriigid/releases/tag/godot-dev-130
- Pordi **hinnanguline valmidus ~75%**, eelmine ~73%.

**Veel tegemisel:** mitme samal maailmaruudul osaleva eraldi armee ühendamine tõeliseks üheks suureks taktikaliseks kokkupõrkeks, mobiilsete lahingute reaalaja valiku graafika, täielik simultaanne taktikaline lahinguarvutus, Androidi pärisseadme visuaal-/jõudlustestid. Uue UI automaattestid katavad GDScripti kompileerimise ja andmete vormindamise, mitte päris seadme puuteergonoomika.


## V5.1 / Godot Dev 127 – mitme rinde salvestatav lahingujärjekord (2026-10-24)

- Uus `campaign_battle_queue_port.gd`: kogub eri maailmaruutude vastasarmeede kokkupõrked kuni 32 kirjena püsivasse `pending_battles` järjekorda ka ajal, mil üks `individual_battle` juba käib. Järjekord on deterministlik (maailmarea/veeru ning armee ID järgi), väldib ühe armee samaaegset topeltkaasamist ja peatab ootel armeede maailmakaardi marsi just nende kokkupõrkekohal.
- Uue taktikalise lahingu algust kontrollitakse olemasoleva `IndividualBattle.start` kaudu ainult siis, kui eelmine lahing on lõppenud. Enne käivitamist kinnitab süsteem, et mõlemad armeed on endiselt vastasriikidest, samal maailmaruudul, elus ning mitte taganemisel. Vananenud järjekorrakanded jäetakse välja – nende eest ei anta tasuta võite, üksuseid ega vallutusi.
- `individual_battle_port.gd`: pärast päris lahingu lõppu saab 30-sekundilise lahingusse taassiseneva pausi ainult kaks osalenud armeed; teiste rindelõikude ootel lahingud ei pea ülemaailmse pausi lõppu ootama. Lahingu XP, kahjud, taganemine, müüride kahjustamine ja vallutamine töötavad endiselt olemasoleva simulatsiooniga.
- `battle_preview_port.gd` ja `preview_sim_port.gd`: kampaania kokkupõrgete tuvastus ja järjekorra teenindamine toimuvad igal simuleeritud aja sammul, sealhulgas käimasoleva lahingu ajal. Vanad sünteetilised benchmark-lahingud jäävad eraldi, muutmata. Varasemad salvestused saavad puuduvate järjekorraväljade korral automaatselt tühja järjekorra.
- `main.gd`: kampaania ja sõjaväe info näitavad järjekorras ootavate lahingute arvu. Uued automaattestid kontrollivad 3 eri rinde järjekorda, liikuvate armeede paigalhoidmist, mängu salvestamist, kahe tõelise lahingu algust/lõppu, teiste rinnete cooldown'i sõltumatust, hävinud armeede aegunud kohtumise tühistamist ja vanade salvestuste ühilduvust.
- GitHub Actions edukas, **902/902 regressioonitesti** + Godoti import, Android APK eksport ja PCK bootstrap smoke test: https://github.com/orogdor/Kuningriigid/actions/runs/40121257125
- Avaldatud: https://github.com/orogdor/Kuningriigid/releases/tag/godot-dev-127
- Pordi **hinnanguline valmidus ~73%**, enne ~71%.

**Piirang:** korraga arvutatakse üks päris taktikaline lahing; teised on järjekorras, mitte mitmel protsessoril samaaegselt simuleeritavad. Lahingujärjekord ei lisa veel kasutajale mitme paralleelse lahingukaardi vahel valimise graafilist menüüd; päris Androidi seadmel kontrollimine on jätkuvalt vajalik. Järgmine sobiv etapp: mobiilne lahingujärjekorra vaade, iga lahingu üksikasjalikum strateegiline raport ning mitme armee kaasamine ühte suuremasse kokkupõrkesse.


## V5.0 / Godot Dev 121 – päriselt liikuvad ja haavatavad piiramiskonvoid (2026-10-24)

- `campaign_siege_supply_port.gd`: AI kindlustatud linna taktikalise lahingu alguses valitakse tema enda linnast **läbitav maismaatee** piiramiskohale. Sobiva varu korral saadetakse kuni 93 puitu, säilitades saatval linnal vähemalt 25. Lähtekoha varu väheneb väljasaatmisel ning lahinguplatsile saab materjal alles päris liikumise järel (2 mängusekundit/maailmaruut). Kui sobivat teed või varu pole, tasuta materjali ei teki.
- Konvoil on salvestatav alguslinn, last, koordinaadid, marsruut, teepunkt, liikumisaeg ja olek `moving/delivered/lost`. Vaenlase elusate vägede poolt hõivatud ja sama ruudu sõbraliku saatjata konvoi hävitatakse, last läheb kaotsi ning see kajastub statistikaväljadel. Sama koorma eest teistkordset mahaarvestust ega tasuta saatmist ei toimu.
- `individual_battle_port.gd`: AI seotud linnapiiramises tellitakse päris ramm, redel või piiramistorn **alles pärast konvoi saabumist**; töötlemine toimub tavalise simuleeritud `tick` aja jooksul. Mängija olemasolevad käsitsi tellitavad tööd säilivad.
- `siege_port_v131.gd`: AI piiramistööde puidukulu võetakse ainult lahingukoha eraldatud `supply_wood` varust. Varem ründaja mis tahes kauge linna laovaru otse kasutatav tee on AI puhul eemaldatud.
- Testid: enne saabumist tasuta töö puudumine; tegelik marsruut ja lähtevaru vähenemine; ramm+redel pärast saabumist; puidu täpne jääk ja ehitusajad; korduvlaadimise vältimine; vaenlase rünnakuga konvoi hävitamine; liikuva ja saabunud konvoi salvestus/laadimine; avatud värava piiramistorn; mängija käsitsi juhtimise säilimine; materjalipuudusel piiramisvahendite puudumine.
- GitHub Actions **889/889 regressioonikontrolli**, Godoti import, PCK smoke test ja Android debug APK eksport edukad: https://github.com/orogdor/Kuningriigid/actions/runs/40120205548
- Väljalase: https://github.com/orogdor/Kuningriigid/releases/tag/godot-dev-121
- **Godoti pordi hinnanguline valmidus ~71%**, eelnevalt ~69%. Hinnang põhineb teostamata töö mahul, mitte automaatsel mõõtmisel.

**Piirangud:** praegu liigutatakse piiramislahingu alguses üks konvoi; puudub mitme lainena jätkuv varustamine, ratsastatud eskort, konvoi tagasiteekond ning kaotatud varustuse hilisem uuesti hankimine. Kui lahing lõpeb enne konvoi saabumist, ei anta väljasaatmisel kulutatud koormat maagiliselt lähteasulasse tagasi. Mitme paralleelse taktikalise lahingu täielik simulatsioon, pikema kampaania AI ning Androidi pärisseadme test on jätkuvalt tegemata.


## V4.9 / Godot Dev 116 – automaatne päris piiramistehnika AI-le (2026-10-24)

- `campaign_siege_ai_port.gd` seob AI piiramistaktika olemasoleva `Siege.start_ladder` ja `Siege.start_assault_work` mootoriga. AI ehitab kindlustatud linna päris lahingus eelistatult rammi (55 puitu, 90 s), lisaks sobiva salgu abil redeli (18 puitu, 30 s). Juba avatud värava korral oskab kasutada piiramistorni (75 puitu, 120 s), kui ründesalk ja puit on olemas.
- Maksimaalselt kaks piiramisvahendi ehituskäsku ühe lahingu alguses; igal töödel päris `owner`, progress, kohale liikumine, valmimisaeg ja olemasolev kokkupõrke-/müürikahjustuse loogika. Kulud arvestatakse maha AI riigi linna puiduvarust, mitte ei teki tasuta masinaid.
- `individual_battle_port.gd`: AI ehitustööde automaatne algus toimub üksnes salvestatud linnamüüriga seotud lahingu käivitamisel, kui ründajaks on AI riik (mitte mängija). Korduva väljakutse korral materjalikulu ei dubleerita; kulud ja tööd on JSON-salvestatavad.
- **11 uut testi** kontrollivad päris seotud piiramislahingut, kahte tööjärjekorda, 73 puidu tasumist, tegelikke töötaimereid, idempotentsust, kampaania statistikat, salvestatavust, vahendite puudumist materjalipuudusel, avatud värava torni ja seda, et mängija armeele AI ehitust ei tellitaks.
- GitHub Actions **881/881 regressioonitestid**, Godoti import, Android debug APK eksport ning bootstrap PCK laadimine läbitud: https://github.com/orogdor/Kuningriigid/actions/runs/40119385444
- Väljalase: https://github.com/orogdor/Kuningriigid/releases/tag/godot-dev-116
- **Pordi hinnanguline valmidus ~69%**, eelmine ~67%.

**Teadaolevad piirangud:** piiramistarvikute materjal võetakse praegu ründaja riigi mis tahes piisava puiduvaruga linnast; tegelik pikamaaline varustuskonvoi ja selle haavatavus pole veel porditud. Piiramisvahendite valik on algeline ega kohane pidevalt lahinguolukorraga. Eri rinnete lahingud lahendatakse endiselt järjest, mitte paralleelselt. Androidi pärisseadmel pole seda funktsiooni eraldi kontrollitud.


## V4.8 / Dev 113 – mitmest linnast koonduvad päris piiramisarmeed (2026-10-24)

- `campaign_rally_port.gd`: kui AI-l on kindlustatud vastaselinn käeulatuses, kuid koduarmee on alla 4 üksuse (või vajab pärast kodugarnisoni jätmist täiendust), valib ta liitlaste teise linna olemasoleva doonorarmee. Donorist suunatakse osa päriselt juba värvatud üksusi eraldi marssivasse koondusüksusse, jättes linnale vähemalt 1 kaitseüksuse.
- Koondusüksus peab läbima tegeliku, läbitava maa marsruudi. Üksused liidetakse juhtarmee alla alles sama maailmaruudu saavutamisel, seega vahepealset teleporti ega tasuta sõjaväge ei teki. Juhtarmee säilitab koondumise ajal oleku `assembly`, abiarmee `rally`, mõlemad ja sihtlinn kirjutatakse tavalisse salvestusse. Lahingus osalevaid armeesid ei ühendata.
- Koondatud vägi saab käsu algselt valitud kindlustatud linnale; kui liitumise järel on vähemalt 5 sõdurit ja kodulinnas puudub teine garnison, jäetakse üks sõdur linna ning vähemalt 4 üksust saadetakse piirama. Senine kolme samaaegse strateegilise rinde ja tegelike taktikaliste piiramiste mootor säilib.
- Uued testid tõestavad 3+3 üksuse juhtumi: lähteasula garnisoni jääb 1 sõdur, koonduslinna garnisoni 1, 4 liigub linnapiiramisele; kõigi kuue samaaegne summa säilib, koondusvägi läbib reaalse maailma marsruudi ja salvestus säilitab keskse ülesande.
- GitHub CI: **870/870 regressioonikontrolli**, Godoti parser, Android APK ehitus ja PCK bootstrap testi läbimine: https://github.com/orogdor/Kuningriigid/actions/runs/40118763677
- Avaldatud APK ja mängupakett: https://github.com/orogdor/Kuningriigid/releases/tag/godot-dev-113
- Üldpordi **hinnanguline valmidus ~67%**, varasem ~65%; protsent on teostamata töö hinnang, mitte automaatne mõõdik.

**Alles töös:** korraga mitme taktikalise lahingu simulatsioon, koondusüksuste ümberplaneerimine ootamatu ründaja/kaotatud juhtarmee korral, AI varustus ja logistika pikematel sõjakäikudel, piiramismasinate täielik AI tootmine ning päris Androidi jõudlus. Automaattestid ei kinnita kasutaja seadme OTA värskendust.


## V4.7 / Godot Dev 109 – strateegiline linnakaitse ja tugevamad piiramisarmeed (2026-10-24)

- `campaign_defense_port.gd`: AI riik tuvastab oma linna lähikonnas (Manhattani kaugus kuni 7 maailmaruutu) reaalselt elusate vaenlasüksuste surve. Ohu korral hindab linna garnisoni ja juba teel olevate abivägede suurust ning käsib olemasoleval sobival ründearmeel pöörduda linna poole. Käsk on päris maailmakaardi rajaleidmisega ja säilib salvestuses; üksuseid ei looda ega teisaldada silmapilkselt.
- Tagasi ei kutsuta poolelioleva taktikalise lahingu osalisi, põgenevaid armeesid ega väge, mis juba hõivab vaenlase linna. Samale abiväele ei anta korduvkäsku. Ohu möödumisel saab sihtlinna jõudnud abiväest taas reserv.
- `campaign_war_port.gd`: ohu all oleva kodulinna vägedel ei lasta lihtsalt uuele ründele lahkuda; piiramisrünnak vajab vähemalt **4 elusat sõjaväeüksust pärast ühe garnisoniüksuse eraldamist**, kindlustamata sihtmärkide puhul jääb 2-üksuseline lävend. AI värbamine võib tõsta kodulinna paigutatud vägede arvu kuni kuue üksuseni; juba olemasolev garnison saab kasvada uueks ründearmeeks, jättes ühe üksuse linna.
- `main.gd`: strateegiline kaitseplaneerija töötab igal kampaaniakäigul pärast värbamist ja enne uusi rünnakukäske, kuvab tagasikutsutud armeede arvu. Olemasolev Dev 102 mitme rinde AI ning Godoti OTA APK/PCK eristus säilitati.
- Testid katavad alamehitatud kindlustatud linna rünnaku vältimist, nelja üksusega päris ründekäsku, üksuste jagamise jäävust, abivägede tagasikutsumist ja liikumistee püsivust, duplikaatkäskude vältimist, linnakaitsjate paigalejäämist ning vanasse kampaaniasalvestusse sobivust.
- Godot Actions CI: **860/860 regressioonitesti**, parser, PCK laadimistest ja Android debug APK eksport läbitud: https://github.com/orogdor/Kuningriigid/actions/runs/40118073210
- Avaldatud pakett: https://github.com/orogdor/Kuningriigid/releases/tag/godot-dev-109
- Pordi **hinnanguline valmidus ~65%** (töömahu hinnang, eelnevalt ~63%).

**Alles tegemisel:** mitme iseseisva *taktikalise* lahingu samaaegne simulatsioon, kahe armee täielik ühendamine teekonnal, arenenud piiramismasinad AI käsul, mitme linna täpne sõjaväeline majandus ja Androidi pärisseadme visuaal-/jõudlustestid. CI kinnitab automaatse testikäigu, mitte kõiki mobiilikasutuse olukordi.


## V4.6 / mitme linna sõjaväe-AI ja korraga mitu rinnet (Dev 102, 2026-10-24)

- `campaign_war_port.gd`: erinevates AI linnades ehitatakse makstud sõjaväelaagreid ja värvatakse sama käigu jooksul, kuni 3 värbamiskäsku riigi kohta; kogu riigi värbamismaht kasvab linnade arvuga, ülempiiriga 12 elusat üksust. Iga ehitus- ja väljaõppekäsk läbib olemasoleva elanikkonna, teaduse, hinnakirja ning ressursside kontrolli.
- Vähemalt kolme üksusega linnakaitsjate armeest eraldatakse ühe sõduri garnison. Ülejäänud vähemalt kaks üksust saavad ründekäsu. Kaks üksust ühe AI linna varases proovikampaanias jäävad varasema Dev 96 käitumisega ühilduvaks, kuid mitme linna AI jätab ilma kohaliku garnisonita 2-üksuselise väe tugevnemist ootama.
- Sõjakäikude plaan määrab **kuni 3 iseseisvat rinnet riigi kohta**, eelistab teistest ründearmeedest erinevaid vaenlaslinnu, proovib läbitavat maailmakaardi marsruuti ja väldib liikumiskäskude kordamist. Kohtumise hetkel võivad muud armeed strateegilist liikumist jätkata; aktiivses lahingus osalevatele armeedele uut käsku ei anta.
- Armee `strategic_role`, `campaign_target_city`, `home_city_id`, garrisoni stats ning tee on salvestatavad, mitte pelgalt kuvaolek.
- Uued testid: mitme linna päriselt tasuline ehitus ja värbamine, 3 samaaegse strateegilise rinde eraldi sihtkohad, kodulinna alles jäänud garnisonid, lahinguga paralleelne AI käskude jagamine, korduvkäskude vältimine ning salvestus/laadimine.
- CI **850/850** Godoti regressiooni roheline; headless import, bootstrap PCK smoke test ning Android APK ehitus edukad. CI https://github.com/orogdor/Kuningriigid/actions/runs/40117310059
- Väljalase: https://github.com/orogdor/Kuningriigid/releases/tag/godot-dev-102
- **Hinnanguline valmidus ~63%** (töömahu hinnang; eelmisel etapil 61%).

**Järgmised kitsaskohad:** samaaegsete strateegiliste sõjakäikude puhul on taktikalise võitluse mootoris endiselt vaid üks aktiivne lahing. Garnisonide pikaajaline hooldus, suure sõjajõu koondamine, ressursiteede sõjaline kaitse, diplomaatia ning AI vägede tagasikutsumine vallutatud linnadest vajavad järgmisi etappe. Testid ei tõenda Androidi pärisseadme jõudlust ega OTA õnnestumist igas telefonis.


## V4.5 / Dev97 arendusetapp, avaldatud Godot Dev 100 (2026-10-24)

- `campaign_siege_port.gd`: kampaanias kindlustatud linnale kohale jõudnud vähemalt kahe vaenlase üksuse vastu kutsutakse vajadusel päris erakorraline mobiliseeritud odamees. Garnison maksab **1 elaniku, 8 puitu ja 2 kivi**; tasuta kloonarmeesid ei teki.
- `campaign_war_port.gd` seob garnisoni AI sõjakampaaniaga, `main.gd` proovib piiramist enne käigu simulatsiooni ja pärast armee saabumist. Olemasolev `IndividualBattle.start` loob ehitatud vallile päris piiramislahingu, koos väravate, müüride, nurgatornide ja linnakaitsjatega. Tegelikult vallutatud keep muudab linna omanikku senise `CityCapture` teekonna kaudu.
- Kui kindlustatud linnal pole kaitseväge ning ei jätku rahvast või varustust uue garnisoni mobiliseerimiseks, peab vähemalt kahe üksusega piirav vaenlane viibima seal **6 eri kampaaniakäiku**, enne kui linn alistub blokaadi tõttu. See märgitakse eraldi `blockade_surrender` sündmusena, mitte ei nimetata taktikalise lahingu võiduks. Topeltkäikude arvestus, omanikuvahetus ja salvestatav blokaadi edenemine on kontrollitud.
- Uued testid: ressursikulu, rahvaarvu muutus, päris sidus piiramislahing, topeltgarnisoni puudumine, oleku JSON-säilivus, keep'i vallutuse omanikuvahetus, 6 käigu blokaad ja topeltvallutuse vältimine.
- GitHub Actions **841/841** regressioonikontrolli läbitud, Godoti import, PCK laadimistest ja Android debug APK eksport edukad.
- GitHub CI: https://github.com/orogdor/Kuningriigid/actions/runs/40116326025
- Avaldatud APK/PCK: https://github.com/orogdor/Kuningriigid/releases/tag/godot-dev-100
- **Hinnanguline pordi valmidus ~61%** (töömahu eksperthinnang, mitte automaatmõõtmine; eelmise etapi hinnang oli 59%).

**Piirangud:** kaitseva garnisoni mobiliseerimine töötab praegu kindlustatud linna *keskruudul*, mitte veel igal 12×12 linnaalal; kindlustamata linnade automaatkaitse ja pikema mitme-armee sõjakäigu AI vajavad edasiarendust. Tornides on endiselt varasem V131 ajutine kaitsjate loogika; seos linna püsiva palga- ja vägede süsteemiga vajab täiendamist. Tegelik Androidi kasutajakogemus ning OTA paketi vahetus pärisseadmel ei ole selle CI-ga eraldi kinnitatud.


## V4.3 / liikuvad asutajad ja AI riikide laienemine (2026-10-24)

- `settler_campaign_port.gd`: päris kampaania asutamisülesanded `settler_missions` (JSON-püsiv), iga käik 3 **kõrvuti olevat maismaaruutu**, teekond kuni 40 ruutu. Ressursid ning kolm elanikku võetakse lähteasulast asutaja teele saatmisel. Uus linn luuakse **alles pärast asutaja päriselt sihtkohta jõudmist**, ilma varusid topelt kulutamata.
- `native_settler_view.gd`: iga asutaja on mängu maailmakaardil nähtav riigivärvilise kerge 3D silindermarkerina; kuvamine värskendatakse iga käiguga ja salvestusest laadimisel.
- Telefoni kategoorias **Kampaania → SAADA ASUTAJA valitud ruudule** ja **Asutajate teekonnad**. Uus asutaja, tema marsruut, käigupikkus, lähteasula, riik ja asukoht säilitatakse eraldi kampaaniasalvestuses.
- Asustamise sihtkoha hõivamisel või läbimatu kaardiruudu korral asutaja ülesanne tühistatakse. Kui lähteasula kuulub endiselt samale riigile, tagastatakse 3 elanikku ja asutamise ressursid (mitte vallutatud vaenlaslinnale).
- `CityFounding.complete_reserved` on ühine linnaks muutmise teekond, mida saab kasutada pärast asutaja kohalejõudmist ja mis ei arva topelt maha juba tasutud varusid.
- AI jaoks `SettlerCampaign.ai_expand`: proovib igal 8. käigul, alates käigust 8, saata riikides 1–3 kuni ühe uue asutaja riigi kohta, eeldusel et `settlement` on avastatud ning sobiv asutav linn ja kuiva maa tee eksisteerivad. Üks riik ei saada samal ajal mitut asutajat.
- Kontrollitud **804/804** Godoti regressioonitesti, sh poole teekonna pealt salvestus/laadimine, 20 ruudu läbimine seitsme käiguga, asutamise puudumine enne saabumist, blokeeritud tee ja kulude hüvitus ning kõigi kolme AI riigi asutajakäsud. Androidi debug APK eksport, PCK laadimistest ja eelväljalaske avaldamine läbitud.
- CI: https://github.com/orogdor/Kuningriigid/actions/runs/40114413987
- GitHubi uus versioon: https://github.com/orogdor/Kuningriigid/releases/tag/godot-dev-91
- **Hinnanguline kogu pordi valmidus ~56%** (töömahul põhinev hinnang, mitte automaatmõõdetud funktsioonide protsent).

**Piirangud:** asutajad on lihtsustatud käsukampaania (mitte veel taktikalises lahingus osalevad üksused). Liikumine on hetkel käikude kaupa nähtav, ilma kaaderhaaval vaheanimatsioonita. Teel olevad üksused ei kasuta veel täielikku varude, diplomaatia, ilmastiku ja sõjalise eskortimise süsteemi. AI hakkab laienema ainult siis, kui tema linnade majandus ja teadus seda tegelikult võimaldavad. Riikliku maakasutuse ja ajaloolise strateegilise asustuse tasakaalu peab pikemas mängus edasi katsetama.

## V4.2 / kampaanias päris uue linna asutamine (2026-10-24)

- `game/scripts/core/city_founding_port.gd`: võimalik rajada oma riigile uus linn kasutaja valitud maailmaruudule, kui `settlement` tehnoloogia on avastatud, valitud maal on läbitav maa, puudub olemasolev territoriaalne omanik, linnade vahe vähemalt 17 ruutu ja asutavast linnast on kuni 40-ruuduline läbitav maismaatee. Minimaalne lähteasula elanikkond **6**, asutamine kolib **3 elanikku**.
- Ressursikulu on **55 puitu, 16 kivi, 18 ühikut toitu ja 12 vett**, mis arvestatakse maha *lähteasula* varudest; uue linna algvaru **25 puitu, 8 kivi, 10 toitu, 12 vett**, ülejäänud kulu katab uue peahoone ja kolimise. Teadaolevate pakkumiste hinna ja elanike kontroll toimub enne ühegi ressursi mahaarvamist.
- Uus linn saab püsiva unikaalse ID, linna `team`, `age`, tühjad veod/majanduse seisu, peahoone ja linnaplaani krundi. Rajamislugu (`founding_log`) sisaldab vanemlinna ID-d, pikkust ja käiku. Territooriumi omanikud ja 3D linnanäitajad uuendatakse.
- Telefoni menüüs **Kampaania → ASUTA LINN valitud kaardiruudule** ning **Asutamise tingimused**; asutamisel tehakse kohene kampaania autosalvestus. Käivitamisel saab hiljem laadida ka **algse manifesti linnade arvust suurema** kontrollitud salvestuse; manifesti olemasolevate linnade ID-d ja koordinaadid peavad olema muutumatud.
- Regressioonitestid: asustustehnoloogia, 17-ruudu vahe, maa/meri, vastaslinna süda, 40-ruudune läbitavus, pop-3 arvestus, tegelik materjalikulu, tasuta duplikaatasula vältimine, territooriumi kinnistamine ja salvestamise/laadimise säilimine.
- Kontrollitud CI **786/786**, Androidi APK ja PCK edukas, `BOOTSTRAP_PACK_VERSION: godot-dev-84`: https://github.com/orogdor/Kuningriigid/actions/runs/40113588497
- Väljalase: https://github.com/orogdor/Kuningriigid/releases/tag/godot-dev-84
- Üldpordi hinnanguline valmidus **53%** (subjektiivne töömahu hinnang; päris Androidi UX-i kontroll pole selle CI osana tehtud).

**Järgmine oluline osa:** praegu asutatakse uus linn ühe käsuga pärast maismaaraja ja ressursside kontrolli. See ei ole veel maailmakaardil *füüsiliselt liikuv asutajaüksus*. Järgmises etapis tuleb teha asutaja liikumine, AI oma linnade asutamine ja vastasriikide tõeliselt strateegiline laienemine.

## V4.1 / esimene päriselt käigupõhine kiviajast pronksiajani kampaania (2026-10-24)

- Uus `campaign_play_port.gd`: 4-riigiline mänguolek, mängijariik 0, konkurentide AI 1–3, üks käik = täpselt **60 mängusekundit**, kampaania vooruarvestus, edetabel, eesmärk, võit/kaotus ning JSON-sõbralik käiguajalugu.
- Mängija eesmärk selles esimeses vertikaallõigus: jõuda **pronksiaega ja 20 elanikuni** enne 90. käiku, võit kaotatakse oma linnade kadumisel või käigulimiidi täitumisel. Kasutatakse olemasoleva 14-linnalise V129 proovikaardi nelja riiki. Uute linnade asutamise ja kogu V153 juhtimise pariteeti veel ei ole.
- Telefoni menüüs uus esimene kategooria **Kampaania**, kus saab alustada uut mängu, ehitada oma linnas, valida järgmise uuringu, lõpetada käigu, avada oma järgmise linna, näha nelja riigi punktiseisu, salvestada ja laadida.
- Käigu lõpetamisel kutsutakse `PreviewSim.tick(state,60.0)`: majandus, inimeste vajadused, tootmine, teadus, AI ehitused/uuringud, kaubandus ja sõjaline liikumine. Demokraamistikust ei võltsita eraldi ressursse ega uudiskäske.
- Automaatne salvestamine iga käigu järel faili `user://kuningriigid_campaign_v1.json`; varasem `user://v131_godot_preview_v25.json` säilib eraldi. `PreviewSim.load_preview` toetab faili valikut ning vanade testisalvestuste lugemist.
- Mängujuhtimises keelatakse kampaania ajal kunstlikud näidisstsenaariumid, AI väljalülitamine, kontrollimatu ajakerimine ja vastasriigi linnas ehitamine. Uue mängu alustamisel eelmiste demode teed ja makstud rajatised ei kandu kaasa. Linna omanikuvärv loetakse aktiivsest mänguseisust pärast vallutusi.
- `game/tests/port_checks.gd` kontrollib päris engine tick'i ja 13 käiku (780 mängusekundit), AI uurimis- ning ehituskäske, ressursside tootmist/majandust, käiguajalugu, eraldi salvestusfaili taastamist, riigipiirangut, võitu, kaotust ja 90 käigu limiiti.
- 13-käigulise eraldi 4-linna katseseisu mõõdetud tulemus: **52 linna-majandusminutit, 6 AI uuringukäsku ja 6 AI ehituskäsku**, kõik 4 linna 4 elanikuga; kogu regressioonikomplekt **767/767**.
- Godoti skriptide import, Android APK eksport ja PCK bootstrap-käivitustest edukad. CI https://github.com/orogdor/Kuningriigid/actions/runs/40112544971 ; Android/PCK https://github.com/orogdor/Kuningriigid/releases/tag/godot-dev-81 .
- Üldpordi **hinnanguline valmidus ~51%** (töömahu hinnang, mitte automaatmõõdetud funktsioonipariteet).

**Olulised piirangud:** praegune kampaania on peamiselt majanduse ja teaduse vertikaallõik. 14 linna on ette antud, mitte mängija rajatud. Vastaste täiemahuline sõjaväeline AI, linna asutamine, diplomaatia, tehnoloogiapuu terviklik kasutajaliides ja pika kampaania mängutasakaal vajavad veel portimist ja päris telefonitesti. CI headless tõendab regressioonireegleid, mitte kasutaja käitumise täielikku testimist Androidis.

## V4.0 / Androidi rõhtasend ja vananenud PCK tagasilaadimise tõke (2026-10-24)

- Telefoni kuvatõrke põhjus oli `window/handheld/orientation=1` nii käivitaja kui mängu `project.godot` failis. See oli Godoti **portrait** režiim ja andis telefoni ekraanil suure musta ala ning 1280×720 horisontaalse mänguriba. Mõlemas projektis nüüd `orientation=4` ehk `SENSOR_LANDSCAPE`, lisaks kutsub Androidis ka käivitaja ja mäng `DisplayServer.screen_set_orientation` sama väärtusega.
- **Vana PCK ei tohi üle kirjutada uuemat paigaldatud APK-d.** `bootstrap/seed_build.json` jääb APK püsivaks andmefailiks, genereeritakse CI-s täpselt sama `godot-dev-N` numbriga mis APK sees `seed/game.pck`. Käivitaja võrdleb seed-i numbrit `user://ota/installed.json` numbriga *enne* ühegi PCK laadimist. Kui APK on uuem, valib algpaketi ja kirjutab uue tarkvara numbri salvestatud olekusse. Kui OTA on uuem, säilitab paigaldatud OTA.
- Käivitaja kuvab paigaldatud numbrit ja kontrollitud viimast GitHubi numbrit; mängu ülaribal on alati `godot-dev-N` ja `UUSIM / UUENDUS / KONTROLLIMATA` olek. Paketi/seed-i identsete numbrite kontroll ning `orientation=4` kontroll lisati `bootstrap/tests/pck_smoke.gd` skripti.
- **Kontrollitud: 742/742** Godoti regressioonitesti, PCK smoke-test, Androidi debug APK eksport ja GitHubi eelväljalase.
- Väljalase: https://github.com/orogdor/Kuningriigid/releases/tag/godot-dev-75
- CI: https://github.com/orogdor/Kuningriigid/actions/runs/40110973016
- **Seadme Android-manifesti ekraanisuunda ja telefoni tegelikku pööramist ei ole eraldi füüsilisel Androidil kontrollitud.** Selle paranduse nägemiseks tuleb üks kord installida uus APK, sest ekraani pööramist määrab Androidi rakenduse käivitaja, mitte ainult OTA kaudu uuendatav PCK.

## V3.9 / alati nähtav versioon ja reaalajas uuenduse kontroll (2026-10-24)

- GitHub Actions kirjutab **iga PCK sisse reaalse koostu numbri** `game/data/build_info.json`: `godot-dev-<run_number>`, commit ja koostamise aja; sama mängupakett lisatakse uude Androidi APK-sse.
- APK käivitaja näitab paigaldatud versiooni ja viimast GitHubis kinnitatud versiooni. Uuenduse leidmisel jätkub senine SHA-256 kontrolliga PCK laadimine; võrguta kuvatakse **KONTROLLIMATA**, mitte tõendamata "uusim".
- Godoti mängu ülaribal on alati nähtav versioonitunnus, olek `UUSIM KONTROLLIMISE HETKEL`, `UUENDUS SAADAVAL` või `KONTROLLIMATA`. Mäng ise kontrollib versiooni GitHubist ka siis, kui Androidi käivitaja on vana, ning kontrollib uuesti iga 15 minuti järel.
- Uusim kontrollitud väljaanne: https://github.com/orogdor/Kuningriigid/releases/tag/godot-dev-74
- GitHub Actions CI: https://github.com/orogdor/Kuningriigid/actions/runs/40104187846
- **741/741** regressioonitesti; test APK/PCK eksporditud ja bootstrap-suitsutest kinnitab `BOOTSTRAP_PACK_VERSION: godot-dev-74`.

### Esimese mängitava kampaania eesmärk (enne kogu V153 porti)

1. **Uus mäng**: riigi valimine ning algse linna/üksuste ja piiride järjepidev salvestatav loomine.
2. **Ühtne majandus**: elamud, tööjõud, toidu/vee tarneahel, uued linnad, ehitus- ja avastamisjärjekorrad, tõelised kulud.
3. **Riiklik strateegiline AI**: mitme linna rajamine, kaubandus, tehnoloogia, kaitse ning rünnakuotsused ühe pideva mängu sees.
4. **Lahingu ja maailmakaardi sünkroniseerimine**: üksuste kaod, ressursid, linnade vallutamine ning kaitserajatiste kahjustused jäävad püsima.
5. **100–150 käigu kampaaniatest**: mäng algab kiviajast ja jõuab pronksiajani ilma eraldi demo käivitamata; salvestuse uuesti laadimine töötab, võidu/kaotuse tingimus on määratud.

Esimese mängitava versiooni kuupäev ei ole kinnitatud. Käesolev **47% kogu V153 pordi hinnang** ei ole võrdne 47% valmis kampaaniamänguga. Godoti mobiiliversiooni tegelik toimimine tuleb endiselt kasutaja seadmes üle kontrollida.

## V3.9 / alati nähtav versioon ja uuenduse kontroll (2026-10-24)

- GitHub Actions genereerib iga mängupaketi sisse täpse `game/data/build_info.json` faili. Selles on `godot-dev-<CI number>`, lähteteksti commit ja ehitamise aeg. Nummerdus vastab APK/PCK GitHubi väljalaskemärgisele.
- Androidi käivitaja näitab paigaldatud mängupaketti ja GitHubis tuvastatud viimast versiooni. Kontrolli nurjumisel ei väideta ekslikult, et versioon on uusim.
- Godoti mängu **ülaribal on kogu aeg nähtav** `godot-dev-74 | ✓ UUSIM`, `↑ UUENDUS` või `? KONTROLLIMATA` vastavalt viimasele õnnestunud kontrollile. Menüü ülaosas on sama tõeline versioon, mitte vana `Godot 1.8` näidistekst.
- Mäng ise küsib GitHubi viimast arendusväljalaset nii käivitamisel kui ka seejärel iga 15 minuti tagant; see toimib ka vana Androidi APK-käivitaja peal pärast uue PCK laadimist.
- Mobiilimenüüsse lisandus `Juhtimine ja salvestus → Kontrolli versiooni`, mis teeb päringu kohe. Kui uuendus on olemas, juhendab mäng rakendust sulgema ja avama.
- Regressioonitest: **741/741**, sh versioonide võrdlus, võrguühenduseta käitumine, uusima väljalaskega võrdlemine ja ajakohane kasutajaliidese olek. Godoti parser, PCK käivitustest, `BOOTSTRAP_PACK_VERSION: godot-dev-74` ning Android debug APK eksport õnnestusid.
- GitHub Actions: https://github.com/orogdor/Kuningriigid/actions/runs/40104187846
- Avaldatud uus APK/PCK: https://github.com/orogdor/Kuningriigid/releases/tag/godot-dev-74
- **Portimise hinnanguline valmidus jääb 47% juurde**: versiooni jälgimine parandab kasutusmugavust, kuid ei asenda puuduvaid kampaaniasüsteeme.
- Esimese päriselt mängitava Stone→Bronze kampaania eraldi kontrollitav plaan: [GODOT_FIRST_PLAYABLE_PLAN_ET.md](GODOT_FIRST_PLAYABLE_PLAN_ET.md).

**Oluline:** uusima väljalaske tähis on õige ainult viimase eduka GitHubi kontrolli hetkel. Internetita näeb käivitatud versiooni alati, kuid värskust ei saa kinnitada. Vanema APK käivitaja ei näita veel uut versiooni käivitusekraanil, kuid `godot-dev-74` mängupaketi **mängusisene** versiooniriba toimib ning kontrollib ise võrku. Uus käivitusekraan eeldab uusima APK paigaldamist.

## V3.8 / ühine kaitseperimeeter ja linna vallutamine (2026-10-24)

- `city_fortification_port.gd` sisaldab deterministlikku `perimeter_edges` loogikat: iga kindlustatud linnaruudu neli külge võrreldakse naaberruutudega; ühisel sisepiiril ei teki tarbetut müüri.
- `exposed_corner` väldib kõrvutiste linnaruudu piiride sisemisi topelttorne. Üksiku ruudu neli välist nurgatorni säilivad.
- `native_detail_tile.gd` joonistab välispiiri müürid ja ainult tegelikud välised nurgatornid, kasutades kahjustustega salvestatud müürilõike.
- `siege_port_v131.gd` arvestab, millised välisseinad on valitud detailruudul olemas; sisemised tänavaühendused on avatud. Piiramislahingul on `city_home_c/r` tunnused, et kaitstud ruut võib olla ka linnasüdame naaberruut.
- `city_capture_port.gd` muudab pärast *päriselt lõpetatud ja linnaga seotud hõivamist* linna riiki; tavaline välilahing või isoleeritud näidislinnus ei saa riigipiire ümber tõsta. Ehitised, linnavaru ja kindlustused säilivad; eelmise omaniku treeningjärjekord tühjeneb, teadusajastu joondatakse uue riigiga.
- Vallutuse tulemus märgitakse `conquests`, `city_captures`, `captured_at` ning lahingulogisse. Vanad piiriallokatsioonid märgitakse aegunuks, et `Territory.rebuild` arvutaks uue riigi piirid.
- Lahingu lõpetamisel salvestatakse müürikahjustused just kaitsjariigi linna, mitte samade koordinaatidega juhuslikku teist katse-linna. Vallutus ei saa topelt arvestust.
- **GitHub Actionsi regressioonitestid: 724/724**, Godoti skriptide import, PCK-käivitus ja Android APK eksport: edukad.
- Kontrollitud CI: https://github.com/orogdor/Kuningriigid/actions/runs/40101999186
- Avaldatud APK/PCK: https://github.com/orogdor/Kuningriigid/releases/tag/godot-dev-69
- **Hinnanguline V153 Godoti pordi valmidus: 47%**, töömahu üldine hinnang, mitte automaatmõõtmine.

**Järgmised piirangud:** linnaruudud moodustavad ühise nähtava välisperimeetri, kuid tervel maksimaalselt 12×12 linnapiirkonnal ei ole veel ühist suurt 3D lahinguvälja. Linna vallutuse järel vajab tööjõu, kaubanduse, sõjagarnisoni ja UI värvide täielik kooskõlastamine täiendavat tööd. Android-telefoni tegelikku OTA uuendamist ei ole kaugelt kinnitatud.

## V3.7 / ehitatud linnamüürist päris piiramislahing (2026-10-24)

- `Siege.from_city(city,tile,attacker,defender)` loeb ainult **päriselt ehitatud ja makstud puitvalli** ning loob sellele vastavad V131 piiramislahingu sektsioonid: 4 nurgatorni, läänevärav, välismüürid, 420 HP puitmüüri lõigud, 500 HP värav ja 520 HP puitkaitsetornid.
- `IndividualBattle.start` tuvastab automaatselt linnakeskuse ruudul kaitsjariigile kuuluva kindlustatud linna, loob piiramislahingu ja paigutab kaitsjad müüride sisse. Tornide juurde lisatakse kuni 5 kaitsjat torni kohta, arvestades lahingu 500 mehe piirangut.
- Piiramislahing kasutab juba olemasolevaid kokkupõrke-, nooleliikumise, redeli-, rammi- ja katapuldikahjustuste reegleid. Suletud värav blokeerib, avatud värav lubab läbipääsu ega takista nooli.
- `CityFortifications.apply_siege_damage` talletab pärast lahingut iga müürilõigu ja värava HP linna `fortification.integrity` väljal, salvestades ka lahingu viimase tulemuse. Uus lahing ei taasta automaatselt katkisi müüre.
- Detailkaardil loetakse samade sektsioonide HP ja näidatakse murdunud lõike, nurgatornide purunemist ning avatud või purustatud väravat.
- Telefoni linnamenüü **Ava / sulge linnavärav** juhib linna püsivalt salvestatud väravaseisundit. Hävinud väravat ei saa remondita sulgeda.
- Telefoni varasem **Pronkslinna vallide demo** ja **Pronkslinna piiramine** on nüüd ühendatavad: kõigepealt ajutine ehitatud linnavall, seejärel lahing.
- CI tulemused: **699/699** Godoti regressioonitesti, parser, bootstrap PCK smoke-test ja Androidi debug APK edukad.
- Valideeritud GitHub Actions: https://github.com/orogdor/Kuningriigid/actions/runs/40100370121
- Avaldatud APK/PCK: https://github.com/orogdor/Kuningriigid/releases/tag/godot-dev-62
- Hinnanguline V153 kogupordi valmidus: **44%** (subjektiivne funktsionaalsuse ja töömahu hinnang).

**Järgmised piirangud:** see on linna *keskruudu* lahingumudel, mitte veel kõigi 12×12 linnaruudu ümber ühtse vallipiiri piiramine. Linna omaniku muutmine pärast vallutamist ja garnisoni täielik rahuaegne simulatsioon ei ole veel seotud. Valli mobiili 3D-jõudlust ja OTA-paigaldust ei ole pärisseadmel eraldi kontrollitud.

## V3.6 / AI linnaplaneering ja pronkslinna puitvallid (2026-10-24)

- `city_planning_port.gd`: deterministlik ajaloolisest V135 planeeringust inspireeritud linnakruntide paigutus. Eraldi tsiviilkeskus, elamukrundid, maa-tootmine, tööstus ja sõjaväehooned. Kõik varasemad maastiku, hoone mõõtude ja kattumise piirangud kehtivad edasi.
- `CityPlanning.housing_target` eemaldab AI senise viie elamu piiri. Vajalik arv sõltub elanikest ja hoonete mahutavusest; ühtki maja ei looda ilma tegeliku ehituskulu ja ehitusprotsessita.
- `city_fortification_port.gd`: pronksiajal ja vähemalt 14 elanikuga linnas saab arendatud linnaruudu piirata puitvalliga. Esimese ruudu hind 65 puitu + 20 kivi, järgneva arendatud ruudu hind 35 puitu + 12 kivi. Ressursid arvatakse maha, vallide asukohad salvestatakse; topeltehitamise eest uuesti ei maksta.
- `native_detail_tile.gd`: ehitatud piirderuudul kuvatakse puitvallid, kesksed väravaavad ja nurgatornid. Ühise müüriga külg külgneva kindlustatud ruudu vahel jäetakse vabaks.
- `preview_ai_port.gd` võib sobiva vanuse, rahvaarvu, varude ja põhivajaduste puhul valliruute ehitada. See on Godoti *preview AI*, mitte veel V153 tegelik strateegiline linnaplaneerija.
- Telefoni menüüs **Linn ja ehitus → Ehita puitvall (pronks)**. **Testid → Pronkslinna vallide demo** näitab valli ajutises pronksilinnas ning **Taasta vallide demo** tagastab algse oleku; testimise ajal ei saa ajutist seisu salvestada.
- Godot 4 skriptikompileerimine, `681/681` regressioonitesti, PCK smoke-testi ja Androidi debug APK eksport on GitHub Actionsis läbitud.
- Tõend: https://github.com/orogdor/Kuningriigid/actions/runs/40097084516
- Avaldatud APK/PCK: https://github.com/orogdor/Kuningriigid/releases/tag/godot-dev-54
- **Kogu V153 pordi töömahu hinnanguline valmidus: 41%** (subjektiivne töömahu hinnang, mitte automaatmõõtmine).

**Lahendamata:** puitvallidel puuduvad veel toimivad lahingukokkupõrked, purustatavus ja päriselt avatavad väravad. Hoonete paigutus on ajaloolisest linnamorfoloogiast inspireeritud lähendus, mitte veebiversiooni kõigi era/maardla/ajaloolise planeeringu reeglite täielik port. Telefoni tegelik OTA-uuendus ja jõudlus tuleb kontrollida seadmes.

## V3.5 / mitme detailruuduga linn (2026-10-24)

- Hooneid paigutatakse esmalt olemasolevasse linnasüdame detailruutu; kui seal pole ruumi, otsib linn järgmise sobiva vaba krundi enda `territory_urban` ruutudelt.
- Salvestatud `site_x/site_z` väljad säilivad. `CityLayout.site_tile`, `site_in_tile` ja `site_on_atlas` teisendavad samu krundiasukohti maailma- ja detailkaardil.
- `native_detail_tile.gd` kuvab linnahooned nüüd ka linnasüdamest väljapoole jääval linnaruudul; tootmis- ja maakonnahoonete pildikiht säilib.
- `native_city_buildings.gd` kasutab sama kaardiprojektsiooni.
- `district_street_nav.gd` loob ruudupõhised AStarGrid2D tänavakaardid ja ühendab need omavahel tänavaportaalide kaudu. Selle kaudu saavad `local_street_nav.gd` töötajad ja veosed liikuda ka naaberruudu majani.
- Uutes linnaruuduosades joonistatakse kaks peateed; jõest blokeeritud lõik jäetakse sillata katmata.
- Regressioonitestid: `666/666`; Godoti skriptide import, PCK smoke-käivitus ja Androidi debug APK eksport õnnestusid GitHub Actionsis.
- Kinnitatud väljalase: https://github.com/orogdor/Kuningriigid/releases/tag/godot-dev-45
- **Kogupordi hinnanguline valmidus: ligikaudu 38%**, võrreldes veebimängu V153 kõigi süsteemidega. Tegemist on projekti ulatuse hinnanguga, mitte automaatse mõõdikuga.

**Piirangud:** Mitme ruuduga linna mudel on praegu funktsionaalne osaport. Ajalooliselt täpne krunditüüpide tsoonide planeerimine, terviklik tänavavõrgustiku kujunemine kasutusest, mitme ruudu linnamüürid ja V153 täis-AI vajavad edasist portimist. Telefonis automaatse `.pck` uuendamise toimimine ja jõudlus on jätkuvalt kasutajapoolse testi ootel.

## V3.4 / V153 linnapiirkond (2026-10-24)

- V153 `city-area-v142.js` mudeli järgi kasvab linnapiirkonna raadius rahvaarvu ruutjuurega: 3 elanikku → 3×3; 9 → 7×7; 16 → 9×9; 25 → 11×11; 36+ → maksimaalselt 12×12.
- Linnapiirkonna tegelik bounding box ei tohi ületada rahvaarvu järgi lubatud külgede pikkust isegi nihkunud või vaidlustatud maakonna korral.
- Maakonna täiendavad ruudud leitakse mööda maismaad. Otsing võib liikuda läbi naaberriigi maad, kuid ei võta juba omatud ruute üle ega ületa vett.
- Linnasüda säilib ka siis, kui suurem naaberlinn ümbruskonna hõivab.
- Mobiilimenüü Testid sisaldab `Piiride demo: 36 elanikku (12×12)` valikut.
- GitHubi automaattest: `657/657`, GDScripti import ja PCK smoke test OK; Androidi APK ja PCK avaldatud.
- Avaldatud väljalase: https://github.com/orogdor/Kuningriigid/releases/tag/godot-dev-34
- Selle tööetapi lõpus on **kogupordi hinnanguline valmidus umbes 35%**, arvestades veebiversiooni V153 kogu mänguloogikat, mitte ainult projekti kompileeritavust. See hinnang ei ole automaatselt mõõdetud töömahu protsent.

**Oluline piirang:** V153 linnapiirkonna loogika on osaliselt porditud. Linna hoonete täielik ruutudevaheline paigutamine ning uus AI linnaplaneering ei ole veel üks-ühele üle kantud. Telefonis toimivat OTA uuenduse läbiviimist ei ole siin seadmes kontrollitud.

## Lähtekood ja ehitamine

- Godoti aktiivne arendusharu: `godot-port-development`.
- Godoti mänguprojekt: `game/` (Godot 4); Androidi APK ja PCK-käivitaja: `bootstrap/`.
- Varasemad `godot-upload/v33/*.txt` osad jäävad arhiiviks, kuid uus CI ehitab **päris, muudetavatest failidest**.
- Androidi CI: `.github/workflows/godot-apk-test.yml`.
- Viimane kontrollitud CI: https://github.com/orogdor/Kuningriigid/actions/runs/40104187846
- Viimane avaldatud APK/PCK: https://github.com/orogdor/Kuningriigid/releases/tag/godot-dev-74
- Väljalasked luuakse `godot-dev-<workflow run number>` märgendiga *prerelease* ainult siis, kui regressioonitestid läbivad kontrolli.

## Kontrollitud (Godot 4.7.2 CI konteiner)

- Pythoni staatilised testid ja GDScripti impordikontroll läbitud.
- `V131_REGRESSION: 741/741` läbitud 2026-10-24.
- `game.pck` loomine ja `BOOTSTRAP_SMOKE_PASS` läbitud.
- Androidi debug-APK edukalt eksporditud ja GitHubi avaldatud.
- **Mitte kontrollitud:** päris Android-telefoni FPS, puutejuhtimine, seadmesse paigaldamine, võrgust PCK allalaadimine ja taaskäivituse andmete ühilduvus.

## Selles jätkamises tehtud parandused

1. Godot 3.3 lähtekood lahti pakitud, eraldi muudetavate failidena arendusharru.
2. Maailmakaardi marsruudikontrollis võimaldatud atlasetaseme läbitavuskontroll enne detailnavigeerimise laadimist. Kui detailkaart on seadistatud, jääb selle rangem kontroll kehtima.
3. Võrdse puudujäägiga kaubavoogude deterministlik prioritiseerimine: esmatarbe toit/vesi enne materjale.
4. Linnaplaneeringu ja kõrguskaardi aegunud test-fixture'ite parandamine.
5. Varem ainult CI-s `sed` abil parandatud GDScripti vead parandatud otse lähtefailis.
6. ETC2/ASTC Androidi eksport salvestatud käivitaja projekti.
7. APK käivitaja loeb nüüd `orogdor/Kuningriigid` `godot-dev-*` eelväljalaskeid, kontrollib `game.pck` SHA-256 ja salvestab uuenduse `user://ota`.

## Järgmise pordietapi prioriteedid

1. **Telefonitesti tulemused:** APK install, turvaline ühenduseta käivitus, Godot GL Compatibility, puutemenüüd ja PCK OTA kontroll.
2. **V153 veebimängu võrdlus V131 Godoti osapordiga:** kaart, linnade/maakondade laienemine, AI, ajastud, kaubandus, lahingsüsteem; koostada puuduva funktsionaalsuse pariteeditabel.
3. Porditud mängureeglite API-ga seotud pikk kampaaniatest, sh vähemalt 200 käiku ja salvestuse taastamine.
4. Püsiv Androidi allkirjastusvõti ametlike APK uuenduste jaoks; praegu on kasutusel test-APK.
5. Võimalusel omaette `Kuningriigid-Godot` hoidla; GitHubi liidesega eraldi repositooriumi loomine vajab veel lahendamist.

**NB!** V131 reeglitestide 646/646 edu ei tähenda, et veebimängu V153 oleks täielikult Godotisse porditud.
