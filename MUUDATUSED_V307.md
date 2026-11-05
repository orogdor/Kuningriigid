# V307 – terve pildiliides ka külili telefonis

V306 laiuse/kõrguse ühine mobiilitingimus peitis külili telefonis soovitud pildipaneelid. V307 piirab sahtlivaate kitsale püstekraanile ning sobitab rõhtvaate kogu pildiliidese nähtava laiuse ja kõrguse järgi. Külgedel võib väga laias telefonivaates jääda rohkem mänguala, kuid piltide kuju säilib ja ükski paneel ei kao.

Samuti parandati ülariba pärandatud 42 px nupukõrgus/veerupaigutus, telefoni menüüde piirid ning kaardivahetuse nupule sattunud keelatud jalutamisnupu kattumine. Maailmavaates jalutamisnuppu ei näidata; detailvaates on see oma kohal ja olemasoleva käsuga ühendatud.

Uus `ui-v307.css` on ainult paigutuse parandus. Genereeritud kunstivarad ja mängu loogika jäävad samaks. Lehe ja CSS-i vahemäluvõtmed on V307.

Kontrollitud on 915×364, 844×390 ja 740×320 rõhtvaated ning 390×844 püstvaade ja 1200×675 arvutivaade. Kõigis kontrollitud nähtavates HUD-i piirkondades oli 0 puuduvat pilti ja 0 kaetud lubatud nuppu. Kõik 23 CI gruppi läbisid. Üksikasjad, brauseripildid ja 3D/GPU kontrolli piirang on `design-qa.md` failis.
