# Kuningriigid V60 – kiviaja ja pronksiaja tehnoloogiad

## Lisatud (valikulised arenguharud)
| Ajastu | Tehnoloogia | Eeldus | Avatavad ehitised |
| --- | --- | --- | --- |
| Kiviaeg | Savitöö ja keraamika (`pottery`) | Kivitöö | Savivõtukoht ja pottsepatöökoda |
| Kiviaeg | Loomakasvatus (`animal_husbandry`) | Jahipidamine ja põlluharimine | Karjamaa |
| Kiviaeg | Kivitahumine (`masonry`) | Kivitöö | Kiviraiduri töökoda |
| Pronksiaeg | Ratta valmistamine (`wheel`) | Pronksitöö ja puusepatöö | Vankritöökoda |
| Pronksiaeg | Vase- ja tinatöö (`copper_tin`) | Pronksitöö ja kivitahumine | Vasekaevandus, tinakaevandus, pronksisulatus |
| Pronksiaeg | Teedeehitus (`road_construction`) | Ratta valmistamine ja vase-tinatöö | Teemeistrite töökoda |

**Uusi ehitisi on 9 ja avastusi 6.** Kõigil üheksal hoonel on oma geomeetriline 3D-välimus.

## Mängumehaanika
- Uued ressursid: savi, keraamika, tahutud kivi, vask, tina, pronks ja vankrid. Kõik sisalduvad linna ressurssides, ladudes ja kaubanduses.
- Savivõtukoht toodab savi. Pottsepatöökoda kulutab savi/puitu ja toodab keraamikat; valmis töökoda lisab 60 toidu säilitamise kohta.
- Karjamaa kulutab vilja ning toodab toitu. Kiviraidur kulutab kivi ning toodab tahutud kivi.
- Vase- ja tinakaevandused toodavad oma maardlaga ruutudel vastavaid metalle; pronksisulatus kasutab mõlemat metalli ja puitu.
- Vankritöökoda kasutab laudu, puitu ja keraamikat. Üks vanker kulub kaubasaadetisele; vankriga maanteeveol on 16 lisakoormuse kohta ja 22% lühem ruuduläbimise aeg enne tee olemasolevat kiirusboonust.
- Aktiivne, töötajaga teemeistrite töökoda parandab linnast väljuvate kaubavankrite reaalselt läbitavaid lõike. **Üks läbimine ei tekita nähtavat rada.**
- Savi, vase ja tina maardlad määratakse deterministlikult maailma seemnest. Algusasula asukoht saab proovimiseks kõik kolm uut maardlat.
- Tehisintellekti teadusjärjekorda ja valikuliste hoonete ehitussoovitusi täiendati.

## Varasemate salvestuste ühilduvus
- Mänguseisu `version:4` jäeti samaks.
- Varem puudunud uued ressursiväljad lisatakse salvestuse laadimisel nullväärtusega. Vana kaardiseeme ja vanad teed säilivad.
- Uued tehnoloogiad ei ole seniste ajastute läbimiseks kohustuslikud. Varem alustatud ehitised ja uurimised ei nullitu.
- Muudetud moodulite vahemälu värskendatakse V60 import map'i abil; vanad salvestuskohad jäävad mängijale alles.

## Kontrollid
- `TEST_V60.mjs`: edukas – 6 avastust, 9 modelleeritud hoonet, uurimislukud, algsed maardlad, tühjast laost toimiv tootmisahel, kaubavankri veomahu kasv ja kulutamine, teemeistri mõju tegelikule liiklusele, vana salvestuse laadimine ja uus salvestus.
- `TEST_V55.mjs`: edukas kolme seemnega (maailm ja avastaja); `TEST_V56.mjs`: edukas ühe seemnega (avastaja liikuvus ja teed).
- `TEST_V57.mjs`, `TEST_V58.mjs`, `TEST_V59.mjs`: edukad (vanad 3D-objektid, kaart ja liiklusteed).
- `TEST_V51.mjs`: edukas 240 mängusekundi simulatsioon, 3 tehisintellekti linna, kriitilisi tõrkeid ei leitud.
- Chrome/puppeteer: mängu avalik V60 leht käivitus ilma JavaScripti käivitusvigadeta, 55 avastust ja 51 ehitist olid laetud, importmap jagas sama ehitiste tabelit, vana versiooni salvestusformaadis uute ressursside taasesitus õnnestus.
- Ainuke täheldatud HTTP 404 oli saidi favicon; mängu failide laadimine ei ebaõnnestunud.

**Piirang:** Automaatne brauseritest ei asenda pikaajalist käsitsi mängimist, kõigi hoonete ehitamise visuaalset ülevaatust ega mitmetunnist tehisintellekti simulatsiooni.
