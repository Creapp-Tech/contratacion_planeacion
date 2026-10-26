-- 0019_area_categorias_contratos_programas.sql
-- Agrega las categorías de áreas Contratos y Programas al catálogo.

insert into public.area_categorias (nombre) values
  ('Contratos'),
  ('Programas')
on conflict (nombre) do nothing;
