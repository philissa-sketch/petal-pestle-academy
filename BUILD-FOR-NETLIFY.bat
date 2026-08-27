@echo off
title Petal and Pestle - build the site to upload by hand
cd /d "%~dp0"

echo.
echo   ==========================================
echo    PETAL ^& PESTLE - BUILD THE SITE
echo   ==========================================
echo.
echo   USE THIS WHEN YOU HAVE NO NETLIFY BUILD MINUTES LEFT.
echo.
echo   Normally: you push in GitHub Desktop, and Netlify
echo   builds the site on their computers. That is what
echo   uses up build minutes.
echo.
echo   This file builds the site HERE on your computer
echo   instead, so Netlify only has to receive it.
echo   Uploading an already-built folder does NOT use
echo   build minutes.
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

echo   STEP 1 OF 2 - running the checks.
echo.
echo   This matters more than usual today. When Netlify builds
echo   the site, it runs these checks itself and a red one stops
echo   the site updating. Uploading a folder by hand SKIPS that.
echo   So this is the only thing standing in the way.
echo.

call npm run check
if errorlevel 1 (
  echo.
  echo   ------------------------------------------
  echo.
  echo   SOMETHING DID NOT PASS. NOTHING WAS BUILT.
  echo.
  echo   Scroll UP. Each check prints what it found.
  echo   Do NOT upload anything until this is green -
  echo   there is no second pair of eyes this way.
  echo.
  pause
  exit /b 1
)

echo.
echo   Checks passed. STEP 2 OF 2 - building.
echo.

call npm run build
if errorlevel 1 (
  echo.
  echo   THE BUILD FAILED. Nothing was uploaded and the
  echo   live site is untouched. Scroll up for the reason.
  echo.
  pause
  exit /b 1
)

echo.
echo   ==========================================
echo    DONE. THE SITE IS BUILT.
echo   ==========================================
echo.
echo   A folder called  dist  is now in:
echo.
echo     %CD%
echo.
echo   NOW DO THIS:
echo.
echo     1. Go to  https://app.netlify.com  and sign in.
echo     2. Open your site, then the  Deploys  tab.
echo     3. Drag the  dist  folder onto the box that says
echo        you can drag a folder there to deploy.
echo     4. Wait for it to say Published.
echo.
echo   Then open the site and check the version in the
echo   top corner is the one you expect. If it is not,
echo   the upload did not land.
echo.
echo   ------------------------------------------
echo.
echo   DRAG THE  dist  FOLDER ITSELF - not the files
echo   inside it, and not this whole project folder.
echo   Dragging the project folder makes Netlify build
echo   it on their computers, which is the thing you
echo   are trying to avoid.
echo.
pause
