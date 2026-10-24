# V131 → Godot 4, port 1.3: individuaalsed lahinguosalised

## Algversioon ja eesmärk

Lähteversioon: `orogdor/Kuningriigid` commit `26562368f56a32616651a266ed2d8c87f06d43d1`. Eesmärk on luua natiivne Godoti lahingusüsteemi võrdlusalus, säilitades pärismängu olulised reeglid. **See EI OLE täielik V131 lahingumootori 1:1 port.**

## Valmis osad

- `scripts/core/individual_battle_port.gd` — eraldi katse, mis ei eemalda V1.2 lihtsat kulumispõhist lahingut.
- 24 meest jalaväes/laskursalgas, 12 ratsaväes, 1 katapuldis; 500 võitlejat maksimaalselt. Üle piiri jäävad **terved salgad** reservi.
- Igal mehel on eraldi positsioon, tervis, laskemoon, jahtumisaeg ja isiklik kahjustus. Lahingus tervisekadu kantakse pärast lõppu tagasi algsele kampaaniaüksusele vaid korra. Põgenenud mehe tervis säilib.
- Automaatne sihtmärgi valik; manuaalrežiimis salk ei ründa ilma käsuta. Eraldi liikumis-, ründamis- ja taganemiskäsk.
- Rivistuste line/column/shield_wall/spear_wall/hold prototüübi kuju ja kiirus-/kaitsemõjud.
- Godoti `MultiMeshInstance3D` kuvab korraga elusad sõdurid. Lahingu testala ning punane väljumispiir on mootoris loodud võrgud, mitte Three.js-i renderdus.
- Salvestuse versioon v13 säilitab käimasoleva lahingu mehed, käsud ja laskemoonad. Varasemad katsesalvestused v12–v02 avanevad muutmata.
- 20 sekundi CSV-mõõtmises on lahenduse koormuse jaoks lisatud `individual_battle_men` ja `individual_battle_shots`.

## Olulised piirangud

- **Mõõtkava:** väike eraldi katseareen (u 64×50 loogikaühikut), mitte V131 3×3 maailma detailruutude maastik ega kindlus.
- Puuduvad täpsed ajaloolised taktikad, ratsaväe šokirünnakud, piiramismootor, seinad ja redelid, individuaalne kokkupõrke/teekonna vältimine, ballistika, täpsed animatsioonid ja originaalne sõdurite GLB-rig.
- Laskurid kasutavad lihtsustatud tabamiskalkulatsiooni; laskude arvu ja laskemoona jälgitakse, **lennuaega ega lendavaid nooli ei simuleerita**.
- Rivistus muudab katsepositsioone kohe. Täielik koordineeritud rivis liikumine ja takistuste arvestus puuduvad.
- Taganenud üksused säilitavad elusad mehed, kuid ohutu maailmakaardi taganemissihtkoha otsing on järgmise etapi töö; ajutine 30 sekundi kokkupõrkepiirang takistab viivitamatut korduslahingut.
- Sõdurid on lihtsad kapselvormid, mitte originaalsed 3D-animatsioonid. Kaardistamine olemasolevate V131 mudelitega tuleb hiljem.
- Meeste maksimum 500 ja ajasamm 0,1 s on reeglid, kuid Godoti tegelik Androidi FPS pole mõõdetud.

## Test ja käivitamine

Projekt: `project.godot`, stseen `scenes/Main.tscn`. Androidil ava Godot 4 Editoris ja käivita.

1. `Armee demo`, seejärel `24-mehe lahing`.
2. `Auto / manuaal`, `Rivistus`, `Rünnakukäsk`, `Liikumiskäsk` või `Tagane` juhivad esimest mängija salka.
3. `Paus` ja `20s test` aitavad võrrelda kaadriaega.
4. `Salvesta` / `Laadi` peavad säilitama poolelioleva lahingu.
5. `Reeglitest` ettevalmistatud 240 väidet; nende läbimine eeldab Godoti mootorit.

Lokaalsed struktuurikontrollid: `python tools/validate_package.py`, `python tools/verify_v12_static.py`, `python tools/verify_native_wiring.py`. Need ei ole GDScripti kompilaator ega testide käivitaja. Päris Godoti käivitustest **tegemata**.
