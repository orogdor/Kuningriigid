# V340 katse: kõik moodulid alguses

V340 on jõudluskatse. V338 commit ja Windowsi rakenduse eelmine sisuversioon jäävad tagasipööramiseks alles. `startup-mode-v340.js` üks lipp `EAGER_MODULES_V340` juhib muudatust. `false` taastab V332/V336 vajaduspõhise käivituse, ilma muid faile muutmata.

Kui lipp on sees, avab käivitusmenüü mängumootori kohe ning `civilization.js` impordib 35 näidismoodulit enne mängu valmimist. Salvestamise Worker käivitub samuti kohe. Windowsi rakendus laadis mängumootori juba varem käivitamisel; seal katsetatakse eeskätt V332 näidismoodulite ja Workeri varasemat laadimist. V336 maastiku vahemälu lugemine ja kirjutamine on katseversioonis välja lülitatud. `USE_TERRAIN_CACHE_V340=true` taastab selle. Mängu salvestatud maailm jääb alles; välja on lülitatud ainult maailmakaardi renderdusvõrgu vahemälu.

Kontroll: brauseris tavaline algusmenüü jõudis valmis mängumootorini (umbes 42 s); kiviaja näidismäng laadis. FPS-i paranemist pole kinnitatud. Võrdle sama Windowsi salvestust samas kohas enne ja pärast katseversiooni paigaldamist.

Lisakontroll: tavaline brauserikäivitus umbes 41 s; 10 s pärast oli "terrainCacheV336()" seis "{hit:false,stored:false,key:null}" ja maastiku vahemälu andmebaasi ei avatud. Windowsi rakenduse FPS-i mõju vajab eraldi mõõtmist.
