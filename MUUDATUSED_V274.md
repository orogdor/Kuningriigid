# V274 — rahvasteränne, puude kasv, kaev avastuse taha

**Rahvasteränne** (uue mängu esimene mängu-minut, enne kiviaega):
- Riik on ainult rändav rahvas: maailmakaardil 4 pakiga töölist ja ees sõdalane (`map-units.js`).
- Liikumine 5× kiirem (rahvas ja selle salk). Linna ei saa rajada; „Vali linna koht“ (`foundcity`)
  jätab valitud koha meelde. Ülal: „Rahvasteränne 48 s“.
- Skaut liigub nähtamatult rahva sees.
- Kiviaja alguses (60 s) rajatakse esimene linn valitud kohta (või kohta, kus rahvas on, kui kohta ei valitud);
  sinna ilmub skaut: tööline + **koer** + **oda** (`scout-dog-v274.js`, nii maailma- kui detailkaardil).
- Kehtib ka arvutivastastele. Vanad salvestused ja näidislinnad rändeajaga ei alga.

**Puude kasv päris loogikaga** (`navigation.js`):
- Istutatud istik on raiumiseks valmis alles 8 käigu (480 s) pärast ja kasvab nähtavalt.
- Raiesmik metsastub ise: täiskasvanud puude lähedal (9 ühikut) võib kännu kohale tärgata seemik
  (mida rohkem naabreid, seda tõenäolisemalt; looduslik seemik kasvab 1,5× kauem). Hoonete, teede ja
  puhastatud maa peale ei kasva.

**Kaev** vajab avastust „Kaevud ja veevarustus“ (enne oli kohe ehitatav).

Testid: `tests/migration-v274.mjs`, `tests/tree-growth-v274.mjs` (CI-s).
