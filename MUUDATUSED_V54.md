# Kuningriigid V54 – peidetud maailmakaart ja puhtam kasutajaliides

## Parandused
- Avastamata ala maailmakaardil on nüüd tugevama pargamentkatte all.
- Avastamata ruudud saavad ühtse koondatud kattepinna, mis peidab maastiku palju paremini kui ainult toonimuutus.
- V53 kaardistiili joonistatud märgid jäid alles, kuid nüüd on nende all ka tegelik peitev kate.
- Üldine kasutajaliides uuendati puhtamaks ja dekoratiivsemaks.
- Paneelid kasutavad nüüd pildipõhiseid taustu ja ornamentikat (SVG-pildid CSS-is).
- Algusmenüüsse lisati pildiline tutvustusplokk.
- Ressursiriba, nupuriba ja külgpaneelid tehti ühtlasema väljanägemisega.

## Märkus
- Täielik visuaalne brauseritest jäi selles keskkonnas endiselt tegemata; muudatused kontrolliti koodi ja süntaksi tasemel.

## Avaldamiseelne paranduskontroll
- Maailmakaardi peitev kate on üks BufferGeometry ja üks renderdusobjekt, mitte kuni 36 300 eraldi sprite'i.
- Nelja tüüpi joonistatud sümbolid on InstancedMesh objektid, et piirata joonistuskutseid.
- V53, V51 ja V50 automaattestid läbiti pärast muudatust.
