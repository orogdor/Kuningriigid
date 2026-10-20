# V79 – pronksiaja linnamudelid ja loomulikult tekkivad teerajad

## Uued mudelid
Pronksiaja välimus erineb nüüd päriselt kiviajast: puitkarkass, põletatud saviplokid, kivivundament, viilkatus ja eristatavad tootmisvahendid. Ehitised säilitavad oma vana ehitus- ja tootmisloogika.

V79 **30 eraldi 3D-hooneliiki**:
- Peamaja, elamu, ladu, kelder, turg, õpikoda, puuraidur, kivimurd, jahimees, kalur, talu, kaev, sõdalaste laager.
- Sadam ja laevaehitus, sild, savikarjäär, keraamikaahi, karjamaa, kivimeistri hoone, vankrimeister, vase- ja tinakaevandus, pronksisulatus, teedeehitajate ladu, saekoda, veski, pagar, vibulaskjate laager, metsamees, kirjutuskoda.

Kiviaja 13 mudelit ei muutunud. Rauaajale ja hilisematele ajastutele jäävad seni olemasolevad mudelid. Uute mudelite testis oli **312–1732 kolmnurka** hoone kohta, maksimaalselt **10 renderduskutset** hoone kohta. Sarnased objektid kasutavad ühiseid tekstuuride, geomeetria ja materjalide vahemälusid.

## Teede teke: täiendused pärast V78
- Kui sama rada läbitakse mitu korda, muutub see nähtavaks juba **nelja kulumisühiku** juures (varem kuus). Üks läbimine nähtavat teed ei tekita.
- Kasutatud tee kulub aeglasemalt ning tugevamini sissetallatud rada püsib kauem.
- Detailkaardi teeriba ei tohi enam ühendada kõrvuti olevaid punkte läbi läbimatu takistuse (hoone, suurem puu, kivim), ka mitte diagonaalselt.
- V78 sujuvad 0,1 sekundi turulkäijate sammud ja jalajälgede jaotus jäävad alles; maailmakaardi teede lävendid ja 1,5× liikumisboonus on endised.

## Uus pronksiaja testlinn

**[Ava Vaskoru pronksilinn](https://orogdor.github.io/Kuningriigid/?v=79-20261020&demo=bronze)** – laadib 32 valmis hoonega pronksiaja linna ja avab kohe selle detailkaardi. 30 eraldi hoonemudelit on korraga näha. Linnas on eelnevalt kaheksal korral turu ja elamute vahel läbitud päris navigeerimismarsruute, seetõttu on teerajad juba nähtavad ning neid saab edasi kulutada.

Näidislinna saab menüüst **Ekspordi salvestus** abil JSON-failina kaasa võtta: `Kuningriigid_V79_Pronksilinn.json`. Tegu on tavalise `version:4` salvestusega.

**Oluline:** `?demo=bronze` ja `?demo=stone` on eraldi, kirjutuskaitstud näidismängud; nende avamine ega menüüst jätkamine ei asenda sinu salvestusi. JSON-i importimine tavalisse mängu võib senise automaatsalvestuse asendada, nii et ekspordi enda mäng eelnevalt.

Säilib ka **[V77 kiviaja näidislinn](https://orogdor.github.io/Kuningriigid/?v=79-20261020&demo=stone)**.

## Tehtud testid
- `TEST_V79.mjs`: 30 mudeli geomeetria ja tekstuurid, kiviaja ning rauaaja regressioon, V4 pronksilinna salvestuse taastamine, 211 juba nähtavat detailkaardi teeruutu.
- `TEST_V79_UI.mjs`: Chromium (telefon 390×844, telefon 844×390, arvuti 1440×900), 32 hoonet, kõik 30 eraldi 3D-mudelit, 211+ nähtavat teerajaruudukest ja 430+ kolmnurgaga teeribad, eksporditav JSON.
- `TEST_V78.mjs`: üks jalutuskäik teed ei tekita, mitu käiku tekitavad sidusa teeraja, turulkäijad liiguvad sujuvalt.
- `TEST_V77.mjs`, `TEST_V76.mjs`, `TEST_V75.mjs`, `TEST_V73.mjs`: varasemad ajastud, külaelu, maailma/detailobjektide vastavus ja salvestuste ühilduvus.

Kõik veebibrauseri mõõtmised toimuvad Chromiumis tarkvaralise WebGL-ga; füüsilise Android GPU FPS ei ole sellest tuletatav.
