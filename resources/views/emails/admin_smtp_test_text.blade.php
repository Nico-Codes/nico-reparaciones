Prueba SMTP de NicoReparaciones

Este correo confirma que el envio de emails esta funcionando.

Datos del envio:
- Fecha: {{ now()->format('Y-m-d H:i:s') }}
- Entorno: {{ $appEnv }}
- URL: {{ $appUrl }}
- Disparado por admin: {{ $sentByEmail }}

Si recibiste este correo, la configuracion SMTP esta operativa.

