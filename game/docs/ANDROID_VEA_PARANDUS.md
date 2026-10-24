# Godot Android: `Expected indented block after "if" block`

**Algne vea asukoht:** `res://scripts/core/trade_network_port.gd`, V1.6 rida 248.

Vigane lõik tekkis kaubaveo lõpufaasi tingimusest: 

```gdscript
if path.is_empty():
cargo["status"] = "Ootab: marsruut puudub"
continue
```

V1.7-s on tingimus paigutatud õigesse kohta ja kordus eemaldatud. Marsruudiga liikuv veos ei satu enneaegselt saabumisloogikasse.

**Telefonis:** paki uus ZIP omaette kausta, vali Godoti projektide loendis Import, ava selle kausta `project.godot`. Ära ava eelmise 1.6 kausta koopiat.

Kui parser näitab järgmist eraldi viga, jaga selle failinimi, rida ja veateade. Siin ei olnud kasutada Godoti CLI-d; automaatne tekstipõhine taandekontroll ei kinnita kogu GDScripti kompileerumist.
