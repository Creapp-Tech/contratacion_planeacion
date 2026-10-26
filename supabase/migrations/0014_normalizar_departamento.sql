-- 0014_normalizar_departamento.sql
-- Normaliza la columna departamento en sedes y sedes_relacion_filtros.
-- El dato original contenía CIUDADES en vez de departamentos.
--
-- Mapeo (aplicar en esta transacción, tablas actualizadas juntas):
--   'Barranquilla'   -> 'Atlántico'        (12 filas)
--   'Cali'           -> 'Valle del Cauca'  (5)
--   'Buenaventura'   -> 'Valle del Cauca'  (1)
--   'Valle del cauca'-> 'Valle del Cauca'  (5, solo corrección de mayúscula)
--   'Santa Marta'    -> 'Magdalena'        (2)
--   'Cartagena'      -> 'Bolívar'          (2)
--
-- Resultado esperado: 14 departamentos distintos, 93 filas.
--   Atlántico 23, Valle del Cauca 11, Magdalena 3, Bolívar 2.

begin;

-- ============ 1. Tablas de respaldo ============
create table if not exists public.sedes_bak_20261020
  as table public.sedes with no data;

truncate public.sedes_bak_20261020;
insert into public.sedes_bak_20261020
select * from public.sedes;

create table if not exists public.sedes_relacion_filtros_bak_20261020
  as table public.sedes_relacion_filtros with no data;

truncate public.sedes_relacion_filtros_bak_20261020;
insert into public.sedes_relacion_filtros_bak_20261020
select * from public.sedes_relacion_filtros;

-- ============ 2. Actualizar sedes ============
update public.sedes
set departamento = case
  when departamento = 'Barranquilla'    then 'Atlántico'
  when departamento = 'Cali'            then 'Valle del Cauca'
  when departamento = 'Buenaventura'    then 'Valle del Cauca'
  when departamento = 'Valle del cauca' then 'Valle del Cauca'
  when departamento = 'Santa Marta'     then 'Magdalena'
  when departamento = 'Cartagena'       then 'Bolívar'
  else departamento
end
where departamento in (
  'Barranquilla', 'Cali', 'Buenaventura',
  'Valle del cauca', 'Santa Marta', 'Cartagena'
);

-- ============ 3. Actualizar sedes_relacion_filtros ============
update public.sedes_relacion_filtros
set departamento = case
  when departamento = 'Barranquilla'    then 'Atlántico'
  when departamento = 'Cali'            then 'Valle del Cauca'
  when departamento = 'Buenaventura'    then 'Valle del Cauca'
  when departamento = 'Valle del cauca' then 'Valle del Cauca'
  when departamento = 'Santa Marta'     then 'Magdalena'
  when departamento = 'Cartagena'       then 'Bolívar'
  else departamento
end
where departamento in (
  'Barranquilla', 'Cali', 'Buenaventura',
  'Valle del cauca', 'Santa Marta', 'Cartagena'
);

commit;

-- ============ 4. Verificación (solo lectura, ejecutar después) ============
-- 4a. Departamentos distintos (esperado: 14)
-- SELECT count(distinct departamento) AS departamentos_distintos
-- FROM sedes_relacion_filtros WHERE activo = true;

-- 4b. Conteo por departamento (esperado: Atlántico 23, Valle del Cauca 11,
--     Magdalena 3, Bolívar 2, y el resto sin cambio)
-- SELECT departamento, count(*) AS filas
-- FROM sedes_relacion_filtros WHERE activo = true
-- GROUP BY departamento ORDER BY departamento;

-- 4c. Total de filas (esperado: 93)
-- SELECT count(*) AS total FROM sedes_relacion_filtros WHERE activo = true;

-- 4d. Consistencia sedes vs sedes_relacion_filtros (todas las filas)
--     (solo debería quedar la diferencia de regional si 0012 no se ejecutó aún)
-- SELECT
--   srf.sede_id,
--   s.regional AS sedes_regional,
--   co.nombre  AS catalogo_regional,
--   srf.departamento AS srf_departamento,
--   s.departamento   AS sedes_departamento,
--   srf.municipio AS srf_municipio,
--   s.municipio   AS sedes_municipio
-- FROM sedes_relacion_filtros srf
-- JOIN sedes s ON s.id = srf.sede_id
-- LEFT JOIN catalogos_opciones co
--   ON co.id = srf.regional_id AND co.dominio = 'regional'
-- WHERE srf.departamento IS DISTINCT FROM s.departamento
--    OR srf.municipio IS DISTINCT FROM s.municipio
--    OR (co.nombre IS NOT NULL AND s.regional IS DISTINCT FROM co.nombre);
