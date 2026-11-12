@echo off
title GuardianPay - Crear e Inicializar Base de Datos MySQL
color 0B

echo ===============================================================================
echo            GUARDIANPAY - CREAR BASE DE DATOS MYSQL 8.0
echo ===============================================================================
echo.
echo Este script creara automaticamente en tu MySQL local:
echo   1. La base de datos 'guardianpay_db'
echo   2. Las 4 tablas oficiales (usuarios, transferencias, auditoria_ia, contactos)
echo   3. Todos los usuarios y datos de prueba listos para operar
echo.
echo NOTA: Asegurate de haber colocado tu contrasena de MySQL en el archivo .env
echo       (Si no tienes .env, se creara uno con los valores de .env.example)
echo.

cd /d "%~dp0backend"

if not exist ".env" (
    if not exist "..\\.env" (
        echo [AVISO] No se encontro archivo .env. Creando uno por defecto desde .env.example...
        copy ".env.example" ".env" >nul
        echo [OK] Archivo backend\.env creado.
        echo.
    )
)

if exist "venv\Scripts\python.exe" (
    venv\Scripts\python.exe backup\restore_db.py
) else (
    python backup\restore_db.py
)

echo.
echo ===============================================================================
echo [OK] Base de datos creada exitosamente. Abre MySQL Workbench para verificar.
echo ===============================================================================
echo.
pause
