# V88f – sõjavägi ja lahinguväli

Kõigis ajastutes vähemalt neli uut oma ajastu lahinguüksust. Varasemaid saab edasi värvata.

| Ajastu | Üksused |
|---|---|
| Kiviaeg | Kiviviskajad, puuodamehed, kivikirvemehed, vibukütid |
| Pronksiaeg | Pronksodamees, pronkskirvemees, pronksiaja vibukütt, sõjavanker |
| Rauaaeg | Raudmõõgamehed, ratsavägi, rauaaja vibukütt, heiteodamees |
| Keskaeg | Amburid, hellebardimehed, rüütlid, raskeratsavägi, relvamehed, katapult, müürilõhkuja, piiramistorn |
| Renessanss | Musketärid, piigimees, arkebuusimees, kürassiir, välisuurtükk |
| Tööstusaeg | Püssimehed, rivijalavägi, ratsalaskur, vintraudne suurtükk |
| Moodne aeg | Motoriseeritud jalavägi, moodne jalavägi, kuulipildujameeskond, tank, tankitõrjerühm |

## Varustus ja kogemus

| Varustus | Materjalikulu | Tervis ja löögijõud |
|---|---:|---:|
| Mobiliseeritud | 50% | 40% |
| Standard | 100% | 100% |
| Eliit | 130% | 140% |

Valik sõjaväe värbamismenüüs; kehtib ka laevadele. Maaväe rahvastikukulu jääb kolmeks ja väljaõppe kestus samaks.

Armee saab XP-d osalemise, tekitatud kahju, hävitatud üksuste ja võidu eest. LVL 2 vajab 100 XP-d, LVL 10 8100 XP-d. Vahepealsed piirid: 100 × (LVL−1)². LVL 10 tervis, löögijõud, laskekaugus, kiirus, moraal ja ründesagedus on 3× LVL 1 näitajad (+200%). Varustuse kordaja liitub kogemusega korrutades. Taseme tõus säilitab haavade osakaalu. Hukkunud üksused ei ärka ellu. Kogemus säilib salvestuses.

## Ühine armee

Maailmakaardi armeede nimekirjas vali armee ja „Koonda oma armeed siia“. Teised oma armeed liiguvad füüsiliselt kohale ja ühinevad saabudes. „Ühenda siin olevad armeed“ ühendab juba samas ruudus olevad salgad. Ühendatud väe kogemus on üksuste arvuga kaalutud keskmine; jagamine ei loo juurde kogemust. Maailmakaardil liigub kogu armee aeglaseima salgatüübi kiirusega.

Maailmakaardil liiguvad ühendatud armee kõik salgad koos. Detailkaardil ja lahingus saab liikumiskäsu anda ainult ühele valitud salgale: vali salk, „Liigu“ ja sihtpunkt. „Peatu“ peatab ainult valitud salga. Grupivalik ja ühine rünnakukäsk on eemaldatud.

Lahing laeb 6 × 6 detailruudu suuruse ala ning ühe ruudu laiuse põgenemisvööndi igast küljest: kokku 8 × 8 ehk 64 ruutu. Võitlusala eraldab põgenemisvööndist punane joon. Kui elus välisalk ületab joone, põgeneb kogu tema armee; teised samal poolel võitlevad armeed võivad jätkata. Põgenemine ei tapa üksusi. Armee paigutatakse maailma kaardil läbitavasse ja vastaste poolt hõivamata põgenemissuuna ruutu; kui sellist ruutu ei leidu, välditakse 30 sekundit uut kohtumist. Põgenemisnupp selgitab joone ületamist ega vii armeed enam koheselt kodulinna. Lahinguala kaamerat saab liigutada ja suumida kogu 8 × 8 ulatuses. Salvestatud lahingu ala taastatakse mängu jätkamisel.

## Kontrollimine

`TEST_V88_MILITARY.mjs`: kõigi ajastute koosseisud, uurimuste ja hoonete nõuded, kõigi üksuste mudelid kolmes varustusastmes, tegelik värbamiskulu ja valmimine, kuue näitaja 3× kasv, haavade ja salvestuse säilimine, XP ühekordne arvestus, liitmise kaalutud XP, formatsioon, liikumine, lahing, kolme armee tegelik koondumine 15-salgaseks väeks ja jagamine.

`TEST_V88_MILITARY_UI.mjs`: mängu käivitus, mobiliseeritud jalaväe ja eliittanki ostmine kasutajaliidesest, ainult ühele salgale antud liikumiskäsk, arvuti ja telefoni ekraanipildid, brauserivigade kontroll.

Varasemad V88 ressursside, tootlikkuse, ajastuhinna, raporti ja kinnijäämise kontrollid ning V59/60/61/64/67/68/72/73/86/87 regressioonid läbisid kohaliku kontrolli.

`TEST_V88_BATTLEFIELD.mjs`: 36 võitlusruutu ja 28 põgenemisruutu, kõik neli punast serva, terve armee põgenemine, teiste armeede jätkamine, elusate üksuste säilimine, päris mitme ruudu liikumistee, maailmakaardile taandumine, vana salvestuse taastamine.

`TEST_V88_BATTLE_UI.mjs`: kahe armee tegelik kokkupõrge, terve 8 × 8 maastiku laadimine, individuaalne liikumiskäsk, tegelik liikumine üle joone, armee põgenemine ning arvuti ja telefoni ekraanipildid.
