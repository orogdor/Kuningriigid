# Kuningriigid V50 – kiviaja ehitaja ja ajastute ehitusuuendus

## Peamised muudatused

1. **Uus Mudelitehas 1000/2 ehitajate seeria**
   - Lisatud 7 uut ehitajamudelit:
     - `stone_builder`
     - `bronze_builder`
     - `iron_builder`
     - `medieval_builder`
     - `renaissance_builder`
     - `industrial_builder`
     - `modern_builder`
   - Kõik on alla 1000 nelinurga.
   - GLB failid asuvad kaustas `models-v50/`.

2. **Igal ajastul erinev ehitaja mängus**
   - Linnade ehitajad vahetavad nüüd mudelit automaatselt vastavalt ajastule.
   - Ehituskiirus kasvab ajastuga:
     - Kiviaeg ×1.00
     - Pronksiaeg ×1.20
     - Rauaaeg ×1.40
     - Keskaeg ×1.70
     - Renessanss ×1.95
     - Tööstusajastu ×2.25
     - Moodne ajastu ×2.60

3. **Avastusaken puhastatud**
   - Tehnoloogiapuu näitab nüüd ainult:
     - juba uuritud tehnoloogiaid,
     - aktiivset uurimist,
     - järjekorras olevaid uurimisi,
     - tehnoloogiaid, mida on praegu päriselt võimalik valida.
   - Lukus ja veel mittealustatavad teemad on peidetud.

4. **UI parandused ehitajatele**
   - Tööjõu vaates kuvatakse aktiivne ehitajatase ja selle kiirus.
   - Ehitusjärjekord kasutab nüüd õiget ehituskiirust ka aja hinnangus.
   - Ehitusnupud näitavad aktiivse ehitaja taset.

5. **Mudelite vaatlus**
   - Lisatud `MUDELID_V50.html`, kus saab kõiki uusi ajastu ehitajaid eraldi vaadata ja testida.

## Test

- Lisatud `TEST_V50.mjs`
- Tulemus: edukas
- Kontrollitud:
  - 14 inimese arhetüüpi
  - 7 ajastupõhist ehitajat
  - geomeetria vahemikus 300–1000 quadi
  - rigide ja animatsiooni põhitoimimine
