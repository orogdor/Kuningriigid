# Kuningriigid V131 → Godot 3.0: 3×3 katselahing

V131 allikas: `orogdor/Kuningriigid` revision `26562368f56a32616651a266ed2d8c87f06d43d1`; `battlefield-v88.js`, `detail-scale-v123.js`, `formations-v94.js`, `soldier-collision-v90.js`.

## Uued kontrollitavad osad

- 3×3 V131 detailruudu lahinguväli = 675 × 585 loogilist ühikut. Iga ruut oma 9×9 kõrgusprooviga. Olemasolev 64×50 maastikulahingu katse säilib.
- Joonistatud 5×5 äärmine taganemisvöönd, mitte 5×5 detailne lahingumaastik. Punase joone taga märgitakse sõdur põgenenuks.
- 500 individuaalset võitlejat katses: 2 × (10 × 24-meheline jala- või vibuküttide salk + 10 × 1-meheline avastajasalk) = 500. Sõdurite ülempiir 500 on ka varem olemasolev reegel.
- Kõigi üheksa ruudu jõelõigud ja sildade asukohad toimivad ühe navipinnaga; 7.5m hõre navivõrk kiireks sõdurite ümbersõidu otsimiseks.
- 3D: reljeef üheksast ruudust, jõed/sillad, välju tähistavad punased jooned ja lihtsustatud taganemisvöönd. 500 üksust jagavad MultiMesh materjale.
- Suure väljaku vajadusest piiratud 2 kallist BFS-teeotsingut 0.1s simulatsioonisammu kohta. Automaatne salgasisene frontihoidmine pikkadel marssidel.
- Sõduri olemasolev kokkupõrgete ruumiline indeks, vibud ja üldine taktikaline sihtmärgivalik jäeti tööle.

## Teadaolevad piirangud

- **Ei ole V131 täielik 1:1 lahingumootor.** V131 formaatsioonid ja individuaalsed animatsioonid on lihtsustatud. Sõdurite rajaleidmise ruudustik 7.5m, mitte kõrgresolutsiooniline sõdurite liikumisgraafik.
- Füüsiline kokkupõrge on 2D-disc kontroll, mitte Godoti CollisionShape3D/RigidBody füüsika. Katselahing ei muuda veel päris maailma kampaaniat lõpuni.
- 5×5 taganemisvöönd on ainult graafiline lihtsustus; põgenemisel mitte alati V131 täpne maailmakaardi naaberruutu tagasipaigutamine.
- Start valitud kuivast maailmaruudust; kui mõni naaberruut on ookean/mägi, võivad sõdurid otsida lähimat läbitavat ala. Edasine vool vajab Androidis jõudlus- ja paigutustesti.
- Eesmärk mõõta telefoni tegelikku FPS-i, mitte kinnitada 60 FPS-i. Käivitumine ja GDScripti 559 testväidet on selles keskkonnas veel kinnitamata.

## Testimine telefonis

1. Paki ZIP uude kausta, ava `project.godot` ja käivita projekt.
2. Vali kuiv sisemine ruut, ava `MENÜÜ → Testid → Suur lahinguväli 3x3: 500 meest`.
3. Vajuta `MENÜÜ → Testid → 20s jõudlustest`; võrdle tulemust 192-mehe demonstratsiooniga.
4. Katseta `Armee` → `Formatsioon`, `Taktika`, `Ründa`, `Liigu` ja `Tagane`.
5. `Reeglitest` käivitab 559 **ettevalmistatud** GDScripti väidet ainult käsitsi.

## Mida on kinnitatud

- Python-põhised staatilised QA-kontrollid ja 3×3 geomeetria eraldi arvutuskontrollid, ZIP-i terviklus.
- **Mitte kinnitatud**: Godoti parser, projektist mängu avamine, 559 Godoti reegliväite tegelik läbimine, Androidi FPS.
