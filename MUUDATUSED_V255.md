# Kuningriigid V255 – pelglik uluk, päris jaht, karjus viib lambad välja

Kõik on kiviaja joonistuskiht. Mängu majandus (saak, tööajad, ressursid) ja salvestused ei muutu.

## Uluk kardab inimesi (`wildlife-v255.js`)
- Iga hirv sööb rohtu (keha ettepoole, pea maas) ja liigub aeglaselt oma paiga ümber, umbes 3 m raadiuses.
- Kui inimene tuleb lähemale kui 9 m, ehmub hirv ja jookseb inimesest eemale, hüpates ja kiiresti. Kui tee on kinni, pöörab ta kõrvale. Ohutus kauguses (17 m) jääb ta seisma ja tuleb rahulikult oma paika tagasi, kui kedagi pole lähedal.
- Läbitavust kontrollitakse, seega loom ei jookse hoone sisse.

## Jahimees luurab ja jahib
- Viimased 14 m oma valitud saagini liigub jahimees **hiilides**: küürus, oda valmis, pilk saagil (uus poos `stalk`, `stone-motion-v222.js`).
- Hiilivat jahimeest loom ei märka, teiste inimeste eest põgeneb ta endiselt.
- Kui jahimees jõuab ja hakkab tööle, viskab ta oda (olemasolev `hunt` liigutus). Umbes sekundi pärast loom kukub külili ja jääb lamama, kuni jahimees viib liha koju. Siis ilmub karja järgmine loom.

## Karjus ja lambakari (`herding-v255.js`)
- **6:30–8:00:** karjus ajab karja karjamaa uksest välja. Kari läheb linna teekonnaotsingu järgi vabale rohumaale umbes 24–36 m kaugusele, kus ümberringi on lahtine maa.
- **8:00–17:30:** karjus liigub aeglaselt karjamaal ringi ja peatub kepi najal (`herd`). Lambad hajuvad karjatama ja söövad pea maas.
- **17:30–19:00:** kari tuleb samamoodi tagasi.
- **Öösel:** karjus ja lambad on sees.
- Kari järgib kõndides karjust ja jääb tema lähedusse.
- Karjamaa enda töötajat ei joonistata hoone juurde sel ajal, kui ta on karjaga väljas, sest karjus ongi tema.
- Asukoht arvutatakse kellaajast, seega ka mängu laadimisel on kari õiges kohas.

## Lamba mudel ja TRELLIS.2
- **Kontrollitud:** `microsoft/TRELLIS.2-4B` on **MIT litsentsiga**, seega selle tehtud 3D-mudeleid võib mängus kasutada. Pildi tegemiseks sobib `Tongyi-MAI/Z-Image-Turbo` (**Apache 2.0**).
- **Ei sobi:** `briaai/BRIA-RMBG-2.0` (tausta eemaldaja Space'is `prithivMLmods/TRELLIS.2-Text-to-3D`) on mittekommertslik. Tausta võib eemaldada ka ise.
- **Siit ei õnnestunud:** selle sessiooni Hugging Face'i ühenduses on Space'ide käivitamine keelatud (`gradio=none`). Ametlikul `microsoft/TRELLIS.2` Space'il pole MCP-d ja kohapeal pole graafikakaarti. Seetõttu on lammas praegu lihtne protseduuriline mudel `createSheepV255`: villane keha, pea, kõrvad, sarved ja jalad, iga kuues lammas tume.

**Kuidas TRELLIS.2 lamba sisse saab:**
1. Ava https://huggingface.co/spaces/microsoft/TRELLIS.2.
2. Laadi üles lamba pilt (üks lammas, külgvaates, lihtsal taustal) ja tee 3D.
3. Laadi alla GLB. Sobib väike tahkude arv, umbes 5000, ja tekstuur 512.
4. Anna GLB mulle. Teen sellest kerge ja raske detailsusastme (nagu teised loodusmudelid kaustas `models-nature-v230/`) ja panen protseduurilise lamba asemele.

Teine võimalus: lülita Hugging Face'i ühenduse seadetes Space'ide käivitamine sisse. Siis saan mudeli siit ise teha.

## Kontrollid
- `node tests/wildlife-v255/run.mjs` (uus): PASS. Kontrollib, et hirv põgeneb inimese eest ja tuleb tagasi, ei märka hiilivat jahimeest, kukub viske peale ja lamab koju viimise ajal, et öösel on kari sees, päeval karjamaal karjuse juures ja õhtul tagasi.
- Brauser (stone-demo, linnale lisatud karjamaa): kari ja karjus karjatavad keskpäeval rohumaal, hirved liiguvad.
- CI kiirkontrolli kõik sammud, `traffic`, `tests/people-v252`, `tests/village-v253`: PASS. `rules`: 20 testi 21-st läbisid, `TEST_V139` kukub nagu varem.
