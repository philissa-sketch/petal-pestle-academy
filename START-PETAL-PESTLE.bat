@echo off
title Petal and Pestle Academy
cd /d "%~dp0"

echo.
echo   ==========================================
echo    PETAL ^& PESTLE ACADEMY
echo   ==========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo   Node.js is not installed on this computer.
  echo   Download it from https://nodejs.org  ^(pick the LTS button^),
  echo   install it, then run this file again.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo   First-time setup. This downloads what the app needs.
  echo   It takes a few minutes and only happens once.
  echo   You need internet for this part only.
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo   Setup failed. Check the internet connection and try again.
    pause
    exit /b 1
  )
  echo.
  echo   Setup finished. Running the built-in checks...
  echo.
  call npm run check
  if errorlevel 1 (
    echo.
    echo   A check did not pass. The app may still run - press a key to try.
    pause
  )
)

echo   Starting up. Your browser will open on its own.
echo.
echo   Leave this black window OPEN while she works.
echo   Closing it shuts the app down.
echo.
call npm run dev

echo.
echo   Petal ^& Pestle has stopped. You can close this window.
pause
