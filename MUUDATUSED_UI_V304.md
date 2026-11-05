# V304 – ühtne illustreeritud kasutajaliides

Üks sinisest nahast ja kullatud raamiga genereeritud menüütaust. Genereeritud põhimenüü maastik ning 140 sisupõhist avastuse illustratsiooni; kogu uus WEBP graafika umbes 3,27 MB. Senised V303 maalitud menüükaardid ja kaardikäsud jäävad kasutusse.

## Käitumine

- Üks paigutus omab kogu HUD-i. Varasemad V288–V303 HUD-skriptid lahkuvad enne elementide loomist. Nende kujundusstiilid on uues režiimis välja lülitatud.
- Ülariba kasutab päris ressursside arve, aega ja pausi. Alumine rida avab samad linnade, ehituse, armeede, kaubanduse, diplomaatia ja päeviku tegevused.
- Päris minimap canvas on uues paneelis; kaardivahetus ja jalutamine on kättesaadavad ka telefoni kaardipaneelis. Valiku `i` avab kõik üksuse käsud ning rivistuse.
- Kõik sisemenüüd jagavad sama materjali, pealkirjade, nuppude ja piltide stiili. Ehituse ja värbamise pildid järgivad päris BUILD_TECH/UNIT_TECH seoseid.
- 140 tehnoloogiat saavad eraldi genereeritud pildi. Sama pilt on puus, suures valitud avastuse vaates ja järjekorras. Uurimisreeglid ja 1+4 järjekord säilivad.
- Puu paigutus võtab arvesse infopaneeli tegelikku laiust; telefoni püsti/rõht vaadetes jäävad käsud kättesaadavaks.
- `?ui=classic` säilitab klassikalise variandi. Uus kujundus on vaikimisi. Salvestusformaat ei muutu.

## Kontroll

CI quick-check käsud: mängu, teede, lahingu, salvestuse, päevavalguse ja üksuste regressioonid läbitud. V293–V304 UI testid läbitud pärast SVG/versioonieelduste ajakohastamist. Uus V304 test kontrollib 140 WEBP-d ja tegevuste tegelikku suunamist, sh keelatud liikumist ja linnade asutamise nähtavust.

Brauseris kontrollitud UI tegeliku uurimisrenderdajaga 1363×936, 390×844 ja 844×390. Avastuse valimine ja järjekorda lisamine toimis, 28 laaditud avastusepildil 0 puuduvat faili. Ehituskaardid ja telefoni paneelid visuaalselt kontrollitud. Pilvebrauseris pole WebGL kontekst kättesaadav; täismahus 3D mängutest jäi seetõttu kinnitamata.

Illustratsioonide päritolu ja promptide kirjeldus: `ui-art-v304/ARTWORK.md`. Kontrollpilt: `previews/ui-v304-research.jpg`.
