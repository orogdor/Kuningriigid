# Kuningriigid Godot APK — telefonist

See on AJUTINE `godot-apk-test` haru olemasolevas `orogdor/Kuningriigid` hoidlas. Algne veebimäng harul `main` jääb puutumata.

## Üks toiming telefonis
1. Laadi ChatGPT vestlusest alla `Kuningriigid_Godot_GitHub_APK_Ehitus_v2.zip` (366 KB).
2. Ava brauseris https://github.com/orogdor/Kuningriigid/tree/godot-apk-test
3. Vali **Add file → Upload files** (vajadusel lülita brauseri menüüst sisse töölauavaade).
4. Laadi ZIP **haru juurkausta** täpse nimega `Kuningriigid_Godot_GitHub_APK_Ehitus_v2.zip` ja vajuta **Commit changes**.
5. GitHub Actions käivitab automaatselt `.github/workflows/godot-apk-test.yml` töövoo.
6. Kui kõik Godoti kontrollid ja Androidi eksport õnnestuvad, ava https://github.com/orogdor/Kuningriigid/actions/workflows/godot-apk-test.yml ning laadi rohelise töö tulemuste **Artifacts → Kuningriigid-Android-APK** ZIP. Selle sees on `Kuningriigid-Android.apk`.

Kui ehitus ebaõnnestub, ava sama töövoo `Godot-ehituslogid` ja saada vestlusesse vea tekst või kuvatõmmis. Faili üleslaadimine ei mõjuta algset Three.js veebimängu.

**Piirang:** see on ajutine APK testharu. Godoti APK automaatne `.pck` uuendaja osutab tulevasele eraldi `orogdor/Kuningriigid-Godot` hoidla Releasesile. Seniks töötab APK sees olev algne mängupakett, kuid GitHubi kaudu OTA-uuendus ei toimi enne selle eraldi hoidla loomist ja väljalasete tegemist.

**Väljastatakse ainult siis, kui Godoti parser, regressioonitestid ja APK eksport läbivad.** Käesolev kood pole veel Androidi seadmel testitud.
