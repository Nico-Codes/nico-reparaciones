@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "PROJECT_ROOT=%~dp0"
set "NEXT_STACK_ROOT=%PROJECT_ROOT%next-stack"
set "NEXT_API_PORT=3001"
set "NEXT_WEB_PORT=5174"
set "NEXT_WEB_PREVIEW_PORT=4174"
set "NEXT_NGROK_API_PORT=4040"
set "NEXT_API_HEALTH_URL=http://127.0.0.1:%NEXT_API_PORT%/api/health"
set "NEXT_WEB_URL=http://localhost:%NEXT_WEB_PORT%"
set "NEXT_NGROK_API_URL=http://127.0.0.1:%NEXT_NGROK_API_PORT%/api/tunnels"
set "NEXT_DEV_LOG_DIR=%NEXT_STACK_ROOT%\.dev-logs"
set "NEXT_API_LOG=%NEXT_DEV_LOG_DIR%\api.log"
set "NEXT_WEB_LOG=%NEXT_DEV_LOG_DIR%\web.log"
set "NEXT_NGROK_LOG=%NEXT_DEV_LOG_DIR%\ngrok.log"
set "NEXT_NGROK_CONFIG=%LOCALAPPDATA%\ngrok\ngrok.yml"

if /I "%~1"=="setup" goto :next_setup
if /I "%~1"=="start" goto :next_start
if /I "%~1"=="stop" goto :next_stop
if /I "%~1"=="qa" goto :next_qa
if /I "%~1"=="preprod" goto :next_preprod
if /I "%~1"=="close" goto :next_close
if /I "%~1"=="next-setup" goto :next_setup
if /I "%~1"=="next-start" goto :next_start
if /I "%~1"=="next-stop" goto :next_stop
if /I "%~1"=="next-qa" goto :next_qa
if /I "%~1"=="next-preprod" goto :next_preprod
if /I "%~1"=="next-close" goto :next_close
if /I "%~1"=="help" goto :help
if "%~1"=="" goto :menu

echo [ERROR] Comando no reconocido: %~1
goto :help

:menu
echo.
echo ================= NicoReparaciones =================
echo Stack operativo: next-stack ^(React + NestJS + Prisma + PostgreSQL^)
echo.
echo 1^) Setup
echo 2^) Start dev + ngrok
echo 3^) Stop dev + ngrok
echo 4^) QA full
echo 5^) Preprod
echo 6^) Close migration gate
echo Q^) Salir
echo ================================================
choice /C 123456Q /N /M "Selecciona opcion [1-6,Q]: "
if errorlevel 7 goto :end_ok
if errorlevel 6 goto :next_close
if errorlevel 5 goto :next_preprod
if errorlevel 4 goto :next_qa
if errorlevel 3 goto :next_stop
if errorlevel 2 goto :next_start
if errorlevel 1 goto :next_setup

:help
echo.
echo Uso:
echo   nico-dev.bat setup        ^(alias: next-setup^)
echo   nico-dev.bat start        ^(alias: next-start^)
echo   nico-dev.bat stop         ^(alias: next-stop^)
echo   nico-dev.bat qa           ^(alias: next-qa^)
echo   nico-dev.bat preprod      ^(alias: next-preprod^)
echo   nico-dev.bat close        ^(alias: next-close^)
echo   nico-dev.bat help
goto :end_ok

:next_setup
echo.
echo [SETUP] Preparando next-stack...
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

echo - npm install
call npm --prefix "%NEXT_STACK_ROOT%" install || goto :end_fail
echo - Prisma generate
call npm --prefix "%NEXT_STACK_ROOT%" run db:generate || goto :end_fail
echo - Env check
call npm --prefix "%NEXT_STACK_ROOT%" run env:check || goto :end_fail

echo.
echo [OK] Setup completado.
exit /b 0

:next_start
echo.
echo [START] Iniciando API + Web del next-stack ^(+ ngrok si esta configurado^)...
if not exist "%NEXT_STACK_ROOT%\package.json" (
    echo [ERROR] No se encontro next-stack en: %NEXT_STACK_ROOT%
    goto :end_fail
)
where npm >nul 2>&1 || (echo [ERROR] npm no encontrado. Instala Node.js LTS. & goto :end_fail)
if not exist "%NEXT_DEV_LOG_DIR%" mkdir "%NEXT_DEV_LOG_DIR%" >nul 2>&1
del /q "%NEXT_NGROK_LOG%" >nul 2>&1

echo - Prisma generate
call npm --prefix "%NEXT_STACK_ROOT%" run db:generate
if errorlevel 1 call :next_warn_prisma_generate_failed

echo - Liberando puertos del next-stack...
call :kill_ngrok_for_web %NEXT_WEB_PORT%
call :kill_port_if_listening %NEXT_API_PORT%
call :kill_port_if_listening %NEXT_WEB_PORT%
call :kill_port_if_listening %NEXT_WEB_PREVIEW_PORT%
call :kill_port_if_listening %NEXT_NGROK_API_PORT%
timeout /t 1 >nul

echo - Iniciando API NestJS ^(puerto %NEXT_API_PORT%^)...
start "" /min cmd /c "cd /d ""%NEXT_STACK_ROOT%"" && npm run dev:api > ""%NEXT_API_LOG%"" 2>&1"

echo - Iniciando Web React/Vite ^(puerto %NEXT_WEB_PORT%^)...
start "" /min cmd /c "cd /d ""%NEXT_STACK_ROOT%"" && npm run dev:web > ""%NEXT_WEB_LOG%"" 2>&1"

set "NEXT_SKIP_NGROK="
if exist "%NEXT_NGROK_CONFIG%" (
  echo - Iniciando ngrok para Web ^(puerto %NEXT_WEB_PORT%^)...
  start "" /min cmd /c "cd /d ""%NEXT_STACK_ROOT%"" && npm exec -- ngrok http %NEXT_WEB_PORT% --log stdout > ""%NEXT_NGROK_LOG%"" 2>&1"
) else (
  if not "%NGROK_AUTHTOKEN%"=="" (
    echo - Iniciando ngrok para Web ^(puerto %NEXT_WEB_PORT%^, token por entorno^)...
    start "" /min cmd /c "cd /d ""%NEXT_STACK_ROOT%"" && npm exec -- ngrok http %NEXT_WEB_PORT% --log stdout > ""%NEXT_NGROK_LOG%"" 2>&1"
  ) else (
    echo [WARN] No se encontro config/token de ngrok. Se inicia API + Web sin tunel publico.
    echo [TIP] Configura %NEXT_NGROK_CONFIG% o define NGROK_AUTHTOKEN.
    set "NEXT_SKIP_NGROK=1"
  )
)

call :wait_http_ok "%NEXT_API_HEALTH_URL%" 25
set "NEXT_API_HEALTH_OK=%ERRORLEVEL%"
call :wait_http_ok "%NEXT_WEB_URL%" 20
set "NEXT_WEB_HEALTH_OK=%ERRORLEVEL%"
set "NEXT_NGROK_OK=1"
set "NEXT_NGROK_PUBLIC_URL="
if not defined NEXT_SKIP_NGROK (
  call :wait_http_ok "%NEXT_NGROK_API_URL%" 20
  set "NEXT_NGROK_OK=%ERRORLEVEL%"
  if "%NEXT_NGROK_OK%"=="0" call :get_ngrok_public_url "%NEXT_NGROK_API_URL%"
)

echo.
if "%NEXT_API_HEALTH_OK%"=="0" (
  echo [OK] API responde health.
) else (
  echo [WARN] API no responde aun: %NEXT_API_HEALTH_URL%
  echo [TIP] Revisar log: %NEXT_API_LOG%
  call :next_log_hint "%NEXT_API_LOG%"
)
if "%NEXT_WEB_HEALTH_OK%"=="0" (
  echo [OK] Web responde.
) else (
  echo [WARN] Web no responde aun: %NEXT_WEB_URL%
  echo [TIP] Revisar log: %NEXT_WEB_LOG%
  call :next_log_hint "%NEXT_WEB_LOG%"
)
if not defined NEXT_SKIP_NGROK (
  if "%NEXT_NGROK_OK%"=="0" (
    echo [OK] Ngrok responde.
  ) else (
    echo [WARN] Ngrok no responde aun: %NEXT_NGROK_API_URL%
    echo [TIP] Revisar log: %NEXT_NGROK_LOG%
    call :next_ngrok_log_hint "%NEXT_NGROK_LOG%"
  )
)
echo - API: %NEXT_API_HEALTH_URL%
echo - Web: %NEXT_WEB_URL%
if defined NEXT_NGROK_PUBLIC_URL echo - Ngrok: %NEXT_NGROK_PUBLIC_URL%
exit /b 0

:next_stop
echo.
echo [STOP] Deteniendo next-stack ^(puertos %NEXT_API_PORT%, %NEXT_WEB_PORT%, %NEXT_WEB_PREVIEW_PORT%^) y ngrok...
call :kill_ngrok_for_web %NEXT_WEB_PORT%
call :kill_port_if_listening %NEXT_NGROK_API_PORT%
powershell -NoProfile -Command "$ports=@(%NEXT_API_PORT%,%NEXT_WEB_PORT%,%NEXT_WEB_PREVIEW_PORT%); $procIds=Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $ports -contains $_.LocalPort } | Select-Object -ExpandProperty OwningProcess -Unique; foreach($procId in $procIds){ Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue }" >nul 2>&1
echo - Next-stack y ngrok detenidos ^(si estaban activos^).
exit /b 0

:next_qa
echo.
echo [QA] Ejecutando QA full del next-stack...
call npm --prefix "%NEXT_STACK_ROOT%" run qa:full || goto :end_fail
echo.
echo [OK] QA full completado.
exit /b 0

:next_preprod
echo.
echo [PREPROD] Ejecutando checks de preproduccion del next-stack...
call npm --prefix "%NEXT_STACK_ROOT%" run deploy:check || goto :end_fail
call npm --prefix "%NEXT_STACK_ROOT%" run qa:preprod || goto :end_fail
echo.
echo [OK] Preprod completado.
exit /b 0

:next_close
echo.
echo [CLOSE] Ejecutando gate final de migracion del next-stack...
call npm --prefix "%NEXT_STACK_ROOT%" run qa:migration:close || goto :end_fail
echo.
echo [OK] Gate final completado.
exit /b 0

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

:kill_ngrok_for_web
setlocal
set "PORT=%~1"
if "%PORT%"=="" endlocal & exit /b 0
powershell -NoProfile -Command "$pattern='ngrok http %PORT%'; $procIds=Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match $pattern } | Select-Object -ExpandProperty ProcessId -Unique; foreach($procId in $procIds){ Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue }" >nul 2>&1
endlocal & exit /b 0

:get_ngrok_public_url
setlocal
set "API_URL=%~1"
for /f "usebackq delims=" %%U in (`powershell -NoProfile -Command "try { $resp=Invoke-RestMethod -UseBasicParsing '%API_URL%' -TimeoutSec 2; $u=@($resp.tunnels | Where-Object { $_.proto -eq 'https' } | Select-Object -First 1 -ExpandProperty public_url); if($u){ Write-Output $u; exit 0 } else { exit 1 } } catch { exit 1 }"`) do (
    endlocal & set "NEXT_NGROK_PUBLIC_URL=%%U" & exit /b 0
)
endlocal & exit /b 1

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

:next_ngrok_log_hint
setlocal
set "LOGFILE=%~1"
if not exist "%LOGFILE%" (
  endlocal & exit /b 0
)
findstr /I /C:"ERR_NGROK_4018" "%LOGFILE%" >nul 2>&1 && echo [HINT] Ngrok requiere auth valida. Ejecuta `ngrok config add-authtoken ...` o revisa %NEXT_NGROK_CONFIG%.
findstr /I /C:"ERR_NGROK_108" "%LOGFILE%" >nul 2>&1 && echo [HINT] La cuenta de ngrok ya tiene otra sesion/tunel activo.
findstr /I /C:"authentication failed" "%LOGFILE%" >nul 2>&1 && echo [HINT] La autenticacion de ngrok fallo. Revisa token/config.
endlocal & exit /b 0

:next_warn_prisma_generate_failed
echo [WARN] Prisma generate fallo. En Windows suele pasar por lock EPERM si hay procesos Node/Nest usando Prisma.
echo [WARN] Se continua con el arranque dev. Si la API falla, ejecuta:
echo        nico-dev.bat stop
echo        nico-dev.bat start
exit /b 0

:end_ok
exit /b 0

:end_fail
echo.
echo [ERROR] El script termino con errores.
exit /b 1
