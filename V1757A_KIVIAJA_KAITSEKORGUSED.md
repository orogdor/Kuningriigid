# V175.7a: palisaadi, puuvärava ja puittorni ühine kõrgus

Kiviaja **madal müür ja madal värav jäävad muutmata**. Selle etapi eesmärk
on suure palisaadi, suure värava ja V175.6 kinnise puittorni kõrguste
ühtlustamine, ilma et tavapärane mäng või V4 salvestus muutuks.

- Ühine moodul `wood-fort-levels-v1757.js`:
  - `walkHeight = 7.25` m – tornivalvuri ja kõrge müüri sõduri loogiline kõrgus;
  - `deckSurface = 6.875` m – torni põranda ja uute käiguteede füüsiline pealispind.
- Olemasolev palisaad ja puuvärav kasutavad vaikimisi taset I.
- Uute kõrgete geomeetriate prototüüpides on sama kõrgusega puidust käigutee;
  puuvärava 3,6 m läbipääs jääb maapinnal lahti.
- Salvestusse ühilduva `woodFortTierV1757:2` omadusega palisaad / puuvärav
  kuvatakse taseme II mudeliga ning kasutab lahingus sama kõrgust kui torn.
  See on **arendaja prototüübivalik**, mitte uus nähtav ehitusnupp.
- Suure müüri taga olev laudtee arvestatakse ka tee- ja jalakäijate
  liikumistõkke sisse; kasutusest tekkivaid teid ei muudeta.
- `TEST_V1757A_FORT_HEIGHTS.mjs` kontrollib mõõte, läbipääsu, lahingu
  kõrgust, torn–müür–värav graafi ning madala variandi säilimist.
- V175.7b-s lisanduvad taseme II valimine ja maksumus. V175.7c–e-s
  täpsustatakse värava trepid, päris käimine ja patrullide läbimine.

Oluline: 7.25 m on sõdurite liikumiskõrgus, mitte laudtee pealispinna
kõrgus. V175.6 tornil on need sihilikult 0.375 m võrra erinevad.
