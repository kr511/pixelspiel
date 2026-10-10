@echo off
title pixelgame
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js fehlt. Bitte Node.js installieren: https://nodejs.org/
  pause
  exit /b 1
)
node scripts\serve-local.mjs
pause
