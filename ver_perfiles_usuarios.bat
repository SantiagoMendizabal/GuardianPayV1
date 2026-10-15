@echo off
chcp 65001 > nul
title GuardianPay - Perfilado Transaccional de Usuarios (MySQL)

echo ============================================================================
echo   CONSULTANDO PERFILES Y HÁBITOS DE GASTO EN MYSQL (GUARDIANPAY AI)
echo ============================================================================
echo.

cd /d "%~dp0backend"

if not exist "venv\Scripts\python.exe" (
    echo [ERROR] No se encontró el entorno virtual en backend\venv.
    echo Ejecuta primero iniciar_backend.bat
    pause
    exit /b 1
)

venv\Scripts\python.exe ver_perfiles.py

echo.
pause
