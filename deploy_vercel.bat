@echo off
cd /d "%~dp0"
title Deploy TSE 2026 para Vercel
echo ========================================================
echo    Deploy do Painel Oficial TSE 2026 para Vercel
echo ========================================================
echo.
echo Executando deploy na Vercel...
vercel --prod
echo.
pause
