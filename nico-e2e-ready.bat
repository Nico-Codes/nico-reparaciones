@echo off
setlocal EnableExtensions

REM ===============================================================
REM NicoReparaciones - E2E local runner
REM Uso:
REM   nico-e2e-ready.bat            -> corre suite critica
REM   nico-e2e-ready.bat full       -> corre critica + suite completa
REM ===============================================================

cd /d "%~dp0"

echo.
echo [1/4] Verificando Playwright (Chromium)...
call npm run e2e:install
if errorlevel 1 (
  echo ERROR: no se pudo instalar/verificar Chromium para Playwright.
  exit /b 1
)

echo.
echo [2/4] Ejecutando E2E critico...
set PLAYWRIGHT_HTML_OPEN=never
call npm run e2e:critical
if errorlevel 1 (
  echo ERROR: la suite E2E critica fallo.
  echo Revisa el reporte en playwright-report\index.html
  exit /b 1
)

if /I "%~1"=="full" (
  echo.
  echo [3/4] Ejecutando E2E completo...
  call npm run e2e:full
  if errorlevel 1 (
    echo ERROR: la suite E2E completa fallo.
    echo Revisa el reporte en playwright-report\index.html
    exit /b 1
  )
) else (
  echo.
  echo [3/4] Suite completa omitida ^(usa "full" para incluirla^).
)

echo.
echo [4/4] Listo.
echo Reporte HTML: playwright-report\index.html
echo Si queres abrirlo por comando: npm run e2e:report

exit /b 0
