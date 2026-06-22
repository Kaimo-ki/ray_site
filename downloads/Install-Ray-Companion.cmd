@echo off
setlocal
set "APP_DIR=%LOCALAPPDATA%\RayWeb"
set "SCRIPT_FILE=%APP_DIR%\Ray-Companion.ps1"
set "ICON_FILE=%APP_DIR%\ray.ico"

if not exist "%APP_DIR%" mkdir "%APP_DIR%"

echo.
echo Telegram bot username.
echo Default: rey_helper_bot
set /p BOT_USERNAME=Bot username without @, or press Enter for default: 
if "%BOT_USERNAME%"=="" set "BOT_USERNAME=rey_helper_bot"
set "BOT_URL="
if not "%BOT_USERNAME%"=="" set "BOT_URL=https://t.me/%BOT_USERNAME%"

powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri 'https://kaimo-ki.github.io/ray_site/downloads/Ray-Companion.ps1' -OutFile '%SCRIPT_FILE%' -UseBasicParsing"
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -Uri 'https://kaimo-ki.github.io/ray_site/downloads/ray.ico' -OutFile '%ICON_FILE%' -UseBasicParsing } catch { }"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$config = @{ botUrl = '%BOT_URL%'; siteUrl = 'https://kaimo-ki.github.io/ray_site/' } | ConvertTo-Json; Set-Content -LiteralPath '%APP_DIR%\companion.json' -Value $config -Encoding UTF8"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$desktop = [Environment]::GetFolderPath('Desktop');" ^
  "$programs = [Environment]::GetFolderPath('Programs');" ^
  "$startDir = Join-Path $programs 'Ray';" ^
  "New-Item -ItemType Directory -Force -Path $startDir | Out-Null;" ^
  "$shell = New-Object -ComObject WScript.Shell;" ^
  "$target = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe';" ^
  "$args = '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""%SCRIPT_FILE%""';" ^
  "foreach ($path in @((Join-Path $desktop 'Ray Companion.lnk'), (Join-Path $startDir 'Ray Companion.lnk'))) {" ^
  "  $shortcut = $shell.CreateShortcut($path);" ^
  "  $shortcut.TargetPath = $target;" ^
  "  $shortcut.Arguments = $args;" ^
  "  if (Test-Path '%ICON_FILE%') { $shortcut.IconLocation = '%ICON_FILE%'; }" ^
  "  $shortcut.WorkingDirectory = '%APP_DIR%';" ^
  "  $shortcut.Save();" ^
  "}"

start "" powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%SCRIPT_FILE%"
echo Ray Companion installed. A floating Ray button should appear now.
pause
