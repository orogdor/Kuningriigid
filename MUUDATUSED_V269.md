# V269 — maailmakaardi linnad detailkaardi kujuga

- Kiviaja linn maailmakaardil ei ole enam üldine „asula“ mudel: iga linna hoone on joonistatud oma
  detailkaardi kohale ja suunas, nii et linn on sama kujuga nagu detailkaardil.
- Hoonete mudelid on detailkaardi mudelitest tehtud ülilihtsad koopiad (`models-world-v269/`, 18 tüüpi,
  ~500 kolmnurka, värvid tippudes, tekstuurideta; detailkaardi kaugvaates on 6000+).
  Tegemine: `tools/world-lod-v269-blender.py` — tekstuuri värv tippudesse, õhukestele pindadele paksus,
  vokselremesh (kinnine kuju), värv tagasi, vähendamine. Iga tüüp = üks InstancedMesh linna kohta.
- Maailmakaardi puud ja kivid linna hoonete alt peidetakse.
- Mõõtkava: maailmakaardi puud ja väed on ~4× suuremad kui päris mõõdus, seepärast on hooned 6× ja
  paigutus 4,5× (ühtlaselt, kuju ei muutu).
- Teised ajastud kasutavad veel vana mudelit. Vana kiviaja välimus: `?worldcity269=0`.
