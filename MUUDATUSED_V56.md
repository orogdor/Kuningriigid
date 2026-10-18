# Kuningriigid V56 – teede nähtavus ja avastaja marsruudiparandus

## Parandatud vead

- Automaatne avastaja ei vali enam naaberruute vastastikku lõpmatusse tsüklisse. V55 sihtkohaotsing luges diagonaalseid tundmatuid nurki (2,2) avastatavaks, kuigi tegelik nähtavus kasutas Manhattani kauguse 3 piiri; nüüd kasutatakse sama avastusulatust.
- Mõne maailmakaardi alguskohta ümbritsesid läbimatud mäed ning käia sai üksnes 9-ruudulisel platsil. V56 loob deterministliku kitsa mäekuru suurema kõnnitava piirkonnani, säilitades ülejäänud mäestiku ja jõed. Seda tehakse ka V55 mänguseisu laadimisel.
- Jalgrada on 3,2 asemel 9 maailmamõõdu ühikut lai. Korduv liiklus laiendab tee kuni 24 ühikuni. Tee kõrgus tõsteti pisut maastikust kõrgemale ja kontrasti suurendati; minikaardi teejooni paksendati.
- Üks tegelik läbimine tekitab endiselt tee, mis salvestatakse mänguseisu. Teed ei teki lihtsalt marsruudi planeerimise peale.

## Kontrollid

- `node TEST_V56.mjs`: viis seemet, liikuvus, automaatne avastamine, teede olemasolu ja geomeetria.
- `node TEST_V55.mjs`, `node TEST_V53.mjs`, `node TEST_V51.mjs`, `node TEST_V50.mjs`.
- Brauseri WebGL visuaaltest ei olnud käitatav, sest Chromiumi EGL/GPU kontekst ei käivitunud selles keskkonnas.

## Jätkamine

V56 on tagasiühilduv V55 salvestusstruktuuriga: vanu teid või avastusi ei kustutata.
