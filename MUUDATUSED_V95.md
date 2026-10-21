# V95 — Mükeene stiilis pronksiaja väed ja uus testlahing

Kõigi nelja pronksiaja sõjatüübi mudelid on uuesti tehtud. Need kasutavad olemasoleva mängu liigendatud animatsiooniliidest ning asendavad pronksiajal senised üldised mehed ja ratsaniku.

- Odamees: suur kaheksakujuline nahkkilp, pronksotsaga oda, avatud kiiver, pronksist kehakaitse ja säärekaitsmed. Kaitserivis suunab oda ette.
- Kirvemees: väiksem ümmargune kilp ja selgelt eristuv pronkskirves.
- Vibukütt: kergem tuunika, nahast peakate, kaarvibu ja nooltega tupp.
- Sõjavanker: kahe hobusega kodarratastega vanker, värvitud esipaneel ja soomustatud vibuga võitleja.
- Eliit kannab kihvplaate meenutavat kiivrit ja rohkem pronkskaitset. Mobiliseeritud meestel on lihtsam varustus.

Kreeka pronksiaja eeskujuks on Mükeene varustus, mitte hilisem klassikaline Korintose hopliit. Mudelid on stiliseeritud ja kombineerivad eri varustuselemente; need ei taotle ühe leiu täpset rekonstruktsiooni. Vankri üks aktiivne nähtav võitleja vastab ühele mängu loendatavale vankrivõitlejale: eraldi dekoratiivset loendamata teist meest pole lisatud. Riigivärvid on mängu eristus, mitte väide ajalooliste ühtsete vormivärvide kohta.

## Riikide eristamine

Detailkaardi sõjaväe värvid on sinine, punane, violetne ja ooker. Pronksiaja kilpidel, tuunikatel, kiivrituttidel, hobuste katetel ja vankri esipaneelil on suured riigivärvi pinnad. Ühised pronks-, naha- ja linased toonid jäävad varustuse materjalideks.

## Uus lahing

`?demo=bronze-battle` avab uue seemnega 9517 lahingu. Mõlemal poolel on 120 odameest, 48 kirvemeest, 60 vibukütti ja 22 vankrivõitlejat: kokku 250 + 250 individuaalselt loendatavat meest. Pooled on sinine ja punane. Kõik neli pronksiaja tüüpi osalevad mõlemas armees. Alles jäävad 3 × 3 lahinguala, terve tühi sektor armeede vahel, 500 mehe piir, põgenemisala ja aeglasem lahingukell. Näidis ei kirjuta üle tavalist kampaaniasalvestust.

Mudelite ülevaade on lehel `MUDELID_V95.html` ja algusmenüü jaotises „Näidislinnad ja mudelid”. See kuvab mõlemad värvid kõrvuti, telefonis kahe veeru ja nelja reana.

## Ajaloolised eeskujud

- National Archaeological Museum, [Collection of Mycenaean Antiquities](https://www.namuseum.gr/en/collection/syllogi-mykinaikon-archaiotiton/).
- National Archaeological Museum, [The face of farewell](https://www.namuseum.gr/en/monthly_artefact/the-face-of-farewell/): sõjavarustuses odameeste kujutamine Mükeene sõdalaskraatril.
- Heraklion Archaeological Museum, [Boar’s-tusk helmet with cheek guards](https://heraklionmuseum.gr/en/exhibit/boars-tusk-helmet-with-cheek-guards/): kihvplaatidest kiivri ja põsekaitsmete eeskuju.

## Kontroll

`TEST_V95.mjs` kontrollib 48 mudeli-, varustusastme- ja värvikombinatsiooni, päriselt geomeetrias olevaid riigivärve, luude sõltumatust, animatsiooni, geomeetria lõplikkust ja mõõtmeid, 8 hobusejalga vankri kohta ning nelja pronksiaja tüübi olemasolu mõlemas 250-mehelises armees. Mudeli staatilised osad ühendatakse liigendi ja materjali kaupa; jagatud geomeetria hoiab iga jalaväelase 6–13 ning vankri 20 joonistuskutse piires.

`TEST_V95_UI.mjs` kontrollib mudelite ülevaadet, mängus kõigi 500 uue mudeli olemasolu, 250 sinist ja 250 punast mudelit, legendi, telefoni ja arvuti üksusekaarti ning lahingu käivitumist. Varasemad testid kontrollivad lisaks kokkupõrkeid, poole aeglasemat lahingukella, laskmist, moraali, põgenemist ja lahingu lõpuni jõudmist uuel maastikul.
