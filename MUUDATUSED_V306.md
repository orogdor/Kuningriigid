# V306 – kasutaja valitud UI paigutuse taastamine

V304 muutis soovitud suure kaarja pildiliidese väikesteks ristkülikuteks. V306 viib selle tagasi kasutaja teise pildi kompositsioonile: suur avastuse medaljon, ümar atlas vasakul, kuus kõrget pildikaarti all ja suur ümmargune valikupaneel paremal.

- V302 iseseisvad maalitud raamid on uuesti kasutusel õigete mõõtmetega; iga raami sisu ja klõpsualad skaleeruvad koos.
- Kuus põhikaarti on eraldi genereeritud püstpildid, mitte laiaks lõigatud ruutpildid. Säilivad linnade, ehituse, armeede, kaubanduse, diplomaatia ja päeviku päris käsud.
- Lisatud on terav lossiportree tühjale kuningriigivalikule ning seadete, pausi ja jätkamise eraldi pildinupud. Kõigi 17 kontekstikäsu pildid on maalitud rasterpildid. Valitud üksuse päris portree säilib.
- V304 tegelike andmete ja käskude loogika jääb aluseks. Lisatud on ainult valikulised kunstivarade ühenduskohad, mida vana/klassikaline kujundus ei kasuta.
- Ressursid, aktiivne avastus, neli järjekorrakohta, minikaart, valitud objekti nimi ja lubatud käsud jäävad elavaks. Viies väike uurimisnupp avab avastuste kogu.
- Telefonis on püstkaardid loetava suurusega keritavas reas ning külgpaneelid avanevad sahtlitena.
- 140 V304 avastusmaali ja Three.js r187 jäävad kasutusse.

Pildid ja individuaalsed genereerimispromptid: `ui-art-v306/`. Visuaalne kontroll ja piirangud: `design-qa.md`; brauseripildid ja ühised võrdlused: `previews/ui-v306-*`.

Kontrollid: CI kõik 23 kiirkontrolli gruppi, `node tests/ui-v306.mjs`, V304 avastus-/käsutest ning brauseris HUD-i tegevused 1200 × 675 ja 390 × 844 viewport'ides. Testibrauseri GPU piirangu tõttu kontrolliti HUD-i päris failidega eraldi selgelt märgistatud rakises, mitte täismängu 3D-kaadrit. See piirang jääb ausalt kehtima.
