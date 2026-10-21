# V99 — üksuste vastupidavus ja vibukahju

- Kõigi 38 üksusetüübi elupunktid ×2, sealhulgas avastaja, linnakaitsjad, kõigi ajastute jalavägi, ratsavägi, piiramisüksused, sõidukid ning transpordi- ja sõjalaevad.
- Vibuküttide, pronksi- ja rauaaja vibuküttide, ristvibumeeste ja sõjavankrite kahju ×0,75. Sõjavankri lahingus kasutatav laskekahju erireegel 18 → 13,5. Ülejäänud üksuste kahju ei muutu.
- Mobiliseeritud, standard- ja eliitastme ning armeekogemuse kordajad säilivad.
- Uue mängu avastaja alustab 110 elupunktiga. Pronksodamehe baas 150 → 300, pronksiaja vibuküti baas 115 → 230 ning kahju 16 → 12; sõjalaev 280 → 560.
- Vanad salvestused migreeritakse ühe korra: üksuste, laevade, salvestatud üksikute meeste ja poolelioleva lahingu praegused ning maksimaalsed elupunktid kahekordistuvad. Haavatuse osakaal ja langenud mehed säilivad. Hooneid ja kindlusi ei muudeta.
- Lahingu 500 mehe piir ja V98 liikumine säilivad.

Kontroll: TEST_V99 (kõik 38 tüüpi, kahju, laevade tegelikud definitsioonid, varustus ja XP, haavatud salvestus, surnud mehed, käimasolev lahing ning korduva laadimise idempotentsus); TEST_V88_MILITARY (värbamine, maksumus, astmed, XP, armeed, ravimine ja laevad).

TEST_V96: 500 mehe tegelik maastikulahing lõppes 204,85 lahingusekundiga; lähivõitlusse jõudis 482 meest, esimene lähivõitlus 26,3 s ja esimene moraalimurdumine 47,25 s. 354 langenut + 82 väljunud + 64 ellujäänut kaardil = 500. Löögid jäid relvaulatusse.

TEST_V96_UI: brauseris 18 meest lähikontaktis, maksimaalne salvestatud löögikaugus 1,722 m (oda ulatus 1,73 m), V99 põhimäng avaneb, JavaScripti vead puuduvad.
