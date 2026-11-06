# Kuningriigid – väikeobjektide CCORE 4B töövoog (otsus 2026-11-06)

## Püsiv otsus
Kasutada **CCORE Qwen3.5-4B-GLB-3D-Coder** esmase lahendusena kõikide **lihtsate ja väikeste staatiliste mänguobjektide** puhul: kirved, odad, mõõgad, kilbid, tööriistad, korvid, pakid, vaadid, kastid, kotid, tarbed, väikesed dekoratsioonid ja sarnased objektid.

**Puud ja tihedad metsad on erand**: CCORE männikatse tulemust ei kiidetud heaks. Puude jaoks kasutada eraldi taimestiku-LOD töövoogu (vt `docs/PUUDE_JA_METSADE_LOD_KAVAND.md`). Ka automaatselt genereeritud objekt ei ole heakskiidetud ainult seetõttu, et kood töötab.

## Allikad ja läbiviidud test
- AI: https://huggingface.co/ccore/Qwen3.5-4B-GLB-3D-Coder (Apache-2.0); Q4_K_M GGUF ligikaudu 2,7 GB.
- 2026-11-06 CCORE käivitus Hugging Face'i GPU töös edukalt ning väljastas täieliku HTML/Three.js mudeligeneraatori koodi koos GLB-ekspordi funktsiooniga.
- Selle katse lähtekood hoitakse eraldi katselises harus: `experimental/ccore-pine-4b-test/experiments/ccore-pine4b-generated.html`; see **ei ole kinnitatud mängukõlblik GLB ega sobiv puumudel**.
- Kontrollitav HF töö: https://huggingface.co/jobs/Orogdor/6aed614c0e0338d1bb80e3ef
- Käivitusraamistik: llama.cpp CUDA, `/app/llama-cli`, mudel `ccore/Qwen3.5-4B-GLB-3D-Coder:Q4_K_M`, ühevooruline genereerimine. Mõistlik on anda piisavalt suur väljundtokenite eelarve, muidu kulub kogu väljund kavandamisele. HF GPU arvutuskulu/saadavus tuleb iga uue töö puhul enne arvestada.

## Vaikimisi tootmisprotsess
1. **Objekti spetsifikatsioon**: üks objekt korraga, mõõdud, värvid/materjalid, soovitud ajastu, vajalikud osad, Y-up, alumine kontaktpunkt Y=0, objekt keskendatud, esikülje suund, eeldatav kasutussuurendus ning kolmnurkade ülempiir.
2. **CCORE 4B** genereerib Three.js geomeetriat ehitava HTML/JavaScript faili. Genereeritud kood käivitada turvalises isoleeritud keskkonnas; ärge käivitage tundmatut koodi salajaste tunnuste või ligipääsudega.
3. **Automaatne eksport** GLB vormingusse (GLTFExporter või kontrollitud Blenderi teisendus); eksporditud faili avamine ja parsimine on kohustuslik. Ära loe HTML-i olemasolu edukaks GLB-ks.
4. **Geomeetriakontrollid**: tegelik kolmnurkade arv, tippude arv, mittetühjad võrgud, mõõtkava, Y=0 põhi, kaduvad/eraldunud detailid, vigased normaalid, leke, vale suund ja tahtmatud alusplaadid. Kontrolli objekti eri nurkadest.
5. **Visuaalne eelvaade**: salvestada päris eksporditud GLB render ees/külg/taga/ülevalt ning realistliku mängukaamera kauguselt; hinnata kuju äratuntavust ja ajastustiili. Katsetada vajaduse korral 2–4 varianti ning valida näidispiltide alusel, mitte automaattesti põhjal.
6. **LOD**: valmistada sõltuvalt objekti suurusest vähemalt lähivaade ning lihtne kaugvariant või jagatud instantsgeomeetria; väiksema mudeli detailsus ei tohi rikkuda siluetti.
7. **Mängutest**: lisada alles heakskiidu järel katselisse mänguharusse. Kontrollida nii Three.js kui Godoti importi juhul, kui objekt on mõlemale vajalik. Põhiharusse alles pärast nähtavat kontrolli ja regressiooniteste.
8. **Dokumentatsioon**: iga heakskiidetud mudeli juurde allikas, litsents, mudeli loomise prompt/retsept, mõõdud, kolmnurkade arv, GLB fail, LOD väärtused ja kontrollpilt.

## Esialgsed eelarved (suunavad, mitte garanteeritud)
- Üksik lihtne ese või pakk: 100–400 kolmnurka.
- Kirves, oda, mõõk, vibu: 150–600.
- Korv, savinõu, kott: 200–700.
- Käru, tööpink või suurem tarbeese: 400–1500.
Välimuse hinnang määrab lõpliku eelarve; ebameeldiva mudeli puhul ei aita formaalselt sobiv kolmnurkade arv.

## Kvaliteedipõhimõtted
- Kasutaja poolt tagasilükatud katset **ei levitata automaatselt** mängu.
- Eelvaade peab olema **reaalsest GLB-st**, mitte illustratsioonist.
- Põhimudel jääb puutumata, kuni uus mudel on kinnitatud.
- Sama välimusega vara võiks kasutada instancingut ja värvivariatsioone, mitte tuhandeid eraldi draw call'e.
- Puud ja tihedad metsad lähevad eraldi puude/LOD/atlas-töövoogu.
