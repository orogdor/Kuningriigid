# Kuningriigid V72 – mereretked ja vallutusvõit

## Parandatud
- Transpordilaevale saab laadida kindla armee ID järgi kuni **6** sõdalast. Teiste armeede ja garnisonide sõdurid ei mõjuta laeva mahutavust.
- Laevaga kaasas oleva armee ID säilib salvestuses. Maabumisel taastatakse õige armee asukoht; laeva uppumisel hukkuvad ainult pardal olnud sõdurid.
- Maandumiskohad otsitakse reaalselt läbitavatelt kallastelt. Meretee leidmiseks kasutatakse kahte hajusotsingut, et vältida sadade korduvate täiskaardi marsruutide tekitatud hangumist.
- Automaatne avastaja ei katkesta avastamist mandri lõppedes. Kui olemas on transpordilaev, saab avastaja minna pardale ja jätkata uue mandri uurimist.
- Armee-/laevamenüüs kuvatakse kõrval seisvad armeed ja nende koosseisu suurus; üle kuue üksusega väeosa ei saa pardale.
- Teadaoleva vastase linna juurde saab anda laevaga sõjaretke käsu. Viimased ellujäänud vastase asunikud on samuti rünnatavad.
- Vastaste AI prioriseerib laevaehituse tehnoloogia järel sadamat; maaväe juhtimine eelistab väljaõpetatud sõjaväge üksikule avastajale.
- Võit arvutatakse alles siis, kui kõik ülejäänud riigid on kaotanud **nii linnad kui ka asunikud**. Viimase riigi kokkuvarisemisel kõrvaldatakse tema ülejäänud üksused ning laevad. Linnade vallutamine ja asunike kinnipüüdmine kasutavad sama võidukontrolli.
- Tootmise AI ei ehita piiramatus koguses üht ja sama kivimurdu või muud põhitoorainetootjat.

## Testimine
- `TEST_V72.mjs`: tõeline detsembrarmee laadimine, salvestuse taastamine, mereteekond vastase mandrile, maabumine, lahingu arvutus, vastase asunike tabamine ja võiduseisund.
- `TEST_V72_AI_NAVY.mjs`: 600 mänguminuti pikkune AI simulatsioon, mis kinnitas vähemalt ühe vastase sadama ja laevade valmimise.
- Varem olemas olnud V68/V69 regressioonitestid ja V71 kuue ekraanisuuruse brauseritestid.

## Oluline piirang
Testid tõestavad laevade ja lõpliku võidu mehhanismide toimimist kindlates stsenaariumides, mitte veel seda, et täismahus 1500-minutiline päris kampaania alati lõppeks vallutusvõiduga.
