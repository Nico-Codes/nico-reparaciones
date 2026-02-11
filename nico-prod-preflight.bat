@echo off
setlocal EnableExtensions

REM ============================================================================
REM NicoReparaciones - Preflight de produccion
REM ----------------------------------------------------------------------------
REM Ejecuta:
REM   1) ops:health-check --strict
REM   2) config:cache
REM   3) route:cache
REM   4) view:cache
REM   5) ops:health-check --strict (validacion final)
REM ============================================================================

set "PROJECT_ROOT=%~dp0"
cd /d "%PROJECT_ROOT%"

set "PHP_EXE=C:\xampp\php\php.exe"
if not exist "%PHP_EXE%" set "PHP_EXE=php"

echo.
echo [1/5] Health check estricto (modo produccion)...
"%PHP_EXE%" artisan ops:health-check --strict --assume-production
if errorlevel 1 goto :fail

echo.
echo [2/5] Cacheando configuracion...
"%PHP_EXE%" artisan config:cache
if errorlevel 1 goto :fail

echo.
echo [3/5] Cacheando rutas...
"%PHP_EXE%" artisan route:cache
if errorlevel 1 goto :fail

echo.
echo [4/5] Cacheando vistas...
"%PHP_EXE%" artisan view:cache
if errorlevel 1 goto :fail

echo.
echo [5/5] Health check estricto final (modo produccion)...
"%PHP_EXE%" artisan ops:health-check --strict --assume-production
if errorlevel 1 goto :fail

echo.
echo [OK] Preflight de produccion completado correctamente.
exit /b 0

:fail
echo.
echo [ERROR] El preflight fallo. Revisa la salida anterior y corrige antes de deploy.
exit /b 1
