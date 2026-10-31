# V256 – salvestused, loomad ja tuli

Alus V255 7e27dc1.

- Salvestused gzip + base64: vana JSON säilib loetavana; salvestuskohad, varukoopia ja näidismängud toetavad mõlemat vormi. Eksporditav JSON jääb pakkimata. Põhisalvestus tehakse enne parima võimalusega varukoopiat. Pako MIT, litsents vendor/PAKO-LICENSE.txt.
- Uluk saab liikuda ka inimesega täpselt kattudes; lamamise ja söömise pöördeteljed parandatud. Karja järgnemine on kaadriaja järgi.
- Tule aeg uueneb ka siis kui linnatõrvikute grupp puudub.
- Kontrollitud: TEST_V73, tests/save-compression-v256, tests/wildlife-v255, scripts/test-daynight-v235, scripts/test-scout-torch-v236, scripts/test-new-world-save-v219; Chrome eraldatud testis vana salvestus, käsitsisalvestus ja automaatsalvestuse taastamine.
