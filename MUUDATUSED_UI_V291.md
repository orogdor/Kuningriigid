# V291 – väikese pildipõhise maailmakaardi UI

## Lähtekujundus
Aluseks on kasutaja kinnitatud kompaktne 1671 × 941 Kuningriigid UI pilt. V291 kasutab sellest eraldi pildifailideks lõigatud komponente, mitte terve ekraani peale asetatud screenshot'i ega CSS-iga joonistatud nuppe.

## Tehtud
- 38 eraldi läbipaistvusega WebP graafikafaili kataloogis ui-art-v291: 11 ülariba osa, avastuste paneel ja 5 ikooni, 6 eraldi menüükaarti, puidust ja sinine alumine taust, minimapi pildiraam ja 3 juhtnuppu, valitud üksuse raam ja portree ning 4 käsunuppu, pilditaustad dialoogidele.
- Ressursikastide ja valitud üksuse päris tekstid loetakse mänguseisust. Pildile sisse maalitud näidistekstid on vastavatest pindadest eemaldatud.
- Maailmakaardi minimapi algne canvas tõstetakse läbi läbipaistva ava päris raamile. Vaate vahetamisel taastatakse see algsesse DOM-i.
- Igal kuuest menüükaardist on eraldi päris nupuhandler: linnad, ehitamine, armeed, kaubandus, diplomaatia ja sündmuste logi. Teadus, paus, suum ja üksuse käsud suunatakse algsesse mänguloogikasse.
- Korraga on nähtav ainult üks maailma HUD: uue režiimi ajal peidetakse V289, V290 ning klassikalised maailmakaardi elemendid. Mängu salvestused, AI ja 3D maastik jäävad puutumata.
- Tugi 1671×941, 1366×768, 1024×768, 844×390, 390×844 ja 2560×1440 mõõtudele. Telefonis kuus illustreeritud kaarti 3×2 ja külgpaneelide pildinupud.

## Testid ja piirangud
- Kohalik Chromiumi HTML-testid näitasid 0 JavaScripti pageerror-it, kõik pildid laadisid ja esimene menüükaart käivitas algse hud-city nupu kõigi kuue mõõdu korral.
- test/ui-v291.mjs kontrollib mängu indeksi viiteid, 38 WebP-faili päiseid, originaalsete juhtkäskude nimesid, minimapi taastamist ja mobiilikujundust.
- Päris avaldatud Three.js mängu täielikku visuaalkontrolli ei ole tehtud; katse aktiveerub ainult ?ui=art. V290 ja V289 jäävad alles.
- Mängu eraldi tehnoloogia-, linna- ja armee menüüde sisulisi paigutusi ei muudetud; nende pildikujundus vajab eraldi järgnevat läbimist.

## Aadressid
- V291 uus pildipõhine HUD: https://orogdor.github.io/Kuningriigid/?ui=art&v=291
- V290 varasem pildipõhine HUD: https://orogdor.github.io/Kuningriigid/?ui=picture&v=290
- Klassikaline varuvariant: https://orogdor.github.io/Kuningriigid/?ui=classic&v=291