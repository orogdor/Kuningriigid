# V240 – scout liigub detailkaardil

- Parandatud olukord, kus detailkaardil sai liikumiskäsu anda, aga
  `inspection()` kirjutas scout'i positsiooni igal kaadril üle
  maailmakaardi 8×8 sektori keskpunktiga.
- Scout'i detailkaardi manuaalne liikumiskäsk juhib nüüd tegelikku
  `deploymentFor` positsiooni. Sihtpunkti jõudes jääb scout sinna.
- Maailmakaardi marker saab statsionaarselt sama positsiooni lokaalsest
  salvestatud scout'i poosist; teise maailmaruudu poole liikumisel
  kasutatakse jälle tegelikku `travelClock` vahepositsiooni.
- Maailmaruut on endiselt 8×8 sektoriteks jaotatud, kuid animatsiooni
  asukoht liigub sujuvalt, ilma iga sektoriga hüppamata.
- Scout kõnnib liikumise ajal ja peatab animatsiooni sihtpunkti saabudes.
- Naaberruudu scout'i 3D-mudel kasutab samuti sujuvat positsiooni.
- Päris brauseri liikumistest: (0,0) → (9.85474,0); uuenesid
  üksuse 3D-mudel, detailpaigutus ja maailmakaardi positsioon.
- Olemasolevate salvestuste formaat jääb toimima.
