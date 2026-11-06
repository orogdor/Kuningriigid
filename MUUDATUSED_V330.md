# V330 – mets jätkub üle ruudupiiride

Kasutaja pilt näitas korrapäraseid üksikuid metsatukki. Puud paigutati 50 ühiku laiusest ruudust ainult keskmisse 37–39 ühikusse, mis tekitas igal serval tühja riba.

V330 kasutab mõlemale maailmapuude kihile ühtset maailmakoordinaatides juhuslikustatud võrgustikku. Puu asukoht ei sõltu ruudu keskpunktist. Ruudud jagavad ainult punktide omandit, servad on poolavatud ja dubleerivaid puid ei teki. Looduslikud lagendikud kasutavad endist katkematut clump-välja. Puude koguarv jääb varasema tiheduse suurusjärku.

Jõeruutudes võivad puud kasvada kuival kaldal, sest enam ei jäeta tervet ruutu tühjaks. Veepind ja kalda kaugus kontrollitakse endiselt iga puu juures. Algruudus on terve ruudu asemel väike ümar vaba ala. Väikeste metsapuude võrad on 20% suuremad ja suured puud ühtlasema mõõduga.

V329 puuliikide reeglid, detailkaardi ressursid, raiumine, kasvamine ja salvestused säilivad. Uus mäng ei ole vajalik.

Kontroll: tests/continuous-forest-v330.mjs kontrollib deterministlikku seemet, puude ühekordset omandit, maailmapunktide sõltumatust ruutude jaotusest ning tegelike InstancedMesh puude tihedust servas ja keskel. 400 ruudu fixture: 22768 puud, serva/keskala suhe X 0,991 ja Z 1,003. Brauseri kontroll ja avaldamine on veel tegemata; seadme FPS-i pole mõõdetud.
