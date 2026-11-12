@echo off
title GuardianPay - Auditoria de Random Forest (120 Arboles)
cls

echo ===============================================================================
echo            GUARDIANPAY AI - AUDITORIA DE RANDOM FOREST EN TERMINAL
echo ===============================================================================
echo.
echo Iniciando evaluacion de los 120 arboles desde random_forest_fraud.pkl...
echo.

cd /d "%~dp0backend"

if exist "venv\Scripts\python.exe" (
    venv\Scripts\python.exe auditar_arboles_terminal.py
) else (
    python auditar_arboles_terminal.py
)

echo.
pause
