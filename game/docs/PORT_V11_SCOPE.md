# V131 -> Godot 1.1: maanteekaubandus riigi linnade vahel

## V131 alused

Lähteversioon: `orogdor/Kuningriigid`, commit `26562368f56a32616651a266ed2d8c87f06d43d1`.
Vaadeldud originaalmoodulid: `trade-network.js`, `roads.js`, `campaign.js` ning `merchant-v87.js`.

## Mis selles osapordis toimub

- `scripts/core/trade_network_port.gd`: V131 linnade varu- ja nõudlusläved, sama riigi kaubaülejäägi arvutamine, kuni kaks sisenevat saadetist linna kohta, ühe väljuva kaupmehe piirang saatva linna kohta, laadimislimiit (36 või 52 turuga), toidu ühine laopiir ja teel olevate kaupade arvestus.
- `scripts/adapters/world_trade_nav.gd`: algse neljasuunalise maailmakaardi BFS-i korduskasutamine, marsruutide vahemälu.
- `scripts/core/trade_network_port.gd`: 4 sekundit ühe maailmaruudu läbimiseks; teest tulenev 1,5-kordne kiirus; liiklus loob teede kulumismustrid.
- `scripts/adapters/native_trade_view.gd`: Godoti `MultiMeshInstance3D` kuvab sama riigi liikuvad karavanid.
- `scripts/core/preview_sim_port.gd`: transpordi ühe-sekundilised sammud ja kaubanduse plaanimise intervall 15 mängusekundit; saadetised ning maailmateed salvestatakse JSON-katseolekusse.
- `scripts/main.gd`: nupud **Kaubanduse demo** ja **Kaubandus sisse/välja**; CSV kaubanduse lisaloendurid.

## Tähtsad erinevused veebimängust

* Praegu **ainult oma riigi linnadevaheline maanteekaubandus**. V131 `merchant-v87.js` väliskaubandus, peatumistasud, sõjad, diplomaatia, mere-/raudtee-/lennukaubandus puuduvad.
* Maailmakaardi 220×165 katseline maastik **ei ole veel originaalse V131 maailmakaardi maastikuandmestik**. BFS on sama algoritmipere, kuid marsruudid ei pruugi olla samad.
* Godoti nähtavad karavanid on lihtsustatud 3D-objektid, mitte tõelised GLB-animatsiooniga kaupmehed.
* Kasutatakse 14 linna *V129 teststsenaariumi asukohti*, mitte V131 täielikku salvestusfaili.
* Uus kaubanduse testdemonstratsioon muudab valitud lähte- ja sihtlinna katselisi ressursivarusid, et demonstreerida vedu; see **ei ole** pärismängu AI toodetud ülejääk.

## Kontroll

- `python3 tools/validate_package.py` kontrollib faili- ja mooduliviiteid ning vähemalt 173 regressioonitesti olemasolu; **ei käivita teste**.
- Godot 4.2+ olemasolul projektikaustast:
  `godot --headless --path . --script res://tests/headless_test.gd`
- Androidis Godot Editoris impordi `project.godot`, käivita ▶, vali **Kaubanduse demo** ja kasuta **+10 min katseaega**. Mõne ruudu kaugusel asuv kaubavedu jõuab kohale tavaliselt kümnete mängusekunditega.
- Kontrollimiseks võrdle testmaailmas lähtevaru, `shipments` sisu ja sihtvaru enne/pärast saabumist. Teel olevad kaubad salvestatakse ainult `user://v131_godot_preview_v11.json` katsefaili.

**Godoti mootor ja Androidi käivitus ei ole siin kontrollitud.** Kinnitatud on üksnes staatiline projektikontroll, failide olemasolu ja ZIP-testi terviklus. Enne 1:1 jõudlusväidet on vaja Godoti päris käivitusteste ja V131 täielikku simulatsiooni.
