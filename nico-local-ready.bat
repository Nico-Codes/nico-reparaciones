@echo off
setlocal EnableExtensions

REM ============================================================================
REM NicoReparaciones - Local Ready Check
REM ----------------------------------------------------------------------------
REM Ejecuta validaciones clave para entorno local en una sola pasada:
REM   1) Limpia cache de config
REM   2) Health-check operativo
REM   3) Prueba de mail sync y async
REM   4) Procesa cola mail una vez
REM   5) Corre tests criticos (mail/auth/checkout)
REM ============================================================================

set "PROJECT_ROOT=%~dp0"
cd /d "%PROJECT_ROOT%"

set "PHP_EXE=C:\xampp\php\php.exe"
set "MAIL_TEST_TO=admin@nico.local"

if not exist "%PHP_EXE%" (
    echo [ERROR] No se encontro PHP en: %PHP_EXE%
    exit /b 1
)

echo.
echo [1/5] Limpiando cache de configuracion...
"%PHP_EXE%" artisan config:clear || goto :end_fail

echo.
echo [2/5] Ejecutando health-check...
"%PHP_EXE%" artisan ops:health-check || goto :end_fail

echo.
echo [3/5] Probando mail sync...
"%PHP_EXE%" artisan ops:mail-test --to=%MAIL_TEST_TO% --force-sync || goto :end_fail

echo.
echo [4/5] Probando mail async y procesando cola...
"%PHP_EXE%" artisan ops:mail-test --to=%MAIL_TEST_TO% || goto :end_fail
"%PHP_EXE%" artisan queue:work --once --queue=mail --stop-when-empty || goto :end_fail

echo.
echo [5/5] Ejecutando tests criticos...
"%PHP_EXE%" artisan test --filter="AuthEmailFlowsTest|OrderConfirmationMailTest|AdminSettingsSmtpTest|OpsMailTestCommandTest|OpsHealthCheckCommandTest" || goto :end_fail

echo.
echo [OK] Local ready check completado.
echo      Revisa bandeja de Mailpit en http://127.0.0.1:8025
exit /b 0

:end_fail
echo.
echo [ERROR] Local ready check fallo.
exit /b 1

