# Kuningriigid – ühine tööjärg

Viimati kokku lepitud seis: **V245**, GitHubi `main`-harus. Enne töö alustamist kontrolli alati GitHubi tegelikku viimast seisu; seda faili ei uuendata automaatselt.

- Mäng ja avalik eelvaade: https://orogdor.github.io/Kuningriigid/
- Lähtekood: https://github.com/orogdor/Kuningriigid
- V241: mängumudelid laaditakse vajaduse järgi; sõduritüübid on eraldi failides.
- V242: detailkaardi naaberalad valmistatakse ette ja taaskasutatakse. Üleminekul säilivad ühine maastik ja kaamera asukoht.
- V243: müüri saab ühendada torni või väravapostiga. Ehitamisel pöörab Ctrl + hiireratas eelvaadet 2° kaupa; juhis on ekraanil. Silla paigutus peab ühendama kaldad.
- V244 (Claude): jõudlus ilma graafikat halvendamata. Puud ja põõsad joonistatakse instancing'uga, kiviaja hoonetel on kolm detailsuse astet (`models-stone-lod-v244/`), WebGPU varulahendus on rangem. Üksikasjad: `MUUDATUSED_V244.md`.
- V245 (Claude): WebGPU must ekraan parandatud. Põhjus oli three r170 instancing'u uniform-puhvri viga (`vendor/three.webgpu.js` patch). Üksikasjad: `MUUDATUSED_V245.md`.
- V243 muudatuste ja kontrollide üksikasjad: `MUUDATUSED_V243.md`; eelmised versioonid: `MUUDATUSED_V241.md` ja `MUUDATUSED_V242.md`.

## Koostöö

1. Enne muudatusi kontrolli GitHubi `main`-haru viimast versiooni ja töökoopia seisu. Ära kirjuta teise töö tegija pooleliolevaid muudatusi üle.
2. Samaaegseks tööks kasuta eraldi harusid või töökoopiaid; ühenda muudatused pärast kontrollimist.
3. Pärast sisulist muudatust uuenda seda faili: märgi tulemus, versioon, kontrollid ja järgmine teadaolev töö. Ära kirjuta oletusi lõpetatud töö pähe.
4. Avalik versioon ja kohalik pooleliolev töö võivad erineda. Märgi see selgelt; GitHubi üleslaadimine või avaldamine toimub kasutaja juhiste järgi.

## Kontrollimine

Käivita muudatusele vastavad testid. Näiteks V243 ehitusmuudatuste puhul `node scripts/test-build-v243.mjs`, müüride puhul `node TEST_V1754_GATES.mjs` ja detailalade puhul `node scripts/test-stream-v242.mjs`. Mängu põhikontroll on `node scripts/test.mjs traffic`. Brauseritestide käivitamiseks on vaja Puppeteeri ja sobivat brauserit.

## Järgmine töö

- Tõrvikud (225 eraldi tükki) ja varustus tuleb liita. Kasutaja soovis selle hilisemaks eraldi ja põhjalikumaks läbivaatuseks.
- WebGPU töötab kasutaja NVIDIA kaardil. Kaadrisagedust WebGPU ja WebGL-i vahel pole veel võrreldud. Mitu onBeforeCompile-efekti (maastiku sujuvad üleminekud, mere lained, pilvede varjud, tuul) puudub WebGPU-s, need tuleb ümber kirjutada TSL-i.
