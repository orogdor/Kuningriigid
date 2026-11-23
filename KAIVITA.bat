@echo off
setlocal
set "GODOT_EXE=E:\cargame\Godot_v4.7.2-stable_win64.exe"
if exist "%GODOT_EXE%" goto run
set "GODOT_EXE=%~dp0Godot_v4.7.2-stable_win64.exe"
if exist "%GODOT_EXE%" goto run
where godot.exe >nul 2>&1
if errorlevel 1 goto missing
set "GODOT_EXE=godot.exe"
goto run
:missing
echo Godot 4.7.2 ei leitud. Ava project.godot Godotis voi lisa Godot sellesse kausta.
pause
exit /b 1
:run
"%GODOT_EXE%" --path "%~dp0."
exit /b %errorlevel%
