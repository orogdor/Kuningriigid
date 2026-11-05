# Kuningriigid – ühine tööjärg

- V309: kuus alumist kaarti avavad oma sisu samas alumises ribas, püsiva Tagasi-nupuga. Päris ehitus-, linna-, armee-, kaubandus-, diplomaatia- ja päevikuelemendid liigutatakse ajutiselt ribasse ning taastatakse sulgemisel; andmeid ja mängukäske ei kloonita. Ehitiste pildid ja hinnad, horisontaalne kerimine, värbamise järgmine tase, Escape ning diplomaatia modaalikatete eemaldamine. Brauseris kontrollitud 5 ekraanimõõtu ja 6 menüüd; kõik 23 kohalikku CI gruppi läbisid. Tõendid ja kontrolli piirid `design-qa.md`, `reports/ui-v309-matrix.json`.

- V308: rõhtvaate ribad ulatuvad äärest ääreni, kuue kaardi suurus säilib ning lisaruum jääb nende järele. Parempoolsed ressursid järgivad paremat serva. Brauseris kontrollitud 4 rõhtvaadet ja senine püstvaade; mõõdud `reports/ui-v308-matrix.json`. Kohalike nõutud kontrollide tulemused: `reports/ui-v308-ci.json`.

- V307: lühikeses telefoni rõhtvaates on nüüd korraga nähtaval kolm pildipaneeli ja kuus kaarti. Skaala sobitub ka nähtava kõrgusega; ülariba ja menüüd mahuvad ekraanile. Parandatud kaardivahetust katnud keelatud jalutamisnupu puuteala. Brauseris kontrollitud kolm rõhtvaadet, püstvaade ja arvutivaade; 0 kaetud lubatud nuppu, 23 CI gruppi läbisid. Tõendid ja GPU piirang: `design-qa.md`, `reports/ui-v307-matrix.json`.

- V306: kasutaja teise pildi järgi taastatud suured kaarjad pildiraamid ja kuus kõrget kaarti. Kümme uut üksikpilti, 17 maalitud kontekstikäsu ühendust, eraldi pausi/jätkamise ikoonid ning loetav telefoni kaardirida. Brauseris kontrollitud HUD-i päris failid ja käsud; 23 CI gruppi ning V306 test läbisid. Visuaalse kontrolli tõendid ja GPU piirang: `design-qa.md`; üksikasjad `MUUDATUSED_V306.md`.

- V305: Three.js r170 → r187 (`0.187.0`), ametlikud muutmata core/WebGL/WebGPU/TSL failid, ühised vahemäluvõtmed, praegune WebGPU renderdusliides, PCF-varjud ja staatilise silla maatriksi uuendamine. Kõik CI kiirkontrolli grupid ning uued varjutajakoodi/GLB/instantside kontrollid läbisid. Siinne brauser ei saa graafikakonteksti luua, nii et tegelik GPU-pilt ja jõudlus vajavad seadmel kontrolli. Üksikasjad: `MUUDATUSED_V305.md`.

Enne töö alustamist kontrolli GitHubi `main`-haru tegelikku seisu ja töökoopia muudatusi.

- Mäng ja avalik eelvaade: https://orogdor.github.io/Kuningriigid/
- Lähtekood: https://github.com/orogdor/Kuningriigid
- V241: mängumudelid laaditakse vajaduse järgi; sõduritüübid on eraldi failides.
- V242: detailkaardi naaberalad valmistatakse ette ja taaskasutatakse. Üleminekul säilivad ühine maastik ja kaamera asukoht.
- V243: müüri saab ühendada torni või väravapostiga. Ehitamisel pöörab Ctrl + hiireratas eelvaadet 2° kaupa; juhis on ekraanil. Silla paigutus peab ühendama kaldad.
- V244 (Claude): jõudlus ilma graafikat halvendamata. Puud ja põõsad joonistatakse instancing'uga, kiviaja hoonetel on kolm detailsuse astet (`models-stone-lod-v244/`), WebGPU varulahendus on rangem. Üksikasjad: `MUUDATUSED_V244.md`.
- V245 (Claude): WebGPU must ekraan parandatud. Põhjus oli three r170 instancing'u uniform-puhvri viga (`vendor/three.webgpu.js` patch). Üksikasjad: `MUUDATUSED_V245.md`.
- V246 (Claude): WebGPU maailmakaardil oli näha ainult udu. Udu kate ja meri on nüüd TSL-is, sest WebGPU eirab `onBeforeCompile`-t. Kontroll: `tests/webgpu-v246/sea.html?gpu=0|1`. Üksikasjad: `MUUDATUSED_V246.md`.
- V255 (Claude): uluk kardab inimesi ja põgeneb, jahimees hiilib ligi ja viskab oda, loom kukub. Karjus viib lambakarja hommikul karjamaalt välja, karjatab ja toob õhtul tagasi (kiviaeg, joonistuskiht). Lammas on ajutine protseduuriline mudel. TRELLIS.2 (MIT) mudelit ei saanud siit teha, sest HF Space'ide käivitamine on ühenduses keelatud; juhis on failis `MUUDATUSED_V255.md`.
- V254 (Claude): mängija linnade vahe on 10 ruutu (oli 17). V252 hoonete lisadetailid on eemaldatud. Puu- ja kivitöö on poole aeglasem. Mets on tihedam (detailkaardil 1,6×, maailmakaardil umbes 1,4×). Üksikasjad: `MUUDATUSED_V254.md`.
- V253 (Claude): kiviaja tõrvik on puukepp kasetohu ja vaiguga, väiksem leek; ukse tõrvikud paigutatakse mudeli mõõtude järgi väljapoole maju (0 hoone sees). Külaelanikud käivad ümber majade, hoiavad isiklikku ruumi, vestlevad üksteise poole, kannavad öösel tõrvikut ja neil on päris poosid. Kükitamise ja istumise poosid on parandatud. Üksikasjad: `MUUDATUSED_V253.md`.
- V252 (Claude): kiviaja kõik hooned on animeeritud (suits, lõke, potikeder, kaevuämber, kuivatusrestid jne) ja töötajatel on uued tööliigutused (savikaevamine, potid, kiviraidumine, õpetamine, karjatamine). Tegevuseta inimesed ajavad juttu või lähevad koju, keegi ei käi teisest läbi ja öösel on käes tõrvik (`people-life-v252.js`, joonistuskiht). Majad saab ehitada lähemale. Pronksiaeg jäi kasutaja soovil muutmata. Üksikasjad: `MUUDATUSED_V252.md`.
- V251 (Claude): teedel on jälle tasemed ja pind vastab ajastule (jalgrada → vankritee → kruus → munakivi → sillutis → makadam → asfalt); maantee on 1,5× laiem ja 10% kiirem. Tõrvikul on päris tule varjutaja. Valgusti vahetub ajastuga: tõrvik → õlilatern → gaasilamp → elektrivalgusti. Jõevesi peegeldab taevast ja lainetel on valgus. Üksikasjad: `MUUDATUSED_V251.md`.
- V250 (Claude): kõik teed näevad välja ühesugused (kruus); maantee (tase 4) on 1,5× laiem ja 10% kiirem. Uued tõrvikud annavad 25% rohkem valgust (päris valgusallikaid on endiselt kõige rohkem 4) ja maapinnale tekib valguslaik. Jõgedel pole enam katkendjooni, vee värv on sügavuse järgi ja uutes maailmades jõed looklevad. Taimestik järgib biomi (rohumaa salud, kõrbes kaktused, tundras kääbuspõõsad). Uued mängud saavad `geographyVersion 7`. Üksikasjad: `MUUDATUSED_V250.md`.
- V249 (Claude): jõesuudmed. Kõigil kaartidel (ainult joonistus) laskub jõgi merre ilma kaldavalli ja kastita ning jõe vesi hajub merre. Uutes „Loogilise maailma“ mängudes (`geographyVersion 6`) algab jõgi peenikesena ja laieneb, suue on lehtrikujuline, kõik jõed jõuavad merre ja laiad lõigud on `riverNavigable`. V248 mängud jäävad versioonile 5. Üksikasjad: `MUUDATUSED_V249.md`.
- V248 (Claude): uus kaarditüüp „Loogiline maailm“ (`world-tectonic-v248.js`, `geographyVersion:5`): laamad, mäeahelikud laamapiiridel, erosioon, tuulte ja vihmavarjuga kliima. See on uue mängu vaikevalik; vanad kaardid ja salvestused ei muutunud. Ajutine menüünupp „Kogu kaart“ (vaikimisi sees) eemaldab udu. Üksikasjad: `MUUDATUSED_V248.md`.
- V247 (Claude): Deno ja Chrome'i kiirtest (`tests/deno-bench-v247/`): sama three.js WebGPU stseen brauseris ja Denos ilma brauserita. Pilvekonteineris (SwiftShader) töötavad mõlemad ja annavad sama 1 767 joonistuskäsku. Päris mõõtmine on veel tegemata ja tuleb teha kasutaja arvutis. Mäng ise ei muutunud.
- V243 muudatuste ja kontrollide üksikasjad: `MUUDATUSED_V243.md`; eelmised versioonid: `MUUDATUSED_V241.md` ja `MUUDATUSED_V242.md`.

## Koostöö

1. Enne muudatusi kontrolli GitHubi `main`-haru viimast versiooni ja töökoopia seisu. Ära kirjuta teise töö tegija pooleliolevaid muudatusi üle.
2. Samaaegseks tööks kasuta eraldi harusid või töökoopiaid; ühenda muudatused pärast kontrollimist.
3. Pärast sisulist muudatust uuenda seda faili: märgi tulemus, versioon, kontrollid ja järgmine teadaolev töö. Ära kirjuta oletusi lõpetatud töö pähe.
4. Avalik versioon ja kohalik pooleliolev töö võivad erineda. Märgi see selgelt; GitHubi üleslaadimine või avaldamine toimub kasutaja juhiste järgi.

## Kontrollimine

Enne avaldamist käivita CI kiirkontrolli testid (`.github/workflows/v128.yml`, töö `quick-check`), eriti `scripts/test-daynight-v235.mjs` ja `scripts/test-scout-torch-v236.mjs`.

Käivita muudatusele vastavad testid. Näiteks V243 ehitusmuudatuste puhul `node scripts/test-build-v243.mjs`, müüride puhul `node TEST_V1754_GATES.mjs` ja detailalade puhul `node scripts/test-stream-v242.mjs`. Mängu põhikontroll on `node scripts/test.mjs traffic`. Brauseritestide käivitamiseks on vaja Puppeteeri ja sobivat brauserit.

- V256: gzip-pakitud automaat- ja käsitsisalvestused koos vanade JSON-salvestuste toega; pakkimist kasutab ka varukoopia. Looma põgenemise kattumise ja lamamis-/söömisasendi parandus, karja kaadrisagedusest sõltumatu liikumine, käsitõrviku tuleaja parandus. Üksikasjad `MUUDATUSED_V256.md`.

- V257: hirve mudeli +X telg pööratakse liikumissuunaga kohakuti; käes olev tõrvik kinnitub animeeritud parema käe külge ja püsib püsti, valge leek on asendatud väikse värvilise leegiga. Vastaste linnade maailmakaardil kuvamise lahknevus (Kogu kaart vs visibleNow) on uuritud, mitte parandatud.

- V258: teiste detailkaartide armeed kuvatakse kõigi salkadega; liikuva armee kujutis järgib maailmakaardi asukohta. Asunike, armeede ja maismaakaupmeeste maailmakaardi kiirus kasutab detailruudu mõõtmeid ning tee- ja üksusekiirust; olemasolev teekond säilitab suhtelise asukoha. Veesõit ja rongid on eraldi. Kontrollid ja piirangud: `MUUDATUSED_V258.md`.

- V259: kirvemees, odamees, lingumees kasutavad TRELLIS.2 tekstuuriga GLB-mudeleid. Uutel mudelitel puudub luustik, seega liigub kogu mudel; V148 jääb varuvariandiks.

## Järgmine töö

- Lamba GLB TRELLIS.2-ga (MIT; tausta eemaldamiseks mitte BRIA-RMBG-2.0, mis on mittekommertslik). Ootab kasutajalt GLB-faili või HF Space'ide käivitamise lubamist.

- Kasutaja soov: kiviaeg lõpuni, siis pronksiaeg. Pronksiaja ülevaatusel leitud: hoonetel (`bronze-buildings-v79.js`, `town-models-v154.js`) on vähe animatsioone, ja paljudel pronksiaja töötajatel pole oma liigutust (savikoda, potikoda, kiviraidur, valukoda, vankrimeister, turg, ait, pagar, kudumine), vaid üldine `work`.

- WebGPU: `demo=medieval` kukub tarkvaralisel WebGPU-l läbi (`three.webgpu.js` `dispose` null) ja lülitub WebGL-ile. Viga on olemas ka V249-s.
- WebGPU: jõe vesi (`waterMaterial`) ja teede ajastupinnad (`roadMaterial`) on `onBeforeCompile` varjutajad ega tööta WebGPU-s; need tuleb kirjutada TSL-i. Tuli töötab ka WebGPU-s (TSL).
- `TEST_V76.mjs` kukub läbi („evening gathering place has a lit fire“), sest küla lõkkekoht (`camp`) on varem eemaldatud. Viga on olemas ka V252-s.
- `TEST_V139.mjs` kukub läbi (`ai-defenses-v128.js:47`, `city.economy.realms[team]` puudub). Viga on olemas ka V248-s.
- Jõelaevandus: `cell.riverNavigable` (V249) märgib laiad jõelõigud, kuid laevad neid veel ei kasuta.
- V248 maailmakaart: kasutaja vaatab uued kaardid üle. Seejärel tuleb ajutine „Kogu kaart“ nupp eemaldada (`index.html` `#reveal-v248`, `civilization-core.js` `seen()`, `fog-delta-v88.js`). Võimalik täpsustus: stepi osakaal (26–31% maast).
- V247 mõõtmine kasutaja arvutis: Chrome 100,8 fps, Deno 51,2 fps (sama stseen). Brauserita lahendus ei ole kiirem; rakenduseks sobib Tauri/Electron + Capacitor.

- Tõrvikud (225 eraldi tükki) ja varustus tuleb liita. Kasutaja soovis selle hilisemaks eraldi ja põhjalikumaks läbivaatuseks.
- WebGPU töötab kasutaja NVIDIA kaardil. Kaadrisagedust WebGPU ja WebGL-i vahel pole veel võrreldud. Udu kate ja meri on V246-s TSL-is. Maastiku sujuvad üleminekud, pilvede varjud ja tuul puuduvad WebGPU-s endiselt ja tuleb ümber kirjutada TSL-i.
- WebGPU udu on WebGL-ist hallim, sest three r170 WebGPU rakendab ACES-toonivastenduse kogu kaadrile ja eirab `toneMapped:false`.

- V262: TRELLIS.2 kirvemees/odamees/lingmees on mängus kiviaja sõdurite asemel, seotud V221 17 luuga luustikule (`stone-trellis-rig-v262.js`). Kimodo (NVIDIA) vajab GPU-d, pole kasutatud. Vana välimus: `?trellis262=0`.

- V263: maalitud UI-ikoonid (`ui-art-v263/`, `ui-art-v263.css/.js`). Portreed valikupaneelil ja rahvaarv ribal (V263c); raam veel kasutamata.

- V264: armeede/linnade nimekiri maailmakaardil, ressursid 3 grupis hoveriga, päeva number kella kõrval, uus peamenüü (`ui-v264.js/.css`).

- V265: vana teal-stiil asendatud (`ui-theme-v265.css`), ♜ → pikkmaja, V264 sildid keelepõhised.

- V266: kiviaja avastuste järjekord parandatud (MUUDATUSED_V266.md); mustandharu ühendatud.

- V267: vesi jõest ilma kaevuta (−10% töö, −5% rahulolu), kaitserajatised vajavad ainult kivitööriistu.

- V268: veekandjad (jõest vesi ilma kaevuta), test CI-s. GitHubi väljalase v268.

- V269: maailmakaardi kiviaja linnad detailkaardi paigutusega, ülilihtsad mudelid (`world-city-v269.js`, `models-world-v269/`).

- V270: näidisküla ?demo=stonetown, maailmakaardi linnad 4×, tihedamad metsad ja ühine metsatukkade väli mõlemal kaardil.

- V271: maailmakaardi linnad 1:1 detailkaardiga, puud väiksemad ja 3× tihedamad.

- V272: maailmakaardi linn täpselt 1:1 (oma ruudu sees), linnaala puudest puhas.

- V273: maailmakaardi linn 1–5× nii, et mahub alati oma ruutu.

- V274: rahvasteränne (esimene minut, 4 töölist + sõdur, 5x kiirus, linnakoha valik), skaut koera ja odaga, puude kasv/looduslik uuenemine, kaev avastuse taha.

- V275: rahvasteränne 2 min ja 7,5x, maailmakaardil detailkaardi mudelid (asunikud, skaut), järvede laiad väljavoolud merre.

- V276: külad 2 tüüpi (röövlid/kaupmehed) mängija hoonetest, kauplemine, röövretked+hoiatused, 20 min rahu, kiviaja armeed 3x väiksemad, jõekaldale kalamees + jõekalad; PARANDUS V274 puude uuenemise viga.

- V277: kaubanduse eraldi menüü (nupp Kaubandus), armeede nimekiri ka detailkaardil (selles ruudus/kaugemal), külade öine kuma.

- V278: loomulik kaldajoon (uued maailmad), puud mitte vette/liivale, barbarimüür kinnine (tornid müüris, värav müüris), külad lähima riigi ajastus (hooned, kaubad, röövsalgad).

- V279: vanu protseduurseid hooneid/inimesi ei näidata kunagi GLB ootel (ainult laadimisvea korral), hoonete GLB-d järjekorras ees, 5 allalaadimist korraga.

- V280: kiviaja testmängu parandused (toit +50%, talu ilma saeveskita, vesi 4 ruudu raadiusest + kauge allikas, ladu 240, kassa uuringu kiirendus, AI ei jää uuringuta, tuli esimesena, palisaad ainult ohu korral, röövlid 28 ruutu, AI kaupleb, AI iseloomud, tühje maju pole, asunik varem, rände soovitatud linnakohad, maagid kõvale maale, 45 min AI test).

- V281: teise kiviaja testmängu parandused (metsalaager metsarikkale naaberruudule, puidu/kivi ost külast, kassa plaan + piir 80, madala rannikumetsa puude kadumise viga, sõjakas kaupleb ja alustab sõda lihtsamalt, aga värbab vähem, asunik kuni 16 ruutu, ehitajal 2 ehitajat, talu tasuvaks, üks röövsalk linna kohta + vangid, vee näit „jõest“, erinevad algusuuringud, test kaardil 7741).

- V282: graafika ja UI (maailmakaardi linn südamiku järgi 2–4× + hooned 1,4×, nimesilt serval, maavarade märgid ressursipiltidega ja vähem, kuuvalgus, telefoni ülariba mahub, ~200 ingliskeelset tõlget + mustrid, pruun stiil ehitusmenüüle/päevikule/vormidele, vee teated, aktiivne nupp, soovituste loogika).

- V283: kiviaja animatsioonid (tööriistad õiget pidi käes, karjusele kepp, õpetaja/pottsepp/savikaevaja/kiviraidur õiged tööriistad, veekandja kann ka tagasiteel, odamehe oda ei paindu, skaut kiviaja inimese mudeliga + uus koer).

- V284: kivimurru töötaja ronib kivihunniku astmele ja raiub kaljuseina, kiviraidur töötab koja tööpingi taga; kivikillud lendavad löögi hetkel (stone-work-spots-v284.js).

- V285: töökohad hoone mudelil ka savikaevandusele (kaevab lohus), pottsepale (ahju ees), õpetajale (kivilaua juures) ja kaevule (veekandja ringi ääres).

- V286: sujuvad kaldad (liiva/muru/vee üleminek kõrgusvahemikus, tihedam kauge maastik, piirid mitte üle mere, maailmakaardi jõesäng madal + meri mitte sisemaal, puud mitte jõkke).


- V287: valikuline maalitud maailmakaardi UI (haru feature/world-map-painted-ui-v287). Kasutab V263 pildilisi WebP elemente; säilitab olemasolevad nupud, salvestused ja reaalajas käigud. Käivitamine ?ui=painted; taastamine ?ui=classic või peamenüü nupuga. Failid: ui-painted-v287.css, ui-painted-v287.js, tests/ui-painted-v287.mjs, MUUDATUSED_UI_V287.md. Enne haru ühendamist kontrolliti JS süntaksit ja pildifailide olemasolu. Brauseri visuaalkontroll ja CI täiskontroll on veel vajalikud.


- V288: referentspildiga sobitatud maailmakaardi illustreeritud HUD (haru feature/illustrated-hud-v288): uus reaalsete andmetega kuue ressursi ülariba, ajastu ja käigu riba, uuringupaneel päris progressiga, nelja riigi elanikkonna/suhete ülevaade, kaardi tööriistad, 6 pildipõhist aluskaarti otse viimase kujunduspildi lõikest, valitud üksuse paneel, olemasolev pausi/jätka nupp ringikujuliselt. Diplomaatia nupud on seotud päris mängu suhtesüsteemiga; mängu loogika ja salvestused jäävad V286. Eestikeelse kavandipildi graafika on toolbar.svg; pildi osad on eraldi toimivate nuppude all. Vana UI on taastatav ?ui=classic. Failid ui-reference-v288.*, ui-art-v288/*, tests/ui-reference-v288.mjs, MUUDATUSED_UI_V288.md. Brauseri visuaalne võrdlus ja mobiilne päriskontroll on veel vajalikud enne täieliku 1/1 tulemuse kinnitamist.

- V289: eraldiseisev responsive maalitud maailmakaardi HUD (feature/standalone-responsive-hud-v289). Vana V287/V288 ja esialgne maailmakaardi HUD peidetakse, nähtav on üks uus #v289-hud. Taaskasutab olemasolevaid pildifaile, kuid mitte vana elementide paigutust. Tegelik minimap canvas liigub uude paneeli ja taastub klassikalise UI valimisel, käsud käivitavad algse mängufunktsiooni. Mobiilil eraldi 3×2 navigeerimine ning avatavad eesmärkide/riikide/minikaardi paneelid. Brauseri 1:1 ekraanipildikontroll on veel puudu. Test: tests/ui-v289.mjs. Üksikasjad MUUDATUSED_UI_V289.md.

- V289 versioonisildi parandus: brauseri tiitel, peamenüü ja illustreeritud HUD näitavad `UI V289 · MÄNG V286`. Varem jäid kaks nähtavat silti ekslikult `V286` peale; test lisatud `tests/ui-v289.mjs` faili. Mänguloogika ja salvestusformaat muutmata.

- V289 menüü sildi lõplik ühtlustus: `<title>Kuningriigid · V289</title>` ja `#menu-version = KUNINGRIIGID · V289`, HUD väikekiri `UI V289 · SEVEN ERAS`. `MÄNG V286` on eemaldatud nähtavast menüüst, kuna kasutajaliidese versioon on V289; alusmängu versioon jääb arendusdokumentatsiooni. HUD skripti cache-key `289b`. Test `tests/ui-v289.mjs` ajakohastatud.

- V290 (pildipõhise maailma-HUD-i katse): kinnitatud kujunduspildi 19 WebP-väljalõiget lisatud ui-art-v290 kataloogi. Täiesti eraldi hud-v290.js/.css töötab ainult ?ui=picture korral ja kasutab mängu algseid funktsioone nähtamatute pildipõhiste klõpsualade kaudu. Kohanduv paigutus kuuel mõõdul lokas Chromiumi inline-testis (0 JS viga); Node CI test lisatud. Ei ole veel mängu serveri lõplikku visuaalkontrolli ega kõiki sisemenüüsid piltidena. V289 jääb ?ui=painted režiimiga alles. Vaata MUUDATUSED_UI_V290.md.

- V291 (pildipõhise kompaktse HUD-i katse): kasutaja viimase 1671×941 kinnitatud pildi 38 eraldi WebP-spritest koosnev UI; kõik ressursikastid, avastuste ikoonid, kuus menüükaarti, minimapi ja üksuse pildilised nupud on eraldi klõpsatavad. Päris mängunumbrid ja üksusepilt tulevad mängust. Minimap canvas liigub läbipaistva raami alla ja taastub režiimist väljudes. Kohalik Chromiumi inline test kuuel resolutsioonil: 0 JS viga ja kõik pildid laetud, nupp käivitas algse käsu. V291 käivitub ?ui=art, V290 ?ui=picture alles. Täielik avaldatud mängu QA ning sisemenüüd jäävad eraldi kontrollida. Vaata MUUDATUSED_UI_V291.md.

- V292: V291 pildipõhise maailmakaardi HUD-i mobiilipaigutus parandatud. Telefonil püstvaates 3×2 kompaktset pildikaarti (124–153 px), rõhtvaates 6 kaarti ühes 70–91px reas; minimap, avastused ja valitud üksus jäävad pildielementideks. Ressursikastid klikitavad, suum-välja nupp taastatud, paus/jätka mõlemad toimivad. Originaalsed pildid ja tegevused säilivad, töölaua CSS muutmata. Failid hud-v292-mobile.css/js, test tests/ui-v292-mobile.mjs; üksikasjad MUUDATUSED_UI_V292.md. Kohalik mock-up test kontrollitud, päris mobiilne GitHub Pagesi test kasutaja poolt veel vajalik.

- V293: avastuste UI eraldi parandusetapp. Viis ringi näitavad 1 aktiivset avastust + 4 päriselt järjekorras olevat (tühjal kohal pluss, mitte suvaline ikoon); kõik tehnoloogiapuu nupud, inspector ja queue kasutavad konkreetse tehnoloogia pildipõhist SVG-portreed. Põhiloogika/salvestus muutmata. Failid `research-art-v293.js/.css`, `hud-v293-research.js`, muudetud `research-ui.js`, `research-tree-v119.js`, `civilization.js` read-only snapshot; test `tests/ui-research-v293.mjs`. V293 avatakse `?ui=art&v=293`; vt MUUDATUSED_UI_V293.md.

- V294: avastuste menüü ehitatud ümber ühe `ui-art-v294/research_menu_bg.svg` illustratsiooni peale. Vana mitmekihiline research-window/kaartide taust eemaldatud; avastused on päris pildi- ja klõpsualadena tausta peal, inspector paremal ja 1 aktiivse + 4 järjekorraga uurimisrida pildi allservas. Vana maailmakaardi HUD ei jää avatud research-menüü peale (z-index 300 ja HUD peitmine). Mobiilne püsti/rõht paigutus, cache bust ja test `tests/ui-research-v294.mjs` lisatud. Mängureegleid ei muudeta. Vaata MUUDATUSED_UI_V294.md.

- V295: avastuste menüü stabiilne ühe pildi lahendus. Desktop/rõhtvaade kasutab V294 ühte 1600×920 pilditausta, telefoni püstvaade kasutab ühte uut 720×1280 pilditausta. Tehnoloogiapuu pildinupud, 1+4 järjekord, algne mänguloogika alles. Sulgemisnupp tõsteti pointer-events:none pealkirjareast välja. Uus CSS/JS `research-panel-v295.*`, pilt `ui-art-v295/research_menu_mobile.svg`, CI test. Varasem V293 aegunud järjekorra test parandatud. Vt MUUDATUSED_UI_V295.md.

- V296: avastuste menüü avamine parandatud. Pildilise HUD-i avastusbadge, viie järjekorraringi ning mobiili teaduse ressursinupu käsud kutsuvad nüüd otse mängu `openResearch()` (avalik adapter `window.openKuningriigidResearchV296`) peidetud `#techtoggle` nupu asemel. `boot-v83.js` ja HUD JS failid cache-bustitud. `tests/ui-research-v296.mjs` testib menüü avamist ning renderdamist; vt MUUDATUSED_UI_V296.md.

- V297: pildilise maailma HUD-i vigade parandus. V291 algsetest fotovaradest tehtud 5 läbipaistva maskiga iseseisvat SVG-pilti; eemaldatud avastuste/minikaardi/paneeli kandilised taustad ja portree sisse jäänud Loss-tekst. Suur sinine footer kaotatud mobiilis; kasutuses õhuke dekoratiivpilt. Minikaardi ja üksuse pildil olevate nuppude topeltpildid peidetud, läbipaistvad nupud kohanduvad pildiraami tegeliku suurusega. Ainult UI muudatus, 3D, salvestus ja AI puutumata. Vt MUUDATUSED_UI_V297.md; test tests/ui-v297.mjs.

- V298: mobiili pildipõhise UI aluspõhjus kõrvaldati: vanad üksteisega vastuolus olevad V291 mobiili, V292 ja V297 CSS/JS paigutuskihid eemaldatud aktiivsest laadimisest. Uus hud-v298-layout.js/.css arvutab kõik kaardi/paneeli ja päris klõpsualade mõõdud ühes kohas; pildi- ja mänguressursid samad. Rõhtvaates kompaktsed 6 kaarti, paremad puudutusalad; kitsal ekraanil ja püstvaates avatavad pildipaneelid. Automaattest tests/ui-v298.mjs proovib 5 resolutsiooni ning 3 avatavat paneeli. Vaata MUUDATUSED_UI_V298.md.

- V299: V298 kuvatõmmise järgi üle kontrollitud kõik nupud: minikaardi 3, üksusepaneeli 4 (nende kuvatud pildilõike kohad erinesid kuni ~20 px), avastuse põhinupp ja 5 järjekorraringi, 6 põhimenüü kaarti, ülariba. Minikaardi ja üksuse originaalsed nupupildid taastatud, et vältida siniseid tühje ringe. Eraldi zoom-out nupp liigutatud zoom-in ringi pealt ära; paus/jätka kasutavad üht kohta, disabled speed nupp peidetud, kuupäev lühendatud. Test `tests/ui-v299-buttons.mjs`; vt MUUDATUSED_UI_V299.md.

- V300: parempoolne pildipõhine valikupaneel nüüd kontekstipõhine. Lisatud üks puhas ümmarguse portreega paneel `ui-art-v300/selection_frame.svg` ja 17 eraldi pildiga käsunuppu; `selection-context-v300.js` valib neli tegelikku käsku vastavalt kas valitud on linn, üksus/armee, tööline/asunik, hoone, kaubavedu või mitte midagi. `kingdomsUiV288.snapshot().selection` kannab ainult valiku andmeid, ilma mängureegleid/salvestust muutmata. Sõduri ründamine ainult lahingus, võõra üksuse liikumisnupud keelatud. Dünaamiline ikoon ja korrektne portree/nimi integreeritud olemasoleva V299 paigutusse. Test `tests/ui-v300-selection.mjs`; vt MUUDATUSED_UI_V300.md.

- V301: kasutaja kinnitatud tühja fantasy-pilditausta saab töölaua maailmakaardil näha ühe läbipaistva HUD-kihina. Alumist raamistikku lühendati 20%, klõpsualad ja kuus kaarti joondati uute raamidega, V300 käsud ning mobiilne V298 paigutus säilivad. Vt MUUDATUSED_UI_V301.md ja tests/ui-v301-background.mjs.

- V302: V301 suurest taustapildist loobutud viie eraldi värskelt joonistatud WEBP UI-tausta kasuks (ülariba, avastused, minikaart, kuus tühja keskmist kaarti, parempoolne valik). Alumine dokk 20% madalam, kaardimaailm säilib nähtavana. Päris käsukontrollid ja mini-canvas on eraldi kihis. Töölaual aktiveerib `hud-v302-pieces.js`; mobiil jääb V298/V301 rajale. Vt MUUDATUSED_UI_V302.md.

- V302b: alumise kuue tühja kaardiga paneeli fikseeritud keskpaigutus eemaldatud. Dokki ankurdab vasak minimapi paneel ja parem valikupaneel: mõlema äärisega 28 px ülekatet (referentsil), dokk uue laiusega 1003 px ja kõrgus 143 px. Külgpaneelid on visuaalselt eespool, kuus olemasolevat läbipaistvat nuppu jaotuvad dünaamiliselt doki sloti peale. Eelmise kujunduse keskmine õhuvahe kadus; mobiili V298/V301 asukohad jäävad muutmata. Test `tests/ui-v302-pieces.mjs` kontrollib geomeetriat, ülekatet ning nupukaste.

- V302b CI järelparandus: V299/V300 regressioonitestide pealkirjaversioon oli jäänud V301 peale, kuigi mäng on V302. Testid aktsepteerivad nüüd V301/V302 silti, mängureeglid muutmata. V302 dokiühenduse geomeetriatest lisati ka kiire automaattesti voogu; ühest pildist sõltuv vahemälu versioon on `302b`.

- V303: kuus uut maalitud käsukaarti (linnad, ehitus, armeed, kaubandus, diplomaatia, logi), 4 minikaardi nuppu ja 4 valitud üksuse kontekstiga sobivat kullatud nupupildi. Funktsionaalne käsk ja valiku blokeering tulevad endiselt V300-st, mitte pildist. Keskdokki jäetakse 28px küljeülekatetega; vana hõljuv zoom-out klõpsuala asub nüüd minikaardi ülemises vabas ringis. V298 mobiili-pildid muutmata. Vt `MUUDATUSED_UI_V303.md` ja `tests/ui-v303-buttons.mjs`.


- V304: kogu illustreeritud UI üks ühine sinine-kuldne kujundus (`ui-v304.js/.css`), vana V288–V303 HUD-i paigutuskood selles režiimis ei käivitu ja vanad esitlusstiilid lülitatakse välja. Üks päris minikaart, 6 põhimenüü pildikaarti, 6 reaalset ressursiloendurit, kontekstikäsud, üksuse lisakäsud/rivistus, kaardivahetus ja jalutamine. Telefoni avanevad paneelid. Sama genereeritud pilditaust peamenüüs, linnas/ehituses/töölistel, armeedes, kaubanduses, diplomaatias, päevikus, abis, graafikas ja salvestuste menüüs.
- V304 avastused: 140 eraldi genereeritud ajaloolist WEBP illustratsiooni (2,72 MB) kõigis avastuste kaartides, infopaneelis ning 1 aktiivse + 4 järgneva uurimuse reas. `research-art-v304.js` seob pildid tehnoloogiate ID-dega. Tundmatu ID korral SVG varupilt säilib. Puu veergude arv sõltub tegelikust vabast laiusest, mitte akna laiusest. `ui-catalog-v304.js` lisab ehitus- ja värbamiskaartidele sisule vastavad pildid.
- V304 kontrollid: nõutud CI quick-check käsud käivitatud, mängu/teede/lahingu/salvestuse/valguse regressioonid korras; vanad ainult-SVG ja fikseeritud versioonisiltide UI testid uuendatud WEBP ning V304 jaoks, kogu UI regressioon uuesti läbitud. `tests/ui-v304.mjs` kontrollib 140 pildifaili, tegelikku käsudispetšerit, võõra üksuse piiranguid ja uurimisreeglite püsimist. Brauseris UI kontroll 1363×936, 390×844, 844×390: avastuse valik, järjekord, pildid, telefoni paneelid, ehitus; avastuste piltidel puuduvad laadimisvead. Brauseri test kasutas päris UI/uurimisrenderdajat eraldi WebGL-ita andmestikuga; pilvebrauser ei saa WebGL konteksti, seega 3D täismängutest pole kinnitatud. Pilt `previews/ui-v304-research.jpg`.
