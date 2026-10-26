# Kuningriigid – GitHub Actionsi testimise ja avaldamise kord

Alates 26.10.2026 ei tohi üks koodimuudatus käivitada korraga kümneid eraldi teste.

## Automaatne kontroll: ainult üks töö

**Actions → Kuningriigid Fast Game Check** (`.github/workflows/v128.yml`)

- Käivitub mängukoodi muudatuste puhul `main` harus.
- Üks job: põhifailide `node --check` ja `node scripts/test.mjs traffic`.
- Ei käivita brauseritestide maatriksit, 200 käigu AI regressiooni ega Pagesi avaldamist.
- Uuem commit tühistab poolelioleva vana kiire kontrolli.
- Ainuüksi dokumentatsiooni ja Actionsi töövoofailide muudatused kiiret kontrolli ei käivita.

## Vajaduspõhised testid

**Actions → Kuningriigid Browser QA (manual)** (`v1754-real-touch.yml`)

- **Run workflow**: päris mängu ja müüriehituse kontroll Chromiumiga arvutis ning telefonivaates.
- Eraldi ajaloolised veebitesti töövood säilivad, kuid neid ei käivitata igal commit'il.

**Actions → Kuningriigid 200-turn regression** (`regression-200.yml`)

- **Run workflow**: pikad AI ja majanduse võrdlustestid, ainult vajaduse korral.
- Müüride füüsika täpsemad testid `v1754-wall-and-gates.yml` ja `v1755-wall-rotation.yml` on samuti käsitsi käivitatavad.

## Avaldamine ainult eraldi käsuga

**Actions → Kuningriigid latest GitHub Pages** (`avaldamine.yml`)

- **Run workflow → main** avaldab uue mänguversiooni.
- Manuaalsel avaldamisel tehakse kiire test ja päris arvuti/telefoni brauseritest.
- Väljalase ei käivitu enam selle YAML-töövoo kaudu igal push'il.
- `workflow_call` säilib ühilduvuseks olemasolevate käsitsi käivitatavate testidega.

**NB! GitHubi sisseehitatud `pages build and deployment` võib endiselt käivituda iga commit'iga, kui Pagesi Source on `Deploy from a branch`.** Seda seadistust ei saa muuta koodifaili kaudu: ava GitHubi projekti **Settings → Pages → Build and deployment → Source → GitHub Actions**. Alles pärast seda jääb Pagesi tegelik avaldamine ülaltoodud manuaalse töövoo hallata. See tuleb GitHubi kasutajaliideses üks kord teha.

Ära lisa vanade versioonitestide `push` või `pull_request` automaatkäivitust ilma selge põhjuseta. Kui uut suurt testi on vaja, kasuta `workflow_dispatch` ja hoia automaatne kontroll kiire.
