# PROJECT_CONTEXT

## Identidad del proyecto

`NicoReparaciones` es una plataforma web para un negocio que combina dos lineas operativas:

- reparacion de dispositivos
- venta de productos y electronica

No es solo una tienda online. El codigo actual muestra una aplicacion con tres superficies de uso:

- publico
- cliente autenticado
- admin interno

## Objetivo del sistema

Centralizar en una sola plataforma:

- tienda, catalogo, carrito y checkout
- pedidos del cliente y gestion admin
- reparaciones publicas, del cliente y del admin
- configuracion del negocio
- branding e identidad visual
- plantillas de correo y WhatsApp
- pricing y catalogo tecnico
- garantias, proveedores, contabilidad y alertas

## Tipos de usuarios

Confirmados por codigo y esquema de base:

- `USER`
- `ADMIN`

Ademas existe la superficie de visitante publico sin autenticacion.

## Modulos funcionales principales

Confirmados por rutas frontend, controllers Nest y schema Prisma:

- auth y cuenta
- tienda publica
- carrito
- checkout
- pedidos
- reparaciones
- ayuda publica
- dashboard admin
- productos y categorias admin
- configuraciones admin
- pricing de productos y reparaciones
- catalogo tecnico de dispositivos
- proveedores
- garantias
- contabilidad
- plantillas de mail
- plantillas y logs de WhatsApp
- usuarios y roles
- seguridad 2FA

## Stack legacy en la raiz del repo

Base historica principal:

- PHP 8.2
- Laravel 12
- Blade
- MySQL
- Tailwind CSS
- Vite

Dependencias relevantes confirmadas en `composer.json`:

- `laravel/framework`
- `firebase/php-jwt`
- `predis/predis`

## Stack nuevo en `next-stack/`

Base operativa principal del sistema migrado:

- React
- TypeScript
- Vite
- Tailwind CSS
- Node.js
- NestJS
- Prisma
- PostgreSQL
- Zod

Dependencias confirmadas por `next-stack/apps/web/package.json` y `next-stack/apps/api/package.json`.

## Estado real actual del proyecto

Validado por codigo, scripts y ultimo gate tecnico:

- el sistema operativo principal vive en `next-stack/`
- el frontend operativo principal vive en `next-stack/apps/web`
- el backend operativo principal vive en `next-stack/apps/api`
- el gate `npm run qa:migration:close` existe y paso en verde
- `qa:legacy:detach` existe y reporta desacople tecnico sin hallazgos bloqueantes

## Que parte del repo es historica y que parte es operativa hoy

Operativo hoy:

- `next-stack/apps/web`
- `next-stack/apps/api`
- `next-stack/packages/contracts`
- `next-stack/scripts`
- `next-stack/docs` para runbooks y QA del nuevo stack
- `nico-dev.bat` como envoltorio operativo local

Historico o de soporte a la migracion:

- `app/`, `routes/`, `resources/`, `bootstrap/`, `config/` y el resto del Laravel root
- `public/` root como superficie publica del legacy
- `database/` root para Laravel, SQLite y utilidades de QA legacy
- `docs/` root con runbooks/documentacion anterior o general

Importante: el legacy ya no es la base funcional principal, pero no es totalmente eliminable hoy. `next-stack` todavia lo usa para algunos scripts de migracion y paridad visual.

## Prioridades de mantenimiento

Prioridad alta:

- preservar integridad del nuevo stack operativo
- evitar limpiezas destructivas sin clasificacion previa
- documentar cruces vivos entre legacy y `next-stack`
- gobernar decisiones tecnicas y futuras limpiezas

Prioridad media:

- consolidar documentacion viva
- reducir duplicaciones de assets, docs y configs
- aclarar que partes del legacy deben conservarse por soporte historico o QA

Prioridad baja por ahora:

- refactors grandes
- eliminacion masiva de archivos
- cambios de arquitectura no justificados
