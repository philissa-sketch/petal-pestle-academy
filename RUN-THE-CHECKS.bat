@echo off
title Petal and Pestle - run the checks
cd /d "%~dp0"

echo.
echo   ==========================================
echo    PETAL ^& PESTLE - THE CHECKS
echo   ==========================================
echo.
echo   Run this BEFORE you commit in GitHub Desktop.
echo.
echo   These are two different jobs:
echo.
echo     THIS FILE   - checks the app is not broken
echo     GitHub      - saves the change and publishes it
echo.
echo   Netlify runs these checks too, and a red one
echo   stops the site updating. But that is the SECOND
echo   pair of eyes. This is the first.
echo.
echo   ------------------------------------------
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
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo   Setup failed. Check the internet connection and try again.
    pause
    exit /b 1
  )
  echo.
)

call npm run check
set CHECKRESULT=%errorlevel%

echo.
echo   ------------------------------------------
echo.

if %CHECKRESULT% neq 0 (
  echo   SOMETHING DID NOT PASS.
  echo.
  echo   Scroll UP in this window. Each check prints what
  echo   it found and why it matters.
  echo.
  echo   DO NOT COMMIT YET. Netlify would refuse this and
  echo   the site would stay on the old version - which is
  echo   the safe outcome, but you would not know why.
  echo.
  pause
  exit /b 1
)

echo   ALL CHECKS PASSED.
echo.
echo   Safe to commit in GitHub Desktop and push.
echo.
pause
