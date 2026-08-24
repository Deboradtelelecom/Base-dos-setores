@echo off
title Dtel Telecom - Vigia Automatico da Plataforma de Rateio

echo.
echo ============================================================
echo   DTEL Telecom - Vigia Automatico da Plataforma de Rateio
echo   Deixe esta janela aberta enquanto trabalha na planilha.
echo   Toda alteracao salva e publicada sozinha (~20s depois).
echo ============================================================
echo.

cd /d "%~dp0"
node vigiar_e_publicar.js

pause
