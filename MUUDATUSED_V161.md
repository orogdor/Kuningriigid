# Kuningriigid V161 – sujuvam detailkaart, ühtne maapind ja jalutamine

- Maakera kaardilt on eemaldatud põldude mustriline tekstuur.
- Maakera kaart ja detailkaart kasutavad nüüd sama maapinna värvi ja sama valgust:
  - sama koht näeb mõlemal kaardil ühesugune välja;
  - kõrb on mõlemal kaardil liivane, rohumaa mõlemal roheline;
  - linnaalade värviline kate on maakera kaardil palju õrnem, piirid jäid selgeks.
- Detailkaardil ruutude vahetamine on sujuvam:
  - varjutajaid ei kompileerita enam iga uue ruudu juures uuesti;
  - maastik arvutab ainult uue kolmandiku, varem arvutati kogu 3×3 ala uuesti;
  - rohi, lilled ja kivid on nüüd kõigil üheksal ruudul ning uued tükid tekivad mõne kaadri jooksul ilma pausita.
- Uus nupp **🧍 Walk** detailkaardil:
  - vajuta nuppu ja klõpsa kaardil kohta, kuhu tegelane panna;
  - kaamera läheb tegelase silmadesse;
  - WASD või nooled liigutavad, hiir pöörab (klõps lukustab hiire), Shift jookseb, Space hüppab, Esc väljub;
  - telefonis on vasak pool ekraani liikumiskang ja parem pool pööramiseks;
  - tegelane ei lähe läbi hoonete ega vette, kõnnib üle ruudupiiride ja jääb väljudes kaardile seisma;
  - mänguloogikat ja salvestusi see ei muuda.
