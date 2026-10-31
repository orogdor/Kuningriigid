# Kuningriigid V252 – kiviaeg ellu: hoonete animatsioonid, tööliigutused, linnaelu, lähemad majad

Kõik muudatused puudutavad kiviaega. Pronksiaeg ja hilisemad ajastud jäid kasutaja soovil muutmata, välja arvatud hoonete vahe reegel, mis kehtib kõigile.

## Hoonete animatsioonid (`building-life-v252.js`)
Igale kiviaja hoonele on lisatud tema tööga sobivad liikuvad detailid. Need paigutatakse mudeli enda mõõtude järgi ukse poolele ja pöörlevad koos hoonega. Liikumine kas toimub alati või ainult siis, kui hoone töötab.

| Hoone | Animatsioon |
|---|---|
| Maja | kolde suits katuse kohal, hommikul ja õhtul tihedam |
| Peamaja | küla lõke ukse ees (öösel suurem) ja suits katuselt |
| Savikoda | puust kolmjalg, mille all savinõu käib üles-alla |
| Potikoda | käega keeratav potikeder pöörleb, ahjus põleb tuli ja tõuseb suits |
| Kiviraidur | kivitolm ja lendavad killud |
| Teadmiste koda | söeanum ja peen suits, nahast joonistusraam |
| Metsaraie | kirves tõuseb ja langeb pakule, laastud lendavad |
| Kivimurd | puukang kangutab kivi, tolm |
| Kaev | ämber lastakse köiega alla ja tõmmatakse üles |
| Jahimaja | nahad kuivatusraamil liiguvad tuules, liha suitsutatakse söel |
| Kalur | kalad kuivatusrestil kõiguvad, võrk liigub tuules |
| Põld / metsavaht | viljavihud painduvad tuules, hernehirmutis pöörab |
| Karjamaa | joogiküna veepind |
| Kasarm | treeningpost pöörleb |
| Vibulaskeväli | märklaud kõigub raamil |
| Vahitorn | lipp lehvib, öösel põleb tipus tuli |

Tuli kasutab sama päris tule varjutajat nagu V251 tõrvikud (`createFireV252`).

## Töötajate tööliigutused (`stone-motion-v222.js`, `builders.js`)
Kiviaja luustikuga inimestele on lisatud uued liigutused:
- **savikaevamine (`dig`):** kahe käega kaevamiskepp, torge ja kangutus;
- **potivalmistamine (`pottery`):** kükis, käed vormivad savinõud ringliigutusega;
- **kiviraidumine (`chisel`):** põlvili, vasak käsi hoiab peitlit, parem lööb vasarakiviga;
- **õpetamine (`study`):** joonistab kepiga maha, siis selgitab käega;
- **karjatamine (`herd`):** toetub kepile, vaatab ringi, tõstab aeg-ajalt kepi;
- **jutuajamine (`talk`):** žestid, noogutused, kehakaalu nihutamine.

Hoone ja liigutuse vasted (ainult kiviajal): savikoda → kaevamine, potikoda → potid, kiviraidur → raidumine, teadmiste koda → õpetamine, karjamaa → karjatamine, peamaja → jutuajamine. Pronksiajal on vasted endised.

## Linnaelu (`people-life-v252.js`)
Kiht muudab ainult seda, kuidas inimesi joonistatakse. Majandus liigutab töötajaid endiselt oma ruudustikul samade aegadega.
- **Keegi ei seisa niisama.** Kui töötajal pole 3,5 sekundi jooksul tööd, läheb ta mõne teise tegevuseta naabri juurde ja nad ajavad 2–3 kaupa juttu: ringis, nägudega vastamisi ja žestidega. Kui kedagi pole, kõnnib ta lähima maja ukseni ja läheb sisse. Öösel minnakse eelistatult koju. Kui töö tuleb tagasi, tullakse majast välja ja minnakse tööle. Liikumine toimub ainult sirgjooneliselt läbitava maa peal.
- **Keegi ei käi teisest läbi.** Igal inimesel on isiklik ruum (raadius 0,85). Mööduja astub kõrvale, töötav või vestlev inimene jääb paigale. Kedagi ei lükata seina ega hoone sisse, sest läbitavust kontrollitakse.
- **Öösel on käes tõrvik.** Kõigil õues olevatel inimestel, kes parajasti ei tööta, on paremas käes päris tulega tõrvik.

## Majad lähemale (`navigation.js`, `economy.js`)
- Hoonete liikumisalad võivad kattuda veidi: kaugus peab olema vähemalt 0,95 × kastide summa + 0,3. Varem oli nõue kastide summa + 0,75.
- Keskpunktide minimaalne kaugus on 5, varem 6.
- Sissepääsude kontroll jääb samaks: uks ja töötajate tagasitee peavad alati jääma vabaks.

Tulemus stone-demos: kaks maja mahuvad kõrvuti vahega 8,4 (varem 8,75) ja selg selja vastu vahega 7,2 (varem 7,95).

## Kontrollid
- `node tests/people-v252/run.mjs`: jutuajamine, kojuminek, isiklik ruum, paigal püsiv töötaja, seinad ja tööle naasmine: PASS.
- Brauser (stone-demo), ekraanipildid:
  - hoonete animeeritud detailid;
  - kolm tegevuseta inimest ajavad ringis juttu;
  - öösel on inimestel tõrvikud käes.
- Ehituse eelvaade: majad mahuvad lähemale ja sissepääsu kontroll keelab endiselt läbipääsu sulgemise.
- CI kiirkontrolli kõik sammud ja `traffic`: PASS. `rules`: 20 testi 21-st läbisid, `TEST_V139` kukub nagu varem.

## Teadaolev
- Neutraalsete külade elanikud (`village-life-v76.js`) ei kasuta veel uut linnaelu kihti.
- Hilisemate ajastute käes kantavad valgusallikad (latern jne) ja hoonete animatsioonid tehakse nende ajastute juures.
