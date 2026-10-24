# V131 → Godot port 0.8 — kohalik navigeerimine

Alus: V131 commit `26562368f56a32616651a266ed2d8c87f06d43d1`.

## Koodi asemel Godoti natiivfunktsioonid
- `scripts/adapters/local_street_nav.gd`: AStarGrid2D, 96×96 ruutude süsteem 0,25 m sammul; kohalikud ehitusjalajäljed, hoonete sissepääsud, 4-suunalised liikumised, marsruudi vahemälu; ehitiste lisamisel uueneb võrk.
- `scripts/core/cargo_port.gd`: saadetis liigub mööda marsruudi punkte; hoonete muutumisel planeerib uuesti praegusest asukohast; laekub varudesse alles sihtkohta jõudes.
- `scripts/adapters/native_street_view.gd`: aktiivsete veoste marsruudid Godoti SurfaceTool-iga.
- `scripts/adapters/native_cargo_view.gd`: kaubad + lihtsustatud kandjad MultiMeshInstance3D abil.
- Kasutajaliideses `Linna lähivaade` ja `Tänavateed / otseteed` — võrdlusrežiim.
- Salvestamine kasutab `user://v131_godot_preview_v08.json`, eelmine v07 seis on endiselt loetav.

## Piirangud
- Testlinna asetus on endiselt 0.7 illustratiivne spiraal, mitte V131 detailkaardi meetrites arhitektuur.
- AStarGrid2D võib valida erineva marsruudi kui V131 navigation.js (ka lõikude kulumine ja teekatte mõju pole veel integreeritud).
- Füüsilised kandjad ja kaup on odavad visuaalsed proksid; puudub algse V131 elanikutööjaotus ja animatsioon.
- Eelmiste ZIP-ide 107 testi + 12 uut — koodi olemasolu on kontrollitud staatiliselt; ainult Godot suudab kinnitada tegeliku läbimise.
- 3D GLB-mudelid laaditakse endiselt esimesel käivitamisel internetist; ZIP neid ei sisalda.
