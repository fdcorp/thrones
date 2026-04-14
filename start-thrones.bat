@echo off
title Thrones — Démarrage

:: ── À MODIFIER : ton domaine ngrok gratuit ──────────────────────
set NGROK_DOMAIN=county-antsy-quiet.ngrok-free.dev
:: ────────────────────────────────────────────────────────────────

set SERVER_DIR=E:\02_PERSONAL_PROJECTS\_01_CLAUDE_CODE\TRONES\GAME\Thrones\server

echo Démarrage du serveur Thrones...
start "Thrones — Serveur" /min cmd /k "cd /d %SERVER_DIR% && npm run dev"

:: Petit délai pour laisser le serveur démarrer avant ngrok
timeout /t 3 /nobreak >nul

echo Démarrage du tunnel ngrok...
start "Thrones — ngrok" /min cmd /k "C:\Users\fndzd\AppData\Local\ngrok\ngrok.exe http --domain=%NGROK_DOMAIN% 3001"

echo.
echo Thrones est en ligne. Bonne partie !
timeout /t 3 /nobreak >nul
exit
