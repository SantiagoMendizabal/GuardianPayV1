@echo off
title GuardianPay - Lanzador General

echo ===============================================================================
echo                GUARDIANPAY - INICIANDO SISTEMA COMPLETO
echo ===============================================================================
echo.

cd /d "%~dp0"

echo [1/2] Levantando Backend FastAPI...
start "GuardianPay Backend" cmd.exe /c "iniciar_backend.bat"

timeout /t 2 /nobreak >nul

echo [2/2] Levantando Frontend Vite...
start "GuardianPay Frontend" cmd.exe /c "iniciar_frontend.bat"

timeout /t 3 /nobreak >nul

echo.
echo [OK] Abriendo aplicacion en http://localhost:3000...
start http://localhost:3000
