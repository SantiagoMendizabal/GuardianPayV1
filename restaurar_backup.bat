@echo off
title GuardianPay - Restaurar Base de Datos MySQL
chcp 65001 >nul

echo ===============================================================================
echo            GUARDIANPAY - RESTAURAR BASE DE DATOS MYSQL 8.0
echo ===============================================================================
echo.
echo Este proceso importara la base de datos 'guardianpay_db' con:
echo   - 11 Usuarios (Anthony Luque, Carlos Mendoza, Lucia Gomez, etc.)
echo   - 53 Transacciones historicas con promedios reales
echo   - 19 Contactos frecuentes
echo   - 55 Registros de auditoria de inteligencia artificial
echo.

cd /d "%~dp0backend"

if exist "venv\Scripts\python.exe" (
    venv\Scripts\python.exe backup\restore_db.py
) else (
    python backup\restore_db.py
)

echo.
echo ===============================================================================
echo Proceso finalizado. Puedes abrir MySQL Workbench para verificar las tablas.
echo ===============================================================================
echo.
pause
