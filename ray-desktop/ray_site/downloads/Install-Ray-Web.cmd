@echo off
setlocal
set "APP_URL=https://kaimo-ki.github.io/ray_site/"
set "APP_NAME=Ray"
set "APP_DIR=%LOCALAPPDATA%\RayWeb"
set "ICON_FILE=%APP_DIR%\ray.ico"

if not exist "%APP_DIR%" mkdir "%APP_DIR%"

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -Uri 'https://kaimo-ki.github.io/ray_site/downloads/ray.ico' -OutFile '%ICON_FILE%' -UseBasicParsing } catch { }"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$edge = Join-Path ${env:ProgramFiles(x86)} 'Microsoft\Edge\Application\msedge.exe';" ^
  "$edge2 = Join-Path $env:ProgramFiles 'Microsoft\Edge\Application\msedge.exe';" ^
  "$chrome = Join-Path $env:ProgramFiles 'Google\Chrome\Application\chrome.exe';" ^
  "$chrome2 = Join-Path ${env:ProgramFiles(x86)} 'Google\Chrome\Application\chrome.exe';" ^
  "$browser = @($edge,$edge2,$chrome,$chrome2) | Where-Object { Test-Path $_ } | Select-Object -First 1;" ^
  "$desktop = [Environment]::GetFolderPath('Desktop');" ^
  "$programs = [Environment]::GetFolderPath('Programs');" ^
  "$startDir = Join-Path $programs 'Ray';" ^
  "New-Item -ItemType Directory -Force -Path $startDir | Out-Null;" ^
  "$shell = New-Object -ComObject WScript.Shell;" ^
  "foreach ($path in @((Join-Path $desktop 'Ray.lnk'), (Join-Path $startDir 'Ray.lnk'))) {" ^
  "  $shortcut = $shell.CreateShortcut($path);" ^
  "  if ($browser) { $shortcut.TargetPath = $browser; $shortcut.Arguments = '--app=https://kaimo-ki.github.io/ray_site/ --new-window'; }" ^
  "  else { $shortcut.TargetPath = 'https://kaimo-ki.github.io/ray_site/'; }" ^
  "  if (Test-Path '%ICON_FILE%') { $shortcut.IconLocation = '%ICON_FILE%'; }" ^
  "  $shortcut.WorkingDirectory = '%APP_DIR%';" ^
  "  $shortcut.Save();" ^
  "}" ^
  "if ($browser) { Start-Process $browser '--app=https://kaimo-ki.github.io/ray_site/ --new-window' } else { Start-Process 'https://kaimo-ki.github.io/ray_site/' }"

echo Ray Web installed. Check Desktop and Start Menu.
pause
