-- 0027_seguimiento_ipc.sql
-- Módulo Seguimiento IPC:
-- 1. Histórico nacional de IPC/UPC administrable desde Configuración.
-- 2. Registro anual de costo usuario y % IPC por contrato.
--
-- Reglas:
-- - Un solo registro por contrato y año.
-- - Un solo registro por país y año en el histórico nacional.
-- - El % IPC admite valores negativos (deflación) y se guarda como porcentaje
--   (p. ej. 9.280), no como fracción.
-- - El comparativo del dashboard se hace contra el IPC nacional de Colombia
--   del mismo año.

begin;

-- ============ Histórico IPC nacional ============

create table public.ipc_nacional (
  id uuid primary key default gen_random_uuid(),
  pais text not null default 'Colombia' check (length(btrim(pais)) > 0),
  anio integer not null check (anio between 2000 and 2100),
  porcentaje_ipc numeric(7,3) not null
    check (porcentaje_ipc between -100 and 100),
  valor_upc numeric(14,2) not null check (valor_upc >= 0),
  created_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ipc_nacional_pais_anio_key unique (pais, anio)
);

comment on table public.ipc_nacional is
  'Histórico nacional de IPC y valor de la UPC por país y año.';
comment on column public.ipc_nacional.porcentaje_ipc is
  'Variación anual del IPC expresada en porcentaje (p. ej. 9.280).';
comment on column public.ipc_nacional.valor_upc is
  'Valor de la Unidad de Pago por Capitación (UPC) en pesos.';

create index ipc_nacional_anio_idx on public.ipc_nacional (anio);

create trigger ipc_nacional_set_updated_at
  before update on public.ipc_nacional
  for each row execute function private.set_updated_at();

alter table public.ipc_nacional enable row level security;

create policy ipc_nacional_select_roles
  on public.ipc_nacional
  for select
  to authenticated
  using (
    (select private.is_rol('superadmin'))
    or (select private.is_rol('analista_contratacion'))
    or (select private.is_rol('gerente_regional'))
  );

create policy ipc_nacional_insert_superadmin
  on public.ipc_nacional
  for insert
  to authenticated
  with check ((select private.is_rol('superadmin')));

create policy ipc_nacional_update_superadmin
  on public.ipc_nacional
  for update
  to authenticated
  using ((select private.is_rol('superadmin')))
  with check ((select private.is_rol('superadmin')));

create policy ipc_nacional_delete_superadmin
  on public.ipc_nacional
  for delete
  to authenticated
  using ((select private.is_rol('superadmin')));

grant select, insert, update, delete on public.ipc_nacional to authenticated;
grant all on public.ipc_nacional to service_role;

-- ============ Seguimiento IPC por contrato ============

create table public.ipc_seguimiento (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references public.contratos(id) on delete cascade,
  anio integer not null check (anio between 2000 and 2100),
  costo_usuario numeric(14,2) not null check (costo_usuario >= 0),
  porcentaje_ipc numeric(7,3) not null
    check (porcentaje_ipc between -100 and 100),
  created_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ipc_seguimiento_contrato_anio_key unique (contrato_id, anio)
);

comment on table public.ipc_seguimiento is
  'Registro anual de costo usuario y % IPC por contrato.';
comment on column public.ipc_seguimiento.costo_usuario is
  'Valor de costo usuario del contrato para el año, en pesos.';
comment on column public.ipc_seguimiento.porcentaje_ipc is
  'Porcentaje de IPC aplicado al contrato en el año.';

create index ipc_seguimiento_contrato_idx
  on public.ipc_seguimiento (contrato_id);
create index ipc_seguimiento_anio_idx
  on public.ipc_seguimiento (anio);

create trigger ipc_seguimiento_set_updated_at
  before update on public.ipc_seguimiento
  for each row execute function private.set_updated_at();

alter table public.ipc_seguimiento enable row level security;

create policy ipc_seguimiento_select_roles
  on public.ipc_seguimiento
  for select
  to authenticated
  using (
    (select private.is_rol('superadmin'))
    or (select private.is_rol('analista_contratacion'))
    or (
      (select private.is_rol('gerente_regional'))
      and exists (
        select 1
        from public.contratos c
        join public.usuarios u on u.id = (select auth.uid())
        where c.id = ipc_seguimiento.contrato_id
          and u.regional_id = c.regional_id
      )
    )
  );

create policy ipc_seguimiento_insert_roles
  on public.ipc_seguimiento
  for insert
  to authenticated
  with check (
    (select private.is_rol('superadmin'))
    or (select private.is_rol('analista_contratacion'))
    or (
      (select private.is_rol('gerente_regional'))
      and exists (
        select 1
        from public.contratos c
        join public.usuarios u on u.id = (select auth.uid())
        where c.id = ipc_seguimiento.contrato_id
          and u.regional_id = c.regional_id
      )
    )
  );

create policy ipc_seguimiento_update_roles
  on public.ipc_seguimiento
  for update
  to authenticated
  using (
    (select private.is_rol('superadmin'))
    or (select private.is_rol('analista_contratacion'))
    or (
      (select private.is_rol('gerente_regional'))
      and exists (
        select 1
        from public.contratos c
        join public.usuarios u on u.id = (select auth.uid())
        where c.id = ipc_seguimiento.contrato_id
          and u.regional_id = c.regional_id
      )
    )
  )
  with check (
    (select private.is_rol('superadmin'))
    or (select private.is_rol('analista_contratacion'))
    or (
      (select private.is_rol('gerente_regional'))
      and exists (
        select 1
        from public.contratos c
        join public.usuarios u on u.id = (select auth.uid())
        where c.id = ipc_seguimiento.contrato_id
          and u.regional_id = c.regional_id
      )
    )
  );

create policy ipc_seguimiento_delete_roles
  on public.ipc_seguimiento
  for delete
  to authenticated
  using (
    (select private.is_rol('superadmin'))
    or (select private.is_rol('analista_contratacion'))
    or (
      (select private.is_rol('gerente_regional'))
      and exists (
        select 1
        from public.contratos c
        join public.usuarios u on u.id = (select auth.uid())
        where c.id = ipc_seguimiento.contrato_id
          and u.regional_id = c.regional_id
      )
    )
  );

grant select, insert, update, delete on public.ipc_seguimiento to authenticated;
grant all on public.ipc_seguimiento to service_role;

notify pgrst, 'reload schema';

commit;
