## 1.7: parandused ja pronkslinna vallutamise test

- **Kriitiline parandus:** `scripts/core/trade_network_port.gd` reas 248 oli vigane `if` taane. 1.7 sisaldab 1.6.1 parandust, eraldi paranduspakk pole vajalik.
- Piiramistorn: 75 puitu, 120 s ehitus, 1.15 ühikut/s lükkamine; jõudmisel avaneb kaks ronimisrada (lihtsustatud mudel).
- Ramm: 55 puitu, 90 s ehitus, 1 ühik/s lükkamine; kohale jõudmise järel kahjustab väravat iga 3 sekundi järel V131 struktuurikordajaga.
- Müürile roninud jalavägi võitleb tornikaitsjatega samal kõrgusel; eraldi lähivõitluse tuum.
- Linnasüdame hõivamine: kui sõdurid sisenevad ja kaitsjad ei ole keskel, väheneb linnasüdame 600 HP; võidu logisse läheb vallutuse tõend. Katselahing **ei muuda mängukaardil oleva linna omanikku**.
- Nupud: „Piiramistorn (75 puitu)”, „Ramm (55 puitu)” ja „Hõiva linnasüda”.
- Kaubanduse probleemsele `if`-plokile lisati automaatne süntaktilise taande kontroll.

### Piirangud

Ainult osaline piiramisport. Ehitamise ajal on meeskonna olemasolu lihtsustatud; piiramistornide füüsika ja kõik V131 müürikõrguse/tulejoone reeglid ei ole üks-ühele. 3D-kuvad on geomeetrilised prototüübid; mängu algsed GLB-failid ei ole ZIP-iga kaasas. Godoti mootorit pole selles töökeskkonnas, seega **käivitamist ja kontrollväidete läbimist ei ole kinnitatud**.
