# V3.3 port: maailmakaardi taganemine

- V131 võrdlus: `battlefield-v88.js` — `applyArmyRetreats`, `checkBattleRetreats`.
- `scripts/core/campaign_retreat_v131.gd`: 4-ruuduline piiratud üleujutus-BFS,
  armee tiiva suund, ohutu koht, linna eelistus, ei lõika läbi läbimatu maastiku.
- `scripts/core/individual_battle_port.gd`: `_finish(state,battle,world_nav)`
  tagastab tervise, annab XP, liigendab lahingu võitja ja käivitab pärast seda
  armee üleviimise. Lahingulogisse lisati `retreats`, `world_c`, `world_r`.
- `scripts/core/military_port.gd`, `battle_preview_port.gd`: taastumise ajal
  on käskudega liikumine ja automaatlahing keelatud.
- `scripts/core/preview_sim_port.gd`: sama world_nav üle lahingu sisse, vanade
  salvestuste migratsioon, kaks uut arvestit.
- `scripts/main.gd`: viimase taganemise menüüinfo, CSV v33.
- 647 ettevalmistatud mängureegli testväidet, 23 uut (mitte jooksutatud Godotis).

See ei ole veel APK ega tõend Androidis toimimisest. Sama ruudu avatud piiramis-
 ja teiste päästeteede eriolukorrad vajavad järgmist ulatuslikumat integratsiooni.
