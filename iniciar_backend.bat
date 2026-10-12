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

if not exist "venv\Scripts\python.exe" (
    echo [INFO] No se encontro la carpeta venv.
    echo [INFO] Creando entorno virtual e instalando librerias de Python...
    python -m venv venv
    venv\Scripts\python.exe -m pip install -r requirements.txt
    echo [OK] Entorno virtual y librerias instaladas con exito.
    echo.
)

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
