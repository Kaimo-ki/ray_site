@echo off
setlocal
set "APP_DIR=%LOCALAPPDATA%\RayWeb"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$desktop = [Environment]::GetFolderPath('Desktop');" ^
  "$programs = [Environment]::GetFolderPath('Programs');" ^
  "$startDir = Join-Path $programs 'Ray';" ^
  "Get-CimInstance Win32_Process | Where-Object { ($_.Name -eq 'powershell.exe' -or $_.Name -eq 'pwsh.exe') -and $_.CommandLine -like '*Ray-Companion.ps1*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue };" ^
  "Remove-Item -LiteralPath (Join-Path $desktop 'Ray.lnk') -Force -ErrorAction SilentlyContinue;" ^
  "Remove-Item -LiteralPath (Join-Path $desktop 'Ray Companion.lnk') -Force -ErrorAction SilentlyContinue;" ^
  "Remove-Item -LiteralPath $startDir -Recurse -Force -ErrorAction SilentlyContinue;" ^
  "Remove-Item -LiteralPath '%APP_DIR%' -Recurse -Force -ErrorAction SilentlyContinue;"

echo Ray shortcuts and local files were removed.
echo If Ray was installed through Chrome/Edge as a browser app, remove it in browser apps/settings too.
pause
