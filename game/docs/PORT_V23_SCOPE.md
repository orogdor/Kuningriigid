# Kuningriigid V131 → Godot 4 · port 2.3: maakonna veod

Algne V131 lähtepunkt: orogdor/Kuningriigid@26562368f56a32616651a266ed2d8c87f06d43d1.

## Päriselt koodi lisatud

- `scripts/core/county_logistics_port.gd`: maakonnatöötaja püsiv asukoht maailmakaardil, BFS-marsruut, 6 sekundit / ruut (teel 1.5x kiirendus) ning tootmise algus pärast kohale jõudmist.
- Kauged töökohad hoiavad saadud tooteid `pending` väljal; linnavaru suureneb **ainult kohaletoimetamisel**. Maksimaalne veos 18 ühikut; üks aktiivne veos töökohalt.
- Eraldi `state.county_shipments` saadetised: maailmaruudu positsioon, teekond, edenemisindeks, veokell, kaubakogus ja päritolutöökoht. Samad V131 tee-kulumise andmed nagu linnadevahelistel karavanidel.
- Laukaitse: vaba ruum kontrollitakse koos töökoha väljastamata koguse ja teel oleva kaubaga; täis laos koorem ootab, mitte ei kao.
- `native_county_logistics_view.gd`: 2 MultiMesh-kategooriat maailmakaardil (töölised, koormad); maakonna detailruudu 3D-vaates sama töökoha töötajad ja hetkel ruudul asuvad veosed.
- Uus testimenüü `Maakonna veod: demo` / `Taasta maakonnakatse`: ajutine valmis kaugem tootmiskoht ja katsemajapidamised. Katse on eraldi ning salvestada ei saa; taastamine taastab katse-eelse oleku.
- Salvestus `user://v131_godot_preview_v23.json`, vanema V22 loetavus. Jõudlus CSV `user://v131_godot_measurements_v23.csv`, uued veostatistika veerud.

## Piirangud

- Töötajate füüsiline liikumine toimub maailmakaardi ruutudena; ei ole veel mitme 225×195 detailruudu katkematu animatsiooniga liikumine ega V131 teeotsing üks-ühele.
- Maakonnatöökoha sisendmaterjalid kuluvad endiselt ühise linna laovaru järgi; eraldi sisendmaterjalide transport puudub.
- Linnade saared, sillad, meretransport, diplomaatia, ehitustööjõu eraldi maakonnaveod ja algsed täpsed tootlikkuse boonused on veel portimata.
- Maakonna leiukohad on sama deterministlikud testnäidised kui V2.2-s, mitte täis V131 maapõue süsteem.
- Godoti mootorit selles ehituskeskkonnas ei ole: **GDScripti tegelik parsingu- ja Androidi käivitustest ei ole kinnitatud**. `tools/run_qa_checks.py` kontrollib staatilist struktuuri, `MENÜÜ → Reeglitest` käivitab mängumootoris päris kontrollid.

## Testida telefonis

1. Paki ZIP täiesti uude kausta ja ava `project.godot` Godot 4 Editoris.
2. Käivita, vali **MENÜÜ → Testid → Maakonna veod: demo**. See avab kaugema tootmisruudu detailvaate.
3. Vajuta **+10 min katseaega**. Eeldatav: töökoha juures on kollane töötaja, toodang väljub pruuni koormana ja jõuab kaardil linna juurde.
4. Vaata alumises inforibas `MAAKONNA VEOD: kohale / kaupa / teel` ning käivita **20s test**, mis salvestab CSV-s aktiivsete töötajate ja koormate arvu.
5. Vali **Taasta maakonnakatse**, enne kui jätkad tavapärase mänguseisuga. Vajadusel vali **Reeglitest** ja saada näidatud vead.
