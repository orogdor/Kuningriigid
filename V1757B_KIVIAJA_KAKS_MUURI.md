# Kuningriigid V175.7b: kaks ehitatavat kiviaja puitmüüri

- **Müür I**: endine madal palisaad; 3 puitu, 9 ehitusaja ühikut ühe lõigu eest.
- **Müür II**: kõrge, pealkäidava galerii ja kaitserinnatisega palkmüür;
  12 puitu + 2 kivi, 24 ehitusaja ühikut ühe lõigu eest.
- Mõlemat saab valida **Defense → palisaad** ehituskaardilt ning
  sirge ja kumera müüri lohistamise tööriistas on kiire tasemevahetus.
- Tase pannakse iga ehitatud lõigu salvestusse: `woodFortTierV1757:2`.
  Madalal müüril ja vanadel V4 salvestustel seda välja ei ole.
- Kõrgema müüri ehitamine küsib kogu materjalihinna enne kulutamist,
  maksab tavalise odava hinna + ainult taseme II hinnavahe.
- Kõrgem ehitusaeg salvestatakse hoonele `buildTimeV1757:24`, millest
  ehitusmoootor arvestab normaalse kiiruse teisendusega.
- Suur värav on endiselt ainult geomeetria- ja mänguloogika prototüüp;
  selle valik ehitusmenüüsse tuleb **V175.7c**.
- See etapp ei muuda müüripatrollide tegelikku ronimist.
- Testid: `TEST_V1757A_FORT_HEIGHTS.mjs` ning
  `TEST_V1757B_WALL_LEVELS.mjs`. Kiirkontrollis üks job.
