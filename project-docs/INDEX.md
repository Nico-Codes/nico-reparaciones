# PROJECT_DOCS INDEX

## Router documental unico

- `../AGENTS.md`: contrato operativo corto para Codex en este repo.
- `INDEX.md`: mapa de lectura y taxonomia documental.
- `WORKFLOW_AI.md`: metodologia operativa detallada para Codex.
- `DECISIONS_LOG.md`: decisiones tecnicas y criterios aceptados.
- `../next-stack/docs/INDEX.md`: runbooks operativos del stack actual.

## Lectura recomendada

### Gobernanza y contexto base

1. `INDEX.md`
2. `WORKFLOW_AI.md`
3. `overview/PROJECT_CONTEXT.md`
4. `overview/REPO_MAP.md`
5. `architecture/ARCHITECTURE.md`
6. `frontend/FRONTEND_MAP.md`
7. `backend/BACKEND_MAP.md`
8. `DECISIONS_LOG.md`

### Lecturas complementarias

- `operations/WHATSAPP_CLOUD_API_INTEGRATION.md`
- `frontend/DESIGN_SYSTEM.md`
- `architecture/ASSET_STRATEGY.md`

## Taxonomia actual

### Gobernanza viva
- `../AGENTS.md`
- `INDEX.md`
- `DECISIONS_LOG.md`
- `WORKFLOW_AI.md`

### Overview
- `overview/PROJECT_CONTEXT.md`
- `overview/REPO_MAP.md`
- `overview/CANONICAL_SOURCES.md`
- `overview/OPEN_QUESTIONS.md`

### Arquitectura
- `architecture/ARCHITECTURE.md`
- `architecture/AUTH_STRATEGY.md`
- `architecture/ASSET_STRATEGY.md`
- `architecture/BUSINESS_RULES.md`
- `architecture/PARITY_STRATEGY.md`

### Frontend
- `frontend/FRONTEND_MAP.md`
- `frontend/FRONTEND_PERFORMANCE.md`
- `frontend/FRONTEND_QA_HARDENING.md`
- `frontend/DESIGN_SYSTEM.md`
- `frontend/UI_STYLE_GUIDE.md`

### Backend
- `backend/BACKEND_MAP.md`
- `backend/BACKEND_BUSINESS_RULES_HARDENING.md`

### Operaciones
- `operations/WHATSAPP_CLOUD_API_INTEGRATION.md`

### Planes activos
- `plans/REPAIR_PROVIDER_PART_PRICING_PLAN.md`
- `plans/UI_APPLICATION_PLAN.md`
- `plans/REPO_CLEANUP_POLICY.md`

### Archivo historico
- `migration-archive/`

## Reglas documentales

- Si buscas codigo operativo, entra a `next-stack/`.
- Si buscas reglas operativas de Codex, entra a `AGENTS.md`.
- Si buscas metodologia de trabajo, entra a `WORKFLOW_AI.md`.
- Si buscas decisiones o contexto, entra a `project-docs/`.
- Si buscas runbooks de operacion, entra a `next-stack/docs/INDEX.md`.
- Todo plan temporal debe vivir en `plans/`.
- Todo documento de cierre de migracion o legado vive en `migration-archive/`.
- No crear `.md` sueltos fuera de esta taxonomia salvo caso justificado y documentado.

## Politica de mantenimiento

- Mantener `AGENTS.md` corto y normativo; no usarlo como enciclopedia.
- Mantener `WORKFLOW_AI.md` como detalle metodologico y operativo.
- Actualizar la doc viva impactada cuando cambie arquitectura, convenciones o entendimiento del repo.
- Evitar duplicacion entre documentos; `INDEX.md` debe apuntar, no repetir.
