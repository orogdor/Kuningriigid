# Kuningriigid V131 → Godot 1.2 — sõjavägi

Lähteversioon: `26562368f56a32616651a266ed2d8c87f06d43d1` (V131).

## Lisatud

* Kümne üksusetüübi baaskirjed (kiviaeg, pronks, varane rauaaeg), osaliselt V131 `civilization-core.js` ja `military-v88.js` põhjal.
* Kolm V131 varustustaset: mobiliseeritud 0,5× hind ja 0,4× tugevus; standard 1×; eliit 1,3× hind ja 1,4× tugevus.
* Värbamise nõuded, riiklik tehnoloogia, valmis hooned, ressursimakse ning elaniku kulu; üksus tekib alles väljaõppe lõppedes.
* Natiivne maailmakaardi BFS-marsruut (220×165), armee käigukäsk, tee kulumine ning V131 armee XP valem.
* Natiivne Godoti MultiMesh 3D-vaade ellujäänud üksustele.
* *Ainult katse jaoks*: deterministlik, võitlusstatistikal põhinev automaatne lähivõitlus samal maailmaruudul. See ei ole 1:1 V131 individuaalne lahing.
* 26 uut reeglikontrolli, sh väljakirjutamine, armee liikumine, kauba/tee mõju, lahingukatse, salvestuse JSON-ring ja vanade salvestuste ühilduvus.
* CSV jõudlusmõõtmisele kolm veergu: armee sammud, väljaõpetatud sõdurid, lõpetatud lahingukatsed.

## Mida EI ole selles versioonis

Täielik V131 `individual-battle-v91.js`, sõdurite 24-mehelised salgad, reaalsed formatsioonid, katapuldid, vibude laskemoon, piiramised, lahingu 3D-detailkaart, taktikaline AI, ratsaüksuste sõiduanimatsioon ning täpne V131 vägede liikumise ajastus. Armee kiirus `4 sek / ruut`, korrigeerituna üksuse kiiruse ja teega, on mõõtmise katsereegel, mitte verifitseeritud 1:1 võrdlus.

Värbamise testkasutajaliides ei lisa ressursse ega eelda automaatselt avastusi. „Armee demo” loob aga selgesõnaliselt kunstliku katseolukorra: kaks armeed, kasarmu ning piisavad materjalid. See ei muuda algset veebimängu salvestust.

## Kontrollitavus

`python3 tools/validate_package.py` ja `python3 tools/verify_native_wiring.py` on *staatilised*, mitte Godoti kompileerimis- ega käivitustestid.

Godoti puudumise tõttu selles konteineris ei ole päris GDScripti tõlgendamine ega 199 testi käivitamine veel kinnitatud.
