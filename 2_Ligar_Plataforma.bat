@echo off
title Servidor Plataforma de Rateio de Custos - Dtel Telecom
cd /d "%~dp0"
echo ===================================================
echo     INICIANDO PLATAFORMA DE RATEIO DE CUSTOS
echo ===================================================
echo.
echo [1/2] Iniciando servidor local (le a planilha em dados-mensais)...
start /min node server.js
echo.
echo [2/2] Abrindo o painel no navegador...
timeout /t 2 /nobreak > nul
start http://localhost:3000
echo.
echo ===================================================
echo   SISTEMA ATIVO! Pode minimizar esta janela.
echo   Deixe esta janela aberta (minimizada) para o
echo   painel continuar funcionando e sendo acessivel
echo   pela rede em http://SEU-IP-NESTE-COMPUTADOR:3000
echo ===================================================
