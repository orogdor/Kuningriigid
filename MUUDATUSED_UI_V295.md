# V295 – ühe pilditaustaga avastuste menüü parandamine

## Parandatud
- Lauaarvuti ja telefoni rõhtvaade kasutavad olemasolevat **ühte** `ui-art-v294/research_menu_bg.svg` pildifaili. Menüü hoiab 1600:920 proportsiooni ja tsentreerib end ekraani.
- Telefoni püstvaatel on üks eraldi `ui-art-v295/research_menu_mobile.svg` pildifail, mis sisaldab kogu raami, ülemist avastuste kaarti, alumist detailpiirkonda ja viit järjekorraringi. Korraga on ekraanil nähtav üks taustapilt, mitte eri CSS-paneelidest kokku pandud raam.
- Teknoloogiad, nende eraldi V293 pildid, lukustatud/aktiivne/uuritud olek, ühendusjooned, progress ja klõpsualad jäävad ühe pildi peale (`research-tree-v119.js`).
- Viis alumist järjekorrakohta kuvavad üht aktiivset ja nelja ootel uurimust (`research-ui.js`). Eemaldamine toimib algse mänguloogikaga; salvestusfaili ei muudeta.
- `research-panel-v295.js` tõstab sulgemisnupu otse pildiraami külge. V294-s oli see mitteklõpsatava pealkirjarea sees ning telefonis valele kohale nihkunud.
- `research-panel-v295.css` lisab kindla paigutuse ja iseseisva kerimisala puule ja avastuse detailidele, koos Androidi puute- ja väikese rõhtvaate reeglitega.
- V293 vana test oli ekslikult vanale järjekorraklassile lukustatud; test parandatud. Lisatud `tests/ui-research-v295.mjs` ja CI.

## Piirang
- Päris Androidi kuvapildi 1:1 vastavus ja täielik elava mängu kasutajatest ei ole kinnitatud. GitHubi automaattesti edu kontrollitakse avaldamisel.
- Kõiki mängu ülejäänud menüüsid ei muudetud; ainult avastuste menüü.

Proovi `https://orogdor.github.io/Kuningriigid/?ui=art&v=295`.