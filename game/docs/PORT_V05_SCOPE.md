# Kuningriigid V131 → Godot 4 · versioon 0.5

**Lähteversioon:** `orogdor/Kuningriigid` V131 commit `26562368f56a32616651a266ed2d8c87f06d43d1`. See pole V134 ega V135 port ega üldse veel V131 täielik simulatsioon.

## Mis päriselt muutus versioonist 0.4?

1. **V131 `labor.js` baastaseme tööjõujaotus** (`scripts/core/labor_port.gd`): elamumaht ja töötajate eelarve; 0.25 töötaja algosakud; toidu- ja veepuuduse kõrgem prioriteet; töökohad ilma sisendita ei saa töötajaid; hoone efektiivsus `pow(min(1, assigned/required),0.85)`. Puudu on AI vundamenditööd, lõplikud prioriteedid, kõik ajastute tootmisahelad, teekonnad ja tegelik transport.
2. **Katsemajanduse tööjõu ühendus** (`preview_sim_port.gd`): töötajaid ei anta enam igale tootmishoonele automaatselt täiskoormusega. Ehitatavad hooned vajavad vähemalt abstraktset ehitaja osa. Tootlus sõltub määratud töötajatest. Eelmise testi pidev ressursitootmine jääb siiski lihtsustatuks.
3. **Eraldi *katse-AI*** (`preview_ai_port.gd`): riigid 1–3 alustavad uurimist ja annavad linnadele piiratud ehituskäske. Valikud arvestavad olemasolevaid tehnoloogiaid, eeldusi, ressursse ning pooleliolevaid ehitisi. See on loodud koormuskatseks: **EI OLE V131 `ai-strategy.js` ega `ai-development-v128.js` üks-ühele port**.
4. **Natiivse 3D-hoonete sünkroon:** olemasolev `native_city_buildings.gd` loeb `revision` väärtust ning visualiseerib katse-AI hoonete lisandumist ja valmimist.
5. **Telefoni juhtnupud:** `AI sisse/välja`, `+10 min katseaega`. Viimane kiirendab ainult linnade katsemajandust, mitte sõdurite liikumist ega terve mängu teisi süsteeme.
6. **Salvestamine:** salvestab `user://v131_godot_preview_v05.json`; laadimine tunneb ära ka olemasolevad `...v02.json` katsesalvestused. See **ei ava Three.js V131 V4 mängusalvestusi**.
7. **Regressioonitestide lähtekood:** 51 → **65 testväidet**, sh tööjõupiirang, ehitaja reserveerimine, katse-AI 3 riigi ehitamine/uurimine, mängija linna puutumatus ja 3D revision.

## Mis on alles väljas?

- V131 päris `civilization-core.js`, AI otsustussüsteem, üksuste võitluse füüsika/taktika, kaubandus, animatsioonid, detailkaart, linnade ajalooline paiknemine, 1:1 maastik ja linnasisene töötajate teekond.
- 3D-hooned on Godoti proksid; GLB-loader proovib esimesel käivitusel tuua viis originaalassetti lukustatud V131 GitHub commitist. ZIP-is GLB-failide baite endiselt pole.
- Selle keskkonna Godot 4 mootor puudub ja välisvõrk pole konteinerist kättesaadav, mistõttu **GDScripti parserit, 65 reeglitesti ja Androidi FPS-i ei saanud käivitada**.
- `tools/validate_package.py` ja `tools/verify_native_wiring.py` kinnitavad ainult struktuuri ja sidumisi, mitte Godoti toimimist.

## Proovimine Androidis

1. Paki ZIP lahti ja ava kaust `Kuningriigid_Godot_0_5` Godot 4 editoris (`project.godot`).
2. Vajuta ▶. See on katsemaailm 14 linna ja 150/500/1200 natiivse tegelasega, mitte täismäng.
3. Vajuta `Reeglitest`: kui kuvatakse 65/65, on sinu seadmes loogikatestid läbitud; väiksem arv nõuab vea väljavõtet.
4. Vajuta `AI sisse/välja`, seejärel `+10 min katseaega`: linnad 1–3 hakkavad ehitama ja uurima (ühendatud 3D proksidega).
5. Vajuta `20s test` ja vaheta GLB/kastid ning BFS/A* režiime. Ära võrdle tulemusi Three.js V131 tervikmängu FPS-iga 1:1, sest simulatsioonide koormus veel erineb.
