# Kuningriigid V166 – Etapp 2: kiviaja külade kindlustamine

AI kiviaja küladele lisati eraldi puidust palisaadide, puitväravate ja vahitornide planeerija.
Selle töö lähtepunkt on V163 kompaktne linnaplaneering ja V165 põhjamaade riigipõhised nimed.

## Funktsioonid

- **Puidust külavärav** (`woodgate`): uus kiviaja ehitis, mida saab ehitada pärast kaitserajatiste tehnoloogiat; värav on 3D-s nähtav, maavägi ja töötajad saavad läbi käia.
- **Kaks sissepääsu** küla põhja- ja lõunateelt, **neli nurgatorni** ja nende vahel reaalselt ehitatavad palisaadilõigud.
- AI valib müüriringi suuruse päriselt ehitatud linnasüdame majade järgi ning jätab farmid väljapoole.
- AI rajab puitväravad esimesena, seejärel vahitornid ning palisaadi pikad 14m lõigud. Visuaalseid tasuta müüre ei tekitata.
- Pikkade lõikude 3D-mõõtmed ja teekasutust tõkestav footprint sobivad kokku; värava läbipääs on kollisioonis lahti.
- Kiviajal seatakse teadusjärjekorras sõjapidamine ja kaitserajatised pronksiajast ettepoole.
- Nii mängija kui AI saab kiviaja kaitserajatised odavamalt ehitada; kaitserajatiste avastusega suureneb kiviajal puidutootmise tõhusus.
- Iga ehitis ostetakse olemasolevatest materjalidest ja valmib ehitaja töö kaudu; olemasolevad salvestused ei saa automaatselt valmis kaitserajatisi.
- Hilisem pronksiaja kivimüüride planeerija jääb eraldi, olemasolevad V139 ja V160 regressioonitestid läbivad kontrolli.

## 70 käigu AI simulatsioon – maailma seeme 142023

Reaalne tehisintellekti mäng, ilma lisavarude või tasuta hooneteta. 70. käigul:

| AI linn | Ajastu | Elanikud | Palisaadilõigud | Puitväravad | Vahitornid | Valmis kaitserajatised |
|---|---|---:|---:|---:|---:|---:|
| Sogn | pronks | 13 | 2 | 1 | 3 | 6 |
| Vendel | pronks | 12 | 0 | 2 | 2 | 3 |
| Sampola | kivi | 14 | 1 | 2 | 3 | 5 |

**Piirang:** müürirõngad ei ole 70. käiguks täies ulatuses suletud. 40-lõigulise planeeringu lõpuni ehitamist piiravad ebapiisavad puiduvarud ja töös olevad hooned. Etapi 2 rajatiste ilmumine mängu on kinnitatud, kuid pildil nähtud *täielikult kindlustatud küla* nõuab veel majanduse ja ehitusprioriteetide tasakaalustamist.

## Kontrollid

`TEST_V166_STONE_FORTS.mjs`: deterministlik võrguga plaan, 2 päriselt avatavat väravat, 4 torni, pikad 14m lõigud, puiduvaru kaitse, tavaline ehituskulu, 70-käiguline päris simulatsioon.

`.github/workflows/stone-forts-v166.yml`: testi käivitamine GitHub Actionsis; lisaks V139, V160 ja V163 varasemad regressioonid.
