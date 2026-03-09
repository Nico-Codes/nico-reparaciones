# CLEANUP_CANDIDATES

## Codigo y tooling deprecated

### 1. `next-stack/legacy-support/deprecated/api/migrate-legacy-settings.ts`
- Estado: deprecated.
- Evidencia: dry-run sin datos pendientes.
- Riesgo de retiro: medio.
- Requiere validacion humana: recomendada.

### 2. `next-stack/legacy-support/deprecated/api/migrate-legacy-product-images.ts`
- Estado: deprecated.
- Evidencia: dry-run sin copias necesarias; fuentes fallback legacy practicamente vacias.
- Riesgo de retiro: medio.
- Requiere validacion humana: recomendada.

### 3. `next-stack/legacy-support/deprecated/api/migrate-legacy-visual-assets.ts`
- Estado: deprecated.
- Evidencia: el canon ya vive en `next-stack/apps/web/public`; dry-run sin copias reales necesarias.
- Riesgo de retiro: medio.
- Requiere validacion humana: recomendada.

### 4. `next-stack/legacy-support/deprecated/qa/qa-visual-parity.mjs`
- Estado: deprecated.
- Evidencia: cobertura reducida, fuerte dependencia del root Laravel y superposicion con el gate actual.
- Riesgo de retiro: medio.
- Requiere validacion humana: si.

### 5. `next-stack/legacy-support/deprecated/sqlite/legacy-visual-parity.sqlite`
- Estado: deprecated.
- Evidencia: solo da soporte a la parity legacy archivada.
- Riesgo de retiro: bajo/medio.
- Requiere validacion humana: recomendada.

## Assets root y storage legacy

### 6. `public/brand`, `public/brand-assets`, `public/icons`, `public/img`
- Estado: mirror legacy, no canon.
- Evidencia: duplicados equivalentes frente a `next-stack/apps/web/public/*`.
- Riesgo de retiro: alto mientras exista el runtime legacy.
- Requiere validacion humana: si.

### 7. `storage/app/public` y `public/storage`
- Estado: fallback historico.
- Evidencia: actualmente vacios salvo `.gitignore`.
- Riesgo de retiro: medio.
- Requiere validacion humana: si.

## Root Laravel y dependencias residuales

### 8. `predis/predis`
- Estado: pendiente de auditoria final.
- Evidencia: sin uso directo confirmado; configuracion legacy todavia contempla Redis.
- Riesgo de retiro: medio/alto.
- Requiere validacion humana: si.

### 9. residuos de esquema legacy (`google_id` y migracion asociada)
- Estado: residuo sin uso funcional.
- Riesgo de retiro: medio.
- Requiere validacion humana: si.

### 10. root Laravel completo
- Estado: historico activo / sensible.
- Riesgo de retiro: alto.
- Requiere validacion humana: obligatoria.
