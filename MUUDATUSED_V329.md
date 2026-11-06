# V329 – tihedamad metsad ja ühine liigijaotus

Metsade, taiga ja džungli põhikiht on maailmakaardil 1,8 korda tihedam; suuremate metsatukkade puude arv kasvas 6 pealt 10 peale. Detailkaart lisab metsabiomides ühe väiksema kaaspuu iga elava puu kõrvale, kui koht on kuiv ja vaba. Kaaspuu kuulub sama ressursi vaate juurde ning kaob koos raiutud või ehituse jaoks eemaldatud puuga. Ressursse, majandust ja olemasolevaid salvestusi ei muudeta.

Kõik kolm puukihti kasutavad forest-ecology-v329.js liigireegleid. Taigas ja külmas metsas kasvavad kuusk, mänd ja kask; parasvöötme metsas tamm, pärn ja kask; kuivemas metsas mänd ja tamm; džunglis olemasolevast kuuest liigist palm. Kõrbes on palmid vee juures, mitte kuival kõrbepinnal. Detaili looduslik ja istutatud järelkasv kasutab sama asukoha liigireeglit.

Detaili kaaspuud väldivad vett, suuri kõrguserinevusi, maju ja põlde. Aktiivsel detailkaardil kontrollitakse kaaspuu nähtavust olemasoleva navigeerimisvõrgu, tekkinud teede ja hoonete järgi. Instancing, viis mudelivarianti ja ekraanisuurusest sõltuvad LOD-id säilivad.

Kontrollid: tests/forest-ecology-v329.mjs kontrollib 8000 liigivalikut, külma/kuiva metsa, oaasi, tegeliku detaili dekoraatori vee/nõlva/põllu välistusi ja salvestuse puutumatust. Testkaardi 81 ruudu maailmapuude arv 2617 → 4684; detailressursse endiselt 24853. Saplingu paigutus- ja elava instancing'u kontrollid läbisid. Kõik 106 CI kiirkäsku läbisid; tulemused reports/forest-v329-ci.json.

Kohalik Chromium ei saanud selles keskkonnas socket-piirangu tõttu käivituda. Päris brauseri testi jaoks on valmis tests/sapling-trees/game-browser-v329.cjs ja eraldi Actionsi töövoog. GPU-pilti ja seadme FPS-i pole kinnitatud.

Muudatused on kohalikus harus feature/forest-ecology-v329. GitHubi push blokeeriti automaatse turvakontrolli poolt, kuna avaldamiseks nõutakse kasutaja kinnitust; avalikus veebis ja APK/EXE sisukanalis V329 veel ei ole.
