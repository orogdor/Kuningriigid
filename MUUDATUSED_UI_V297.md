# V297 — korrastatud pildipõhine maailmakaardi HUD

## Mure põhjus
V296 telefonipildil oli merel kandiline sinine taust avastuste paneeli taga, suur läbipaistmatu sinine riba alumise menüü taga, lahtiselt hõljuvad minikaardi ja sõduri käsunupud ning valitud objekti teksti kattumine. V291 artefaktid olid tehtud kuvapildist väljalõikamisega ning osa piltide sisse jäid algse näidiskaardi taustad ja isegi näidistekst.

## Parandus (säilitades kinnitatud kunstistiili)
- Lisatud 5 eraldi iseseisvat SVG-pildifaili `ui-art-v297/`: `research_panel`, `minimap_frame`, `selection_frame`, `portrait_castle`, `footer_trim`. Iga SVG sisaldab päris V291 WebP pilti base64 kujul, koos vektormaskiga, mis lõikab **taustaristküliku** ära. Väliseid pildipäringuid SVG sees ei ole.
- Avastuse kuldse märgi, minikaardi ja üksusepaneeli servad on nüüd läbipaistvad. Portreepildi sisse trükitud 'Loss' alumine riba on peidetud, et ainus nähtav nimi tuleks päris mängu valikust.
- Mobiilil ei venitata 170 px paksust sinist `footer_navy.webp` pilti üle maailma: alumise tausta jaoks jääb alles ainult algse pildi 31 px laiuse mustriga õhuke serv.
- Minikaardi +/kaamera/silm ning üksuse ründa/liigu/peata/linna nupud olid juba raami sisse maalitud. Seetõttu on nende peal nüüd **pildita nähtamatud klikialad**, mitte veel kord samad maalitud nupud.
- `hud-v297-refinement.js` arvutab klikialade asukohad otse pildiraami tegelikust `getBoundingClientRect()` mõõdust. Muudab kohti nii pööramisel, telefoni suurust muutes kui ka paneele avades.
- Viis avastusjärjekorra nuppu ja suur avastusnupp liiguvad samuti koos avastusmärgi pildiga. Kõik käsud kasutavad endiselt V291–V296 mängukoodi; mängu loogikat ja salvestust ei muudetud.
- Madalas Androidi rõhtvaates on kaartide alus kitsam ning avastuse/minikaardi/üksuse külgpaneelid väiksemad. Lauaarvuti pildipõhine alumine raam jääb alles.

## Kontroll
- `tests/ui-v297.mjs` kontrollib kõigi viie pildi RIFF/WEBP päritolu, SVG maskid, läbipaistvad topeltnuppude eemaldused, versioonid, responsive reeglid ja klõpsuala geomeetria.
- Sisseehitatud pildiga SVG laadimine kontrolliti Chromiumi `data:`-pildi renderduses.
- Koostatud eraldi kunstivaradega 1368×547 maastikuvaate eelvaade; suur kandiline sinine avastusetaust selles ei olnud enam nähtav.
- Need ei ole päris mängu 3D-kaardi ekraanisisesed Androidi testid. Pärast Pagesi avaldamist tuleb kasutajal telefonis vaadata.

Proovimiseks `https://orogdor.github.io/Kuningriigid/?ui=art&v=297`.