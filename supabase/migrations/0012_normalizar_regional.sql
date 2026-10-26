-- 0012_normalizar_regional.sql
-- Normaliza el texto de regional en sedes.regional y regionales.nombre
-- para que coincida con catalogos_opciones.nombre (fuente canónica del catálogo).
--
-- PROBLEMA: 'Eje Cafetero' (en sedes/regionales) vs 'Eje cafetero' (en catalogos_opciones).
-- Esto rompe comparaciones por texto en filtros, frecuencias, capacidad, etc.
--
-- SOLUCIÓN: usa lower(trim()) para encontrar coincidencias case-insensitive
-- y reemplaza con el nombre exacto del catálogo.

begin;

-- ============ Normalizar sedes.regional ============
-- Actualiza sedes.regional para que coincida con el nombre del catálogo.
UPDATE public.sedes s
SET regional = co.nombre
FROM public.catalogos_opciones co
WHERE co.dominio = 'regional'
  AND lower(trim(s.regional)) = lower(trim(co.nombre))
  AND s.regional IS DISTINCT FROM co.nombre;

-- ============ Normalizar regionales.nombre ============
-- La tabla regionales se usa para alcance de usuarios (alcanceDelUsuario, regionalNombre).
-- Su nombre debe coincidir con el catálogo para que la restricción de acceso funcione.
-- NOTA: si existe una regional en `regionales` cuyo nombre no coincide con ningún
-- catálogo (ni siquiera por lower/trim), NO se toca; la verificación de abajo la mostraría.
UPDATE public.regionales r
SET nombre = co.nombre
FROM public.catalogos_opciones co
WHERE co.dominio = 'regional'
  AND lower(trim(r.nombre)) = lower(trim(co.nombre))
  AND r.nombre IS DISTINCT FROM co.nombre;

commit;

-- ============ Verificación (solo lectura) ============
-- 1) sedes.regional sin coincidencia en el catálogo (esperado: 0 filas)
-- SELECT s.id, s.nombre, s.regional, co.nombre AS catalogo_regional
-- FROM sedes s
-- LEFT JOIN catalogos_opciones co
--   ON co.dominio = 'regional'
--   AND lower(trim(co.nombre)) = lower(trim(s.regional))
-- WHERE s.regional IS NOT NULL
--   AND s.regional IS DISTINCT FROM co.nombre;
--
-- 2) regionales.nombre sin coincidencia en el catálogo (esperado: 0 filas)
-- SELECT r.id, r.nombre
-- FROM regionales r
-- LEFT JOIN catalogos_opciones co
--   ON co.dominio = 'regional'
--   AND lower(trim(co.nombre)) = lower(trim(r.nombre))
-- WHERE r.nombre IS NOT NULL
--   AND co.nombre IS NULL;
