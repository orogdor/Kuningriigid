# Kuningriigid V244 – sujuvam mäng, graafika jääb samaks

Analüüsi põhjal: mängu loogika ei ole pidur. Brauseri põhilõim oli 77–97% ajast jõude, aeglus tuleb joonistamise mahust.

## Mis muutus
1. **Puud, põõsad ja loomad (detailvaade):**
   - kõik sama liiki lihtsad mudelid joonistatakse ühe joonistuskäsuga (`InstancedMesh`) ja vaatevälja kontroll tehakse iga puu kohta eraldi;
   - detailne mudel lülitub sisse ainult 40 m piires päris meetrites. Varem jagati kaugus kaamera suumiga ja kaugemad puud said detailse mudeli.
2. **Kiviaja hoonetel on kolm detailsuse astet:**
   - originaal (umbes 100 000 kolmnurka) kuni 40 m;
   - vahepealne mudel (25% originaalist) kuni 100 m. See kasutab sama tekstuuri ja materjali, seega näeb välja sama;
   - kauge mudel (6% originaalist, 512 px tekstuur) üle 100 m. Varem tõmbas kauge mudel alla terve 4–16 MB originaalfaili ja lihtsustas selle mängu ajal. Nüüd on kauge mudel valmis väike fail, mis kõrvaldab laadimisjõnksud.
   - Failid asuvad kaustas `models-stone-lod-v244/`. Tööriist on `tools/stone-models-v221/lod_cluster.py`: QEM, mis säilitab originaali UV-d ja normaalid ning ei pööra kolmnurki ümber.
3. **Varjud:** maailmakaardil ei heida puud väga kaugelt suumides (suum > 3000) enam varju.
4. **WebGPU (`?gpu=1`):**
   - taevas muutub nüüd koos päeva ja ööga;
   - mäng lülitub WebGL-ile tagasi ainult päris WebGPU vea korral, mitte enam iga suvalise mänguvea peale;
   - jõudlusnäidik näitab õiget joonistuskäskude arvu.

## Mõõdetud (sama kiviaja küla, sama kaamera)
| | enne | pärast |
|---|---|---|
| Detailvaade, joonistuskäsud | 410 | 336 |
| Detailvaade, tekstuurid | 58 | 48 |
| Sisse suumitud, kolmnurgad | 2,41 mln | 1,66 mln |
| Sisse suumitud, joonistuskäsud | 369 | 335 |

Visuaalne võrdlus on failis `catalog-v163/v244_enne_parast.png` (vasakul enne, paremal pärast).

## Tegemata
- Tõrvikud ja varustus: kasutaja soovil vaadatakse need hiljem eraldi läbi.
- Maailmakaardi joonistuskäsud jäid samaks (637).

Mänguloogika ja salvestused ei muutunud.
