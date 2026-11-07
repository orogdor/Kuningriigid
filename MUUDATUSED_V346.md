# V346: kiviaja tornikaitsja, müürikäigud ja tihedam mets

- **Kiviaja tornikaitsja (`stone_guard`, "Tornikaitsja"):** kiviaja tornis on vibukütt asendatud kivikirvemehega, kellel on kotitäis viskekive. Kaugemale viskab ta kive (ulatus 14), lähedal lööb kirvega (BOW_UNITS/carriesSword loogika). Ühikut ei saa treenida ega AI-ga värvata; seda kasutab ainult torn.
- **Müüril käimine:** madalal puitvallil ja külaväraval (`palisade`, `woodgate`, tase I) pole käigurada, seega pole need enam `walkable`. II taseme galeriiga puitvall ja kivimüürid jäävad käidavaks.
- **Torn:** puidust vahitornis seisab kaitsja tekil (`deckSurface` 6,875), mitte 0,4 m kõrgemal. Kohti piiratakse ±1,55 m-ni, et kõik jääksid rinnatise sisse.
- **Tihedam mets:** detailkaardil täidetakse puudevahelised tühjad kohad dekoratiivsete puudega. Need on Saplingi instantsid ja puude raiumist ega mängu ei mõjuta. Täidetakse koht, mille 24 m raadiuses on puu, aga 4,6 m raadiuses mitte. Avatud niidud jäävad lahti, samuti teed, vesi, ehitised ja keskmine teeriba.
- Test `tests/stone-tower-guard-v346.mjs`.
