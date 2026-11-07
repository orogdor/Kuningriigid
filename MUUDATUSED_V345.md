# V345: uued puud kõigile kuuele liigile

Kasutaja soov: põhjamaise metsa stiilis puud (Sketchfabi "forest with a road at night" eeskujul): kõrged tüved, rippuvad oksakihid, päris okka- ja lehetekstuurid. Kõik puuliigid ja -variandid pidid olema väiksema kolmnurkade arvuga, eri kaugustele eraldi tasemetega, ning otse mängus.

## Muudatus

- `tools/forest-trees-v345/make_trees.py` genereerib kuuse, männi, tamme, pärna, kase ja palmi, igaühest 5 varianti (kokku 30 puud). Kasutab ainult Pythonit (numpy + Pillow), Blenderit ei vaja. Kõik tekstuurid joonistab kood ise:
  - kuuse okkaoks kahe tasandi okstega;
  - männi pikkade okaste tutid;
  - tamme, pärna ja kase lehed kujupõhiselt;
  - palmi sulglehed.
  - Koor on liigiti erinev: kasel valge mustade triipudega, männil ülemine tüvi oranž.
- Kujud:
  - kuusel rippuvad oksamännased;
  - männil kõrge paljas tüvi ja ladvakroon;
  - lehtpuudel peaoksad, kõrvaloksad ja ellipsoidne krooni täide, nii et kroon on igast suunast suletud;
  - palmil kaardus tüvi ja rippuvad lehed.
- Kolm taset, sama failiformaat kui Saplingil (`assets/sapling-trees/<liik>_0N/{near,mid,far}.glb`, `manifest.json`). `sapling-trees-v328.js` ja paigutus on muutmata.
  - **near:** kuni 2000 kolmnurka (keskmiselt 1104; varem ~2530);
  - **mid:** kuni 250 (keskmiselt 187; varem ~310);
  - **far:** 6 kolmnurka. `bake.html` renderdab near-mudeli eest, küljelt ja ülalt, `make_far.py` teeb neist ristuvad kaardid.
- GLB-failid kokku 26,1 MB → 22,4 MB. Tekstuurid on PNG-d (WebP renderdus mängus mustana), läbipaistvate tekslite all on lehe värv, et kaugel olevad puud ei tumeneks. Vanad Blenderi lähtefailid ja vaatepildid on eemaldatud: puude kaust 347 MB → 25 MB.
- Versioon V345.

## Kontrollid

- `tests/forest-trees-v345.mjs` (ka v128 kiirkontrollis): 30 puud, 6 liiki × 5 varianti, failid ja kontrollsummad olemas, kolmnurgaeelarved peetud, near/mid kaks osa (koor + lehestik), maapinnal.
- `tests/sapling-trees/live-integration.mjs` ja `existing-placement.mjs` läbisid: LOD-vahetus, 5 varianti, biomiliigid ja paigutus samad.
- Mängupildid enne/pärast peata Chrome'is: vt PR.

## Teada piirid

- Kaugtaseme ristkaardid paistavad küljelt vaadates õhukese joonena, nagu varemgi.
- Kask on veel üsna tihe ega ole nii õhuline kui päris kask.
- Tekstuurid on genereeritud, mitte fotod. Fototekstuurid (CC0) saaks hiljem samasse atlasesse vahetada.
