# Kuningriigid V169 – kiviaja kindlustatud küla tasakaalustus

Eesmärk: enne pronksiaega AI linnale päriselt ehitatud (mitte tasuta) puidust kaitsering, millel on kaks kasutatavat väravat, neli vahitorni ning maastikuga sobivad palisaadid.

## Parandused

- **Kogu müürikoridori kontroll:** pika palisaadilõigu keskpunkti asemel kontrollitakse kogu lõiku, et see ei läbiks jõge, järve ega muud läbimatut maastikku.
- **Rohkem asukohavariante:** planeerija võrdleb ka kuni 14 mänguühiku võrra nihutatud ringe ning väldib ehitiste ja maardlate koridore.
- **Kompaktne ajalooline südamik:** kaitsering eelistab esimest 90% keskuse ümber koondunud elumajadest. Äärelinna või tootmismaja võib jätta kaitseringist välja.
- **Turvalisem pealinna asukoht:** AI esimese linna asutamise eel kontrollitakse, kas kahe värava ja nelja torniga palisaad mahub kuivale pinnale. Kui algne rannaruut on liiga kitsas, saab AI valida maksimaalselt ühe naaberruudu kaugusel asuva sobiva koha, kus on päris puidu- ja kivivarud ning olemasolevat mööda maad juurdepääsu.
- **Ajastute tasakaal:** juba alustatud müüriringi ei jäeta pooleli pelgalt sellepärast, et küla rahvaarv ajutiselt langes. Kiviaja piduril on endiselt 110 käigu ülempiir.
- Olemasolevaid ehitisi, salvestatud linnade koordinaate ega mängija asuniku otsuseid ei muudeta. AI peab kõik puidust kaitserajatised tavapäraselt ostma ja ehitajatega valmima.

## Testimise viis

- `TEST_V169_FOUNDING.mjs`: rannaruudul olevate piirangute tuvastamine, tegeliku kuiva naaberruudu valimine, algsete maavarade nõue, mängija asuniku puutumatus.
- `TEST_V166_STONE_FORTS.mjs`: materiaalsed ehituskulud, kaks läbitavat väravat, tornid, AI ajastuvahetuse regressioon.
- `TEST_V139.mjs`, `TEST_V160.mjs`, `TEST_V163_STONE_CITY.mjs`: vanad linnaplaneeringu, pronksiaja ja elamutsooni regressioonid.
- `scripts/stone-fort-balance-v167.mjs`: 3 maailma × 3 AI pealinna × kuni 125 käiku; mõõdetakse täieliku müüriringi valmimist viimaseks kiviaja käiguks.

Täpsed arvud ja GitHub Actionsi artefaktid on `.github/workflows/stone-forts-v167.yml` testikäivituse juures.

## Päris AI mängude kinnitatud tulemus

GitHub Actionsi [V169 kolme maailma kindlustamistest](https://github.com/orogdor/Kuningriigid/actions/runs/40272119341) **läbis kõik kontrollid**. Test jooksutas 3 maailma seemet (`142023`, `31757`, `81311`) ja 3 AI riiki igas maailmas, kokku 9 pealinna. Kõik ehitised osteti ja ehitati olemasoleva mängumajanduse kaudu.

| Maailma seeme | AI linn | Viimane kiviaja käik | Valmis kindlustusi | Puitväravaid | Vahitorne | Tulemus |
|---:|---|---:|---:|---:|---:|---|
| 142023 | Sampola | 102 | 20/20 | 2 | 4 | Valmis |
| 142023 | Vendel | 74 | 22/22 | 2 | 4 | Valmis |
| 142023 | Sogn | 95 | 20/20 | 2 | 4 | Valmis |
| 31757 | Ahtola | 92 | 20/20 | 2 | 4 | Valmis |
| 31757 | Svea | 73 | 22/22 | 2 | 4 | Valmis |
| 31757 | Kaupang | 89 | 20/20 | 2 | 4 | Valmis |
| 81311 | Hiitola | 92 | 22/22 | 2 | 4 | Valmis |
| 81311 | Järnsida | 85 | 20/20 | 2 | 4 | Valmis |
| 81311 | Hrafnista | 74 | 22/22 | 2 | 4 | Valmis |

**Kokku: 9/9 ehk 100% täielikult ehitatud kaitseringi enne pronksiaega**, võrreldes vana 7/9 tulemusega. Iga kinnitatud ring sisaldas täpselt kahte puitväravat ja nelja vahitorni ning ülejäänud lõigud olid palisaadid.

**Piirang:** need on 3 fikseeritud maailma seemne simulatsioonid, mitte tõend, et absoluutselt igas võimalikus maailmas suudab AI kogu ringi lõpuni ehitada. Uus asukohavaliku reegel vähendab selliseid probleeme, kuid äärmuslikud maastikud võivad endiselt vajada eraldi parandust.
