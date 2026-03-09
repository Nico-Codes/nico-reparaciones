# OPEN_QUESTIONS

## Cerradas recientemente

1. ¿`qa:visual-parity` sigue siendo gate canonico?
- Respondida: no.
- Decision: queda deprecated/manual en `next-stack/legacy-support/deprecated/qa/qa-visual-parity.mjs`.

2. ¿Los migradores legacy siguen siendo parte del flujo normal?
- Respondida: no.
- Decision: quedan deprecated en `next-stack/legacy-support/deprecated/api/`.

3. ¿La fuente canonica de assets visuales es `next-stack/apps/web/public`?
- Respondida: si.

4. ¿`next-stack/.env` sigue siendo la unica fuente viva real?
- Respondida: si.

## Abiertas

1. ¿Cuando se retira fisicamente `next-stack/legacy-support/deprecated/`?
- Estado: abierta.
- Tipo: decision humana / cleanup final.

2. ¿Cuando se retiran los duplicados de `public/` root?
- Estado: abierta.
- Tipo: decision humana / fase siguiente.

3. ¿`predis/predis` sigue siendo necesario en el root legacy?
- Estado: abierta.
- Tipo: auditoria final de Composer legacy.

4. ¿Los residuos de esquema legacy como `google_id` se limpian o se dejan archivados hasta el retiro final del root?
- Estado: abierta.
- Tipo: decision humana.

5. ¿Que destino final se quiere para el root Laravel: archivo interno o retiro completo?
- Estado: abierta.
- Tipo: decision humana.
