# V223 – maapinna, jõgede ja teede visuaalne uuendus (etapp 1)

## Muudatused
- **Jõekaldad:** ühele ja samale jõgede võrgule põhinev mudavöönd ning uus pehme kruusa/setteliiva ja heinamaa üleminek. Kõik suubumised ja naaberruudud kasutavad sama lõigatud võrgusilma, mitte iga ruudu eraldi veetriipu.
- **Madalikud:** vana suure heleda hulknurga kujuline madaliku pealisplaat on eemaldatud. Jõe põhi on juba olemasoleva reljeefiarvutuse järgi päriselt madal ning ületuskivid jäävad alles.
- **Maanteed:** strateegilise tee visuaalne spline võtab nõlval arvesse maapinna kõrgust, kuid suunab teed kõrvalekaldega ainult vähesel määral ja jätab teeristide ning jõeületuste asukoha täpselt samaks.
- **Detailteed:** linna ala A*-teede 90° ja 45° teravnurgad on pehmendatud 5 lokaalse võrgusilma silumisläbimisega. Iga kõrvalekalle on kontrollitud sama nav.open()/nav.clear() abil; läbi maja või müüri ei tohi teed siluda.
- **Pinnakatted:** kruusa/mulla läiked, ebaühtlased rattaroopad, niisked lõigud, pehmed teeservad ning rohuse südamikuga külajalgrajad. Shaderid kasutavad maailmakoordinaate, et ruudupiiril tekstuur ei hüppaks.

## Mida ei muudetud
- Ei muudetud mängu maastiku seemet, maailmaruute, jõgede suundi, jõgede laiuse andmeid, linnu, mõjupiirkonda, teede liiklusloogikat, tee kiiruse boonust, sildade ehitamist, navigeerimisvõrku ega salvestusfaili formaati.
- Teede nõlva järgimine on **visuaalne**, mitte maailma teedevõrgu või A* algoritmi strateegiline ümberplaneerimine.
- AI-d ja Hugging Face'i mudeleid selle etapi käivitamiseks ei vajata. PBR-tekstuure saab lisada eraldi järgmises etapis.

## Kontroll
- Sünktaktiline kontroll `node --check` muudetud JS-failidele.
- Chrome/Puppeteer: päris kiviaja demo maailm ja detailkaart (sh jõeületus); ei ühtegi JS pageerror ega nurjunud võrguressurssi.
- River test: neli lähikonna jõelõiku, uus kruusa/heinamaa mesh; madaliku hulknurk on eemaldatud.
- Road test: ajutine kulumisjäljega maantee kahe naaberruudu vahel; toimus tegelik renderdus; näidis 1 tee 678 kolmnurgaga ning mõlema lõpp-punkti püsivusega.
- Repos on ka `TEST_V223.mjs`, **käsitsi käivitatav**, et säilitada väike CI maht.

## Järgmiseks
PBRFusion või teise sobiva tööriistaga muru, kivi, kruusa ja liiva ühtlased mängutekstuurid. See on etapp 2; V223 sõltub ainult olemasolevast Three.js-koodist.
