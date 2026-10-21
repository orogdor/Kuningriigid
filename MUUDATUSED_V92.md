# V92 – ajalooallikatest inspireeritud lahingukäitumine

500 mehe ülempiir, 12-mehelised salgad ja 3×3 võitlusala säilivad. Testis on mõlemal poolel 250 meest: 120 odameest, 48 kirvemeest, 60 vibukütti ja 22 sõjavankrivõitlejat. Need on võrreldava mängutesti arvud, mitte ühegi ajaloolise armee teadaolev koosseis.

## Allikad ja nende piirid

- Bibliotheca Alexandrina, [Thutmosis III annaalide tõlge](https://inscriptionslibrary.bibalex.org/presentation/monument.aspx?ins_id=13&lang=en&mon_id=5205), tõlked Redfordi ja Lichtheimi järgi: Megiddo juures kirjeldatakse keskosa ja kahte tiiba ning vastaste põgenemist ja varustuse mahajätmist. Tegemist on kuningliku võidukirjeldusega, mitte neutraalse lahingulogiga.
- [Metropolitan Museum, Seti II vibuga sõjavankril](https://www.metmuseum.org/art/collection/search/549276): esemeline kujutis toetab sõjavankri vibulaskmise rolli.
- [PBS, New Kingdom Soldiers](https://www.pbs.org/empires/egypt/newkingdom/soldiers.html): professionaalsed väeosad, nõrgemalt varustatud ajateenijad, kerged kilbid ning juhi ja laskuriga vankrid.
- [Breasted, The Battle of Kadesh](https://storage.lib.uchicago.edu/pres/2008/pres2008-0334.pdf), Chicago Ülikooli digikogu: marsikolonni üllatamine ja vasturünnakud. Tegemist on vana uurimusega; selle arve ja rekonstruktsioone ei võetud mängu kindlate mõõtudena.
- [English Heritage, Hastingsi lahingu ülevaade](https://www.english-heritage.org.uk/members-area/members-magazine/october-2018-get-ready-for-the-battle-of-hastings/): koos püsiva kaitserivi tugevus, rivi lõhkuva jälitamise oht ja paanika. See on keskaegne võrdlus, mitte tõend pronksiaja kilbimüüri kohta.
- [Bryn Mawr Classical Review, Drews'i käsitluse arvustus](https://bmcr.brynmawr.edu/1994/1994.01.09): pronksiaja jalaväe ja vankrite täpse rolli rekonstruktsioonid on vaieldavad.

## Mängus rakendatud tõlgendus

| Väeliik / olukord | Käitumine |
| --- | --- |
| Odavägi | Ees lai rivi; mehed püsivad oma salga lähedal ja eelistavad ees paiknevaid sihtmärke. Seisev koondunud odavägi on tugevam ratsaväe vastu. |
| Kirvemehed | Algul teises ešelonis, automaatses rünnakus vabanevad 16 mängusekundi järel; otse lähedale jõudnud vaenlast tõrjuvad kohe. |
| Jalaväe laskurid | Liiguvad oma eesliini taga; ei jookse automaatselt kogu salgaga vaenlase keskele. |
| Sõjavankrid | Mõlemal tiival, mobiilsed vibulaskurid; hoiavad laskekaugust ja väldivad otserünnakut odarivile. Mudelil on nüüd vibu. |
| Rivi ja küljed | Koondunud odameeste esikülg vähendab noolte, kivide ja heiteodade kahju. Tagant ja küljelt ründamine suurendab kahju ning moraalipinget. Kilp ei kaitse samal viisil püssikuuli eest. |
| Laskemoon | Vibukütt alustab 20, vankrilaskur 24 lasuga. Lask võib mööduda. Laskemoona lõppedes on võimalik nõrgem lähivõitlus. Hilisematel tulirelvadel on eraldi suurem varu. |
| Väsimus | Liikumine ja võitlemine väsitavad, puhkus taastab; väsimus vähendab kiirust ja võitlusvõimet. |
| Moraal | Oma salga kaotused, lagunenud rivi, küljerünnakud ja lähedaste salgakaaslaste põgenemine võivad põhjustada paanika. Lähedal olevad võitlusvõimelised omad toetavad moraali. |
| Põgenemine | Mees või salk võib lahingust eemalduda elusalt. Punase joone ületamise varasem reegel jääb jõusse: see viib vastava armee kaardilt välja. |

## Teadlikud lihtsustused

Täpne vahemaa, kahjuprotsent, moraalilävi, laskemoon ja 16-sekundiline viivitus on mänguparameetrid. Kõik pronksiaja armeed ei kasutanud ühesugust asetust; see on kontrollitav üldstsenaarium, mitte täpne Megiddo, Kadeši või Hastingsi rekonstruktsioon. Tänapäevaste armeede jaoks ei väideta selle asetuse ajaloolist täpsust. Vankrimudel ja sõidukimeeskonna visualiseerimine on endiselt lihtsustatud: mudel ei rekonstrueeri eraldi kõiki juhi, laskuri ja hobuste rolle.

## Kontrollid

`TEST_V92.mjs` kontrollib rivistust, teise ešeloni viivitust, mõlemat tiiba, sõjavankri laskekaugust, relvaliikidest sõltuvat kaitset, küljerünnakut, paanikat, laskemoona, väsimust ning 500 mehega lahingu lõppu päris maastikul. `TEST_V91.mjs` kontrollib jätkuvalt iga mehe tervist, kaotuste säilimist, kokkupõrkeid ja koos põgenenutega korrektset arvestust. Brauseritest kontrollib nii arvuti- kui telefonivaadet ja inimese infokaarti.
