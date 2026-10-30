# V242 – pidevalt laaditavad detailalad

Versioon V241 vajaduspõhise mudelilaadimise peal.

## Mängija jaoks

- Ümbrus koosneb püsivatest 3 × 3 detailaladest. Kaamera liikumissuunas
  valmistatakse järgmine serv ette enne selleni jõudmist.
- Piiri ületamisel säilivad ühiste alade maastik ja ressursiobjektid.
  Kaamera maailmaruumi asukoht ja suum jäävad samaks.
- Ka jõed, teed, kaugmaastik ja rannik valmistatakse ette. Kogu ümbrust ei
  looda piiri ületamisel uuesti.
- Maastiku servad kasutavad samu kõrgusi, normaale ja metsatekstuuri segu.
  Ka mere lainete muster on seotud maailmakoordinaatidega.
- Alles hoitakse kuni 25 lähedast visuaalset ala. Kaugemale jäävate alade
  eraldi puhvrite ja kasutuseta ettevalmistatud liikumisvõrkude mälu vabastatakse.
- Mängija ei saa kaamera nihutamisega avada veel avastamata detailala.

## Teostus ja piirid

Maastiku, vee, jõgede ja liikumisvõrgu ettevalmistamine toimub väikeste
osadena kaadrite vahel. Taustatöö siht on 3 ms kaadri kohta; brauseri
ja graafikadraiveri tööd ei saa käsitleda range reaalajalise piirina.

Mängu loogika ja salvestuse koordinaadid jäävad paigale. Nihutatakse ainult
nähtavate alade asukohti kohaliku stseeni suhtes. Liikumisvõrgu tavapärane
kasutaja saab alati valmis võrgu, ka siis, kui ettevalmistamine oli pooleli.

Esimese detailala avamine ja hüpe kaugele, veel ettevalmistamata alale võib
endiselt nõuda laadimisaega. Lahingud kasutavad senist detailvaadet.
See ei lisa kõigi nähtavate alade paralleelset täielikku sõjasimulatsiooni.

## Kontrollid

```text
node scripts/test-stream-v242.mjs
node scripts/qa-stream-v242.cjs
node scripts/test.mjs traffic
```

Lisaks kontrolliti V241 laadimispoliitikat, V233/V237 põllu- ja hoonemudeleid,
V239 scout'i nähtavust ning V240 liikumiskoordinaate. Brauserikontroll kasutab
arvuti- ja telefonivaadet ning salvestab tõendid kausta `artifacts-v242`.

Ülemineku kontroll võrdleb ühiste maastike ja ressursiobjektide identiteeti,
kaamera koordinaate ning maastiku kõrgusi ja normaale mõlemal pool piiri.
Pikem edasi-tagasi liikumine kontrollib ka vahemälu suuruse piiri ja eemaldamist.

31.10.2026 arvutibrauseri testjooksus kulus üheksa ettevalmistatud piiri
ületamisele ligikaudu 6–13 ms. Kaamera maailmakoordinaatide erinevus oli 0;
idapoole liikudes säilisid kõigi kuue ühise ala maastiku- ja ressursiobjektid.
Jagatud maastikuserva kõrguse, normaali ja metsatekstuuri segu erinevus oli 0.
Pikema liikumise järel oli alles 13 ala ning 18 kaugemat ala oli eemaldatud.
Need on kohaliku testiarvuti tulemused, mitte kõigi seadmete jõudlusgarantii.

Vana `TEST_V67.mjs` eeldab, et kogu maailma ja detailala jõe esimene
võrgupunkt langeb kokku. See kontroll ebaõnnestub ka muutmata V240 jõe
teostusega. Eraldi võrdlus kinnitas, et V242 etapiviisilise jõelaadimise
geomeetria, indeksid ja atribuudid on V240 omadega täpselt samad.

Kohalik eelvaade jätkub samal aadressil: http://127.0.0.1:8789/.
Avaliku mängu aadress: https://orogdor.github.io/Kuningriigid/.
