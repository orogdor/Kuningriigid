# Kuningriigid V86: mängukulu ja jõudluse analüüs

Võrdluse lähteversioon: V85, commit 79916e9c7f6a2367f53411dfca739745308bd490. Kaardiseemned 8417 ja 20261020. Mõlemas variandis kasutati samu seaduslikke AI käske ka mängija osapoole jaoks; ressursse, valmis hooneid ega ajastuid ei antud juurde.

| Leid | Mõju | Parandus |
|---|---|---|
| Toidu- või veepuudus piiras ka suure linna kolme töötajaga | Tootmine võis pärast väikest puudust pikalt seiskuda | Suurem linn säilitab 75% tööjõust; kolme elanikuga alguslinna ei karistata rohkem |
| Tehased said tööjõudu ka puuduva sisendmaterjaliga | Toitu ja vett tootvad töökohad kaotasid töötajaid | Sisendita tootmine vabastab tööjõu, kuid näitab endiselt puuduvat materjali |
| Ajastumaterjali vajadus sai mõnes harus ellujäämisest kõrgema prioriteedi | Tööstusse ümberjagamine võis nälga süvendada | Kriitiline toit ja vesi kontrollitakse enne tööstusharusid |
| Puuduva toiduallikaga linn jagas kõik töötajad hoonetele | Marjakorjamine jäi tööjõuta | Väike hädareserv korjamiseks; mängija nulliks määratud töökohti austatakse |
| Üks töötav jahimeheonn välistas teise rajamise | Kasvava linna nõudlus ületas tootmise | AI võib väikese toiduvaru korral rajada lisatoiduallikaid, ilma neid lõputult kuhjamata |
| Esimese AI ehitusvaliku paigutus ebaõnnestus | Kogu ehitusplaan jäi sama valiku juurde | Kontrollitakse ehitaja ja tooraine ligipääsu ning proovitakse teisi kasulikke ehitisi |
| Ligipääsu kontroll arvutas iga kord kaalutud täispika tee | Tarbetu CPU koormus | Takistuste muutumiseni kehtivad ühendatud maastikupiirkondade vahemälud |
| Suured taimestiku instantsid hõlmasid kogu maailmakaarti | Kaamerast väljas olev mets koormas GPU-d | Staatilised instantsid jagatakse ruumilisteks rühmadeks; kaugvaates kasutatakse taas suuremat partiid |
| Avatud uurimispuu nupud eemaldati iga värskendusega | Klõps või puudutus võis kaduma minna | Nupud säilivad; edenemist ja ETA-d muudetakse kohapeal |
| Peidetud uurimispuu ja tööjõukontrollid uuendati mängimise ajal | Liigne DOM töö ja juhtnuppude uuendamine | Automaatvärskendused koondatakse, aktiivset sisestust hoitakse ning peidetud kontrollide ümberehitamist välditakse |

## Tunnipikkuse võrdluse esimene tulemus

V85 jõudis pronksiaega 6 osapoolt 8-st; kaardil 20261020 jäid kaks osapoolt kiviaega. V86 jõudsid mõlema kaardi kõik 8 osapoolt pronksiaega. Esimese linna toiduvarud paranesid mitmel osapoolel märgatavalt, linnad kasvasid ja laienesid. Kõik üksikud tooraine- ja ehitusummikud pole kadunud; rauaajale ülemineku lauatootmine vajab pikemat tasakaalutesti.

## Renderduskoormuse esimene mõõtmine

Sama telefonivaate avakaadris vähenes renderdatud kolmnurkade arv 4 377 626-lt 1 580 688-ni (umbes 64%). See mõõdab GPU-le antavat geomeetriat, mitte füüsilise telefoni FPS-i. Mudelite kuju ega paigutust selleks ei lihtsustatud.

## Kontrolli ulatus

- Majanduse, tööjõu, sisendite, ligipääsu ja menüüde regressioonitestid.
- Salvestuste taastamine, tehnoloogiad, kindlustused, meretransport, tegelik kontrollitud lahing ning võidutingimused olemasolevate testidega.
- Telefonivaates mängitud avang: avastaja, asuniku liikumine, linna rajamine, uurimine, ehitus, valmimine ja kaartide vahetamine.
- Arvuti- ja telefonivaate kuvatõmmised ning renderdatud kolmnurkade mõõtmine.
- V4 salvestusvorming säilib. Ressursside üldist kogumiskiirust ega mängu kiiruse valikut ei muudeta.

See pole tõend terve kampaania lõpuni läbimise või füüsilise S24 kaadrisageduse kohta. Testimiseks kasutatakse Chromiumi tarkvaralist WebGL-i ja mobiilivaate emulatsiooni. Hiliste ajastute pikk majandus ning väga suured armeed jäävad edasiseks stressitestiks.
