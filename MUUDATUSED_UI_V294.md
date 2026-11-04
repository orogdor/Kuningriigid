# V294 – avastuste menüü ühe pilditaustaga

## Mis muutus
- `ui-art-v294/research_menu_bg.svg` on üks terviklik 1600 × 920 illustreeritud menüütaust: raam, kuldornament, tehnoloogiapuu ala, detailinfo ala ja viis avastuste järjekorra sõõri on kõik selles **ühes pildifailis**.
- `research-panel-v294.css` eemaldab vanad üksteise otsa kujundatud kastide, kaartide, inspector-paneeli ja tehnoloogiasõlmede taustad. Tehnoloogiate pildid, pealkirjad, progress ja klõpsualad paiknevad tausta peal.
- `research-panel-v294.js` võtab kasutusele ühe illustratsiooniga menüü, säilitades kõigi vanade uurimiskäskude elementide ID-d.
- `research-ui.js`: alumises menüüreas täpselt viis kohta: **üks aktiivne uurimus ja neli salvestatud järjekorrakohta**. Iga pilt tuleb V293 konkreetse tehnoloogia ilustratsioonist. Aktiivne nupp valib uurimuse puus; järjekorra nupp eemaldab selle, nagu olemasolevas menüüs. Tühjad kohad näitavad plussi.
- Kõik tehnoloogiapuu elemendid jäävad algse mängu `research-tree-v119.js` loogikaga elavaks: eeldused, aktiivne ja lõpetatud avastus, arvutuslik progress, teistesse ajastutesse hüppamine, suum ja järjekorda lisamine säilivad.
- Parandatud suur kihiviga: `#researchpanel` on mängu pildilise maailmakaardi HUD-ist eespool (z-index:300), ning avatud menüü ajal peidetakse vana HUD.
- `research-ui.js?v=294a` vahemäluvõtme muutus tagab, et mobiilibrauser ei laadiks vana järjekorraloendit.
- Muudatus on avastuste menüü keskne: mängu tehnoloogiareegleid, save-faili formaati ja muud maailmakaardi HUD-i ei muudeta.

## Kohanduvus
- Lauaarvutis tehnoloogiapuu vasakul ja valitud tehnoloogia info paremal, sama pilditausta sees.
- Tahvelarvutis ja telefoni püstvaates tehnoloogiapuu on ülemises keritavas alas, valitud tehnoloogia info all ning viis avastuste ringi allservas.
- Madalas telefoni rõhtvaates puu ja info on kõrvuti. Kõik nupud säilivad.

## Kontrollid
- `tests/ui-research-v294.mjs`: üksainus menüütaust, kõik mängu tehnoloogiapildid, viis päris järjekorrakohta, vana HUD-i peitmine, responsive paigutus ja versioon V294.
- GitHub Actions kiirkontroll töövoogu lisatud.
- Avaliku veebimängu tegeliku Androidi välimuse visuaalne kinnitus ja pildi 1:1 vastavus vajavad veel päris seadmega kontrollimist.