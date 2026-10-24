@echo off
setlocal
set "MAVEN_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "%MAVEN_NODE%" set "MAVEN_NODE=node.exe"
"%MAVEN_NODE%" "%~dp0_internal\tools\start-maven.mjs"
if errorlevel 1 pause
