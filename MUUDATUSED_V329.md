# V329 – tihedamad metsad ja ühine liigijaotus

Metsade, taiga ja džungli põhikiht on maailmakaardil 1,8 korda tihedam; suuremate metsatukkade puude arv kasvas 6 pealt 10 peale. Detailkaart lisab metsabiomides ühe väiksema kaaspuu iga elava puu kõrvale, kui koht on kuiv ja vaba. Kaaspuu kuulub sama ressursi vaate juurde ning kaob koos raiutud või ehituse jaoks eemaldatud puuga. Ressursse, majandust ja olemasolevaid salvestusi ei muudeta.

Kõik kolm puukihti kasutavad forest-ecology-v329.js liigireegleid. Taigas ja külmas metsas kasvavad kuusk, mänd ja kask; parasvöötme metsas tamm, pärn ja kask; kuivemas metsas mänd ja tamm; džunglis olemasolevast kuuest liigist palm. Kõrbes on palmid vee juures, mitte kuival kõrbepinnal. Detaili looduslik ja istutatud järelkasv kasutab sama asukoha liigireeglit.

Detaili kaaspuud väldivad vett, suuri kõrguserinevusi, maju ja põlde. Aktiivsel detailkaardil kontrollitakse kaaspuu nähtavust olemasoleva navigeerimisvõrgu, tekkinud teede ja hoonete järgi. Instancing, viis mudelivarianti ja ekraanisuurusest sõltuvad LOD-id säilivad.

Kontrollid: tests/forest-ecology-v329.mjs kontrollib 8000 liigivalikut, külma/kuiva metsa, oaasi, tegeliku detaili dekoraatori vee/nõlva/põllu välistusi ja salvestuse puutumatust. Testkaardi 81 ruudu maailmapuude arv 2617 → 4684; detailressursse endiselt 24853. Saplingu paigutus- ja elava instancing'u kontrollid läbisid. Kõik 106 CI kiirkäsku läbisid; tulemused reports/forest-v329-ci.json.

Actionsi päris mängu WebGL test 42216717316 läbis: V329 käivitus, 12/12 maailma puuderühma valmis, detailis 218 puujuurt / 105 kaaspuud ja 15 liigi-variandi kombinatsiooni, 0 JavaScripti viga. Pildid vaadati üle artefaktis forest-v329-evidence. See on tarkvaraline 320×180 suitsutest; seadme FPS-i ei ole mõõdetud. Raport: reports/sapling-v329-browser.json.

Kasutaja kinnitas GitHubi üleslaadimise ja avaldamise loa. PR #51 on main-is, runtime bf61aac8f9abdbe1bb0854daf04d45207e163b0b. Main CI 42217058570 ja Pages 42217058614 läbisid; avalik veebileht näitab V329 ja forest-ecology-v329.js vastab HTTP 200. Native-content avaldamine 42217545918 läbis. APK/EXE uuendab seitse faili, kokku 367451 baiti; paigaldajat ega puumudeleid ei pea uuesti alla laadima.
