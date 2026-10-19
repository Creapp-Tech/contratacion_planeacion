-- 0002_modulo_areas.sql
-- Módulo Áreas: agrega la medida al catálogo de áreas.
-- Las tablas area_categorias, areas_catalogo y sedes_areas ya existen (ver 0001_modulo_sedes.sql).

-- ============ areas_catalogo ============
alter table public.areas_catalogo
  add column if not exists medida integer not null default 1
  check (medida >= 1);

comment on column public.areas_catalogo.medida is 'Medida del área (cantidad de unidades que representa).';
