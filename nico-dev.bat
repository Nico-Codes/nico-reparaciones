@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM ============================================================================
REM NicoReparaciones - Script unificado para Windows
REM ----------------------------------------------------------------------------
REM USO RAPIDO
REM   1) Doble click en este .bat (menu interactivo)
REM   2) O por consola:
REM      - nico-dev.bat setup   (primera vez / PC nueva)
REM      - nico-dev.bat start   (iniciar entorno + worker de cola mail si aplica)
REM      - nico-dev.bat next-setup   (setup del stack migrado React/Nest/Prisma)
REM      - nico-dev.bat next-start   (iniciar API + Web del next-stack)
REM      - nico-dev.bat next-stop    (detener API/Web del next-stack)
REM      - nico-dev.bat next-qa      (QA full del next-stack)
REM      - nico-dev.bat next-preprod (checks preproduccion del next-stack)
REM      - nico-dev.bat stop    (detener entorno)
REM      - nico-dev.bat local-ready
REM      - nico-dev.bat e2e
REM      - nico-dev.bat e2e-full
REM      - nico-dev.bat prod-preflight
REM      - nico-dev.bat project-ready
REM      - nico-dev.bat project-ready-full
REM ----------------------------------------------------------------------------
REM GUIA "PC DESDE CERO" (antes de ejecutar setup)
REM   - Instalar XAMPP (PHP + MySQL)
REM   - Instalar Node.js LTS (incluye npm)
REM   - Instalar Composer
REM   - Clonar el proyecto en: C:\xampp\htdocs\nico-reparaciones
REM   - (Opcional) descargar ngrok y ajustar ruta en NGROK_EXE
REM ============================================================================

set "PROJECT_ROOT=%~dp0"
cd /d "%PROJECT_ROOT%"

REM ===== RUTAS LOCALES (ajustar si cambia tu instalacion) ======================
set "PHP_EXE=C:\xampp\php\php.exe"
set "MYSQLD_EXE=C:\xampp\mysql\bin\mysqld.exe"
set "MYSQL_EXE=C:\xampp\mysql\bin\mysql.exe"
set "MYSQLADMIN_EXE=C:\xampp\mysql\bin\mysqladmin.exe"
set "MYSQL_INI=C:\xampp\mysql\bin\my.ini"
set "NGROK_EXE=D:\Descargas\ngrok-v3-stable-windows-amd64\ngrok.exe"

set "APP_HOST=127.0.0.1"
set "APP_PORT=8000"
set "VITE_PORT=5173"
set "NEXT_STACK_ROOT=%PROJECT_ROOT%next-stack"
set "NEXT_API_PORT=3001"
set "NEXT_WEB_PORT=5174"
set "NEXT_WEB_PREVIEW_PORT=4174"
set "NEXT_API_HEALTH_URL=http://127.0.0.1:%NEXT_API_PORT%/api/health"
set "NEXT_WEB_URL=http://localhost:%NEXT_WEB_PORT%"
set "NEXT_DEV_LOG_DIR=%NEXT_STACK_ROOT%\.dev-logs"
set "NEXT_API_LOG=%NEXT_DEV_LOG_DIR%\api.log"
set "NEXT_WEB_LOG=%NEXT_DEV_LOG_DIR%\web.log"
set "NGROK_API_PORT=4040"
set "MAILPIT_EXE=%PROJECT_ROOT%tools\mailpit\mailpit.exe"
set "MAILPIT_SMTP_PORT=1025"
set "MAILPIT_UI_PORT=8025"
set "DEV_RUNTIME_DIR=%PROJECT_ROOT%storage\app\dev"
set "QUEUE_PID_FILE=%DEV_RUNTIME_DIR%\queue-worker.pid"
set "MAILPIT_PID_FILE=%DEV_RUNTIME_DIR%\mailpit.pid"

if /I "%~1"=="setup" goto :setup
if /I "%~1"=="start" goto :start
if /I "%~1"=="stop" goto :stop
if /I "%~1"=="next-setup" goto :next_setup
if /I "%~1"=="next-start" goto :next_start
if /I "%~1"=="next-stop" goto :next_stop
if /I "%~1"=="next-qa" goto :next_qa
if /I "%~1"=="next-preprod" goto :next_preprod
if /I "%~1"=="local-ready" goto :local_ready
if /I "%~1"=="e2e" goto :e2e_ready
if /I "%~1"=="e2e-full" set "RUN_E2E_FULL=1" & goto :e2e_ready
if /I "%~1"=="prod-preflight" goto :prod_preflight
if /I "%~1"=="project-ready" goto :project_ready
if /I "%~1"=="project-ready-full" set "RUN_E2E_FULL=1" & goto :project_ready
if /I "%~1"=="help" goto :help

:menu
echo.
echo ================= NicoReparaciones =================
echo [Stack Laravel legacy]
echo 1^) Setup inicial (primera vez / PC nueva)
echo 2^) Iniciar entorno (MySQL + Laravel + Vite + Mailpit + queue + ngrok)
echo 3^) Detener entorno
echo 4^) Local ready (health + mail + tests criticos)
echo 5^) E2E critico
echo 6^) E2E full
echo 7^) Preflight produccion (estricto)
echo 8^) Project ready (local ready + e2e critico)
echo.
echo [Next Stack migrado]
echo 9^) Next setup (npm + prisma checks)
echo A^) Next start (API + Web)
echo B^) Next stop
echo C^) Next QA full
echo D^) Next preprod (deploy-check + qa:preprod)
echo Q^) Salir
echo ================================================
choice /C 123456789ABCDQ /N /M "Selecciona opcion [1-9,A-D,Q]: "
if errorlevel 14 goto :end_ok
if errorlevel 13 goto :next_preprod
if errorlevel 12 goto :next_qa
if errorlevel 11 goto :next_stop
if errorlevel 10 goto :next_start
if errorlevel 9 goto :next_setup
if errorlevel 8 goto :project_ready
if errorlevel 7 goto :prod_preflight
if errorlevel 6 set "RUN_E2E_FULL=1" & goto :e2e_ready
if errorlevel 5 goto :e2e_ready
if errorlevel 4 goto :local_ready
if errorlevel 3 goto :stop
if errorlevel 2 goto :start
if errorlevel 1 goto :setup

:help
echo.
echo Uso:
echo   nico-dev.bat setup
echo   nico-dev.bat start
echo   nico-dev.bat stop
echo   nico-dev.bat next-setup
echo   nico-dev.bat next-start
echo   nico-dev.bat next-stop
echo   nico-dev.bat next-qa
echo   nico-dev.bat next-preprod
echo   nico-dev.bat local-ready
echo   nico-dev.bat e2e
echo   nico-dev.bat e2e-full
echo   nico-dev.bat prod-preflight
echo   nico-dev.bat project-ready
echo   nico-dev.bat project-ready-full
goto :end_ok

:next_setup
echo.
echo [NEXT-SETUP] Preparando next-stack (React + Nest + Prisma)...
if not exist "%NEXT_STACK_ROOT%\package.json" (
    echo [ERROR] No se encontro next-stack en: %NEXT_STACK_ROOT%
    goto :end_fail
)
where npm >nul 2>&1 || (echo [ERROR] npm no encontrado. Instala Node.js LTS. & goto :end_fail)

if not exist "%NEXT_STACK_ROOT%\.env" (
    if exist "%NEXT_STACK_ROOT%\.env.example" (
        echo - Creando next-stack\.env desde .env.example...
        copy /Y "%NEXT_STACK_ROOT%\.env.example" "%NEXT_STACK_ROOT%\.env" >nul || (echo [ERROR] No se pudo crear next-stack\.env & goto :end_fail)
    ) else (
        echo [WARN] No existe next-stack\.env.example. Crea next-stack\.env manualmente.
    )
) else (
    echo - next-stack\.env ya existe.
)

echo - npm install (next-stack)
call npm --prefix "%NEXT_STACK_ROOT%" install || goto :end_fail

echo - Prisma generate (next-stack)
call npm --prefix "%NEXT_STACK_ROOT%" run db:generate || goto :end_fail

echo - Env check (next-stack)
call npm --prefix "%NEXT_STACK_ROOT%" run env:check || goto :end_fail

echo.
echo [OK] Next setup completado.
echo     Siguiente paso: nico-dev.bat next-start
exit /b 0

:next_start
echo.
echo [NEXT-START] Iniciando API + Web del next-stack...
if not exist "%NEXT_STACK_ROOT%\package.json" (
    echo [ERROR] No se encontro next-stack en: %NEXT_STACK_ROOT%
    goto :end_fail
)
where npm >nul 2>&1 || (echo [ERROR] npm no encontrado. Instala Node.js LTS. & goto :end_fail)
if not exist "%NEXT_DEV_LOG_DIR%" mkdir "%NEXT_DEV_LOG_DIR%" >nul 2>&1

echo - Prisma generate ^(forzando client local para evitar errores prisma:// en dev^)...
call npm --prefix "%NEXT_STACK_ROOT%" run db:generate
if errorlevel 1 call :next_warn_prisma_generate_failed

echo - Verificando puertos ocupados del next-stack...
call :kill_port_if_listening %NEXT_API_PORT%
call :kill_port_if_listening %NEXT_WEB_PORT%
call :kill_port_if_listening %NEXT_WEB_PREVIEW_PORT%
timeout /t 1 >nul

netstat -ano | findstr /R /C:":%NEXT_API_PORT% .*LISTENING" >nul 2>&1
if errorlevel 1 (
    echo - Iniciando API NestJS ^(puerto %NEXT_API_PORT%^)...
    start "" /min cmd /c "cd /d ""%NEXT_STACK_ROOT%"" && npm run dev:api > ""%NEXT_API_LOG%"" 2>&1"
) else (
    echo [WARN] API sigue ocupando el puerto %NEXT_API_PORT% antes de iniciar.
)

netstat -ano | findstr /R /C:":%NEXT_WEB_PORT% .*LISTENING" >nul 2>&1
if errorlevel 1 (
    echo - Iniciando Web React/Vite ^(puerto %NEXT_WEB_PORT%^)...
    start "" /min cmd /c "cd /d ""%NEXT_STACK_ROOT%"" && npm run dev:web > ""%NEXT_WEB_LOG%"" 2>&1"
) else (
    echo [WARN] Web sigue ocupando el puerto %NEXT_WEB_PORT% antes de iniciar.
)

call :wait_http_ok "%NEXT_API_HEALTH_URL%" 25
set "NEXT_API_HEALTH_OK=%ERRORLEVEL%"
call :wait_http_ok "%NEXT_WEB_URL%" 20
set "NEXT_WEB_HEALTH_OK=%ERRORLEVEL%"
echo.
if "%NEXT_API_HEALTH_OK%"=="0" (
  echo [OK] API responde health.
) else (
  echo [WARN] API no responde aun: %NEXT_API_HEALTH_URL%
  echo [TIP] Revisar log: %NEXT_API_LOG%
  echo [TIP] Si ves error prisma://, reintenta: npm --prefix "%NEXT_STACK_ROOT%" run db:generate
  call :next_log_hint "%NEXT_API_LOG%"
)
if "%NEXT_WEB_HEALTH_OK%"=="0" (
  echo [OK] Web responde.
) else (
  echo [WARN] Web no responde aun: %NEXT_WEB_URL%
  echo [TIP] Revisar log: %NEXT_WEB_LOG%
  call :next_log_hint "%NEXT_WEB_LOG%"
)
echo - API: %NEXT_API_HEALTH_URL%
echo - Web: %NEXT_WEB_URL%
echo [TIP] Si falla DB, revisa: npm --prefix "%NEXT_STACK_ROOT%" run db:check
echo [TIP] Si login queda en 401/refresh 401, limpia localStorage:
echo       nico_next_access_token / nico_next_refresh_token / nico_next_user
echo [TIP] Si aparece 429, espera ~60s ^(throttler dev^) o reinicia API.
exit /b 0

:next_stop
echo.
echo [NEXT-STOP] Deteniendo next-stack (puertos %NEXT_API_PORT%, %NEXT_WEB_PORT%, %NEXT_WEB_PREVIEW_PORT%)...
powershell -NoProfile -Command "$ports=@(%NEXT_API_PORT%,%NEXT_WEB_PORT%,%NEXT_WEB_PREVIEW_PORT%); $pids=Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $ports -contains $_.LocalPort } | Select-Object -ExpandProperty OwningProcess -Unique; foreach($pid in $pids){ Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue }" >nul 2>&1
echo - Next-stack detenido (si estaba activo).
exit /b 0

:next_qa
echo.
echo [NEXT-QA] Ejecutando QA full del next-stack...
if not exist "%NEXT_STACK_ROOT%\package.json" (
    echo [ERROR] No se encontro next-stack en: %NEXT_STACK_ROOT%
    goto :end_fail
)
where npm >nul 2>&1 || (echo [ERROR] npm no encontrado. Instala Node.js LTS. & goto :end_fail)
call npm --prefix "%NEXT_STACK_ROOT%" run qa:full || goto :end_fail
echo.
echo [OK] QA full completado.
exit /b 0

:next_preprod
echo.
echo [NEXT-PREPROD] Ejecutando checks de preproduccion del next-stack...
if not exist "%NEXT_STACK_ROOT%\package.json" (
    echo [ERROR] No se encontro next-stack en: %NEXT_STACK_ROOT%
    goto :end_fail
)
where npm >nul 2>&1 || (echo [ERROR] npm no encontrado. Instala Node.js LTS. & goto :end_fail)
call npm --prefix "%NEXT_STACK_ROOT%" run deploy:check || goto :end_fail
call npm --prefix "%NEXT_STACK_ROOT%" run qa:preprod || goto :end_fail
echo.
echo [OK] Next preprod completado.
exit /b 0

:setup
echo.
echo [SETUP] Preparando proyecto por primera vez...
call :check_required_file "%PHP_EXE%" "PHP de XAMPP" || goto :end_fail
where npm >nul 2>&1 || (echo [ERROR] npm no encontrado. Instala Node.js LTS. & goto :end_fail)
where composer >nul 2>&1 || (echo [ERROR] composer no encontrado. Instala Composer. & goto :end_fail)

if not exist ".env" (
    echo - Creando .env desde .env.example...
    copy /Y ".env.example" ".env" >nul || (echo [ERROR] No se pudo crear .env. & goto :end_fail)
) else (
    echo - .env ya existe.
)

call :load_db_env
call :ensure_mysql_running || goto :end_fail
call :create_database_if_needed

echo - composer install
composer install || goto :end_fail

echo - npm install
npm install || goto :end_fail

echo - php artisan key:generate --force
"%PHP_EXE%" artisan key:generate --force || goto :end_fail

echo - php artisan migrate --force
"%PHP_EXE%" artisan migrate --force || goto :end_fail

echo.
echo [OK] Setup inicial completado.
echo     Siguiente paso: nico-dev.bat start
goto :end_ok

:start
echo.
echo [START] Iniciando entorno de desarrollo...
call :check_required_file "%PHP_EXE%" "PHP de XAMPP" || goto :end_fail
where npm >nul 2>&1 || (echo [ERROR] npm no encontrado. Instala Node.js LTS. & goto :end_fail)

call :load_db_env
call :load_ops_mail_env
call :ensure_mysql_running || goto :end_fail
call :ensure_mailpit

if exist "public\hot" (
    echo - Limpiando public\hot
    del /F /Q "public\hot" >nul 2>&1
)

netstat -ano | findstr /R /C:":%APP_PORT% .*LISTENING" >nul 2>&1
if errorlevel 1 (
    echo - Iniciando Laravel: artisan serve...
    start "" /min "%PHP_EXE%" artisan serve --host=%APP_HOST% --port=%APP_PORT%
) else (
    echo - Laravel ya activo en puerto %APP_PORT%.
)

netstat -ano | findstr /R /C:":%VITE_PORT% .*LISTENING" >nul 2>&1
if errorlevel 1 (
    echo - Iniciando Vite: npm run dev...
    start "" /min cmd /c "cd /d ""%PROJECT_ROOT%"" && npm run dev"
) else (
    echo - Vite ya activo en puerto %VITE_PORT%.
)

if exist "%NGROK_EXE%" (
    netstat -ano | findstr /R /C:":%NGROK_API_PORT% .*LISTENING" >nul 2>&1
    if errorlevel 1 (
        echo - Iniciando ngrok: http %APP_PORT%...
        start "" /min "%NGROK_EXE%" http %APP_PORT%
    ) else (
        echo - ngrok ya activo.
    )
) else (
    echo [WARN] NGROK_EXE no encontrado. Ajusta la ruta si quieres tunel publico.
)

call :ensure_queue_worker

timeout /t 3 >nul
echo.
echo [OK] Entorno iniciado.
echo - Web local:   http://%APP_HOST%:%APP_PORT%
echo - Vite local:  http://localhost:%VITE_PORT%
echo - Mailpit UI:  http://127.0.0.1:%MAILPIT_UI_PORT%
if exist "%NGROK_EXE%" echo - Panel ngrok: http://127.0.0.1:%NGROK_API_PORT%
if /I "%OPS_MAIL_ASYNC_ENABLED%"=="true" (
    echo - Cola mail: activa ^(queue: %QUEUE_WORKER_QUEUES%^)
) else (
    echo - Cola mail: desactivada ^(OPS_MAIL_ASYNC_ENABLED=false en .env^)
)
goto :end_ok

:stop
echo.
echo [STOP] Deteniendo servicios por puertos %APP_PORT%, %VITE_PORT% y %NGROK_API_PORT%...
powershell -NoProfile -Command "$ports=@(%APP_PORT%,%VITE_PORT%,%NGROK_API_PORT%); $pids=Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $ports -contains $_.LocalPort } | Select-Object -ExpandProperty OwningProcess -Unique; foreach($pid in $pids){ Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue }" >nul 2>&1

call :stop_queue_worker
call :stop_mailpit

echo - Servicios detenidos (si estaban activos).
goto :end_ok

:local_ready
echo.
echo [LOCAL READY] Validando entorno local...
call :resolve_php || exit /b 1
where npm >nul 2>&1 || (echo [ERROR] npm no encontrado. Instala Node.js LTS. & exit /b 1)

echo.
echo [1/5] Limpiando cache de configuracion...
"%PHP_EXE%" artisan config:clear || exit /b 1

echo.
echo [2/5] Ejecutando health-check...
"%PHP_EXE%" artisan ops:health-check || exit /b 1

echo.
echo [3/5] Probando mail sync...
"%PHP_EXE%" artisan ops:mail-test --to=admin@nico.local --force-sync || exit /b 1

echo.
echo [4/5] Probando mail async y procesando cola...
"%PHP_EXE%" artisan ops:mail-test --to=admin@nico.local || exit /b 1
"%PHP_EXE%" artisan queue:work --once --queue=mail --stop-when-empty || exit /b 1

echo.
echo [5/6] Verificando TypeScript/React frontend...
call npm run typecheck || exit /b 1

echo.
echo [6/6] Ejecutando tests criticos...
"%PHP_EXE%" artisan test --filter="AuthEmailFlowsTest|OrderConfirmationMailTest|AdminSettingsSmtpTest|OpsMailTestCommandTest|OpsHealthCheckCommandTest" || exit /b 1

echo.
echo [OK] Local ready check completado.
echo      Revisa bandeja de Mailpit en http://127.0.0.1:8025
exit /b 0

:e2e_ready
if not defined RUN_E2E_FULL set "RUN_E2E_FULL=0"
echo.
echo [E2E] Verificando Playwright (Chromium)...
where npm >nul 2>&1 || (echo [ERROR] npm no encontrado. Instala Node.js LTS. & exit /b 1)
call npm run e2e:install || exit /b 1

echo.
echo [E2E] Ejecutando suite critica...
set PLAYWRIGHT_HTML_OPEN=never
call npm run e2e:critical || exit /b 1

if /I "%RUN_E2E_FULL%"=="1" (
    echo.
    echo [E2E] Ejecutando suite completa...
    call npm run e2e:full || exit /b 1
) else (
    echo.
    echo [E2E] Suite completa omitida ^(usa e2e-full para incluirla^).
)

echo.
echo [OK] E2E finalizado.
echo      Reporte: playwright-report\index.html
set "RUN_E2E_FULL="
exit /b 0

:prod_preflight
echo.
echo [PROD PREFLIGHT] Ejecutando checks estrictos...
call :resolve_php || exit /b 1
where npm >nul 2>&1 || (echo [ERROR] npm no encontrado. Instala Node.js LTS. & exit /b 1)

echo.
echo [1/5] Health check estricto (modo produccion)...
"%PHP_EXE%" artisan ops:health-check --strict --assume-production || exit /b 1

echo.
echo [2/5] Cacheando configuracion...
"%PHP_EXE%" artisan config:cache || exit /b 1

echo.
echo [3/5] Cacheando rutas...
"%PHP_EXE%" artisan route:cache || exit /b 1

echo.
echo [4/5] Cacheando vistas...
"%PHP_EXE%" artisan view:cache || exit /b 1

echo.
echo [5/6] Compilando frontend (Vite build)...
call npm run build || exit /b 1

echo.
echo [6/6] Health check estricto final (modo produccion)...
"%PHP_EXE%" artisan ops:health-check --strict --assume-production || exit /b 1

echo.
echo [OK] Preflight de produccion completado correctamente.
exit /b 0

:project_ready
if not defined RUN_E2E_FULL set "RUN_E2E_FULL=0"
echo.
echo [PROJECT READY] Ejecutando validacion integral...
call :local_ready || exit /b 1
if /I "%RUN_E2E_FULL%"=="1" (
    set "RUN_E2E_FULL=1"
) else (
    set "RUN_E2E_FULL=0"
)
call :e2e_ready || exit /b 1
set "RUN_E2E_FULL="
exit /b 0

:check_required_file
if exist "%~1" exit /b 0
echo [ERROR] Falta %~2 en la ruta: %~1
exit /b 1

:resolve_php
if defined PHP_EXE if exist "%PHP_EXE%" exit /b 0
for /f "delims=" %%P in ('where php 2^>nul') do (
    set "PHP_EXE=%%P"
    goto :resolve_php_done
)
:resolve_php_done
if defined PHP_EXE if exist "%PHP_EXE%" exit /b 0
echo [ERROR] PHP no encontrado. Verifica C:\xampp\php\php.exe o agrega php al PATH.
exit /b 1

:load_db_env
set "DB_HOST=127.0.0.1"
set "DB_PORT=3306"
set "DB_NAME=nico_reparaciones"
set "DB_USERNAME=root"
set "DB_PASSWORD="

if exist ".env" (
    for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
        if /I "%%A"=="DB_HOST" set "DB_HOST=%%B"
        if /I "%%A"=="DB_PORT" set "DB_PORT=%%B"
        if /I "%%A"=="DB_DATABASE" set "DB_NAME=%%B"
        if /I "%%A"=="DB_USERNAME" set "DB_USERNAME=%%B"
        if /I "%%A"=="DB_PASSWORD" set "DB_PASSWORD=%%B"
    )
)
exit /b 0

:load_ops_mail_env
set "OPS_MAIL_ASYNC_ENABLED=false"
set "OPS_MAIL_QUEUE=mail"
set "OPS_MAIL_TRIES=3"
set "OPS_MAIL_BACKOFF_SECONDS=60,300,900"
set "OPS_MAIL_BACKOFF=60"
set "QUEUE_WORKER_QUEUES=mail,default"

if exist ".env" (
    for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
        if /I "%%A"=="OPS_MAIL_ASYNC_ENABLED" set "OPS_MAIL_ASYNC_ENABLED=%%B"
        if /I "%%A"=="OPS_MAIL_QUEUE" set "OPS_MAIL_QUEUE=%%B"
        if /I "%%A"=="OPS_MAIL_TRIES" set "OPS_MAIL_TRIES=%%B"
        if /I "%%A"=="OPS_MAIL_BACKOFF_SECONDS" set "OPS_MAIL_BACKOFF_SECONDS=%%B"
    )
)

set "OPS_MAIL_ASYNC_ENABLED=%OPS_MAIL_ASYNC_ENABLED:"=%"
set "OPS_MAIL_QUEUE=%OPS_MAIL_QUEUE:"=%"
set "OPS_MAIL_TRIES=%OPS_MAIL_TRIES:"=%"
set "OPS_MAIL_BACKOFF_SECONDS=%OPS_MAIL_BACKOFF_SECONDS:"=%"

if /I "%OPS_MAIL_ASYNC_ENABLED%"=="1" set "OPS_MAIL_ASYNC_ENABLED=true"
if /I "%OPS_MAIL_ASYNC_ENABLED%"=="yes" set "OPS_MAIL_ASYNC_ENABLED=true"

for /f "tokens=1 delims=," %%B in ("%OPS_MAIL_BACKOFF_SECONDS%") do set "OPS_MAIL_BACKOFF=%%B"
if "%OPS_MAIL_BACKOFF%"=="" set "OPS_MAIL_BACKOFF=60"
for /f "delims=0123456789" %%N in ("%OPS_MAIL_BACKOFF%") do set "OPS_MAIL_BACKOFF=60"
if "%OPS_MAIL_TRIES%"=="" set "OPS_MAIL_TRIES=3"
for /f "delims=0123456789" %%N in ("%OPS_MAIL_TRIES%") do set "OPS_MAIL_TRIES=3"

set "OPS_MAIL_QUEUE=%OPS_MAIL_QUEUE: =%"
if "%OPS_MAIL_QUEUE%"=="" set "OPS_MAIL_QUEUE=mail"
set "QUEUE_WORKER_QUEUES=%OPS_MAIL_QUEUE%"
echo %QUEUE_WORKER_QUEUES% | findstr /I /C:"default" >nul 2>&1
if errorlevel 1 set "QUEUE_WORKER_QUEUES=%QUEUE_WORKER_QUEUES%,default"
exit /b 0

:ensure_queue_worker
if /I not "%OPS_MAIL_ASYNC_ENABLED%"=="true" (
    echo - Cola mail async desactivada en .env. No se inicia queue worker.
    exit /b 0
)

if not exist "%DEV_RUNTIME_DIR%" mkdir "%DEV_RUNTIME_DIR%" >nul 2>&1
echo - Verificando queue worker de correo...
powershell -NoProfile -Command "$root = '%PROJECT_ROOT%'; $existing = Get-CimInstance Win32_Process -Filter \"Name='php.exe'\" | Where-Object { $_.CommandLine -like '*artisan queue:work*' -and $_.CommandLine -like ('*' + $root + '*') }; if ($existing) { Set-Content -Path '%QUEUE_PID_FILE%' -Value $existing[0].ProcessId; exit 0 }; $args = 'artisan queue:work --queue=%QUEUE_WORKER_QUEUES% --tries=%OPS_MAIL_TRIES% --backoff=%OPS_MAIL_BACKOFF%'; $p = Start-Process -FilePath '%PHP_EXE%' -ArgumentList $args -WorkingDirectory '%PROJECT_ROOT%' -WindowStyle Minimized -PassThru; Set-Content -Path '%QUEUE_PID_FILE%' -Value $p.Id; exit 0;" >nul 2>&1
if errorlevel 1 (
    echo [WARN] No se pudo iniciar/verificar queue worker automaticamente.
    exit /b 0
)

set "QPID="
if exist "%QUEUE_PID_FILE%" set /p QPID=<"%QUEUE_PID_FILE%"
if not "%QPID%"=="" echo - Queue worker activo (PID %QPID%).
exit /b 0

:ensure_mailpit
if not exist "%DEV_RUNTIME_DIR%" mkdir "%DEV_RUNTIME_DIR%" >nul 2>&1

if not exist "%MAILPIT_EXE%" (
    echo [WARN] Mailpit no encontrado en tools\mailpit\mailpit.exe
    echo        Descarga sugerida:
    echo        curl.exe -L "https://github.com/axllent/mailpit/releases/download/v1.29.0/mailpit-windows-amd64.zip" -o "tools\mailpit\mailpit-windows-amd64.zip"
    echo        tar -xf tools\mailpit\mailpit-windows-amd64.zip -C tools\mailpit
    exit /b 0
)

netstat -ano | findstr /R /C:":%MAILPIT_SMTP_PORT% .*LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo - Mailpit ya activo en puertos SMTP %MAILPIT_SMTP_PORT% / UI %MAILPIT_UI_PORT%.
    exit /b 0
)

echo - Iniciando Mailpit...
powershell -NoProfile -Command "$p = Start-Process -FilePath '%MAILPIT_EXE%' -ArgumentList '--smtp 127.0.0.1:%MAILPIT_SMTP_PORT% --listen 127.0.0.1:%MAILPIT_UI_PORT%' -WorkingDirectory '%PROJECT_ROOT%' -WindowStyle Minimized -PassThru; Set-Content -Path '%MAILPIT_PID_FILE%' -Value $p.Id" >nul 2>&1
if errorlevel 1 (
    echo [WARN] No se pudo iniciar Mailpit automaticamente.
    exit /b 0
)
echo - Mailpit iniciado.
exit /b 0

:stop_queue_worker
if exist "%QUEUE_PID_FILE%" (
    set "QPID="
    set /p QPID=<"%QUEUE_PID_FILE%"
    if not "%QPID%"=="" (
        taskkill /PID %QPID% /F >nul 2>&1
        if not errorlevel 1 (
            echo - Queue worker detenido (PID %QPID%).
        )
    )
    del /F /Q "%QUEUE_PID_FILE%" >nul 2>&1
)

powershell -NoProfile -Command "$root = '%PROJECT_ROOT%'; $procs = Get-CimInstance Win32_Process -Filter \"Name='php.exe'\" | Where-Object { $_.CommandLine -like '*artisan queue:work*' -and $_.CommandLine -like ('*' + $root + '*') }; foreach($p in $procs){ Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1
if exist "%QUEUE_PID_FILE%" del /F /Q "%QUEUE_PID_FILE%" >nul 2>&1
exit /b 0

:stop_mailpit
if exist "%MAILPIT_PID_FILE%" (
    set "MPID="
    set /p MPID=<"%MAILPIT_PID_FILE%"
    if not "%MPID%"=="" (
        taskkill /PID %MPID% /F >nul 2>&1
        if not errorlevel 1 (
            echo - Mailpit detenido (PID %MPID%).
        )
    )
    del /F /Q "%MAILPIT_PID_FILE%" >nul 2>&1
)

powershell -NoProfile -Command "$root = '%PROJECT_ROOT%'; $procs = Get-CimInstance Win32_Process -Filter \"Name='mailpit.exe'\" | Where-Object { $_.ExecutablePath -like ('*' + $root + '*') }; foreach($p in $procs){ Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1
exit /b 0

:ensure_mysql_running
if exist "%MYSQLADMIN_EXE%" (
    call :mysqladmin_ping
    if not errorlevel 1 (
        echo - MySQL activo en puerto %DB_PORT%.
        exit /b 0
    )
) else (
    netstat -ano | findstr /R /C:":%DB_PORT% .*LISTENING" >nul 2>&1
    if not errorlevel 1 (
        echo - MySQL activo en puerto %DB_PORT%.
        exit /b 0
    )
)

echo - MySQL no esta activo. Intentando iniciar mysqld...
if not exist "%MYSQLD_EXE%" (
    echo [ERROR] mysqld.exe no encontrado en: %MYSQLD_EXE%
    exit /b 1
)

if exist "%MYSQL_INI%" (
    start "" /min "%MYSQLD_EXE%" --defaults-file="%MYSQL_INI%" --standalone --console
) else (
    start "" /min "%MYSQLD_EXE%" --standalone --console
)

for /l %%S in (1,1,20) do (
    timeout /t 1 >nul
    if exist "%MYSQLADMIN_EXE%" (
        call :mysqladmin_ping
        if not errorlevel 1 (
            echo - MySQL iniciado correctamente en puerto %DB_PORT%.
            exit /b 0
        )
    ) else (
        netstat -ano | findstr /R /C:":%DB_PORT% .*LISTENING" >nul 2>&1
        if not errorlevel 1 (
            echo - MySQL iniciado correctamente en puerto %DB_PORT%.
            exit /b 0
        )
    )
)

echo [ERROR] No se pudo iniciar MySQL en el puerto %DB_PORT%.
exit /b 1

:create_database_if_needed
if not exist "%MYSQL_EXE%" (
    echo [WARN] mysql.exe no encontrado. Salteando creacion automatica de DB.
    exit /b 0
)

if "%DB_NAME%"=="" (
    echo [WARN] DB_DATABASE vacio en .env. Salteando creacion automatica.
    exit /b 0
)

echo - Verificando/creando base de datos "%DB_NAME%"...
call :mysql_exec "CREATE DATABASE IF NOT EXISTS %DB_NAME% CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if errorlevel 1 (
    echo [WARN] No se pudo crear/verificar la DB automaticamente.
    echo       Revisa credenciales en .env (DB_HOST/DB_PORT/DB_DATABASE/DB_USERNAME/DB_PASSWORD).
)
exit /b 0

:mysqladmin_ping
if defined DB_PASSWORD (
    if not "%DB_PASSWORD%"=="" (
        "%MYSQLADMIN_EXE%" -h "%DB_HOST%" -P "%DB_PORT%" -u "%DB_USERNAME%" --password="%DB_PASSWORD%" ping >nul 2>&1
        exit /b %ERRORLEVEL%
    )
)
"%MYSQLADMIN_EXE%" -h "%DB_HOST%" -P "%DB_PORT%" -u "%DB_USERNAME%" ping >nul 2>&1
exit /b %ERRORLEVEL%

:mysql_exec
if defined DB_PASSWORD (
    if not "%DB_PASSWORD%"=="" (
        "%MYSQL_EXE%" -h "%DB_HOST%" -P "%DB_PORT%" -u "%DB_USERNAME%" --password="%DB_PASSWORD%" -e "%~1" >nul 2>&1
        exit /b %ERRORLEVEL%
    )
)
"%MYSQL_EXE%" -h "%DB_HOST%" -P "%DB_PORT%" -u "%DB_USERNAME%" -e "%~1" >nul 2>&1
exit /b %ERRORLEVEL%

:wait_http_ok
setlocal
set "URL=%~1"
set "TRIES=%~2"
if "%TRIES%"=="" set "TRIES=15"
for /l %%I in (1,1,%TRIES%) do (
    powershell -NoProfile -Command "try { $r=Invoke-WebRequest -UseBasicParsing '%URL%' -TimeoutSec 2; if($r.StatusCode -ge 200 -and $r.StatusCode -lt 500){ exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
    if not errorlevel 1 (
        endlocal & exit /b 0
    )
    timeout /t 1 >nul
)
endlocal & exit /b 1

:kill_port_if_listening
setlocal
set "PORT=%~1"
if "%PORT%"=="" endlocal & exit /b 0
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING" 2^>nul') do (
    if not "%%P"=="0" (
        echo   - Liberando puerto %PORT% ^(PID %%P^)
        taskkill /PID %%P /F >nul 2>&1
    )
)
endlocal & exit /b 0

:next_log_hint
setlocal
set "LOGFILE=%~1"
if not exist "%LOGFILE%" (
  endlocal & exit /b 0
)
findstr /I /C:"EADDRINUSE" "%LOGFILE%" >nul 2>&1 && echo [HINT] Se detecto EADDRINUSE en %LOGFILE% ^(puerto ocupado / proceso viejo^)
findstr /I /C:"prisma://" "%LOGFILE%" >nul 2>&1 && echo [HINT] Se detecto error de Prisma Data Proxy/Accelerate en %LOGFILE%
findstr /I /C:"Unauthorized" "%LOGFILE%" >nul 2>&1 && echo [HINT] Hay 401 en backend. Limpia localStorage del navegador si el login ya cambio.
endlocal & exit /b 0

:next_warn_prisma_generate_failed
echo [WARN] Prisma generate fallo. En Windows suele pasar por lock EPERM si hay procesos Node/Nest usando Prisma.
echo [WARN] Se continua con el arranque dev. Si la API falla, ejecuta:
echo        nico-dev.bat next-stop
echo        nico-dev.bat next-start
exit /b 0

:end_ok
exit /b 0

:end_fail
echo.
echo [ERROR] El script termino con errores.
exit /b 1
