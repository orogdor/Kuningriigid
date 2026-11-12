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
