# V326 – merevesi samas stiilis nagu jões

Kasutaja V325 maailmakaardi pildil olid meri ja jõgi eri värvi ning suudme juures nähtavad geomeetrilised servad. V326 muudab mere vett jõe järgi.

- `seaMaterial()` kasutab nüüd päriselt sama `waterMaterial()` teostust kui jõgi: tume sinakasroheline vesi, rohekad madalikud, voolavad peened lained, valgussädelus, sama karedus/metallilisus ja taevapeegeldus. Värvid asuvad ühes jagatud seadistuses. Mere vana lai hele vahuriba ja eraldi dekoratiivsed lainejooned eemaldatud.
- Jõesuudme lõppu ei segata enam heledat türkiissinist merevärvi. Mere kuivamask säilib ka pärast peegelduse läbipaistvuse arvutust.
- WebGPU puhul koostatakse mere ja jõe jaoks sama TSL-i teostus; varem jõe `onBeforeCompile`-vesi seal ei rakendunud.
- Maailmakaardi mere x/z tipud ja kolmnurgad tulevad tegelikust maastikuvõrgust. Varasem sisemaa meretippude järsk -30 m liigutamine on eemaldatud: kogu merepind on tasane ja kuiv maa peidetakse sügavusmaskiga. See eemaldab ühe tuvastatud allika, mis tekitas suudmetes kaldus veekolmnurki.
- Maailmakaardi jõe mudased pealisribad võtavad kõrguse tegelikult joonistatud maastikukolmnurkadest. Need ei järgi enam eraldi detailset kõrgusfunktsiooni, mis võis asuda jämedama maailmamaastiku kohal või all.

Maailma navigeerimine, salvestus, jõgede keskjooned, detailruutude 5×5 laadimine ja V320 taimestiku järjekord säilivad.

## Kontroll

`tests/shared-water-v326.mjs` kontrollib sama lainetuse ja peegelduse shader-koodi, sama kella ja paleti kasutamist, tasase merevõrgu ja maastikuvõrgu tippe/indekseid, kuiva maa maski ning mõlema päris WebGPU veematerjali WGSL-i koostamist. Senised Three.js ja ruudupõhise mere kontrollid on ajakohastatud ühise teostuse jaoks. Kõik 104 CI kiirkäsku läbisid; tulemused on salvestatud faili `reports/shared-water-v326-ci.json`.

See ei ole kasutaja salvestuse GPU-pildiga kinnitatud lõpptulemus: pilvebrauseris on WebGL keelatud. Kasutaja kuvatõmmisel nähtav suudmeala vajab endiselt seadmel ülevaatust. V326 muudab konkreetseid materjale ja eemaldab tuvastatud geomeetriavea; see ei väida kogu rannajoone visuaalset veatust.
