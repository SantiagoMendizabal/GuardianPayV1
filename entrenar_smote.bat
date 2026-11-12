@echo off
title GuardianPay - Reentrenamiento ML con SMOTE y GridSearchCV
chcp 65001 >nul

echo ===============================================================================
echo       GUARDIANPAY - REENTRENAMIENTO MACHINE LEARNING (SMOTE + 120 ARBOLES)
echo ===============================================================================
echo.

cd /d "%~dp0"

if exist "backend\venv\Scripts\python.exe" (
    echo [INFO] Usando entorno virtual venv local...
    echo.
    backend\venv\Scripts\python.exe entrenar_smote.py
) else (
    echo [INFO] Usando Python global...
    echo.
    python entrenar_smote.py
)

echo.
echo ===============================================================================
echo [OK] Proceso terminado. Archivos generados en backend\model\:
echo      - random_forest_fraud.pkl
echo      - model_metadata.json
echo      - matriz_confusion.png
echo      - curva_roc.png
echo ===============================================================================
echo.
pause
