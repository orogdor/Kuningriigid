# V338 – automaatsalvestus iga 10 minuti tagant

Perioodilise automaatsalvestuse intervall on nüüd **600 sekundit aktiivset mänguaega** (enne 10 sekundit). Menüüs, pausi ajal ja taustal taimer ei kasva. Iga edukas käsitsi või muu sündmuse käivitatud salvestus alustab järgmist intervalli uuesti.

Mängust väljudes, lehe peitmisel ning mängutoimingute järel tehtavad turvasalvestused jäid alles. V338 muudab ainult perioodilise taimeri käitumist; see ei ole veel FPS-regressiooni põhjuslik parandus.

Test: `node tests/autosave-v338.mjs`.
