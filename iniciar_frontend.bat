@echo off
title GuardianPay - Frontend React [Puerto 3000]

echo ===============================================================================
echo                GUARDIANPAY - INICIANDO FRONTEND REACT
echo ===============================================================================
echo.

cd /d "%~dp0frontend"

echo [OK] Directorio: %CD%

if not exist "node_modules" (
    echo [INFO] No se encontro la carpeta node_modules.
    echo [INFO] Instalando dependencias de Node.js por primera vez...
    call npm install
    echo [OK] Dependencias instaladas con exito.
    echo.
)

echo [INFO] Iniciando servidor Vite en http://localhost:3000
echo.

call npm run dev

echo.
echo [ALERTA] El servidor frontend se ha detenido.
pause
