# V343: väiksem CPU-kulu rohkemate objektide jaoks

Alus: main `7285958` (Claude'i V341/V342). Säilivad kaamerapõhine 25-ruuduline detailaken, keskruudukihtide hiline ehitus ja ajalõikudega laadimine. Sapling instancing ja LOD olid juba olemas; neid ei lisatud uuesti.

## Muudatused

- FPS-piirangu tõttu vahele jäetud kaadritel ei tehta enam põhistseeni `worldSync`/`syncLocal`, sõdurite koondamist ega hoonete/üksuste visuaalset uuendamist. Simulatsioon, sisend, kaamera ja salvestuse taimer jooksevad endiselt igal callback'il. Uus `RenderDeltaV343` liidab vahelejäänud animatsiooniaja järgmisele joonistatavale kaadrile; uuele kaardile minnes vana vaate ajavõlga kaasa ei kanta. Animatsioone ei aeglustata FPS-piirangu suhtes.
- Sapling kasutab renderdaja juba arvutatud maailmamatrikseid. Iga puu ei arvuta enam kahel korral kõigi vanemate maatrikseid; nähtavuse sfäär, vaatepüramiid ja abimaatriksid taaskasutatakse.
- Sõdurite koondaja arvutab jagatud esivanemate nähtavuse ühe korra uuenduse kohta; peidetud salgu maatrikseid ei käida läbi. GPU-le märgitakse muutunuks ainult elavate/nähtavate instantside puhvriosa. Koordinaadid on õiged ka liikuva/pööratud vanema puhul.
- Kõrguse vahemälu võrdleb numbrilisi revisjone, loomata igal kõrguspäringul uut stringi. Täpsed koordinaadid ja mõlema revisjoni invalidatsioon säilivad.

Mudelid, LOD-läved, metsatihedus, 25-ruuduline limiit, mängureeglid ja salvestuse formaat muutmata. Need on CPU-kulu vähendused, mitte uus lubadus maksimaalse objektide arvu või riistvara FPS-i kohta. Piiramata FPS-i korral kaadrite vahelejätmise võitu ei ole; puude/sõdurite töö väheneb ka siis. Neljasekundilist materjalide läbikäiku selles etapis ei muudeta.

## Kontrollid

- `tests/render-efficiency-v343.mjs`: 144 callback'i / 48 visuaalset uuendust annab endiselt täpselt ühe animatsioonisekundi; paus, kaardivahetus, revisjonid, 160 sõdurit / 1920 osa, peitmine/taastamine, maatriksite vastavus ning GPU puhvriosa. Pööratud/liikuva/venitatud vanemaga puu ning kaamerast väljumine/naasmine.
- Olemasolevad Sapling instancing/LOD/raiumise ja skaudi/varade hilise laadimise regressioonid läbisid.
- `scripts/bench-render-v343.mjs`: kontrollitud V342 lähtekoodi ja uue koodi eraldi CPU-mikrotest, soojendus + seitsme mõõtmise mediaan. 2000 puu ettevalmistus 1,38 → 0,71 ms (−48%); 1000 sõdurit, pooled salgad peidetud: 11,06 → 7,14 ms (−35%); 100000 kõrguse vahemälupäringut 5,46 → 4,69 ms (−14%). Sama puude instantside arv ja maatriksid. Need ei ole kogu mängu FPS-protsendid.
- Täieliku kohaliku quick-check'i ja GitHubi pärismängu brauserikatse tulemused lisatakse pärast lõpetamist. Kohalik Chromium ei käivitu: `process_singleton_posix.cc socket() Operation not permitted`; brauserikatse töövoog on eraldi arendusharus.

Avaldamine: arendusharu `feature/render-efficiency-v343`; main-i ega APK/EXE sisukanalisse pole seda muudatust veel avaldatud.
