# V131 Godot port 3.1 — taktika ja formeeringud

Lähtekoodi alus: `orogdor/Kuningriigid` commit `26562368f56a32616651a266ed2d8c87f06d43d1`, eeskätt `formations-v94.js`, `soldier-collision-v90.js`, `battle-doctrine-v98.js` ja `battlefield-v88.js`.

## Kasutamiseks

Godot 4.2+ projekt avatakse failist `project.godot`. **MENÜÜ → Testid → Taktikalahing: 120 meest** avab odameeste, vibuküttide ja ratsaväe vastasseisu (2 × [24+24+12]). **Suur lahinguväli 3x3: 500 meest** kasutab 675×585 lahinguvälja; 250 inimest kummalgi poolel, sh kaks ratsasalka kummalgi poolel.

Valitud mängijasalgale on **MENÜÜ → Armee → Rivistus** (liigile lubatud rivistused), **Automaatne rivistus** (taastab AI valiku) ja **Lahingu taktika info** (rivi tugevus ja loendurid). Käsitsi liikumis-, ründe- ja taganemiskäsud jäävad alles.

## Lisatud

- Formeeringumoodul `scripts/core/battle_formations_v131.gd`: line, column, shield_wall, spear_wall, hold, loose, skirmish, charge.
- Salk arvutab automaatselt rivi liigi, suuna, rivistumise aja ja kooshoidmise koefitsiendi. Salgu tugevus oleneb sellest, kas üksikisikud päriselt ettenähtud kohtadele jõuavad.
- Vibuküttide hajumine ja lähivõitlejast eemaldumise siht; ratsasalk valib püsiva ümberhaaramise tiiva, mitte võnkuva sihi.
- Kaitse toimib suunaliselt: kilbisein kaitseb eest, odarivi vähendab ratsanike rünnakut eest; hajurivi aitab laskemoona vastu, kuid on haavatavam lähivõitluses. Kiirused ja ratsarünnaku boonus vastavad osaliselt V131 reeglitele.
- Ees seisva oma sõduri tuvastamine enne vibu lasku ruumilise räsi abil; katapuldikivi sõbralikku tuld ei blokeerita.
- Uued lahingu logi/CSV mõõdikud: vormevahetused, vibude taganemiskatsed, ratsanike ümberhaaramised, blokeeritud sõbralikud laskejooned. CSV `user://v131_godot_measurements_v31.csv`.
- Eelmise lahingu salvestusest tulevatele sõduritele lisatakse puuduv `team` väli enne laskejoone kontrolli; uus salvestus jääb JSON-andmete kujul.

## Piirangud

See on **osaline port**, mitte V131 täpne lahingureeglite koopia. Algse V131 taktika täielik valmisolek, lähikontakti keerukam käsitlus, üksuste moraal, põgenemiskäitumine, ratsaväe impulsi füüsika, laskemoona täiendamine ning piiramisareeni integreerimine suure väljaga vajavad veel tööd. 500-mehelisel katsel on 2 A*-otsingu eelarve simulatsioonisammu kohta.

Godoti parserit/Androidi rakendust selles keskkonnas ei käivitatud. Testis `tests/port_checks.gd` on **593 ettevalmistatud kontrollväidet**, mitte 593 läbiviidud mängutesti. `python tools/run_qa_checks.py` on ainult lähtekoodi-, sidumis- ja eraldi arvutuskatsete kontroll. Kui Godot kuvab parse-viga, saada punase veateate ekraanipilt koos faili ja reanumbriga.

## Järgmine etapp

V131 sõdurite moraali, kurnatuse ja põgenemise port koos tulejoone 3D-läbitavusega ning tegeliku Godoti parseri/Androidi jõudlustulemuse põhjal optimeerimine.
