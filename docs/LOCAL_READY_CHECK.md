# Local Ready Check

Validacion rapida para confirmar que el proyecto esta operativo en entorno local.

## Opcion 1: Script Windows

```bat
nico-dev.bat local-ready
```

## Opcion 2: Composer

```bash
composer run ops:local:ready
```

## Que valida

1. `config:clear`
2. `ops:health-check`
3. Mail de prueba en modo sync (`ops:mail-test --force-sync`)
4. Mail de prueba en modo async + procesamiento de cola
5. Suite critica de tests:
   - `AuthEmailFlowsTest`
   - `OrderConfirmationMailTest`
   - `AdminSettingsSmtpTest`
   - `OpsMailTestCommandTest`
   - `OpsHealthCheckCommandTest`

Si todo pasa, el entorno local queda listo para QA funcional.
