-- 0021_programas_catalogo.sql
-- Agrega el dominio programa al catálogo de opciones.

alter table public.catalogos_opciones
  drop constraint if exists catalogos_opciones_dominio_check;

alter table public.catalogos_opciones
  add constraint catalogos_opciones_dominio_check
  check (dominio in ('regional','zonal','marca','nivel','tipo_ips','tipo_personal','categoria','programa'));
