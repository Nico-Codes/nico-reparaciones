# Script `.bat` unificado (guia rapida)

## `nico-dev.bat`
Script unico para todas las tareas locales en Windows.

Comandos:
- `nico-dev.bat` -> menu interactivo
- `nico-dev.bat setup` -> prepara proyecto en PC nueva
- `nico-dev.bat start` -> levanta entorno de desarrollo (MySQL/Laravel/Vite/Mailpit/queue/ngrok)
- `nico-dev.bat stop` -> detiene entorno local
- `nico-dev.bat local-ready` -> health + mail + tests criticos backend
- `nico-dev.bat e2e` -> E2E critico (Playwright)
- `nico-dev.bat e2e-full` -> E2E critico + full
- `nico-dev.bat prod-preflight` -> preflight estricto orientado a produccion
- `nico-dev.bat project-ready` -> local-ready + e2e critico
- `nico-dev.bat project-ready-full` -> local-ready + e2e critico + e2e full

## Recomendacion de uso diario
1. Desarrollo: `nico-dev.bat start`
2. Cierre de cambios: `nico-dev.bat project-ready`
3. Cierre de etapa importante: `nico-dev.bat project-ready-full`
