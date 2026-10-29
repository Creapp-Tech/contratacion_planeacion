-- 0034_responsable_catalogo.sql
-- Agrega el dominio responsable al catálogo de opciones.

alter table public.catalogos_opciones
  drop constraint if exists catalogos_opciones_dominio_check;

alter table public.catalogos_opciones
  add constraint catalogos_opciones_dominio_check
  check (
    dominio in (
      'regional','zonal','marca','nivel','tipo_ips',
      'tipo_personal','categoria','programa',
      'categoria_contrato','tipo_contrato','estado_legalizacion','estado_ejecucion',
      'responsable'
    )
  );

insert into public.catalogos_opciones (dominio, nombre) values
  ('responsable', 'Carmen Montes Mejia')
on conflict (dominio, nombre) do nothing;
