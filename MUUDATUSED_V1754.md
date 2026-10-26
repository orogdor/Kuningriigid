# Kuningriigid V175.4 — sirge/kumer müür, päris puuteehitus, väravad ja teed

26.10.2026

## Parandused

- Ehitamise tööriistal on jätkuvalt eraldi **Sirge** ja **Kumer** valik (V175.2). Tõmme joonistatakse esmalt eelvaatena ja vabastamisel ehitatakse päris tasulised müürilõigud, kuni 10 lõiku korraga.
- V175.3 lisatud müürijuppide ~0,52 m üleulatuvaid ühendusotsi säilitatakse mõlemas režiimis.
- V175.4 `wallCrossesGateOpeningV175` ja `Civilization.previewBuild` väldivad uue palisaadilõigu ehitamist olemasoleva puit- või kivivärava avasse; konstruktsioon võib jätkuda väravapostide kõrval.
- V175.4 ehituse eelvaade valideerib planeeritud lõikude hinna, järjekorra mahu, maastiku ja olemasolevate hoonete/väravate piirid **enne ressursi kulutamist**. Punane eelvaade ja selge eestikeelne veateade eristavad sobimatut kohta rohelisest. Enne alustamist vigase plaani puhul ei ehitata ühtegi tükki; võimalikke ehitamisel tekkivaid tõrkeid näidatakse samuti.
- `detail-roads.js` suunab liiklusest juba olemasolevate maailma-teede visuaalsed lõigud ümber müüri läbi kohaliku navigatsioonivõrgu ja avatava väravakoridori. Kui ohutu tee puudub, jäetakse läbiv riba joonistamata. Seda ei saavutata tee võltsimise, salvestatud `heat` muutmise ega mobiili kaardi väljalülitamisega.
- Jalakäijate tekkivate teeribade geomeetria arvestab värava kahe reaalse postiga; keskne läbipääs jääb kujutatavaks.

## Tõestatud toimivus

- [V175.4 päris mobiilipuute ehitus](https://github.com/orogdor/Kuningriigid/actions/runs/40350892850) — **PASS**:
  - Arvutil 1 päris sirge müürilõik, hinnaks 3 puitu.
  - Telefonivaates Chromiumi päris `Input.dispatchTouchEvent` sündmustega 1 päris sirge müürilõik, 3 puitu.
  - **Kumer müür telefonis: 2 päriselt ehitatud lõiku, maha arvestati 6 puitu**. See ei ole üksnes hiirega joonistatud eelvaade.
  - 169 nähtavat detailkaardi teerakku jäid testlinna alles, salvestusi ei kirjutatud juhuslikult üle.
- [V175.4 värava-, tee- ja füüsikatest](https://github.com/orogdor/Kuningriigid/actions/runs/40351645542) — **PASS**:
  - Päris V174 Sogni linnas 2 avatavat puitväravat, mis jäävad navigeeritavaks.
  - Müürilõik ei saa väravat sulgeda; tavaline palisaad blokeerib liikumist.
  - Maailmakaardi tee järgib vajadusel värava juurde viivat läbitavat trajektoori (22 navigeerimise sõlme teststsenaariumis).
  - Jalgsi sissekäidud tee on endiselt nähtav; värava vahele loodi 17 kulunud rajarakku ja 96 riba tipupunkti.
  - V175.3 sirgete ja kumerate lõikude ühendus-, V59/V80 loomulike teede ja V73 varasemate V4 salvestuste testid **PASS**.

## Mängitav demo

[**Ava V175.4 – Sogn kiviaja lõpus**](https://orogdor.github.io/Kuningriigid/?v=1754-20261026&demo=ai-stone-v174)

Kasutamine: Build → Palisade → **Sirge** või **Kumer**. Lohista sõrmega üle kaardi ning vabasta; roheline joon lubab ehitada, punane joon annab põhjuse, miks ei tohi ehitada.

## Piirangud ja järgmised sammud

- Browser QA emuleeris 390 × 844 Androidi viewport'i ja kasutas Chromiumi puutesündmusi. Päris füüsilisel telefonil (eri GPU, puudutuste ajastus) ei ole veel mõõdetud FPS-i.
- V175.4 ei lisa uut ringikujulist automaatset linnakaitse AI-generatsiooni ega mitme-kilomeetrise linnamüüri joonistusrežiimi; kumeraid juppe saab siiski järjest joonistada.
- Ümber ehitatud sõdurite rünnakurežiim ja purustatud müürist läbipääsemine nõuavad eraldi lahingustsenaariumi põhjalikku testi.
