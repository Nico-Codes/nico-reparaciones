# UI Parity Final Checklist (Legacy -> Next Stack)

Objetivo historico: validar que las vistas clave del `next-stack` mantuvieran paridad visual y UX con el stack legacy (`Laravel/Blade`).

## Estado actual

Este checklist queda como referencia historica.

La validacion visual canonica hoy ya no depende de `qa:visual-parity` y se concentra en:

- `qa:admin:visual`
- `qa:responsive:visual`
- `qa:frontend:e2e`
- `smoke:web`
- `qa:route-parity`

## Nota sobre `qa:visual-parity`

- Estado: deprecated/manual.
- Ubicacion actual: `next-stack/legacy-support/deprecated/qa/qa-visual-parity.mjs`.
- Ya no forma parte del gate principal del repo.
- Solo conserva valor historico para comparaciones puntuales excepcionales.

## Cierre actual de etapa

- [x] Paridad de rutas legacy cubierta por `qa:route-parity`
- [x] QA funcional automatica del nuevo stack en verde
- [x] QA visual del nuevo stack (`admin` + `responsive`) en verde
- [ ] Sign-off visual manual final solo si se considera necesario en entorno destino
