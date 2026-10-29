# Kuningriigid V223.1 – FPV kõrgused, vee servad, kiviraidur ja pinnas

**Lähteversioon:** V223 (`ec23b94d0823d7e72f380f2acf1a1285d0aad429`)

## Parandused
1. **Üks renderdatud maapind:** `renderedGroundV2231()` arvutab sama kolmnurgapinna (barytsentriline interpolatsioon), mida Three.js näitab. See asendab erineva täpsusega `localVisualSurface`-i FPV tegelase, teede, hoonete ja töötegijate visuaalses kõrgusarvestuses. Lahinguväljal kasutatakse vana sobivat proovivõttu.
2. **Tee all oleva maapinna kontakt:** teeribad tükeldatakse maksimaalselt 0,58 maailmameetri pikkusteks detailsegmentideks ning iga serva kõrgus võetakse renderdatud pinnalt. Jäetakse ainult umbes 1,5 cm nihe z-fighting'u vältimiseks. A* teed jäävad endiselt takistustest mööda.
3. **Meri ja rannad:** detailmaastiku vana täiendav veetasand eemaldati (välja arvatud lahingustsenaariumid); rannikul kasutatakse ühte veekihti. Veematerjal haihtub, kui veealune pinnas tõuseb veepinnast kõrgemale. Rannavõrgu proovivõttu tihendati 166 segmendini.
4. **Jõekaldad:** jõge ümbritsev võrgu samm detailvaates 2,5 → 1,75 maailmameetrit; mudased ja kruusased kaldad saavad tegeliku renderdatud pinnakõrguse. Olemasolevat jõgede topoloogiat ja voolusuundi ei muudetud.
5. **Kiviraidur:** 3D-alust kohandatakse hoone jalajälje madalaima maastikupunkti järgi, et alumised kivid ei hõljuks. GLB lahtine kiviseina piirkond täideti kolme deformeeritud kivimahuga, kasutades originaalse GLB kivitekstuuri. Geomeetria jagatakse mälus.
6. **Muud ehitised:** paigutus ankurdub nähtava maastiku külge, mitte aegunud salvestatud `baseY` kõrgusse. Füüsiline läbipääs ja ehitusloogika jäid muutmata.
7. **Maapind:** väiksem suure kontrastiga ruuduline müramuster, tumedamad muru- ja metsatoonid, soojemad mullalaigud, vähem ere liiv ning ühtlasem kaugvaade.

## Kontrollitud
- Muudetud JavaScripti failid läbisid `node --check` kontrolli.
- Chrome/Three.js brauseritest: mängu käivitus, detailkaart, uus jõekallas, töökohtade paigutus, ka FPS kaameravaade; JavaScripti vigu ei esinenud.
- Eraldi teekatse lõi kaks naaberruutu ühendava tee; kõik **31 mõõdetud teepunkti** jäid nähtava maapinna suhtes **1,4–1,5 cm** vahemikku.
- Kiviraiduri mudel on 4 võrgusilma (originaal + 3 täidet), mitte auklik üksik võrgusilm. Madala kaameravaate pildi järgi sobitub paranduse kivitekstuur algse kiviseinaga.
- Mudelite GLB-failid, üksused, salvestusvorming ja teede liiklusloogika jäid puutumata.

## Piirangud
- See on visuaalse maastiku, vee ja mudelite parandamise etapp. See ei lisa füüsikalist veevoolusimulatsiooni ega muuda maailma kõrguskaardi genereerimise reegleid.
- Mobiiliseadmete 3D-tulemus võib erineda Chrome'i testkeskkonnast (GPU/ekraani resolutsioon).

## Testimiseks
`?v=2231&demo=stone` ja mängus nupp **Walk**. Kontrolli eriti teid, randa, kiviraidurit ja jõe ületuskohti.
