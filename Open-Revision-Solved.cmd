@echo off
setlocal
rem Open the hosted app so daily revision continues with the existing saved data.
set "REVISION_URL=https://revision-solved.kapiltripathi267.chatgpt.site"
set "REVISION_CHROME="
for /f "delims=" %%I in ('where chrome.exe 2^>nul') do if not defined REVISION_CHROME set "REVISION_CHROME=%%I"
if not defined REVISION_CHROME if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" set "REVISION_CHROME=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
if not defined REVISION_CHROME if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "REVISION_CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined REVISION_CHROME if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "REVISION_CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined REVISION_CHROME (
  echo Google Chrome could not be found. Open this address in Chrome:
  echo %REVISION_URL%
  pause
  exit /b 1
)
start "" "%REVISION_CHROME%" "%REVISION_URL%"
exit /b %errorlevel%
