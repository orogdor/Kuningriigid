# V130 — elanike õpitud rajad ja linnaalade kontroll

Iga päris linnaelanik õpib sama lähte- ja sihtpunkti vahelise suunatud teekonna kolmel esimesel korral tavalise rajaotsinguga. Edasi kasutab ta kolmandal korral leitud rada. Tagasitee, teised sihtkohad ja teised elanikud õpivad eraldi. Iga elaniku kohta hoitakse kuni 64 hiljutist teekonda; mälu on käitusajal ning mängu uuesti laadides algab õppimine uuesti.

See hõlmab korjajaid, kaevureid, metsatöölisi, põllutöölisi, ehitajaid, tootmishoonete töötajaid, treenereid, turulkäijaid ja kaubakandjaid. Ehitajate ja turulkäijate maailmaruutude vahelise teekonna aktiivne rada säilib samuti, et maailma rajaotsingut ei korrataks igal sammul. Ka seal õpitakse korduv teekond kolm korda.

Sama ruudu navigatsiooni muutus tühistab kohaliku õpitud raja: ehitamine, hoone valmimine, teisaldamine või hävimine, müüri pööramine, puu eemaldamine või istutamine, põllu rajamine ning maastiku/silla läbipääsu muutus. Läbitavate maailmaruutude muutus tühistab nende kaudu õpitud teekonna. Teise, teekonda mittepuutuva ruudu muutus seda ei tühista. Liikumisel säilib takistuse kontroll; tegelikult blokeeritud rada unustatakse kohe. Jälgede tekkimine ja tee kulumine üksi ei tühista õpitud rada.

Sõjavägi ja lahinguüksused jätkavad olemasoleva `move`/`route` süsteemiga ning ei kasuta elanike rajamälu. Dekoratiivsete külategelaste animatsioonid säilivad.

Alade audit kontrollib rauaaja testseisu 14 linna praegust ala ja uuesti kõigi linnade maksimaalset kasvu: kokku 28 kontrolli. Iga ala on ühendatud, oma riigile nähtav ja jääb kuni kolmekordse nimelise linnaala piiresse. Rannik võib ulatust piirata. Praegused linnad: 8–9 linnaruudu ja 18–19 maakonnaruuduga, kokku 27. Maksimaalse kasvu korral on ulatus rannikust sõltuvalt 138–243 ruutu. Maakonnaruudu kolme ehitise piirang säilib.

Parandatud on ka ehitajate ja turulkäijate ruuduületus: väljapääs ja sisenemine kasutavad praeguse 225 × 195 detailruudu mõõte, mitte vana 150 × 130 ruudu vahepunkte.

Kontrollid: TEST_V130 (päris läbikäigud, A* väljakutsete arv, õpitud rada ja muudetud takistus, sõjaväe eraldatus, ruutudevahelised teekonnad, alade audit), TEST_V125–V129 ning brauseri laadimis- ja mobiilikontroll. Alade arvud on failis reports/ai-navigation-v130/areas.json.
