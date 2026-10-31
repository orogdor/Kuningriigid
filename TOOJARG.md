# Kuningriigid – ühine tööjärg

Viimati kokku lepitud seis: **V255**, GitHubi `main`-harus. Enne töö alustamist kontrolli alati GitHubi tegelikku viimast seisu; seda faili ei uuendata automaatselt.

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
