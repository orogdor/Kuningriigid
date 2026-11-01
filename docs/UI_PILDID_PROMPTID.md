# Kuningriigid: UI-piltide promptid (ChatGPT / FLUX)

## Kuidas teha
1. Kopeeri iga pildi jaoks **STIIL** + selle rea prompt (inglise keeles annab ühtlasema tulemuse).
2. Üks ikoon ühe pildina, **1024×1024, läbipaistev taust (PNG)**. Kui läbipaistvat ei tule: ühtlane
   puhas valge taust, ma lõikan selle ise välja.
3. Failinimi = tabeli esimene veerg (nt `res_wood.png`). Laadi siia üles kas ükshaaval või ZIP-ina.
4. Kui esimene pilt meeldib, kirjuta ChatGPT-le: *"Same style, same lighting, same frame as the previous
   image"* + järgmine prompt. Nii jäävad kõik ikoonid ühte stiili.

## STIIL (pane iga prompti ette)
```
Game UI icon for a historical real-time strategy game. Hand-painted, slightly stylized realism,
warm natural colours, soft top-left light, crisp dark outline, readable at 32 pixels.
Single centered object, no text, no letters, no frame, transparent background.
```

## 1. Ressursid (kõige tähtsam, ülemine riba)
| Fail | Prompt |
|---|---|
| res_wood.png | a small stack of three freshly cut logs with bark |
| res_plank.png | a neat bundle of sawn wooden planks tied with rope |
| res_stone.png | a pile of rough grey quarry stones |
| res_cutstone.png | two square cut stone blocks with chisel marks |
| res_food.png | a round loaf of rustic bread with a piece of roasted meat |
| res_grain.png | a sheaf of golden wheat tied with straw |
| res_flour.png | a small linen sack of flour, slightly open |
| res_water.png | a wooden bucket full of clear water |
| res_gold.png | a few rough gold coins and a small nugget |
| res_clay.png | a lump of wet reddish clay |
| res_pottery.png | a simple Neolithic clay pot with incised pattern |
| res_copper.png | a chunk of green-tinged copper ore |
| res_tin.png | a chunk of dull silver-grey tin ore |
| res_bronze.png | a cast bronze ingot, warm golden-brown |
| res_ore.png | a lump of rusty iron ore |
| res_coal.png | a pile of black charcoal pieces |
| res_iron.png | a dark forged iron bar |
| res_weapons.png | a crossed sword and spear |
| res_population.png | three small simple human silhouettes, warm brown |

## 2. Kiviaja ehitised (ehitusmenüü)
| Fail | Prompt |
|---|---|
| bld_hall.png | a large Stone Age longhouse with thatched roof and smoke from the roof hole |
| bld_house.png | a small round Stone Age hut with thatched roof |
| bld_lumber.png | a flint axe stuck in a tree stump with logs nearby |
| bld_forester.png | a young sapling being planted, small wooden stake beside it |
| bld_quarry.png | a rock face with a stone hammer and loose stones |
| bld_hunter.png | a hunter's hut of hides with a spear leaning against it |
| bld_well.png | a simple stone-lined well with wooden frame |
| bld_farm.png | a small tilled field with a wooden hoe |
| bld_pasture.png | a woven wattle fence pen with two sheep |
| bld_cellar.png | a dug-in earth food store with a wooden door |
| bld_mason.png | a stone worker's bench with a chisel and a cut block |
| bld_watchtower.png | a tall wooden watchtower on four poles with a ladder |
| bld_stonewall.png | a low dry-stone wall segment |
| bld_barracks.png | a wooden training yard with spears in a rack |

## 3. Kiviaja üksused (valikupaneel, armee)
| Fail | Prompt |
|---|---|
| unit_axeman.png | portrait bust of a bearded Stone Age warrior with a flint axe and fur shoulder, facing three-quarter |
| unit_spearman.png | portrait bust of a Stone Age spearman with a long wooden spear and fur vest, three-quarter view |
| unit_slinger.png | portrait bust of a young Stone Age slinger holding a leather sling, three-quarter view |
| unit_settler.png | portrait bust of a Stone Age settler carrying a bundle on the back |
| unit_worker.png | portrait bust of a Stone Age villager with a stone tool |
| unit_scout.png | portrait bust of a lean Stone Age scout with a torch, looking into the distance |

## 4. Käsud ja nupud (alumine riba)
| Fail | Prompt |
|---|---|
| cmd_move.png | a footprint trail with an arrow |
| cmd_attack.png | two crossed flint spears |
| cmd_stop.png | an open raised hand made of carved wood |
| cmd_build.png | a stone hammer and a wooden beam |
| cmd_research.png | a glowing clay tablet with carved symbols |
| cmd_map.png | a rolled leather map |
| cmd_explore.png | a burning torch and a compass-like carved stone |
| cmd_city.png | a small cluster of huts behind a palisade |
| cmd_army.png | a group of three spear tips raised together |
| cmd_pause.png | an hourglass made of wood and sand |

## 5. Paneelide taustad (kaks pilti, 1536×1024, ilma läbipaistvuseta)
| Fail | Prompt (STIILI asemel kasuta seda) |
|---|---|
| panel_stone.png | seamless tileable texture of stretched tanned animal hide with subtle stitching, soft and dark enough for white text on top, no objects, top-down flat lighting |
| panel_frame.png | an empty rectangular frame made of weathered wooden sticks bound with leather cords, transparent centre and background, game UI border, flat front view |

## Järjekord
Alusta **1. ressurssidest** ja **4. käskudest**: need on kogu aeg ekraanil ja annavad kõige suurema
muutuse. Ülejäänud võib tulla hiljem.
