@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM ============================================================================
REM NicoReparaciones - Helper de desarrollo para Windows
REM ----------------------------------------------------------------------------
REM USO RAPIDO
REM   1) Doble click en este .bat (menu interactivo)
REM   2) O por consola:
REM      - nico-dev.bat setup   (primera vez / PC nueva)
REM      - nico-dev.bat start   (iniciar entorno + worker de cola mail si aplica)
REM      - nico-dev.bat stop    (detener entorno)
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
set "NGROK_API_PORT=4040"
set "DEV_RUNTIME_DIR=%PROJECT_ROOT%storage\app\dev"
set "QUEUE_PID_FILE=%DEV_RUNTIME_DIR%\queue-worker.pid"

if /I "%~1"=="setup" goto :setup
if /I "%~1"=="start" goto :start
if /I "%~1"=="stop" goto :stop
if /I "%~1"=="help" goto :help

:menu
echo.
echo ================= NicoReparaciones =================
echo 1^) Setup inicial (primera vez / PC nueva)
echo 2^) Iniciar entorno (MySQL + Laravel + Vite + queue + ngrok)
echo 3^) Detener entorno
echo Q^) Salir
echo ================================================
choice /C 123Q /N /M "Selecciona opcion [1/2/3/Q]: "
if errorlevel 4 goto :end_ok
if errorlevel 3 goto :stop
if errorlevel 2 goto :start
if errorlevel 1 goto :setup

:help
echo.
echo Uso:
echo   nico-dev.bat setup
echo   nico-dev.bat start
echo   nico-dev.bat stop
goto :end_ok

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

echo - Servicios detenidos (si estaban activos).
goto :end_ok

:check_required_file
if exist "%~1" exit /b 0
echo [ERROR] Falta %~2 en la ruta: %~1
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

if exist "%QUEUE_PID_FILE%" (
    set "QPID="
    set /p QPID=<"%QUEUE_PID_FILE%"
    if not "!QPID!"=="" (
        tasklist /FI "PID eq !QPID!" | findstr /R /C:" !QPID! " >nul 2>&1
        if not errorlevel 1 (
            echo - Queue worker ya activo (PID !QPID!).
            exit /b 0
        )
    )
    del /F /Q "%QUEUE_PID_FILE%" >nul 2>&1
)

echo - Iniciando queue worker: artisan queue:work --queue=%QUEUE_WORKER_QUEUES% --tries=%OPS_MAIL_TRIES% --backoff=%OPS_MAIL_BACKOFF%
powershell -NoProfile -Command "$p = Start-Process -FilePath '%PHP_EXE%' -ArgumentList 'artisan queue:work --queue=%QUEUE_WORKER_QUEUES% --tries=%OPS_MAIL_TRIES% --backoff=%OPS_MAIL_BACKOFF%' -WorkingDirectory '%PROJECT_ROOT%' -WindowStyle Minimized -PassThru; Set-Content -Path '%QUEUE_PID_FILE%' -Value $p.Id" >nul 2>&1
if errorlevel 1 (
    echo [WARN] No se pudo iniciar queue worker automaticamente.
    exit /b 0
)

set "QPID="
set /p QPID=<"%QUEUE_PID_FILE%"
if "%QPID%"=="" (
    echo [WARN] Queue worker iniciado, pero no se pudo guardar PID.
) else (
    echo - Queue worker iniciado (PID %QPID%).
)
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

:end_ok
exit /b 0

:end_fail
echo.
echo [ERROR] El script termino con errores.
exit /b 1

