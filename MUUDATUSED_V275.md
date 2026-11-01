# V275 — pikem rahvasteränne, detailkaardi mudelid, järvede väljavool

- **Rahvasteränne** kestab 2 minutit (enne 1) ja liikumine on veel 1,5× kiirem (kokku 7,5×).
- **Mudelid**: maailmakaardil on rändav rahvas nüüd detailkaardi kiviaja inimesed (4 × `stone_settler`) ja
  ees TRELLIS-odamees; skaut on detailkaardi kiviaja kütt (`stone_hunter`, oma odaga) + koer —
  nii maailma- kui detailkaardil (`map-units.js`, `detail-travellers-v157.js`).
- **Järvede väljavool** (uued maailmad): osa suurtest järvedest (≥ 10 ruutu, ~60 %) saab laia laevatatava
  jõe merre — madalaim tee üle maa (`addLakeOutletsV275`, `world-geography.js`). Laius 7–16.
  Salvestatud maailmade jõed ei muutu (lipp `lakeOutletsV275`). Test `tests/lake-outlets-v275.mjs`.
