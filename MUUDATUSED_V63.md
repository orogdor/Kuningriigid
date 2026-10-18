# Kuningriigid V63 – English / Eesti

## Keelevalik

- Mäng alustab **inglise keeles (English)**, olenemata arvuti või telefoni süsteemikeelest.
- Kaks valikut: **English** ja **Eesti**. Muuda keelt uue mängu menüüs või mängu ülariba 🌐 valikust ka juba käivas mängus.
- Valik jõustub kohe. Lehe uuesti avamisel jääb viimati valitud keel alles (`localStorage: kingdoms-language`).
- Keelesäte ei ole seotud mänguseisuga ega muuda seniseid `version:4` salvestusi, armeede asukohti, linnade arengut ega tehnoloogiate uurimisolekut.

## Tõlgitud sisu

- Peamenüü, kaardi põhijuhtimine, mängujuhtimise menüüd, lahingu-, ehitus-, tööjõu- ja uurimisekraani põhitekstid.
- Hoonete, avastuste, ajastute, sõjaväeüksuste ning ressursside nimetused; tehnoloogiate avamise kirjeldused.
- Ingliskeelne mängujuhend ja suuremad mängusisesed selgitavad lõigud.
- Eraldi `locale-en.js` sõnastik **615 tõlkevastega** ja `localization.js` korduvkasutatav tõlkekiht. Andmete sisemised võtmed ei muutu.
- Uued, mängu käigus lisanduvad kasutajaliidese tekstid tõlgitakse automaatselt; keelevaliku tagasi vahetamisel taastatakse algupärased eestikeelsed nimed ja lõigud.

## Testid

- `TEST_V63.mjs`: ingliskeelne vaikevalik, tõlkesõnastiku katvus, kõigi hoonete, avastuste, üksuste ja ressursside nimetuste kontroll.
- Läbitud `TEST_V61.mjs` ja `TEST_V60.mjs`, kontrollimaks kaitserajatiste, tootmise ja salvestusstruktuuri regressioone.
- Avalikul GitHub Pagesi mängulehel kontrollitud English → Eesti → English, keeleeelistuse säilimine lehe uuesti laadimisel ning ingliskeelse uue mängu käivitumine.
- Eraldi brauseritest mängu käigus: avatud uurimispaneeli ja juhendi keelevahetus mõlemas suunas; mänguseemne, asunike arvu ja salvestuse versiooni püsimine; ilma JavaScripti veateadeteta.

## Märkus

Osad harva esinevad, detailsemad simulatsiooni sündmuste või veateadete tekstid võivad vajada tulevastes versioonides täiendavat kontekstipõhist tõlget. Mängu põhimenüüd, nimetused ja tavapärased juhtnupud on mõlemas keeles.
