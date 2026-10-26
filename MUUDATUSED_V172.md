# V172 / etapp 3.2a – AI kiviaegse külasüdame tihendamine

26. oktoober 2026.

## Tehtud

- Uus puhas ja deterministlik elamukrundi hinnang failis `compact-stone-v172.js`.
- `historic-urban-v138.js` kasutab **ainult kiviajal** elamute ja linnakeskuse teenushoonete jaoks uut punktisüsteemi. Hooneid ehitatakse endiselt päris ehitushindade ja maastikupiirangutega.
- Elamud eelistavad 31 m ümbrust peamajast (vanemas kiviaja V163 mudelis 42 m); väikesed õued kogunevad 10–19 m kaugusele eelmistest elamutest.
- Peamaja ümbrus jääb avatuks; peamiste ajalooliste teede ribad jäävad ehitisteta. Juba salvestatud hooneid ei paigutata ümber.
- Põllumajanduse, maardlate, ranniku ning muude tootmishoonete ehituskohtade skoor jääb kiviajas muutmata.
- Kõik tegelikud ehitused kontrollivad endiselt maastiku kõrgust, hoonete kattumist, navigeeritavust, ressursside olemasolu, palisaadikoridori, tehno- ja ehitusjärjekorra piiranguid.
- V172 mängumenüü ja koheselt üle võetav kiviaja lõpu teststsenaarium.

## Päris AI simulatsioon, seeme 142023

- `scripts/make-ai-stone-v172.mjs` simuleeris 116 käiku 3 AI riigiga ilma kunstlikult antud toidu, puidu, kivide või hooneteta.
- Uueks mängitavaks testlinnaks valiti **Sogn**, käigu 95 lõpp, vanus 0 (kiviaeg).
- Testkinnitatud linnal oli 15 elanikku, 42/42 valmis hoonet, sealhulgas 12 elumaja.
- Palisaadirõngas: **20/20**, millest 2 puitväravat, 4 torni ja 14 palisaadilõiku.
- Sama AI riik jõudis ise pronksiaega käigul 96. Ülevõtmisel ei ole pronksiaeg mängijale automaatselt peale surutud.
- Salvestus `scenarios/ai-stone-v172.json` (tavaline V4); metaandmed `scenarios/ai-stone-v172.manifest.json` (versioon 172).

## Hoonestustiheduse võrdlus

Elamute **keskmine kaugus peamajast** kahes päris AI simulatsiooni salvestuses. Mõlemad on sama seemnega 142023, aga vanad ja uued pildid on eri käikudel ning erineva arvu majadega.

| Küla | V171 | V172 |
|---|---:|---:|
| Sampola | 44,28 m (14 elamut, käik 102) | 35,33 m (12 elamut, käik 95) |
| Sogn | 41,47 m (12 elamut, käik 102) | 30,69 m (12 elamut, käik 95) |

Sogni vähenemine ~26%; V172 pilt on päriselt hoonemudelitega renderdatud, mitte ainult puhta planeerimisfunktsiooni teoreetiline tulemus.

## Regressioonitestid

- [V172 kompaktse linna regressioon](https://github.com/orogdor/Kuningriigid/actions/runs/40307902858): **PASS**.
- `TEST_V172_LAYOUT.mjs`: 12 esimese planeeritud elamukrundi keskmine vahemaa ~30,1 m; teenindushooned ~24,8 m; talud ~92,3 m. Eristuvad krundid, vanade teede säilimine, determinism, majadevaheline ülekattumiste vältimise eelistus.
- V138 ajalooliste tänavate test, V139 kesklinna täitmise test, V163 kiviaja tsoonide test, V169 sobiva linnakoha test ja V73 vana salvestuse ühilduvus: **PASS**.
- 48 käigu päris AI-proov nelja kiviaegse asulaga: **PASS**.
- [V167 3-seemnega kindlustamiste test](https://github.com/orogdor/Kuningriigid/actions/runs/40307717943): **PASS**, ka uue hoonestuse järel.
- [V172 päris AI testlinna genereerimine](https://github.com/orogdor/Kuningriigid/actions/runs/40308055338): **PASS**, kontrollitud V4 mänguseisu ülevõtmine ja jätkamine.
- [V172 brauseritest](https://github.com/orogdor/Kuningriigid/actions/runs/40308187081): **PASS** nii töölaual 1280×800 kui telefoni 390×844 vaates; päris WebGL detailkaart, seisakult jätkamine, 0 käitusviga ja algsete kasutajasalvestuste säilimine.
- [V172 GitHub Pagesi avaldamine](https://github.com/orogdor/Kuningriigid/actions/runs/40308186617): **PASS**.

## Mängi

**[Ava V172 AI linna Sogn kiviaja lõpus](https://orogdor.github.io/Kuningriigid/?v=172-20261026&demo=ai-stone-v172)**

Mäng avab Sogni detailkaardi pausil. Vajuta ▶, et ise mängu jätkata. Testdemo ei kirjuta eelmist kasutaja autosalvestust üle.

## Piirid ja järg

- Testiseadme telefoni suurus on 390 × 844 px Chromiumi emulatsioon. Päris Samsungi telefonil FPS-i pole mõõdetud.
- See on **3.2a**: uute elamute ja kesklinna teenushoonete automaatse paigutuse parandamine. V172 ei sisalda veel 3.2b liikumiskoridoride visuaalset ühtlustamist ega 3.3 tarade/õuede mikrodetaile.
- Mängu teede ja ehitiste silueti edasine täpsustamine vajab eraldi väljalaset, sest navigeerimist ja palisaadirõngaid ei tohi lõhkuda.
