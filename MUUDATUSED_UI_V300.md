# Kuningriigid V300 — kontekstipõhine pildipaneel (etapp A + visuaalne korrastus)

## Eesmärk
Valitud linna, sõduri või töölise nupud ei tohi olla samad kui ilma valikuta. Iga nupp peab olema **oma SVG-pildifail** ja käivitama olemasolevat mängukäsku. Parempoolne paneel ei tohi näidata sisse maalitud ja peale joonistatud dubleeritud ikoone.

## Muudatused
- `ui-art-v300/selection_frame.svg` — üks uus dekoratiivne tumesinine-kuldne paneel, läbipaistva portreeavaga, nelja nupu jaoks tühja alaga ja korraliku nimesildiga. Varasemate piltide sisse maalitud ikoonid eemaldatud.
- 17 eraldi `ui-art-v300/action_*.svg` pilti. Sama kuldne/tumesinine dekoratsioon, erinevad äratuntavad keskikoonid.
- `selection-context-v300.js` — üks tegevuste kataloog, mis tagastab täpselt 4 käsku, nime, ikooni ja keelatuse tegeliku valiku järgi. Loogika on sõltumatu graafikast ja testitav.
- `civilization.js` — `kingdomsUiV288.snapshot().selection` lisab ainult esituseks vajaliku `kind/name/own/movable/attackable/scout/order/team` ülevaate tegelikust `currentSelection()`-ist. Mänguloogikat, üksuste liikumist ja salvestusvormingut ei muudetud.
- `hud-v291.js` — neli olemasolevat õiget nuppu säilitavad originaalsed V299 pildikoordinaadid, aga pildid, kirjeldused ja sihtkäsud muutuvad dünaamiliselt. Suures ringis on üksuse/linna portree, selle all tegelik nimi; ilma valikuta kuvatakse maailma pilt.
- `hud-v298-layout.css` — ühe ja sama paigutuse sees uus parempoolne puhas raam, paremini nähtavad nupu pildid, mitte topelt joonistatud kujundid; väike korrastus kaardi menüünuppude hover'il.
- `boot-v83.js` ja `index.html` — vahemälu uuendatud V300 peale.

## Tegevused valiku järgi
| Valik | Vasak ülemine | Parem ülemine | Vasak alumine | Parem alumine |
| --- | --- | --- | --- | --- |
| Valik puudub | Kaardi vahetus | Avastused | Sündmused | Diplomaatia |
| Linn | Linna ülevaade | Ehitamine | Värbamine | Kaubandus |
| Tööline / asunik | Liigu | Ehita / asuta | Ressursid | Peata |
| Üksus / armee | Liigu | Ründa lahingus, avasta skaudiga või armeed | Peata | Keskenda |
| Hoone | Hoone info | Ehita | Töölised | Keskenda |
| Kaubavedu | Kaubandus | Kaart | Sündmused | Keskenda |

Ründenupp ilmub ainult juhul, kui reaalne lahing ja valitud salk seda võimaldavad. Liikumis- või peatamisnupud on keelatud, kui objekt ei ole juhitav. Nuppudele jäävad korrektsed kirjeldused ja puutekäskude olemasolev loogika. V300 ei lisa uusi mängumehaanikaid.

## Testimine
- `tests/ui-v300-selection.mjs`: 17 päris SVG-faili, 9 valikuolukorda, 4 nuppu iga olukorra kohta, keelatud käskude turvalisus, mängu tegeliku UI-käsu siht ja valitud objektiga seotud CSS/JS.
- GitHub Actions kontrollib ka V291–V299 varasemaid paigutuse, ressursside ja avastuste regressioone.
- Päris Androidi ekraanitest ja kaardil üksuse tegelik valimine vajab avaldatud mängus visuaalset kinnitust; automaattestid ei tõenda täielikku 1:1 visuaalset vastavust.

Ava: https://orogdor.github.io/Kuningriigid/?ui=art&v=300
