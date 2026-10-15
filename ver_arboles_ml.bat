@echo off
title GuardianPay - Evidencia de Machine Learning (Random Forest)
chcp 65001 >nul

echo ===============================================================================
echo        GUARDIANPAY - EVIDENCIA Y VISUALIZADOR DE RANDOM FOREST (120 ÁRBOLES)
echo ===============================================================================
echo.
echo Generando visualizacion de Scikit-Learn desde 'random_forest_fraud.pkl'...
echo.

cd /d "%~dp0backend"

if exist "venv\Scripts\python.exe" (
    venv\Scripts\python.exe visualizar_arbol.py
) else (
    python visualizar_arbol.py
)

cd /d "%~dp0"

echo.
echo Abriendo visualizador interactivo en tu navegador...
start visualizador_arboles_ml.html

echo.
echo ===============================================================================
echo ¡Listo! Muestra esta pantalla a tu docente o jurado para sustentar el ML.
echo ===============================================================================
echo.
pause
