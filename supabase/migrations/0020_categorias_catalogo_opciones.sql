-- 0020_categorias_catalogo_opciones.sql
-- Mueve Contratos y Programas al catálogo de opciones (dominio categoria)
-- y retira las filas agregadas por error a area_categorias en 0019.

alter table public.catalogos_opciones
  drop constraint if exists catalogos_opciones_dominio_check;

alter table public.catalogos_opciones
  add constraint catalogos_opciones_dominio_check
  check (dominio in ('regional','zonal','marca','nivel','tipo_ips','tipo_personal','categoria'));

insert into public.catalogos_opciones (dominio, nombre) values
  ('categoria', 'Contratos'),
  ('categoria', 'Programas')
on conflict (dominio, nombre) do nothing;

delete from public.area_categorias ac
where ac.nombre in ('Contratos', 'Programas')
  and not exists (
    select 1
    from public.areas_catalogo a
    where a.categoria = ac.nombre
  );
