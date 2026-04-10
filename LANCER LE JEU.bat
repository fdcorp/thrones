@echo off
setlocal
title Thrones — Lancement du jeu

:: ─────────────────────────────────────────
::  1. Verification de Node.js
:: ─────────────────────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
    cls
    echo.
    echo  ============================================================
    echo   THRONES — Installation requise
    echo  ============================================================
    echo.
    echo   Node.js n'est pas installe sur cet ordinateur.
    echo   C'est necessaire pour faire tourner le jeu.
    echo.
    echo   1. La page de telechargement va s'ouvrir.
    echo   2. Telechargez et installez Node.js LTS ^(bouton vert^).
    echo   3. Redemarrez l'ordinateur.
    echo   4. Relancez ce fichier .bat.
    echo.
    echo  ============================================================
    echo.
    pause
    start "" "https://nodejs.org/en/download"
    exit /b 1
)

:: ─────────────────────────────────────────
::  2. Aller dans le dossier client
:: ─────────────────────────────────────────
cd /d "%~dp0client"

:: ─────────────────────────────────────────
::  3. Installation des dependances si absent
:: ─────────────────────────────────────────
if not exist "node_modules\" (
    cls
    echo.
    echo  ============================================================
    echo   THRONES — Premiere installation ^(une seule fois^)
    echo  ============================================================
    echo.
    echo   Installation des dependances du jeu...
    echo   Cela peut prendre 1 a 2 minutes.
    echo.
    npm install
    if %errorlevel% neq 0 (
        echo.
        echo   ERREUR lors de l'installation. Verifiez votre connexion.
        pause
        exit /b 1
    )
)

:: ─────────────────────────────────────────
::  4. Demarrer le serveur en arriere-plan
:: ─────────────────────────────────────────
cls
echo.
echo  ============================================================
echo   THRONES — Demarrage...
echo  ============================================================
echo.
echo   Le jeu va s'ouvrir dans votre navigateur dans quelques
echo   secondes. Ne fermez pas cette fenetre pendant la partie.
echo.
echo  ============================================================
echo.

start "Thrones — Serveur" /min cmd /c "npm run dev"

:: Attendre que Vite soit pret
timeout /t 5 /nobreak >nul

:: ─────────────────────────────────────────
::  5. Ouvrir le navigateur
:: ─────────────────────────────────────────
start "" "http://localhost:5173"

:: Garder la fenetre ouverte (le serveur tourne dedans)
echo   Jeu en cours. Fermez cette fenetre pour arreter le jeu.
echo.
pause >nul
