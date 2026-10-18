# Kuningriigid V65 — ressursikiht, jõed ning maastiku vastavus

## 1. Ressursid nupuga

- Maailmakaardi juhtpaneelil asub uus **🧺 Näita ressursse / Show Resources** nupp.
- Uuel kasutajal on ressursiikoonide kiht **esialgu välja lülitatud**, et maailmakaart ei oleks üle koormatud.
- Kui vajutad nuppu, ilmuvad **ainult juba avastatud** kaardiruutude juurde ressursimärgid. Valitud ruudu all kuvatakse lisaks vastavad ikoonid ja ressursinimed; tundmatu või puuduv ressurss jääb peidetuks.
- Nupu teine vajutus peidab ikoonid ning taastab selge kaardipildi; `aria-pressed` näitab režiimi olekut.
- Säte `kingdoms-resource-layer` säilib brauseris, mängu salvestusandmete struktuuri muutmata.
- Ressursinupu tekstid ja kuvatasand on kättesaadavad nii eesti kui inglise keeles.
- Et vältida varasemaid kaardi piltide riknemise vigu, korduskasutatakse sama ikoonitekstuuride kogu.

## 2. Loomulikumad jõed

- Maailmakaardi jõed ei ole enam üksnes sirged, ühekaupa joonistatud ruuduühendused: need on **seemne järgi määratud looklevad sängid**.
- Jõgedel on veerannad ja ühtlane jõesäng, mis liitub täpselt naaberruudu jõesängiga ning suubub järgneva valgla ruutu.
- Uute mängude `hydrologyVersion:2` vähendab lühikesi juhuslikke harujõgesid, eristab ojasid ja suuri jõgesid, muudab laienemist allavoolu selgemaks ning piirab sügavate jõgede juhuslikke koolmekohti. Jõgede võrk on endiselt ühendatud mere suunas, määratud reljeefist ja drenaažist.
- Vanade salvestuste `hydrologyVersion:1` **jääb alles**. Neile rakenduvad samad paremad jõe 3D-kujud, kuid jõgede asukohad ei muutu.

## 3. Maailmakaart ja detailkaart vastavad üksteisele

- Uus `landscape-shared.js` määratleb ühise teisenduse 50×50 maailmaruudust 150×130 detailkaardi alaks.
- `pointsOfRiver`, `riverSegmentsNear` ja `createDetailLandscape` projitseerivad **täpselt samad jõekurvid** detailkaartidele, kasutades ruudupiiril lõikamist, et ühenduskohad ei läheks katki.
- **Kaljud ja mägede kivirahnud** asuvad mõlemas vaates täpselt samadel seemne järgi määratud x/z koordinaatidel. Detailkaardile lisanduvad suuremad, mitmetahulised kaljumudelid.
- **Maailmateede keskjoon** arvutatakse nii maailmas kui detailkaardil `roadCurve` kaudu. See asendab vana lahenduse, milles detailkaart otsis täiesti erineva tee mööda navigeeritavaid ruute. Kohalikud elanike kulumisrajad jäävad lisaks alles.
- Valmis **sillad ja koolmekohad** joonistatakse ühiste jõgede kohal mõlemas vaates.
- Detailvaates on nähtavad ka sama loogikaga genereeritud kaheksa kõrvalruudu jõed ja kaljud.
- Rändamine, linna ehitamise nõuded ja üksuste andmestruktuur jäävad seniste reeglite järgi; jõgede visuaalne kaardiparandus **ei ole veel füüsikaliselt simuleeritud veevool ega eraldi detailkaardi ujumis-/ülepääsusüsteem**.

## Testid

- `TEST_V65.mjs` läbis neli maailma: jõed on tsükliteta, nende allavoolu vooluhulk ei vähene, jõgede otsad sobivad naaberruutudega, kõik detailkaardi kaljud projitseeritakse maailmakaardi asukohtadest ning teede kurvid on mõlemas suunas identsed. Samuti kontrolliti vanu jõevõrgu salvestusreegleid.
- `TEST_V56.mjs` läbis viis kaardiseemet; avastaja ei takerdunud kahe ruudu vahele ja teed tekkisid liikumise tagajärjel.
- `TEST_V64.mjs` kontrollis kalade paiknemist vees ja ajastupõhist kalapüüki.
- `TEST_V63.mjs`, `TEST_V61.mjs` ja `TEST_V60.mjs` kontrollisid tõlgete, kaitserajatiste ja majanduse ühilduvust.
- Avaliku GitHub Pagesi brauseritest: algse ressursikihi olek `false`, sisse lülitatuna 64 ressursiikooni, välja lülitatuna 0; jõeruudul 3 jõe kujutavat maastikuobjekti ja mägisel ruudul 9 kaljuobjekti naaberkaartidel; `hydrologyVersion:2`; ilma JavaScripti vigadeta.

Mänguseisu formaat on endiselt `version:4`. Ehitiste, üksuste ja linnade asukohad säilivad.
