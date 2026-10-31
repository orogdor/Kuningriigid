# Kuningriigid V254 – linnad lähemale, hoonete lisadetailid eemaldatud, aeglasem puu- ja kivitöö, tihedam mets

## Linnade vahe 10 ruutu
- `MIN_CITY_SPACING` (`counties-v126.js`) on nüüd 10, varem 17. Mängija linnakeskuste vahele peab jääma vähemalt 10 ruutu.
- AI linnade vahe jääb 9 ruutu (`AI_CITY_SPACING`).
- Testid `TEST_V129.mjs` ja `TEST_V136.mjs` on uue väärtuse järgi uuendatud.

## Hoonete lisadetailid eemaldatud
V252-s hoonetele lisatud animeeritud detailid (`building-life-v252.js`: suits, lõkked, potikeder, kaevuämber, kuivatusrestid, märklaud, lipp jne) on kasutaja soovil eemaldatud.
- Moodul on kustutatud ning eemaldatud on ka kutsed (`civilization.js`), külmutamise erand (`perf-render-v131.js`) ja importmap'i kirje.
- Töötajate tööliigutused, linnaelu ja tõrvikud jäid alles.

## Puu- ja kivitöö poole aeglasem
- **Puude raiumine ja kivide murdmine** (`navigation.js` `gather`, `WOOD_STONE_PACE_V254 = 0,5`): üks töötsükkel kestab kaks korda kauem.
- **Kivimurru maardla kaevandamine** (`resource-sites-v88.js` `harvestMineral`, kivimurd): samuti poole aeglasem.
- Muud tööd (jaht, kalapüük, marjad, malmimaardlad jne) jäid samaks.

## Tihedam mets
- **Detailkaart (puud on mänguressurss):**
  - vanad kaarditüübid: metsalahtris 176 puukohta, varem 110;
  - „Loogiline maailm“: mets 190, džungel 205, taiga 180, jõeäärne aas 110 (varem vastavalt 120, 130, 115, 90).
  - Juba asutatud linnade puud on salvestuses ega muutu.
- **Maailmakaart:** metsas 11,5 puud lahtri kohta (varem 8), džunglis 12,5 (varem 9), taigas 11 (varem 8).

## Kontrollid
- CI kiirkontrolli kõik sammud, `traffic`, `tests/people-v252`, `tests/village-v253`, `TEST_V129`, `TEST_V136`: PASS.
- `rules`: 20 testi 21-st läbisid, `TEST_V139` kukub nagu varem.
- Brauser (stone-demo): linn laadib vigadeta, hoonete juures pole lisadetaile, 15 tõrvikust 0 hoone sees.
