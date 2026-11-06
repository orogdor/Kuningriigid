# Kuningriigid V330 – fikseeritud Windowsi võrdlusversioon

See on eraldiseisev **Windows 10/11 x64 EXE** testversioon, mille mängusisu pärineb muutmata kujul commit'ist
`966841212bb96cfe3051bf19b3f9f48f8067bb85` (V330).

- Installer: `Kuningriigid-V330-FROZEN-win-x64.exe`.
- Oma rakenduse identiteet `ee.kuningriigid.v330.frozen`, oma paigaldus ja eraldi salvestuskaust `Kuningriigid-V330-Frozen`.
- Mängufailid on EXE paigalduspaketis. Rakenduse käivitamisel ei kontrollita võrgu kaudu uuendusi.
- Ka varasemaks jäänud sisumanifestide olek tühistatakse käivitamisel. V330 peale jääb alati kohaliku paki commit.
- Windowsi Chromiumi renderdus kasutab sama Electron 45.2.3 mootorit kui olemasolev WebApp. Muudatud on ainult Windowsi käivitaja ja pakenduse seadeid, mitte mängukoodi.
- See haru **ei muuda** GitHub Pagesi ega tavalise APK/EXE uuenduskanalit.

## FPS-võrdlus

1. Paigalda V330 Frozen ning uuem Kuningriigid WebApp eraldi. Kui kasutasid varem ühist salvestust, impordi mõlemasse sama JSON-fail mängu menüüst (salvestused ei liigu automaatselt ühest äpist teise).
2. Kasuta sama maailmaseemet, salvestust, graafikavalikuid, resolutsiooni, vaateulatust ja zoom'i.
3. Mõõda 60 sekundit maailmakaardil ja 60 sekundit detailkaardil. Võrdle keskmist FPS-i, 1% madalaimat FPS-i ja laadimisaega.
4. Ava mõlemad rakendused algul ükshaaval, mitte korraga. Vajadusel pane Windowsi `Task Manager` sisse GPU ja RAM kasutuse veerud.
5. V330 Frozen ei ole jõudlusparandus, vaid muutmata vana mängusisu kontrollvariant regressiooni leidmiseks.

GitHub Actionsi `v330-frozen-exe.yml` ehitab NSIS installeri, kontrollib v330 manifesti ja käivitab Windowsis päris mängu offline-režiimis. Alles edukas build + smoke test tekitab eraldi prerelease'i `v330-frozen-test`.
