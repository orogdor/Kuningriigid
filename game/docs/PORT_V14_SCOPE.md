# V131 lahinguport 1.4: täpne ulatus

Algne sihtmärgivalik: `battle-doctrine-v98.js` — kaugus, külgnihe, püsiv sihtmärk, ratsaväe eelistused. Selle idee kohandatud osa on `scripts/core/battle_doctrine_v131.gd`.

Algne individuaalne võitlus: `individual-battle-v91.js` — maks. 500 meest, salgad, sõdurite eraldi elud, laskemoon, käsud. Port `scripts/core/individual_battle_port.gd` on katsemootor.

Algne kokkupõrkehaldus: `soldier-collision-v90.js` — kasutab ruumilist jaotust. Port kasutab 3 m rakkudega indeksi; täpsete keharaadiuste ja sõdurite gruppides joondamise ülekandmine on järgmiseks.

Algne renderdus: `soldier-batch-v90.js` ja `model-runtime-v50.js` asendatakse Godoti `MultiMeshInstance3D` ja GLTFDocumentiga. Käesolev port kasutab originaalset **staatilist** `warrior_1000_2.glb` võrgustikku juhul, kui GLB laadimine õnnestub. Mooduli skinned rig'i animatsiooni ei ole veel porditud.

Erinevused 1:1-st: katselahingu areen on väiksem; navigeerimine ei rakenda kõiki taktikareegleid; nool lendab lennuajaga, kuid tabab deterministlikult ellujäänud sihtmärki; hobuse erinevat kehakokkupõrget pole; lahingu kogemus ja kaotused kantakse katsesimulatsiooni olekusse; piiramisvõitlust pole.

Automaat- ja manuaalrežiimi ning osa rivistuse põhimõtteid saab võrrelda, kuid neid ei tohi esitada V131 täislahinguna.
