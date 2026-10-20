# Kuningriigid V74 – mobiilis kaart esimesena

Põhineb V73 `dev/v73-save-reliability` harul; selles etapis **ei muudeta ühtegi mängu ega salvestuse andmestruktuuri**.

## Miks V71 liikvel ei toiminud piisavalt hästi?
- Väikesel 390px ekraanil oli korraga seitse menüüelementi, mille tekst kahanes CSS-is lausa 8–11px peale.
- Minikaart, eesmärkide paneel, ressursside nupp ja suumimine olid kõik pidevalt kaardil.
- Ehituspaneeli väikeses horisontaalses reas oli raske hooneid lugeda ja puudutada.

## V74 muudatused
- `hud-v74.css` lisab ainult mobiil- ja kompaktvaadetele eraldi paigutuse. Desktop kasutab varasemat V73/V72 liidest.
- Alumisel tööriistaribal on seitse võrdse laiusega 52px kõrgust ikooni **Kaart, Linn, Avasta, Teadus, Väed, Ehita, Menüü**.
- Maailmakaardil minikaart on vaikimisi suletud; selle saab avada 45×45px nupust.
- Ressursside kiht ja asuniku automaatsed ressursiikoonid jäävad endiselt alles; ressursside detailid avatakse eraldi 45×44px nupust.
- Kaardi suurendus/vähendus on 44px kõrguste nuppudega parema pöidla juures; üksuse käsud avanevad kompaktsest paneelist.
- Linn, ehitus, avastamine ja kaardi täpsemad toimingud avanevad alumise menüü kohal hüpikpaneelina, sulgedes muud nähtavad juhtelemendid.
- Ehitised on kahes veerus, paremini loetavate 80px kõrguste nuppudega.
- Sama alumise menüünupu teine vajutus sulgeb vastava linna-, ehitus- või väepaneeli.
- Alustamise, uurimise ja päeviku modaalid peidavad taustal olevad mängu juhtnupud.

## Kontroll
- `TEST_V74_UI.mjs`: 390×844; ehitamine päriselt rajatud linnas; 844×390; 667×375; arvuti 1440×900. Samuti menüüde sulgemine, ressursid, suumimine, minikaart, käsud ja nuppude suurused.
- `TEST_V71_UI.mjs`: vanad minikaardi, puutežestide, avastaja ja kaartide regressioonitestid.
- `TEST_V72.mjs`: merevägi, võit ja sõjaretked.
- `TEST_V73.mjs`: salvestusvorming ja taastamine.

Playwrighti emulatsioon ei asenda füüsilise Androidi testimist. Mäng on jätkuvalt `main`-harus V72; V74 on eraldi arendusharus.
