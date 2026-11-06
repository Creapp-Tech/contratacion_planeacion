-- 0041_catalogos_cups_capitulos_anexos.sql
-- Opciones de catálogo para el módulo CUPS:
--   * Capítulos 1 a 24
--   * Anexos 3 a 7 (usados como secciones)

-- Ampliar el dominio permitido en catalogos_opciones
alter table public.catalogos_opciones
  drop constraint if exists catalogos_opciones_dominio_check;

alter table public.catalogos_opciones
  add constraint catalogos_opciones_dominio_check
  check (
    dominio = any (array[
      'regional',
      'zonal',
      'marca',
      'nivel',
      'tipo_ips',
      'tipo_personal',
      'categoria',
      'programa',
      'categoria_contrato',
      'tipo_contrato',
      'estado_legalizacion',
      'estado_ejecucion',
      'responsable',
      'cups'
    ])
  );

-- Capítulos 1 a 24
insert into public.catalogos_opciones (dominio, nombre, descripcion, activo)
select 'cups', 'Capítulo ' || n, 'Capítulo', true
from generate_series(1, 24) as n
on conflict (dominio, nombre) do nothing;

-- Anexos 3 a 7
insert into public.catalogos_opciones (dominio, nombre, descripcion, activo)
select 'cups', 'Anexo ' || n, 'Anexo', true
from generate_series(3, 7) as n
on conflict (dominio, nombre) do nothing;
