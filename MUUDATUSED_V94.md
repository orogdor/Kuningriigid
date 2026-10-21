# V94 — ajastule ja relvastusele sobivad lahingutaktikad

Vali lahingus oma mees või salk. Vasakus alanurgas asuva üksusekaardi „Rivistus” valik kehtib kogu tema 12-mehelisele salgale. Noolenupud pööravad rivi 45°. Automaatne laseb salgajuhil olukorra järgi taktikat valida. Vaenlase või põgeneva salga käske muuta ei saa.

| Taktika | Sobivad üksused | Tegelik mõju |
| --- | --- | --- |
| Kilbirivi / kilbivall | Pronksodamehed; rauaaja ja keskaja kilbiga jalavägi | Kuus meest kõrvuti kahes reas. Kilbid, lähinaabri olemasolu, valmis rivi ja rünnaku suund määravad lisakaitse. Eest vähendab noolte ja lähivõitluse mõju; külgedelt, tagant, liikumisel või lagunenud rivis nõrk. Kuulidele lisakaitset ei ole. |
| Odade vastuvõtt | Odamehed, pronksodamehed, hellebardistid, piigimehed | Peatub ja hoiab oda ees. Koos seisva, õigele poole vaatava rivi kaitse on ratsarünnaku vastu tugevam. |
| Hajurivi | Kerglaskurid ja varased tulirelvad | Mehed võtavad füüsiliselt suuremad vahed; sihitud lasu tabamisvõimalus väheneb, lähivõitluses nõrgem. |
| Lase ja eemaldu | Kiviviskajad, vibumehed, odaviskajad | Hoiab vahet läheneva vaenlasega. Piiratud laskemoon, taganemisruum ja väsimus loevad. |
| Kogupauk | Renessansi musketärid/arkebuusimehed, tööstusajastu ridajalavägi/püssimehed | Valmis rivi laseb ühises aknas iga kolme lahingusekundi järel. Igal mehel oma laskemoon ja laadimine. Oma mehed blokeerivad otsetule. Püssimehed alustavad piikide tiibadel, mitte nende taga. |
| Koondunud ratsarünnak | Rauaajast renessansini sobiv ratsavägi | Kiirem, väsitavam koondumine. Vähemalt kuue meetri hoovõtt võimendab esimest kokkupõrget; uus mõju vajab uut hoovõttu ja ooteaega. Valmis eesmine odarivi peatab löögiboonuse. Kürassiiri mõõk nõuab nüüd lähikontakti, mitte varasemat 12-meetrist tabamiskaugust. |
| Hoia positsiooni | Kõik | Jääb määratud kohta ega jookse lähivõitluseks rivist välja. Selgesõnaline liikumiskäsk viib salga uude kohta. |

## Füüsika ja AI

Rivistuse vahetamine ei telepordi mehi. Mehed valivad lähimad vabad rivikohad ja liiguvad sinna olemasoleva kokkupõrkefüüsikaga. Rivistumine võtab aega, pööramiskiirus on piiratud ning kaotuste järel täidetakse tühjad rivikohad uuesti. Valmisolekut mõõdetakse meeste tegelike asukohtade, elus meeste arvu ja ühtehoidmise järgi. Kilbid ja odad muudavad ka meeste lahingupoosi.

Automaatne juht kasutab kilbirivi läheneva laskuriväe vastu, odarivi lähedase ratsaväe vastu, kergväel eemaldumist, tulirelvadel kogupauku ning ratsaväel hoovõtuga rünnakut. Mängija määratud rivistus ja suund jäävad tema kontrolli alla.

Alles on 3 × 3 lahinguala, punase joone tagune põgenemisala, maksimaalselt 500 individuaalset meest, üks terve tühi sektor armeede vahel ning poole aeglasem lahingukell.

## Ajalooline alus ja mängulised piirid

- Royal Armouries, [Saxons](https://royalarmouries.org/schools/learning-resources/saxons) ja [Saxon Shield Wall](https://royalarmouries.org/sites/default/files/2023-08/Saxon-Shield-Wall.pdf): odaga võitlemine kilbirivi tagant ning kahekäekirve ja kilbi samaaegse kasutamise piirang. Seetõttu ei saa kahekäekirvemees kilbivalli valida.
- Cromwell Museum, [Soldiers](https://cromwellmuseum.org/cromwell/civil-war/soldiers/): piigid keskel, musketid tiibadel, piikide kaitse ratsaväe vastu ja ebatäpsete musketite massiline koondtuli.
- National Army Museum, [Battle of Naseby](https://www.nam.ac.uk/explore/battle-naseby): jalaväekeskme ja ratsaväetiibade koostöö ning küljerünnaku tähtsus.

Pronksiaja „kilbirivi” on kilpide ja odade füüsikast lähtuv mänguline tõlgendus, mitte väide, et kõik pronksiaegsed armeed kasutasid hilisemat saksi kilbivalli. 12 meest kujutavad suurema rivi lõiku, mitte tervet ajaloolist falanksit või pataljoni. Kaitse-, tabavus-, hoovõtu- ja ajaväärtused on mängureeglid, mitte ajalooallikatest mõõdetud konstandid. Eri rahvaste drill, käsu levimise viivitus ja tulirelvade ridade vahetamine on jätkuvalt lihtsustatud.

## Kontroll

`TEST_V94.mjs` kontrollib relvastuse/ajastu piiranguid, päris liikumisega rivistumist, kaherealist kilbirivi, suunast ja toetusest sõltuvat kaitset, kuulide läbimist, kaotuste järel rivi täitumist, hoovõttu/ooteaega, odarivi, hajurivi, pööramist, oma meeste blokeeritud tulejoont, tegelikku samaaegset kogupauku ja salvestuse taastamist. `TEST_V94_UI.mjs` kontrollib käske telefoni- ja arvutivaates ning vastase käsukaardi peitmist. Varasemad lahingutestid kontrollivad lisaks 500 mehe kokkupõrkeid, maastikul liikumist, moraali, põgenemist ja lahingu lõppu.

Avaldamise eel parandati ka V61 torni testi sõltumatus: teise olukorra ründaja luuakse uuesti, mitte esimese testi juba haavatud individuaalsete meestega. Mehitamata torni tulekeeld jääb samaks. Brauseri käivitustest ootab lahingukella tegelikku edenemist, mitte kindlat neljasekundilist viivitust.
