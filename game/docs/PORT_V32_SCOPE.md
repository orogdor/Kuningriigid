# Godot 3.2 – moraal ja taganemine

Algallikad V131: `historical-tactics-v92.js`, `battle-movement-v97.js`, `battlefield-v88.js`.

Uus moraal: värvatud 64, tavalised 82, eliit 94, kaotused, tiivalöögid, väsimus, liitlaste paanika ja kooshoid. Salk murdub, kui üle 45% elusolijatest põgeneb.

Taganemiskäsud ja automaatsed põgenemised valivad läbitava väljumiskoha, arvestavad lahingukaardi 3×3 piire ja olemasolevat maastiku A*-süsteemi. Marsruudi valiku eelarve 2 uut otsingut suurel lahingul simulatsioonisammu kohta. Taganenud inimesed jäävad elus ja üksuse HP säilib.

Uus CSV on `user://v131_godot_measurements_v32.csv`. Uus menüütest `Moraali ja taganemise katse`.

Piirang: tegemist on lihtsustatud lahingutaktika pordiga. Maailmakaardile taganenud armee ümberpaigutamine ja lõplik V131 täielik lahingutaktika vajavad edasist portimist. Godoti ja Androidi runtime kontrollimata.
