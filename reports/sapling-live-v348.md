# V348 – elusate üksikpuude optimeeringu A/B-test
Kuupäev: 2026-11-12. Haru: `experiments/sapling-live-v348`. Baas: V347 main.

## Muudatused
Muudetud ainult `sapling-trees-v328.js` ja selle olemasolevat integratsioonitesti.

1. `withSaplingTreeV328` jätab meelde stseeni juure ning kolme taseme `far`, `mid`, `near` geomeetriaosad ja batch-viited. Kui puu või mõni tema esivanem eemaldatakse või tõstetakse teise stseeni, tühjendatakse cache ja eemaldatakse jälgivad sündmuskuulajad.
2. Tasemepõhised `kind:variant:level:height` batch-võtmed luuakse üks kord puu loomisel.
3. Puude maatriksid kirjutatakse nagu enne, kuid `instanceMatrix.needsUpdate` seatakse ainult vahetult enne joonistamist: `onBeforeRender` või `onBeforeShadow`. Iga puu lisamisel muudetakse ainult odavat dirty-lippu. `castShadow` fikseeritakse batch-meshi loomisel.
4. Sama `kind/variant/level` GLB laadimist ei küsita pooleliolemise ajal igal kaadril uuesti.

`onBeforeShadow` on oluline, sest ainult põhijoonistuse `onBeforeRender` ülekirjutamine võiks jätta varjupassi GPU puhvri vanaks.

## Korrektsuse kontroll
- `tests/sapling-trees/live-integration.mjs` (V348 lisatestidega) – PASS.
- 100 üksikpuu batch, dünaamilise puhvri kasv, peidetud/maharaiutud ja eemaldatud puude kadumine, geomeetria/LOD, paigal ning nihutatud puude maailmamaatriksid – PASS.
- GPU buffer version kasvab enne varjupassi ainult 1 võrra ja teine joonistus ilma uute andmeteta ei kasvata versiooni.
- Vahepealse `Group`-i teise Scene alla liigutamine muudab õige batch'i stseeni ning eemaldamisel vabastatakse ancestor listener.
- Sünteetilises 100/500/1000 puu testis on maatriksite andmed, batch'i instantsiarv, järjekord ja varjuseaded võrreldud vana koodiga – PASS.

## Sünteetiline CPU mõõtmine
RTX 2080 SUPER masin, Windows Node.js V8. Stseeni ja puude `update` simuleerimine koos GPU submit hookide kutsumisega. 600 renderdussammu:
| Eluspuud | V347 algne | V348 katse | Vähenemine |
|---|---:|---:|---:|
| 100 | 65,092 ms | 21,886 ms | 66,4% |
| 500 | 275,425 ms | 92,365 ms | 66,5% |
| 1000 | 549,908 ms | 192,940 ms | 64,9% |

See isoleeritud test **ei ole kogu renderdaja kaadriaeg** ega tähenda sama protsendi FPS-võitu.

## Päris Chrome WebGL A/B: 500 lisatud elusat puud
Avalik GitHub Pages V346f WebGL mäng; mõlemas käivituses asendati ainult HTTP vastus `sapling-trees-v328.js` (vana või V348). 1600×900, medium, RTX 2080 SUPER D3D11; `?demo=stonetown&gpu=0&v=346`, sama Kivikalda küla, kaamera ja fookus. 500 ekstra `withSaplingTreeV328` puud sisestati localScene'i, eelnevalt laaditi viis männi varianti ja kõik kolm LOD-taset. Mõlemas katses 0 JS viga ja asendusmoodul laaditi 1 kord.

| Näitaja | V347 vana | V348 uus |
|---|---:|---:|
| 5 kaadrit: CPU keskmine | 21,56 ms | 20,78 ms |
| 5 kaadrit: frame interval FPS hinnang | 40,00 | 43,62 |
| 120 kaadrit: CPU keskmine | 19,418 ms | 19,794 ms |
| 120 kaadrit: CPU mediaan | 19,3 ms | 19,5 ms |
| 120 kaadrit: CPU p95 | 25,1 ms | 24,5 ms |
| 120 kaadrit: Three render CPU keskmine | 15,98 ms | 16,39 ms |
| 120 kaadrit: gl draw-käske keskmiselt | 1079,5 | 1089,1 |
| 120 kaadrit: frame interval FPS hinnang | 49,07 | 48,08 |
| 120 mõõtekaadri jooksul 500 puu `root.update` CPU koguaeg | 87,3 ms | 60,1 ms |
| Mõõdetud puu `root.update` kutseid | 63 000 | 62 500 |
| 1000 `root.update` kutse CPU aeg | 1,386 ms | 0,962 ms |

Puude `root.update` on päris veebimängus umbes **31% kiirem kutse kohta**, kuid kogu kaadri CPU ja FPS jäävad selle ühekordse mõõtmise hajuvuse piires samaks. Mõõdetud `root.update` kogukutse arv võib sisaldada CDP profiili avamise/sulgemise ajal tehtud renderdusi; suhteline kutsekohtane hind on usaldusväärsem kui puude kogukulust tuletatud FPS.

## Piirangud ja otsus
- Detailvoog polnud täielikult valmis: mõlema katse alguses vaid 9/31 jälgitavast kirjest `ready`; järgnevad laadimispiigid võivad FPS-i muuta.
- Kaadrite `glDrawCalls` erinevus tulenes reaalaja renderduste ja laadimisoleku varieerumisest; GPU aega eraldi ei mõõdetud.
- Eraldi brauserikäivituste võrdlus ei ole deterministlik pikema salvestatud mänguseansi benchmark.
- **Soovitus:** jätta V348 katseharusse, kuni on tehtud pikaajaline täielikult laaditud detailkaardi ja liikuva kaamera test. Funktsiooni kiirendus on kinnitatud, suurt FPS võitu mitte.

## Testi artefaktid samas Windowsi arvutis
`E:\KuningriigidTest\bench-five-frames\`
- `sapling-live-micro-v348.mjs`, `sapling-live-v348-micro-results.json`.
- `sapling-live-integration-v348.mjs` ning `sapling-live-upstream-test-v348.mjs`.
- `profile-sapling-v348-ab.mjs`, `sapling-live-v348-browser-comparison.json`.
- `2026-11-12-sapling-v348-baseline/` ja `2026-11-12-sapling-v348-optimized/`, sh 5 ja 120 kaadri CPU profiilid.


## Pikem veebimängu FPS-võrdlus (2026-11-12, kell ~15 Eesti aja järgi)

Pärast esialgset 5/120 kaadri A/B-testi tehti teine, iseseisev pikem katse. Kummaski variandis **2400 tegelikult joonistatud kaadrit**, jaotatuna 800 paigal kaamera, 800 deterministliku panoraami ja 800 lähi-/liikuva vaate kaadriks. Kokku 4800 kaadrit. Eraldi Chrome'i WebGL käivitused samal Windowsi masinal (RTX 2080 SUPER, D3D11), 1600×900, medium, 100% resolutsioon, piiramatu FPS. Kivikalda küla `?demo=stonetown&gpu=0&v=346`. Mõlemal katsel vastas veebimängu laadimine GitHub Pagesi avalikule versioonile; ainult üks HTTP vastus `sapling-trees-v328.js` asendati kohaliku V347 või V348 koodiga, asenduste arv 1. Mõlemas 0 JavaScripti viga.

Mängu tegelikele **1311 elavale ressursipuule** lisati samas jaotuses **500** `withSaplingTreeV328` testipuud. Iga faasi alguses pandi paika sama fookus ja suum; 1,8-sekundiline üleminek jäeti mõõtmisest välja. Detailvoog oli mõlema käivituse ajal 9/31 jälgitavat kirjet ready; selle piiranguga tuleb arvestada.

| Faas (800 renderdatud kaadrit) | V347 FPS | V348 FPS | V348 muutus | V347 kaadri CPU (ms) | V348 kaadri CPU (ms) |
|---|---:|---:|---:|---:|---:|
| Paigal, suum 150 | 56,26 | 54,97 | −2,29% | 16,950 | 17,380 |
| Liikuv kaamera, suum 150 | 47,67 | 46,30 | −2,87% | 20,111 | 20,729 |
| Lähi-/liikuv kaamera, suum 95 | 47,73 | 46,37 | −2,85% | 19,902 | 20,550 |
| **Kokku, 2400 kaadrit kummaski versioonis** | **50,25** | **48,89** | **−2,71%** | — | — |

FPS = renderdatud kaadrite arv / mõõdetud monotoonkella järgi kulunud aeg (mitte graafikaseadmete juhtpaneelil näidatud FPS). Kaamera liikumine järgib sama deterministlikku sinusoidaalset marsruuti, st katseolud on ligikaudu võrdsed, kuid sõltumatu mängumaailma laadimise, süsteemi ajastuse ja shaderite tippkoormuse tõttu mitte bititäpselt identsed.

**Aeglased kaadrid:** faaside lõikes üle 50 ms intervalle V347=1/2/8, V348=1/2/7 (kokku vastavalt 11 ja 10). 99. protsentiili intervall oli paigal ~33 ms, panoraamil ~42 ms ning lähivaates ~50 ms mõlemas variandis. Mõlema paigal lõigu jooksul esines umbes 320 ms üksikpiik. Renderduskorralduste arv oli suures osas samaväärne (~1092 paigal, ~1225 panoraamil, ~1056 lähivaates).

**Tõlgendus:** V348 `root.update` oli eelnevas isoleeritud ja lühikeses pärisbrauseri katses kiirem, kuid pikema 1811 puuga koormatud päris mängukaadri FPS ei paranenud ja jäi umbes 2,7% alla lähteversioonile. Erinevus on väike ja mõõdetud üks kord ühe variandi kohta; kindlalt ei saa järeldada, et V348 alati aeglustab, küll aga puudub tõend üldise FPS-võidu kohta. Seetõttu **mitte ühendada V348 praegu main-harusse**. Järgmine mõistlik test on kordus A/B ümberpööratud käivitusjärjestusega ning varjupassi GPU ajamõõt, või muuta kitsalt vaid osade/mallide vahemälu ning jätta buffer dirty muutmine katsevariandiks.

Kohalikud pikema testi toorandmed: `E:\KuningriigidTest\bench-five-frames\long-sapling-v348-ab.mjs` ja `long-sapling-v348-baseline/` ning `long-sapling-v348-optimized/` (`summary.json`, `idle-frames.json`, `pan-frames.json`, `near-frames.json`).
