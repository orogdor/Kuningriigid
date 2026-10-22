# V111 – hilispronksiaja kindluslinna piiramistest

Test: `?demo=bronze-siege&v=111` (eraldi näidis; mängija automaatsalvestust ei asenda).

- Suletud kivimüüriring: 36 eraldi purustatavat lõiku, sh kaks puitväravatega väravahoonet. Kümme kandilist torni, kivisoklid ja savitellistest ülaosad. Müüride vahele jäävad peamaja, elamukvartalid, kaev, turg, laod, kasarm, pronksivalukoda ja keraamikatöökoda. Hattušast inspireeritud mänguline linn, mitte arheoloogilise paiga täppisrekonstruktsioon.
- Ühendatud müürikäigud ja neli sisetreppi. 64 vibumeest kaheksas 8-mehelises müürisalgas; kaitsjad liiguvad mööda ühendatud müüri ohu suunas. Jalavägi saab valmis redeli/piiramistorni kaudu müürile, seal liikuda ning sama vahendi kaudu alla tulla. Müürile liikumiseks vali salk, Liigu ja müür. Sisetreppi saavad kasutada kaitsjad. Maas olev lähivõitleja ei löö otse kõrgemal asuvat kaitsjat.
- Alles on V108 ehitusajad ja puidukulu: redel 30 s / 18 puitu; torn 120 s / 75 puitu. Vallivibumeeste laskekaugus +25%.
- Müüri purunemine avab ainult selle lõigu. Suletud linna sisemine rajaleidmisala säilib.
- Parandatud sõdurite tegelik kõrgus renderdamisel: varasem lapselemendi asukoht tühistas müüri kõrguse.
- Staatilised kiviplokid liidetakse materjali järgi, geomeetriat jagatakse. Mängusalvestuse skeem jääb V4.

## Testiväed ja ajaloolise lähenduse piir

Kadeši (u 1274 eKr) jalaväe ja kaarikuväe eeskuju. Relvaliikide täpne jaotus pole allikatest teada: odameeste, kirvemeeste ja vibumeeste osakaal on selgelt mänguline lähendus. Lahing ei taasloo Kadeši sündmusi ega pretendeeri mõlema armee täpsele suurusele.

| Pool | Odamehed | Kirvemehed | Jalaväe vibumehed | Kaarikud | Kaarikumeeskond | Inimesi kokku |
|---|---:|---:|---:|---:|---:|---:|
| Ründaja | 96 | 48 | 48 | 24 | 48 (2/kaarik) | 240 |
| Kaitsja | 72 | 24 | 64 | 12 | 36 (3/kaarik) | 196 |

Ründajal 80% jalaväelasi / 20% kaarikumeeskondi; kaitsjal u 82% / 18%. Mootor näitab ühe kaariku ühe lahinguobjektina: 216 ja 172 kuju, mitte vastavalt 240 ja 196 eraldi animeeritud inimest. Tornide töölistest vahid on hoonete kaitseteenistus, neid selles regulaarväe tabelis ei loeta. Ratsavägi ja katapuldid on selle ajaloolise näidise koosseisust eemaldatud; tavamängu üksusevalik ei muutu. Piiramistorn on säilitatud kasutaja varem soovitud mängumehaanikana; ei väideta, et see esines just Kadešis.

Eeskujud:
- DAI, Hattuša müüride eksperimentaalne rekonstruktsioon: https://www.dainst.org/blogs/experimental-archaeology-research-strategy-with-a-wow-factor/386
- Rekonstruktsiooni arhitektid, kivisokkel ja savitellised: https://klessing-hoffschildt-architects.com/turkey-bogazkale-hattusa-city-wall-reconstruction/
- British Museum, Kadeši lahingu kirjeldus: https://www.britishmuseum.org/collection/object/Y_EA10181-9

Kontroll: `node TEST_V111.mjs`; olemasolevad kindlustuste, ajastute ja lahingu regressioonitestid.

## Kontrolli tulemus

- `TEST_V111.mjs`: PASS (kindluse ehitus, 216/172 kuju, 64 müürivibumeest, ühendatud müürikäik, redeli 18 puidu kulu, 30 s ehitus, ülespääs ja ühe lõigu avamine). Redel ei ava kaarikutele maapealset käiku läbi terve müüri.
- `TEST_V111_UI.mjs`: arvuti 1440×1000 ja telefonimõõt 412×915, mõlemas 36 müürilõiku + 10 tornimudelit, 64 müürisõdurit, 10 s simulatsiooni järel kontrollitud salga liikumine 13,69 m; lehe skriptivead puuduvad. Need on emuleeritud brauseri vaateaknad, mitte füüsilise telefoni jõudlustest.
- `TEST_V100_BATTLE.mjs`: PASS, lahing lõppes 234,4 simuleeritud sekundiga; katapuldid tulistasid, ratsavägi ja vibumeeste mõõgad osalesid lähivõitluses; inimeste arvestus säilis.
- V61, V60, V59, V67 ja V68 kontrollid: PASS.
- Uuendatud kaks aegunud testiootust: V61 tornilask tabab ühte 5 HP meest (ei kanna liigset kahju üle järgmisele); V100 inimeste säilimist võrreldakse testi tegeliku 482-mehelise algseisuga, mitte vana 500 ülempiiriga. V61 vana ootuse viga kinnitati ka muutmata V110 peal.
- Telefonivaates on linnapiiramise infopaneel väiksem ja redeli/torniehituse nupud rivistusvalikust eespool. Müürile jõudnud mängija salk saab liikumis- ja ründekäske.

Avaldamine: muudatused on kohalikus Git-commitis. GitHubi põhiharule lükkamine jäi automaatse kinnituskontrolli taha; avalik mäng ei ole selle töö käigus uuendatud.
