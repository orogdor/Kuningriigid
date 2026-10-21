# V98 — püsiv lahingusse marssimine

Parandatud korduv terve salga tagasipööramine lahingu alguses.

- Salga teekond ei kasuta enam linnatöölise liikumisrutiini. Liikuva sihi muutumisel alustas vana rutiin rada ümardatud alguspunktist, mis jäi tihti salga taha. Lahingu juhtpunkt kasutab nüüd sama püsimäluga takistusmarsruuti kui sõdurid.
- Kui juhtpunkt jõuab meestest ette, ootab see neid; seda ei tõmmata enam iga kaadri ajal tagasi salga keskme juurde.
- Salk hoiab valitud vastast, kuni teine siht on selgelt sobivam või vana vastane murdub. Jalavägi hoiab lähenemisel oma rivi koridori ning sulgub vastasega lähivõitluses.
- Rivist ette jõudnud mees ootab või kohendab kohta külgsuunas; automaatne rivistumine ei käsi tal avamaal kaugest vastasest eemale kõndida.
- Takistusest möödumine, ummikus ruumi andmine, käsitsi liikumine, laskjate eemaldumiskäsk ning moraalipõhine füüsiline põgenemine säilivad.

## Kontroll

TEST_V98: päris 500 mehe pronksiaja maastik, esimesed 30 lahingusekundit. Kõik 20 odameeste salka edenesid 90,6–94,4 meetrit. Üle 70% meestest korraga tagasisammu tegev juhtum: 1 kogu 42 salga ja 600 sammu kohta. Väiksemad üksikute meeste takistus- ja rivikohendused on lubatud. Üle 2 sekundi möödumist loetud salga keskme >2,5 cm tagasisamme: v97 2321, v98 389 (sisaldab vankreid ja takistusi).

TEST_V96: kogu 500 mehe maastikulahing lõppes 160,95 lahingusekundiga; 441 meest jõudis lähivõitlusse, esimene lähivõitlus 26,3 s, esimene moraalimurdumine 34,35 s. 432 langenut + 49 väljunud + 19 kaardile jäänud = 500. Löögid jäid relva tegelikku ulatusse.

TEST_V97: iga mees ületab punase joone ise, võit ootab põgenejate väljumist, takistusest möödumine.

TEST_V94: kilbirivi, rivivahetus, suunapõhine kaitse, kogupauk ja 192 mehe püssi-/oda-/ratsaväelahing (176,65 s).

Brauser: TEST_V96_UI kinnitas 14 võitleja tegelikku lähikontakti (maksimaalne löögikaugus 1,703 m, oda ulatus 1,73 m), V98 pealkirja ja põhimängu avanemise, JavaScripti vigadeta. TEST_V97_UI kinnitas esmalt 34 väljunud ja 216 alles jooksvat meest ning lõpuks kõigi 250 mehe füüsilise piiriületuse, JavaScripti vigadeta.

Avamaal kontrollitud 500 mehe lahing lõppes 142 lahingusekundiga: 422 langenut, 53 väljunud ja 25 kaardile jäänud meest. Vähim kehade vahe oli 0,020 m: üksikud mehed ei kattunud. Juhtpunkt ootab ainult siis, kui see on marsisuunas meestest ees; taga olev punkt võib neile järele jõuda. Vaenlane salga taga lubab ümberpööramise. Võrguta simulatsioonis hoiab põgeneja valitud väljapääsu, mitte ei vaheta seda igal sammul.
