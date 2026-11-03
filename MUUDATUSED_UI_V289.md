# V289 — puhas kohanduv HUD, ilma vana liidese kattumiseta

## Taust
Kasutaja V288 ekraanipildil jäi vana ja uus HUD korraga nähtavale. V289 lahendab selle eraldiseisva maailmakaardi HUD-iga, mitte täiendava CSS-kattega vana liidese peale. Sihtkujundus põhineb vestluse 1672×941 pildil (sinimustad ja kuldsed paneelid, 6 illustreeritud kaarti).

## Teostus
- Uued failid: hud-v289.js ja hud-v289.css, lisatud kõige viimasena.
- Maailmakaardi maalitud vaates on ainult #v289-hud nähtav; V287/V288 ja varasemad UI paneelid peidetakse.
- Vana kasutajaliidese kood ei määra uue liidese paigutust. Taustal kasutatakse vaid olemasolevaid mänguandmeid ja päris nuppe. Piltideks kasutatakse ainult juba olemasolevaid V263/V288 graafilisi varasid; kirjutati uus HTML ja uus CSS.
- Ülariba: vapp, nimi, ressursside elavad numbrid, ajastu/aeg, menüü.
- Vasak üleval: päris mängu soovitatud tegevused.
- Parem üleval: fraktsioonid ja nende tegelikud elanike arvud/suhted.
- All vasakul: sama päris minimapi canvas (liigutatud uude paneeli, mitte teise pildina kopeeritud), koos suuminuppudega.
- All keskel: kuus illustreeritud nuppu (ehitised, üksused, uurimus, diplomaatia, kaubandus ja riik), seotud päris mängufunktsioonidega.
- All paremal: valitud linna või väeüksuse info ja toimivad käsud, pausi/jätka nupp.
- Diplomaatia käib V288 olemasoleva game-state API kaudu. Ei looda väljamõeldud End Turn käsku.
- Eraldi reeglid <=1430, <=1100, <=900, <=520 ja madala maastikulise ekraani jaoks. Telefonis üleval rullitav ressursiriba, kaks kompaktset ala, kuus nuppu 3×2 ruudustikus ja avatavad kõrvalpaneelid.
- Uus liides aktiveerub ainult maailmakaardil ja ainult ui=painted korral. Linna detailvaates ja ka muus režiimis jääb senine UI alles kuni eraldi ümbertegemiseni.

## Proovimine
Uus: https://orogdor.github.io/Kuningriigid/?ui=painted&v=289
Vana: https://orogdor.github.io/Kuningriigid/?ui=classic&v=289

## Kontroll
- JS-i parse kontroll ja CSS sulgude tasakaal kontrollitud.
- tests/ui-v289.mjs kontrollib HTML/CSS/JS viiteid, vana UI peitmist, minikaardi taastamist, pildifailide olemasolu, reaalseid funktsioone ja kohanduvusreegleid.
- Kontroll lisatud olemasolevasse CI kiirtesti.
- Viimase kavandipildi väljanägemise ja kõikide seadmete täielik 1:1 sobivus ei ole veel päris brauseri ekraanipiltidega kinnitatud. Kasutaja kaug-PC oli kontrolli ajal offline.
