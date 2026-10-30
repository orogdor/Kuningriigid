# Kuningriigid V238 – detailkaardi scout

- Põhjus: scout oli detailkaardil olemas, kuid tema 1–2 m pikkune
  mudel jäi 200 m kaugusele tõmmatud kaameras vaevu märgatavaks.
  Kontrollitud V237 brauseritest: scout oli tegelikult 8×8 sektoris
  (x=14.0625, z=12.1875), nähtav, kuid tähiseta.
- Scout'i päris 3D-mudelile lisati ühise tekstuuriga nimega sprite ja
  maapinnale rõngas. Nimi skaleerub kaamera kaugusega.
- Avastaja ruutu avades suunatakse kaamera tema asukoha poole.
- Naaberruudus kuvatakse scout ka segaarmee koosseisus; eelmisel
  versioonil töötas see vaid puhta scout-armee puhul.
- Animatsioon, 8×8 sektorite määramine ja maailmakaardi positsioon
  jäävad samaks. Ei muuda mängusalvestuse formaati.
- Lisatud automaattest ja gameDebug.scoutDetailStatusV238().
