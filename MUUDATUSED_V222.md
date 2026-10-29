# Kuningriigid V222 — kiviaja tööliste ja sõdalaste animatsioonid

## Muudetud mängus
- V221 kiviaja 17-luuline `human_rigged.glb` jäi samaks; töötajate liigutused on uues `stone-motion-v222.js` moodulis.
- Sujuvamad üleminekud seismise, kõndimise ja töö vahel; vahelduv sammutsükkel, põlvetõste, ülakeha vastuliikumine ja raskuskeskme nihe.
- Eraldi töötsüklid puude raiumisele, kaevandamisele, ehitamisele, põllutööle/korjamisele, kalapüügile ja vee kandmisele.
- Koorma kandmisel käed hoiavad koormat ka kõndimise ajal; olemasolevad tööriistad ja tiimivärv säilivad.
- V148 sõdalaste mudelid ja animatsiooniklipid säilivad. Uued käeliigutused ja keha pöörded kihistuvad nende peale: oda ettevalmistus ja torge, kirve hoovõtt ja löök, lingu keerutamine ja heide, vibu sihtimine ja vabastamine.
- Scout/militia kasutavad odamehe täiendatud liikumist; lisatud võitlus- ja kaitseasendite detailid ning tabamuse reageering.
- Pronksi- ja hilisemate ajastute üksuste animatsioone ei muudetud. Mänguloogikat, salvestusi ja tegelaste geomeetriat ei muudetud.

## Vaata telefonis
`stone-animation-preview-v222.html`: vali tööline või sõdalane ning vali animatsioon. Mudelit saab ekraanil sõrmega pöörata.

## Kontroll
`node TEST_V222.mjs` — kiire test ilma Playwrighti, Godoti, APK või EXE ehitamiseta. Kontrollib 9 töörolli liikumisi, koormaga kõndimist, seismist, 6 sõdalase rünnakufaase, luupöörete lõplikkust ja teiste ajastute muutmata jätmist.

## Tehnoloogia ja litsents
Animatsioonid on siin loodud **oma protseduurilise JavaScripti animatsioonikoodiga**, mitte HY-Motioni ega Kimodo mudelikaaludega. Seetõttu ei nõua see muudatus kolmanda osapoole motion-generatsioonimudeli litsentsi ega GPU arvutusvõimsust. See on esmane mängus töötav animatsioonide uuendus, mitte AI motion-capture'i genereerimise katse.
