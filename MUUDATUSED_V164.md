# Kuningriigid V164 – Põhjamaade eeposte ja pärimuse külanimed

Uut mängu alustades saavad uued asulad nimed neljast Põhjala pärimusele pühendatud nimekogust. Nimed on osalt eeposte ja saagade algupärased kohanimed, osalt tegelaste ja paigamotiivide järgi **mängu jaoks tuletatud** külanimed; kõik ei ole ajaloolised asulanimed.

| Meeskond | Nimekogude taust | Näited |
|---|---|---|
| 0 (mängija) | Eesti „Kalevipoeg“, Suur Tõll, Leiger ja rahvaluule | Kalevila, Lindamäe, Tõlluste, Kaljuvald |
| 1 (AI) | Soome „Kalevala“ | Väinölä, Pohjola, Tapiola, Ahtola |
| 2 (AI) | Rootsi saagad ja muistsed Rootsi paigad | Ynglinga, Svitjod, Bråvalla, Vendel |
| 3 (AI) | Vana-Põhjala „Edda“, Islandi saagad ja Taani kangelaslood | Nóatún, Breiðablik, Himinbjörg, Lejre |

- Kõigis neljas kogus on 16 eri nime, mida valitakse mängumaailma seemnest lähtuvalt.
- Ühe maailma asulad ei saa sama nime, kuni vastavas kogus leidub kasutamata nimi.
- Kui korduvalt linnu rajades saavad nimed otsa, lisatakse eristav number.
- Olemasolevate salvestuste linnanimesid ei muudeta.
- Kui salvestusel on kasutaja määratud `factionNames`, säilib senine valitud fraktsiooni nimega nimetamine.
- Linnade ehitus, käigud ja majandus ei muutu.

**Kontroll:** `TEST_V164_NAMES.mjs` testib nelja kultuuripanka, kordumatust, püsivat seemnepõhist valikut, nimekohandusi, säilivaid salvestusi ning päriselt asutatud AI linnade nimesid. GitHub Actions: `.github/workflows/v164-nordic-names.yml`.

## Pärimuse allikad
- [Kalevala Seura: Kalevalan maailma](https://kalevalankankahilla.kalevalaseura.fi/nv/b.php)
- [Eesti mütoloogia ja Kalevipoeg](https://et.wikisource.org/wiki/Eesti_m%C3%BCtoloogia/Kalevipoeg)
- [Uspenskij: Snorri's Edda and Ynglingasaga, divine place names](https://www.digar.ee/arhiiv/et/download/112261)
- [Rootsi Ynglinga pärimuse ja vanade kuninganimede uurimus](https://asset.library.wisc.edu/1711.dl/6YOMT7DYKX7CU8Q/R/file-555a3.pdf)
