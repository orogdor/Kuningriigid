# Kuningriigid V298 — üks terviklik pildipõhise HUD-i paigutus

## Põhjus
V297 laadis samaaegselt V291 algse CSS-i mobiilireeglid, V292 mobiili-CSS-i ja V297 paranduskihi. Kõik määrasid samade paneelide positsioone ja mõõtmeid `!important` abil. Lisaks paigutas V291 JS iga resize'i järel vanu koordinaate, mida V297 JS seejärel ümber tõstis. Selline kihistamine muutis eriti Androidis külgpaneelid ja nupud ebastabiilseks.

## Parandus
- `hud-v291.css` säilitab originaalse pildipõhise töölaua kujunduse, kuid vanad mobiili meediapäringud on eemaldatud.
- `index.html` ei laadi enam `hud-v292-mobile.css`, `hud-v297-refinement.css` ega `hud-v297-refinement.js`.
- `hud-v298-layout.js` juhib mobiilis kõikide pildifailide ja nende **päris nuppude klõpsualade** koordinaate ühest paigast. Vanad mängukäsud, minikaardi canvas, avastuste järjekord ja salvestus jäävad alles.
- `hud-v298-layout.css` säilitab V297 läbipaistvad raamid, peidab originaalpiltidele peale joonistatud topeltnupupildid ning jätab alumiseks taustaks vaid õhukese pildist puiduliistu. Sinine suur alumine riba eemaldati.
- Telefonis rõhtvaates on kuus illustreeritud kaarti ühes madalas reas; minikaart ja üksusepaneel paiknevad nende kõrval, mitte peal. Avastuste paneel on väiksem.
- Väga kitsas rõhtvaates (alla 710 px) ning püstvaates avanevad külgpaneelid originaalsete pildinuppudega. Püstvaates on kuus kaarti 3×2 paigutuses.
- Minikaardi ja üksuse piltidega integreeritud juhtnuppude läbipaistvad puudutusalad paiknevad tegeliku pildi suhtes. Tüüpilisel 844×390 telefonivaates on need üle 28 px.
- `hud-v291.css` ja `hud-v291.js` said uued vahemäluversioonid 298a.
- Uuendatud V291/V292/V297/V296 varasemad regressioonitestid, säilitades nende sisu kontrolli; lisatud `tests/ui-v298.mjs`, mis käivitab tegeliku V298 JS-i mockitud DOM-i peal mitmel ekraanisuurusel.

## Proovimine
`https://orogdor.github.io/Kuningriigid/?ui=art&v=298`

## Olulised piirangud
Puudub päris ühendus kasutaja Android-seadmega; graafika viimase versiooni täpset nähtavust ja kogu Three.js-mängu klikikäitumist ei ole päris telefonis kinnitatud. V298 kinnitab paigutuse ja pildipõhiste nuppude geomeetria ning GitHubi mängutestid. Kui telefonis probleem püsib, on vajalik ekraanipilt just V298-st ning avatava menüü olek.
