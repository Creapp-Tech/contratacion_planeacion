-- 0018_modulo_contratos.sql
-- Módulo Contratos: gestión de contratos asociados a aseguradores, regionales
-- y gerentes regionales. El borrado es lógico (estado = 'inactivo').

begin;

create table public.contratos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (length(trim(nombre)) > 0),
  asegurador_id uuid not null references public.aseguradores_eps(id) on delete restrict,
  numero_contrato text not null check (length(trim(numero_contrato)) > 0),
  regional_id uuid not null references public.regionales(id) on delete restrict,
  ciudad text not null check (length(trim(ciudad)) > 0),
  modalidad text not null check (modalidad in ('capita', 'especial', 'evento', 'integral', 'pgp')),
  responsable_id uuid references public.usuarios(id) on delete set null,
  estado text not null default 'activo' check (estado in ('activo', 'inactivo')),
  created_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.contratos is 'Contratos gestionados por el área de contratación.';
comment on column public.contratos.modalidad is 'Modalidad del contrato: capita, especial, evento, integral o pgp.';
comment on column public.contratos.responsable_id is 'Gerente regional responsable del contrato.';
comment on column public.contratos.estado is 'Estado lógico del contrato: activo o inactivo.';

create unique index contratos_numero_contrato_key on public.contratos (numero_contrato);
create index contratos_asegurador_idx on public.contratos (asegurador_id);
create index contratos_regional_idx on public.contratos (regional_id);
create index contratos_estado_idx on public.contratos (estado);
create index contratos_responsable_idx on public.contratos (responsable_id);
create index contratos_nombre_idx on public.contratos (nombre);

create trigger contratos_set_updated_at
  before update on public.contratos
  for each row execute function private.set_updated_at();

alter table public.contratos enable row level security;

create policy contratos_select_roles
  on public.contratos
  for select
  to authenticated
  using (
    (select private.is_rol('superadmin'))
    or (select private.is_rol('analista_contratacion'))
    or (
      (select private.is_rol('gerente_regional'))
      and exists (
        select 1
        from public.usuarios u
        where u.id = (select auth.uid())
          and u.regional_id = contratos.regional_id
      )
    )
  );

create policy contratos_insert_roles
  on public.contratos
  for insert
  to authenticated
  with check (
    (select private.is_rol('superadmin'))
    or (select private.is_rol('analista_contratacion'))
    or (
      (select private.is_rol('gerente_regional'))
      and exists (
        select 1
        from public.usuarios u
        where u.id = (select auth.uid())
          and u.regional_id = contratos.regional_id
      )
    )
  );

create policy contratos_update_roles
  on public.contratos
  for update
  to authenticated
  using (
    (select private.is_rol('superadmin'))
    or (select private.is_rol('analista_contratacion'))
    or (
      (select private.is_rol('gerente_regional'))
      and exists (
        select 1
        from public.usuarios u
        where u.id = (select auth.uid())
          and u.regional_id = contratos.regional_id
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
        from public.usuarios u
        where u.id = (select auth.uid())
          and u.regional_id = contratos.regional_id
      )
    )
  );

create policy contratos_delete_roles
  on public.contratos
  for delete
  to authenticated
  using (
    (select private.is_rol('superadmin'))
    or (select private.is_rol('analista_contratacion'))
    or (
      (select private.is_rol('gerente_regional'))
      and exists (
        select 1
        from public.usuarios u
        where u.id = (select auth.uid())
          and u.regional_id = contratos.regional_id
      )
    )
  );

grant select, insert, update, delete on public.contratos to authenticated;
grant all on public.contratos to service_role;

notify pgrst, 'reload schema';

commit;
