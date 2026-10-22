# V112 – redelite kasutamine ja täielikud tornid

- Parandatud V111 redeli juurde lähenemine: varasem rivistusankur jäi müüri navigatsioonitakistuse sisse ja salga keskpunkt ei jõudnud ronimise alustamiseks piisavalt lähedale.
- Iga sõdur läheneb nüüd ise redeli jalami järjekohale; korraga ronib ühe salga kaks meest. Ronimise kõrgus ja asukoht arvutatakse iga sõduri jaoks eraldi. Toetavad automaatsed jalaväesalgad kasutavad samuti valmis pääsu. Terve müür jääb maapealsetele üksustele suletuks.
- Piiramisvahendi liigutamise ajal järgneb ehitanud salk sellele; valmis vahend ei kao ehitaja surma või taganemise tõttu.
- Müürile jõudnud lähivägi saab kasutada linna sisetreppe, et liikuda allesjäänud linnakaitsjate vastu.
- Redel vastab tegelikule 5m lähenemisele ja 3,8m müürikäigule. Vahendi suund säilib ka pärast müürini jõudmist. Piiramistorni korpus jääb müürist väljapoole ja sild ulatub müürikäiguni.
- Linnatornidel on nüüd neli ülemist külgseina läbipääsudega ning parapetid kõigil neljal küljel. Lükataval piiramistornil on täielikud külgpaneelid, raam, rattad, sisetrepid ja 3,8m kõrgusel sild.

Kontroll: `node TEST_V112.mjs` läbib mõlema vahendi päris ehituse, lähenemise ja ronimise algpositsioonilt, sõdureid käsitsi ümber tõstmata. Redeliga jõudis 48 meest üles 64,4 simuleeritud sekundiga, torniga 114,9 sekundiga (reaalaeg lahingus kaks korda pikem). Vastase tule mõju on selles liikumistestis välja lülitatud. Varasem V111 test tõstis salga käsitsi redeli juurde; see katmata osa on eemaldatud.

V111 kindlustuste ja mobiilivaate testid samuti läbitud; 412×915 brauserivaates skriptivigu ei tekkinud.
