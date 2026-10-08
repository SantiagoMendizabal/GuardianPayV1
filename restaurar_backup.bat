@echo off
title GuardianPay - Restaurar Base de Datos MySQL

echo ===============================================================================
echo            GUARDIANPAY - RESTAURAR BASE DE DATOS MYSQL 8.0
echo ===============================================================================
echo.
echo Este proceso restaurara la base de datos 'guardianpay_db' con las 4 tablas
echo oficiales y los datos de prueba de los 5 usuarios desde el backup.
echo.

cd /d "%~dp0backend"

if exist "venv\Scripts\python.exe" (
    venv\Scripts\python.exe backup\restore_db.py
) else (
    python backup\restore_db.py
)

echo.
echo ===============================================================================
echo Proceso finalizado. Abre MySQL Workbench para verificar las tablas.
echo ===============================================================================
echo.
pause
