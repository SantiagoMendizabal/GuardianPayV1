@echo off
title GuardianPay - Frontend React [Puerto 3000]

echo ===============================================================================
echo                GUARDIANPAY - INICIANDO FRONTEND REACT
echo ===============================================================================
echo.

cd /d "%~dp0frontend"

echo [OK] Directorio: %CD%
echo [INFO] Iniciando servidor Vite en http://localhost:3000
echo.

call npm run dev

echo.
echo [ALERTA] El servidor frontend se ha detenido.
pause
