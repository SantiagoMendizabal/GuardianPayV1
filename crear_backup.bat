@echo off
title GuardianPay - Generar Respaldo MySQL

echo ===============================================================================
echo             GUARDIANPAY - GENERADOR DE RESPALDO MYSQL 8.0
echo ===============================================================================
echo.

cd /d "%~dp0backend"

if exist "venv\Scripts\python.exe" (
    venv\Scripts\python.exe backup\backup_db.py
) else (
    python backup\backup_db.py
)

echo.
echo ===============================================================================
echo Respaldo finalizado en: backend\backup\guardianpay_backup.sql
echo ===============================================================================
echo.
pause
