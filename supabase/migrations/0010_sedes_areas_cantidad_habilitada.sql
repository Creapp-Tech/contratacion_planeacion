-- ============ sedes_areas.cantidad_habilitada ============
-- Distingue las unidades existentes por infraestructura (cantidad)
-- de las unidades habilitadas para operar (cantidad_habilitada).
-- Las disponibles para uso = cantidad - cantidad_habilitada.

alter table public.sedes_areas
  add column cantidad_habilitada integer not null default 1;

-- Los registros existentes se consideran totalmente habilitados,
-- conservando el comportamiento previo.
update public.sedes_areas set cantidad_habilitada = cantidad;

alter table public.sedes_areas
  add constraint sedes_areas_cantidad_rango_check
  check (cantidad_habilitada >= 0 and cantidad_habilitada <= cantidad);

comment on column public.sedes_areas.cantidad_habilitada is
  'Unidades habilitadas para operar. Debe ser <= cantidad (unidades existentes físicas).';
