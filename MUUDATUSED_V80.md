# Kuningriigid V80 – teed ei läbi maju, ühendatud tänavate võrgustik ja keskaja näidislinn

## Parandatud: V79 teed jooksid kohati läbi ehitiste

### Mis oli põhjus?
Varem tähistas `Navigation.rebuild()` hoone ümber kitsast keeluala (enamasti vaid 2,5 × 2,3 m poolmõõtu). Pronksiaja 3D-hoonel olid aga näiteks trepid, trepimademed, kaubakastid ja turu varikatused kaugemal kui see. Teerajad olid seega tehniliselt lubatud ruutudel, kuigi 3D-mudeli jaoks jooksis tee juba läbi ehitise. V79 näidislinnas ühendas kunstlikult eelkõnnitud rada peamiselt kolme elamut ühe turuga: sellest ei saanud välja kasvada linna tänavatevõrgustikku.

### Kuidas V80 töötab?
- `navigation.js`: 3D-hoonele vastav **hoonetüübipõhine vabaks jäetav ala**, sealhulgas trepid, varjualused ja rekvisiidid; sissepääs nihutati maja ette väljapoole takistusala.
- Kui hoonet liigutatakse või lisatakse (isegi kui hoonete koguarv ei muutu), arvutatakse navigeerimismask uuesti ning eemaldatakse hoone alla jäänud vanad rajajäljed. Vanad V4 salvestused parandatakse avamisel; neid ei kustutata.
- `detail-roads.js` ja `civilization.js`: 3D-teeribad ja kulumisringid joonistatakse vaid seal, kus on endiselt läbitav maapind. Teeribad on kitsamad ja ei ulatu seintesse; 3D teede geomeetria ehitatakse ümber ka siis, kui hoonete asetus muutub.
- `town-streets-v80.js`: **kaks eri naaberhoonete suunda** (ida–lääs, põhja–lõuna), lähimad töökojad ja mitmed ühiskasutatavad sihtkohad (kodud, turg, kaev, peamaja, kõrts). Kõik ühendused lähevad mööda päriselt läbitavat navimarsruuti, mitte sirgjoones läbi majade.
- Uusi kõnnijälgi lisavad linnarahva igapäevased käigud järk-järgult iga seitsme mängusekundi järel. Üks käik ei muuda rada kohe nähtavaks; korduv liikumine kasvatab raja taset ja kasutamata teed kuluvad edasi.
- Eelnäidislinnad saavad kohe kontrollitava tänavavõrgustiku, mille jäljed tekkisid **navigeerimissüsteemi kaudu läbitud korduvatel marsruutidel**, mitte suvaliste joonistatud joontena.

### Näidislinnad
- **[Vaskoru pronksilinn – uued teed](https://orogdor.github.io/Kuningriigid/?v=80-20261020&demo=bronze)**. Võrdle V79 pronksiaja maju ja tänavavõrgustikku kasutaja algse ekraanipildiga.
- **[Kivilinna keskaegne linn](https://orogdor.github.io/Kuningriigid/?v=80-20261020&demo=medieval)**. Suur linn koos keskaegsete hoonete, tornide, kindluste ja teedega.
- **[Tavaline mäng](https://orogdor.github.io/Kuningriigid/?v=80-20261020)**. Jätkab olemasolevast V4 salvestusest.

Näidislinnad avatakse URL-i `demo=` parameetriga ajutises lugemisrežiimis. Praegune automaatsalvestus ja käsitsi salvestuskohad jäävad alles. Demo JSON-i saab menüüst eksportida.

**Ajastud on täpselt** kiviaeg (0), pronksiaeg (1), rauaaeg (2), keskaeg (3). V80 uus keskaegne arhitektuur kehtib ajastule **3**, mitte rauaajale 2. V79 pronksiaja 3D-mudelid jäävad alles.

## Kontrollid

- `TEST_V80.mjs`: mitu hoonevahelist teeliiki, tegelike naviruutude hoonemõõtudega välistus, 3D-teeriba tippude kokkupõrkekontroll, navigeeritav marsruut ja eraldi keskaja hoonemudelid.
- `TEST_V80_UI.mjs`: Chromiumi telefonivaade pronksiajast ja keskajast, arvutivaade, teede tegeliku nähtavuse ja majadesse mitte lõikumise kontroll ning ekraanipildid.
- Vanad `TEST_V79.mjs`, `TEST_V78.mjs`, `TEST_V77.mjs`, `TEST_V76.mjs`, `TEST_V75.mjs`, `TEST_V73.mjs` kontrollivad varasemat mängu, salvestusi ja ajastuid.

Füüsilise telefoni GPU FPS-i ei mõõdeta tarkvaralise WebGL-ga CI-brauserist. Linnakülade teede arv sõltub elanike liikumisest, hoonete asukohast, läbitavast maastikust ja vanemate radade kulumisest.
