# Kuningriigid V163 – etapp 1: kiviaja AI linnaplaneerimine

Eesmärk: kiviaja lõpuks areneb AI küla tiheda ja ajalooliselt usutava südamiku ümber, nii et hiljem saab selle ümbritseda puidust palisaadiga. V163 ei lisa veel graafikareformi ega uut UI-d; need on hilisemad etapid.

## Planeerimistsoonid

1. **Keskus (umbes 20–35 m südamiku lähedal):** peamaja, kaev, õppekoht, hoiukohad.
2. **Elamuvöönd (eelistatult 20–72 m südamikust):** majad asuvad kõrvutistel ajaloolistel tänavalõikudel; täituvad olemasolevad krundid, enne kui küla laieneb.
3. **Tootmise ja põldude tsoon (eelistatult 74–110 m südamikust):** põllutalud, põllud, karjamaa ning metsa- ja kivivaru tootmisrajatised. Põldude kõrval eelistatakse järgmist põldu samas piirkonnas.

Kõik kaugused on **detailkaardi mänguühikutes**, mille mõõt lähtub 1,76 m pikkusest mängu inimese 3D-mudelist. Need ei muuda maailmakaardi 50-ühikulist loogilist ruudustikku.

## Põhimõtted ja ühilduvus

- Puuduvad tehislikult antud majad, elanikud ja varud.
- Ehitised läbivad olemasolevad ressursside, tehnoloogia, maapinna kalde, kokkupõrgete ja töötajate ligipääsu kontrollid.
- Ei muudeta teisi ajastuid ega olemasolevaid salvestusi.
- Kui eelistatud koht ei sobi, saab AI valida järgmise tegelikult sobiva krundi; tsoon ei ole jäik ehituskeeld.
- Põllualade järjestus arvestab talu asukohta, keskuse läheduse vältimist ja olemasolevaid põlde.

## Muudetud failid

- `stone-town-plan-v163.js` – kiviaja ehitustsoonide deterministlikud reeglid.
- `historic-urban-v138.js` – kiviaja kruntide tsoonipõhine järjestus.
- `civilization-core.js` – tsoonireeglid kehtivad ainult kiviajal.
- `ai-rural-v143.js` – põldude koondamise punktisüsteem.
- `TEST_V163_STONE_CITY.mjs` – elamute, põllumajanduse ja keskuse paigutustestid.
- `scripts/stone-town-v163-report.mjs` – päris 48 käigu AI-mäng ning majade ja põldude mõõdikud.
- `.github/workflows/stone-town-v163.yml` – automaatkontroll ja aruande artefakt.

## Järgmine etapp

**Etapp 2:** kiviaja küla palisaadi, väravate ja tornidega kindlustamine. Selleks tuleb enne vaadata V163 simulatsioonis tegelikult kujunenud külade suurust ja hoonete asetust.
