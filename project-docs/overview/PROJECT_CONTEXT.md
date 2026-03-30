# PROJECT_CONTEXT

## Identidad del proyecto

`NicoReparaciones` es una plataforma web para un negocio de reparacion de dispositivos y venta de electronica.

## Objetivo del sistema

Centralizar en una sola web:
- tienda online
- carrito y checkout
- pedidos de clientes
- reparaciones de clientes y admin
- configuracion del negocio
- branding, plantillas y comunicacion
- operacion interna del panel admin

## Tipos de usuario

- visitante publico
- cliente autenticado
- administrador

## Modulos funcionales principales

- tienda
- carrito
- checkout
- pedidos
- reparaciones
- auth
- dashboard admin
- productos y categorias
- pricing y catalogo tecnico
- configuracion del negocio
- branding
- mail y WhatsApp
- proveedores
- garantias
- contabilidad
- ayuda
- usuarios y roles

## Stack actual

- frontend: React + TypeScript + Vite + Tailwind CSS
- backend: NestJS + TypeScript + Prisma
- base principal: PostgreSQL
- contratos compartidos: `@nico/contracts`

## Estado actual del repo

- `next-stack/` es el sistema operativo real
- la migracion funcional y estructural esta cerrada
- el runtime Laravel legacy fue retirado del repo activo
- `project-docs/` concentra la documentacion viva del proyecto

## Prioridad de mantenimiento

1. mantener limpio y coherente `next-stack/`
2. evitar reintroducir capas legacy o duplicacion de fuentes de verdad
3. documentar decisiones y cambios sensibles en `project-docs/`
