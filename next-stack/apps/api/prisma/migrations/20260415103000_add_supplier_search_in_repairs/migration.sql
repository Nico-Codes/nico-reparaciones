ALTER TABLE "Supplier"
ADD COLUMN "searchInRepairs" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Supplier"
SET "searchInRepairs" = CASE
  WHEN lower(trim("name")) IN (
    'puntocell',
    'evophone',
    'celuphone',
    'okey rosario',
    'novocell',
    'electrostore',
    'el reparador de pc',
    'tienda movil rosario'
  )
    THEN true
  ELSE false
END;
