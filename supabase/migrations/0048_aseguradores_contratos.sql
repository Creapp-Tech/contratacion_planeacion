-- 0048_aseguradores_contratos.sql
-- Módulo Aseguradores y Contratos: tabla global de servicios CUPS contratados
-- por asegurador/contrato, con opciones de direccionamiento y trazabilidad.
-- Reutiliza los catálogos existentes y el historial de Direccionamiento.

begin;

-- ============ especialista centinela VIVA1A ============
-- Se resuelve por (tipo_identificacion, numero_identificacion), nunca por un
-- UUID fijo en la aplicación. La inserción es idempotente.
insert into public.especialistas (
  tipo_identificacion,
  numero_identificacion,
  nombre_completo,
  tipo_persona,
  especialidad,
  ciudad,
  estado
)
select 'NIT', 'VIVA1A', 'VIVA1A IPS', 'juridica', 'No aplica', 'No aplica', 'activo'
where not exists (
  select 1
  from public.especialistas
  where tipo_identificacion = 'NIT'
    and lower(trim(numero_identificacion)) = 'viva1a'
);

create or replace function private.especialista_viva1a_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select e.id
  from public.especialistas e
  where e.tipo_identificacion = 'NIT'
    and lower(trim(e.numero_identificacion)) = 'viva1a'
    and e.estado = 'activo'
  limit 1;
$$;

grant execute on function private.especialista_viva1a_id() to authenticated;

-- ============ tabla de servicios CUPS por asegurador ============
create table if not exists public.servicios_cups_aseguradores (
  id uuid primary key default gen_random_uuid(),
  asegurador_id uuid not null
    references public.aseguradores_eps(id) on delete restrict,
  contrato_id uuid not null
    references public.contratos(id) on delete restrict,
  cups_asegurador text not null check (length(trim(cups_asegurador)) > 0),
  cups_id uuid references public.cups(id) on delete restrict,
  frecuencia_uso_contratada numeric(14, 2) check (frecuencia_uso_contratada >= 0),
  cme_contratado numeric(14, 2) not null check (cme_contratado >= 0),
  primera_opcion_especialista_id uuid
    default private.especialista_viva1a_id()
    references public.especialistas(id) on delete set null,
  segunda_opcion_especialista_id uuid
    default private.especialista_viva1a_id()
    references public.especialistas(id) on delete set null,
  created_by uuid references public.usuarios(id) on delete set null,
  updated_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists servicios_cups_aseguradores_uq
  on public.servicios_cups_aseguradores (contrato_id, lower(trim(cups_asegurador)));

comment on table public.servicios_cups_aseguradores is
  'Servicios CUPS contratados por asegurador/contrato con CME y opciones de direccionamiento.';

create index if not exists servicios_cups_asegurador_asegurador_idx
  on public.servicios_cups_aseguradores (asegurador_id);
create index if not exists servicios_cups_asegurador_contrato_idx
  on public.servicios_cups_aseguradores (contrato_id);
create index if not exists servicios_cups_asegurador_cups_idx
  on public.servicios_cups_aseguradores (cups_id);
create index if not exists servicios_cups_asegurador_primera_idx
  on public.servicios_cups_aseguradores (primera_opcion_especialista_id);
create index if not exists servicios_cups_asegurador_segunda_idx
  on public.servicios_cups_aseguradores (segunda_opcion_especialista_id);
create index if not exists servicios_cups_asegurador_created_by_idx
  on public.servicios_cups_aseguradores (created_by);

-- Integridad: el contrato debe pertenecer al asegurador seleccionado.
create or replace function private.validar_asegurador_contrato_servicios_cups()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  contrato_asegurador uuid;
begin
  select c.asegurador_id into contrato_asegurador
  from public.contratos c
  where c.id = new.contrato_id;

  if contrato_asegurador is null then
    raise exception 'El contrato indicado no existe';
  end if;

  if contrato_asegurador <> new.asegurador_id then
    raise exception 'El contrato no pertenece al asegurador indicado';
  end if;

  return new;
end;
$$;

drop trigger if exists servicios_cups_asegurador_integridad
  on public.servicios_cups_aseguradores;
create trigger servicios_cups_asegurador_integridad
  before insert or update of asegurador_id, contrato_id
  on public.servicios_cups_aseguradores
  for each row execute function private.validar_asegurador_contrato_servicios_cups();

drop trigger if exists servicios_cups_asegurador_set_updated_at
  on public.servicios_cups_aseguradores;
create trigger servicios_cups_asegurador_set_updated_at
  before update on public.servicios_cups_aseguradores
  for each row execute function private.set_updated_at();

drop trigger if exists servicios_cups_asegurador_historial
  on public.servicios_cups_aseguradores;
create trigger servicios_cups_asegurador_historial
  after update on public.servicios_cups_aseguradores
  for each row execute function private.registrar_historial_direccionamiento(
    'cups_asegurador', 'cups_id', 'frecuencia_uso_contratada',
    'cme_contratado', 'primera_opcion_especialista_id',
    'segunda_opcion_especialista_id'
  );

-- ============ RLS por contrato ============
create or replace function private.regionales_contrato_aseguradores(p_contrato_id uuid)
returns setof text
language sql
stable
security definer
set search_path = ''
as $$
  select distinct lower(trim(r.nombre))
  from public.contratos c
  join public.regionales r on r.id = c.regional_id
  where c.id = p_contrato_id and r.nombre is not null and trim(r.nombre) <> ''
  union
  select distinct lower(trim(r.nombre))
  from public.contrato_regionales cr
  join public.regionales r on r.id = cr.regional_id
  where cr.contrato_id = p_contrato_id and r.nombre is not null and trim(r.nombre) <> '';
$$;

create or replace function private.puede_ver_aseguradores_contratos(p_contrato_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.puede_ver_direccionamiento(''))
    or exists (
      select 1
      from private.regionales_contrato_aseguradores(p_contrato_id) regional
      where (select private.puede_ver_direccionamiento(regional))
    );
$$;

create or replace function private.puede_editar_aseguradores_contratos(p_contrato_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.puede_editar_direccionamiento(''))
    or exists (
      select 1
      from private.regionales_contrato_aseguradores(p_contrato_id) regional
      where (select private.puede_editar_direccionamiento(regional))
    );
$$;

grant execute on function private.regionales_contrato_aseguradores(uuid) to authenticated;
grant execute on function private.puede_ver_aseguradores_contratos(uuid) to authenticated;
grant execute on function private.puede_editar_aseguradores_contratos(uuid) to authenticated;

alter table public.servicios_cups_aseguradores enable row level security;

drop policy if exists servicios_cups_aseguradores_select
  on public.servicios_cups_aseguradores;
create policy servicios_cups_aseguradores_select
  on public.servicios_cups_aseguradores
  for select to authenticated
  using ((select private.puede_ver_aseguradores_contratos(contrato_id)));

drop policy if exists servicios_cups_aseguradores_insert
  on public.servicios_cups_aseguradores;
create policy servicios_cups_aseguradores_insert
  on public.servicios_cups_aseguradores
  for insert to authenticated
  with check (
    (select private.puede_editar_aseguradores_contratos(contrato_id))
    and (created_by is null or created_by = (select auth.uid()))
  );

drop policy if exists servicios_cups_aseguradores_update
  on public.servicios_cups_aseguradores;
create policy servicios_cups_aseguradores_update
  on public.servicios_cups_aseguradores
  for update to authenticated
  using ((select private.puede_editar_aseguradores_contratos(contrato_id)))
  with check (
    (select private.puede_editar_aseguradores_contratos(contrato_id))
    and (
      updated_by is null
      or updated_by = (select auth.uid())
      or (select private.is_rol('superadmin'))
    )
  );

drop policy if exists servicios_cups_aseguradores_delete
  on public.servicios_cups_aseguradores;
create policy servicios_cups_aseguradores_delete
  on public.servicios_cups_aseguradores
  for delete to authenticated
  using ((select private.is_rol('superadmin')));

revoke all on public.servicios_cups_aseguradores from anon;
grant select, insert, update, delete on public.servicios_cups_aseguradores to authenticated;
grant all on public.servicios_cups_aseguradores to service_role;

notify pgrst, 'reload schema';

commit;
