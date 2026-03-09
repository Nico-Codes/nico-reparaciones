# ROOT_LEGACY_RETIREMENT_CHECKLIST

## Etapa 1 - Desacople funcional
- [x] `next-stack/` definido como canon operativo
- [x] auth social legacy retirada
- [x] assets canonicos consolidados en `next-stack/apps/web/public`
- [x] parity visual legacy retirada del gate principal
- [x] migradores legacy retirados del flujo normal

## Etapa 2 - Retiro material ejecutado
- [x] eliminacion de `next-stack/legacy-support/`
- [x] eliminacion del runtime Laravel root
- [x] eliminacion de `public/` root y storage legacy
- [x] eliminacion de `composer.json`, `composer.lock` y tooling root asociado
- [x] reescritura de `nico-dev.bat` hacia `next-stack`
- [x] reescritura de CI hacia `next-stack`

## Etapa 3 - Pendientes menores
- [ ] decidir si `docs/` historico se conserva completo o se reduce aun mas
- [ ] decidir si los PDFs historicos de raiz siguen teniendo valor documental dentro del repo

## Estado

No hay bloqueo tecnico real para considerar retirado el root Laravel.
