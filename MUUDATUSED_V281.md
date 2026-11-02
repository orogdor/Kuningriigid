# V281 — teise kiviaja testmängu parandused

Testisin kolmel kaardil (seemned 20261106, 7741 ja 555), kumbki mäng 90 mänguminutit.

**1. Riigi majandusplaan puidu jaoks**
- Kui linna oma ruudul on vähe metsa (alla 40 puu) või metsalaagril pole enam puid, ehitatakse järgmine
  metsalaager kõige metsarikkamale naaberruudule. Enne jäi üks riik 70 minutiks puiduta, kuigi naaberruutudel oli
  50–114 puud.
- Kaupmeeste külast saab nüüd osta ka **20 puitu (12 kulda)** ja **15 kivi (12 kulda)**.
- Kassa on osa kõigi riikide majandusplaanist (ka sõjaka). Esimesena ostetakse puuduv: toit, puit ja kivi, kui
  linn neid ise ei saa, ning järgmise ajastu materjalid. Seejärel müüakse lao piiril olev puit ja kivi. Alles siis
  kiirendatakse uuringut.
- Viga parandatud: V278 eemaldas puud ja kivileiukohad kõikjal, kus maapind oli madalam kui 5,6. Madalal
  rannikumetsal jäi sellest allapoole terve ruut, nii et kadusid kõik puud (umbes 20% metsaruutudest). Nüüd
  mõõdetakse rannajoont ruudu enda kõrgusest. Rannaliival ja vees puid endiselt ei ole.

**2. Sõjakas riik**
- Kauplemine käib nüüd kõigil riikidel ühtemoodi, ka sõjakal.
- Sõja alustamiseks piisab sõjakal riigil 5 sõdurist (enne 8). Esimese sõja võib ta alustada 60. minutist
  (enne 180. minutist), järgmise 90 minuti pärast. Kaugel asuvaid riike ta kiviajal ei ründa.

**3. Kassa piir** on 80 kulda (enne 150).

**5. Laienemine**
- Arvutiriigi asunik valib koha, kuhu ta päriselt jõuab. Kiviajal ja pronksiajal on teekond kuni 16 ruutu ja
  valikul arvestatakse tegelikku teekonna pikkust. Enne valiti 64 ruudu kaugune koht, kuhu asunik oleks jõudnud
  alles umbes 2 tunniga.
- Ehitaja riigil on alates 6 elanikust kaks ehitajat.
- Tulemus: ehitaja teine linn tuli 46. minutil (enne ei tulnud üldse) ja 90. minutil oli tal 35 elanikku (enne 16).

**6. Põlluharimine**
- Põld rajatakse kohe pärast vundamenti, nii et uus talu ei seisa tühjalt.
- Igal talul on oma põld (enne ainult üks põld ühe ruudu kohta).
- Talu saab tööjõudu sama tähtsalt kui jahimees ja kalur.
- Kiviaja käsikülvi saak on 1,25 (enne 0,8).
- Vili võib täita 75% toiduaitast (enne 55%).
- Tulemus: talu toob 4,6 vilja töölise kohta minutis (enne 0,5). Jahimees toob 3,3, kalur 6,6.

**8. Sõjakas riik ei ole ainult sõjas**
- Värbab alles siis, kui kodus on vähemalt 9 elanikku (enne 7).
- Kiviajal on tal kõige rohkem 4 sõdurit.
- Uurimisjärjekorras on ka põlluharimine.

**9. Röövretked**
- Ühe linna peale tuleb korraga ainult üks röövsalk.
- Mõne sõdalasega (kuid mitte piisavalt) linn kaotab poole vähem.
- Täiesti kaitseta linnast viiakse ka üks elanik vangi, kui elanikke on vähemalt 5.
- Tagasilöödud küla ootab järgmise retkega kauem.

**10. Vesi**: ilma kaevuta näitab ülemine riba vee asemel „jõest“ või „allikast“. Vesi tuuakse ja vajadus on
kaetud.

**12. Erinevad algused**: kalapüük on kiire avastus ainult kauplejal. Teised võtavad pärast tuld kõigepealt oma
iseloomu avastuse: sõjakas jahi, ehitaja kivitööriistad.

**Testid**: `tests/stone-age-economy-v281.mjs` (kaart 7741, 45 min) kontrollib, et:
- madalal ruudul jääb mets alles;
- ükski riik pole üle 8 minuti puiduta;
- talu toob vähemalt 1,5 vilja töölise kohta minutis;
- ühe linna peale tuleb korraga üks röövsalk;
- asunik rajab linna 40 minuti jooksul.

`tests/natural-shore-v278.mjs` kontrollib uut rannajoont.
