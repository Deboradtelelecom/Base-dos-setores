@echo off
title Dtel Telecom - Publicando Plataforma de Rateio Online

echo.
echo ====================================================
echo   DTEL Telecom - Publicar Plataforma de Rateio
echo   Atualiza o site em ~2 minutos
echo ====================================================
echo.

cd /d "%~dp0"

echo Passo 1: Enviando os dados atualizados para o GitHub...
git add dados-mensais detalhes_colaborador.json extrair_dados.js server.js public Base_de_Conhecimento_Setores_DTEL.xlsx
git commit -m "Atualiza planilha %date% %time:~0,5%"
git push origin master

if %errorlevel% equ 0 (
    echo.
    echo ====================================================
    echo   Publicado! O site atualiza sozinho em ~2 minutos:
    echo   https://base-dos-setores.onrender.com
    echo ====================================================
) else (
    echo.
    echo [AVISO] Nenhuma alteracao para publicar ou erro no push.
    echo Se pediu login do GitHub, confirme os dados na janela que abriu.
)
echo.
pause
