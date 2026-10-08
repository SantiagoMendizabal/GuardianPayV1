@echo off
title GuardianPay - Backend FastAPI [Puerto 8000]

echo ===============================================================================
echo                GUARDIANPAY - INICIANDO BACKEND FASTAPI
echo ===============================================================================
echo.

cd /d "%~dp0backend"

if not exist ".env" (
    if exist ".env.example" (
        copy /y ".env.example" ".env" >nul
        echo [OK] Archivo .env generado desde .env.example
    )
)

echo [OK] Directorio: %CD%

if exist "venv\Scripts\python.exe" goto use_venv
goto use_global

:use_venv
echo [INFO] Usando entorno virtual venv local
echo [INFO] API Swagger: http://localhost:8000/docs
echo.
venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
goto end

:use_global
echo [INFO] Usando Python global
echo [INFO] API Swagger: http://localhost:8000/docs
echo.
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
goto end

:end
echo.
echo [ALERTA] El servidor se ha detenido.
pause
