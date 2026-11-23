# Kuningriigid Godotis — 23.11.2026 vaheversioon

See on poolelioleva Godoti pordi täielik varukoopia koos mänguloogika, kasutajaliidese, 3D-mudelite ja tekstuuridega. Tegemist ei ole veel 1:1 valmis mänguga. Aluseks oleva veebimängu muud harud jäävad alles.

## Windowsis taastamine

1. Laadi sellest harust alla `TAASTA_GODOT.ps1`.
2. Ava PowerShell kaustas, kuhu soovid projekti saada, ning käivita `powershell -ExecutionPolicy Bypass -File .\TAASTA_GODOT.ps1`.
3. Skript vajab Git for Windowsit ja laadib internetist alla umbes 364 MB. See kontrollib faili SHA-256 väärtust ja taastab projekti kausta `Kuningriigid-Godot`.
4. Ava taastatud kaustas `project.godot` Godot 4.7.2 redaktoris ning oota, kuni mudelite ja tekstuuride esmane import lõpeb. Seejärel saad mängu käivitada Godotist või failiga `KAIVITA.bat`. Täiendavad juhised on failides `ALUSTA_SIIST.txt` ja `PORT_STATUS.md`.

Failid `pakiosad/` moodustavad ühe Git bundle'i, mis sisaldab kõiki projekti faile. Need ei ole eraldi käivitatavad. Projekt ei sisalda vanu teste ega demosid. SHA-256: `0fa0717485b1e2be649e4ab9a6a55fafcbbc31f15c613b5b19901c319d950f1c`.
