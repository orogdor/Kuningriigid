# V306 – valitud UI võrdlus

Scope: HUD, selle andmeside ja menüüde avamise nupud. Mängu 3D-maailma välimust see muudatus ei asenda.

## Tõendid

- Visuaalne allikas: kasutaja teine pilt `/workspace/scratch/82c72cf7fc2c/upload/02-6777.png`, 1672 × 941 px.
- Brauseri renderdus: `previews/ui-v306-desktop.png`, 1200 × 675 px/CSS px, ja `previews/ui-v306-mobile.png`, 390 × 844 px/CSS px.
- Täpne sisemine viewport loodi tavalise iframe'iga failis `tests/ui-v306-browser.html`; brauseri screenshot lõigati iframe'i nähtavate DOM-piiride järgi. Seadme pikslitihedus on 1. Allikas normaliseeriti 1200 × 675 peale, sama 16:9 küljesuhe (ümardus alla 1 px).
- Täisvaate võrdlus: `previews/ui-v306-comparison.jpg`. Allikas ja teostus on ühes võrdluspildis.
- Fookusvõrdlused: `previews/ui-v306-footer-comparison.jpg`, `previews/ui-v306-research-comparison.jpg`.
- Teostus kasutab päris `ui-v304.js`, `ui-v306.js` ja nende CSS-i. Kontrollvaate andmed on selgelt märgitud näidisandmetena; seal ei käivitata 3D-mootorit. Minikaardi katseandmestik ja hall keskosa ei ole mängumaailma uus graafika.

## Võrdluse ajalugu

1. Kasutaja esimene pilt/V304: P1 — raamid olid väikesed ristkülikud; kuus kaarti olid madalad ja väga väikesed. Parandus: pildiraamidele vastavad proportsionaalsed piirkonnad, 248 × 356 avastuspaneel, 344 × 376 atlas, 384 × 386 valikupaneel ja kuus püstkaarti 1672 × 941 lähtekoordinaatides. Lõplik tõend on ülaltoodud täis- ja jalusevõrdlus.
2. Esimene brauserivaade: P1 — avastuse pilt/tekst sattus raami taha või kattis pärgamendi. Parandus: eraldatud pildi, raami ja teksti kihid ning pildisisu piiramine ringi sisemusse. Lõplik avastuse lähivõrdlus näitab loetavat nime ja tervet kuldset äärist.
3. Telefoni esimene vaade: P2 — kuus kõrvuti surutud kaarti andsid liiga väikese teksti. Parandus: 100 × 150 px kaardid horisontaalselt keritavas reas; viimase päevikukaardini ja esimese linnakaardini liikumine on brauseris kontrollitud.
4. P2 — valiku harvemad käsud kasutasid vanu lamedaid SVG-ikoone ning paus ei näidanud selgelt jätkamist. Parandus: kõik 17 käsuvarianti kasutavad olemasolevaid maalitud pilte; eraldi genereeritud pausi-, jätkamis- ja seadete nupud. Kontrollitud päris HUD-i pausi- ja käsupildid.
5. Kontrollvaate enda mobiilne sulgemisnupp oli algul iframe'ist väljas (P0 katserakisele, mitte mängule). Parandus katsele: kogu uurimispaneel mahub iframe'i ning sulgemisnupp asub nähtavas nurgas. Avamine ja sulgemine läbisid korduskontrolli.

## Viis nõutud visuaalset pinda

- **Kirjatüüp ja tekst:** elavad arvud/nimed kasutavad Georgia/Times serif-kirja; pildikaartide must tekst on heledal pärgamendil. Pealkirja, arvude ja kaartide hierarhia on kontrollitud. Mobiilikaartide teksti ei vähendata enam kuue kaardi mahutamiseks ühe ekraani laiusesse.
- **Vahed ja rütm:** allika vasak/parem kaar, keskmine kuue kaardi rida, suur ümmargune avastus ning ülariba on samas jaotuses. Keskne mänguväli on vaba. Pildid ja klõpsualad skaleeruvad ühe ühikuga; telefonis avanevad raamid nõudmisel.
- **Värvid:** tumesinine email/nahk, vana kuld, hele pärgament ja tume puit vastavad allika materjalidele. Tavalised ristkülikud on HUD-i kandvatelt piirkondadelt eemaldatud.
- **Pildid:** kümme uut üksikpilti, kuus püstist 448 px laiust kaarti, 512 px lossiportree ning kolm ümmargust juhtnuppu. Kasutatud on olemasolevaid genereeritud raame ja ressursipilte. Teema käsud ei kasuta uusi käsitsi joonistatud SVG/CSS-asenduspilte. Puuduvaid pilte ei olnud lõplikus brauserivaates.
- **Sisu:** kuue kaardi nähtavad eestikeelsed pealkirjad järgivad allikat. Arvud, avastus, järjekord, valiku nimi ja käsud tulevad mängu olemasolevast liidesest. Allika väljamõeldud aastaarvu, kasvunumbreid ja valitud lossi nime ei esitata mängu tegelike andmetena. Tühja valiku korral näidatakse kuningriigi illustratsiooni ja sellele sobivaid käske; päris valik säilitab oma portree.

## Brauseris kontrollitud tegevused

- Kõik kuus põhikaarti: linnaloend, ehitus, armee, kaubandus, diplomaatia, päevik.
- Uurimise avamine ja sulgemine; telefoni avastuste/kaardi sahtlid.
- Minikaardi suurendusnupu ühendus olemasoleva `zin` käsuga.
- Ressursimenüüs on kivi kõrval alles ka puit.
- Paus lülitab ikooni jätkamise pildiks ja tagasi.
- Oma sõduri liikumiskäsk jõuab `commandmove` nupuni; vastase liikumise ja peatamise nupud on keelatud.
- Telefonis pääseb ka horisontaalse rea viimasele kaardile ja saab tagasi esimesele.
- Lõplikus kontrollvaates ei olnud rakenduse konsoolivigu ega puuduvaid pildifaile. Brauserilaiendi enda metaandmete vead jäid sellest hinnangust välja.

## Lubatud erinevused ja piirangud

- Eraldi genereeritud maalide üksikdetailid ja kuldornamendid võivad allikast veidi erineda (P3). Kompositsioon, proportsioonid, materjalid ja pealkirjad järgivad valitud UI-d.
- Allika täpne geograafia ning lahingu/linnaandmed ei kuulu HUD-i võrdlusse. Siinses brauseris on GPU kontekst keelatud, seega täismängu 3D-käivitust ei kinnitatud; see on allesolev seadmel tehtav kontroll.
- 140 avastuspildi seosed ja mängu reeglid läbisid olemasolevad testid. Kõik CI 23 kiirkontrolli gruppi ning uus `node tests/ui-v306.mjs` läbisid.

## Teostuse kontrollnimekiri

- [x] Suured kaarjad paneelid ja püstised pildikaardid.
- [x] Elavad andmed ja olemasolevad käsud, oma/vastase valiku piirangud.
- [x] Arvuti- ja telefonivaate pildiline kontroll.
- [x] Ühine täisvaate ja lähivõtete võrdlus, P0/P1/P2 parandused uuesti kontrollitud.
- [x] Päris GPU-ga mängupildi kontrolli piirang ausalt eristatud HUD-i kontrollist.

final result: passed
