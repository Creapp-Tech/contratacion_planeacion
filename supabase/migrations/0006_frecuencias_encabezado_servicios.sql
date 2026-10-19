-- 0006_frecuencias_encabezado_servicios.sql
-- Módulo Frecuencias de uso (v3): modelo encabezado + servicios.
-- Crea el catálogo `regimenes`, la tabla `frecuencias` (encabezado) y la tabla
-- `frecuencias_servicios` (detalle: servicio + frecuencia). Elimina la tabla
-- plana `frecuencias_uso` (sin datos). RLS + seed idempotente.

-- ============ regimenes ============
create table if not exists public.regimenes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  created_at timestamptz not null default now()
);

comment on table public.regimenes is 'Catálogo de regímenes de afiliación.';
comment on column public.regimenes.nombre is 'Nombre del régimen (Contributivo, Subsidiado, Especial, Excepción, Particular).';

-- ============ frecuencias (encabezado) ============
create table if not exists public.frecuencias (
  id uuid primary key default gen_random_uuid(),
  tipo_frecuencia text not null
    check (tipo_frecuencia in ('nota_tecnica_viva','ejecucion_servicios','asegurador')),
  nombre_nota_tecnica text not null,
  sede_id uuid not null references public.sedes(id) on delete restrict,
  regimen_id uuid not null references public.regimenes(id) on delete restrict,
  asegurador_eps_id uuid not null references public.aseguradores_eps(id) on delete restrict,
  version text not null check (version ~ '^[A-Za-z0-9][A-Za-z0-9._-]*$'),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tipo_frecuencia, nombre_nota_tecnica, sede_id, regimen_id, asegurador_eps_id, version)
);

comment on table public.frecuencias is 'Encabezado de frecuencia de uso: tipo, nota técnica, sede, régimen, asegurador y versión.';
comment on column public.frecuencias.tipo_frecuencia is 'Origen de la frecuencia: nota_tecnica_viva, ejecucion_servicios o asegurador.';
comment on column public.frecuencias.nombre_nota_tecnica is 'Nombre de la nota técnica asociada al encabezado.';
comment on column public.frecuencias.sede_id is 'Sede a la que aplica la frecuencia.';
comment on column public.frecuencias.regimen_id is 'Régimen de afiliación asociado.';
comment on column public.frecuencias.asegurador_eps_id is 'Asegurador (EPS) asociado.';
comment on column public.frecuencias.version is 'Versión alfanumérica de la frecuencia.';

create index if not exists frecuencias_sede_idx on public.frecuencias (sede_id);
create index if not exists frecuencias_tipo_idx on public.frecuencias (tipo_frecuencia);
create index if not exists frecuencias_regimen_idx on public.frecuencias (regimen_id);
create index if not exists frecuencias_asegurador_idx on public.frecuencias (asegurador_eps_id);

drop trigger if exists frecuencias_set_updated_at on public.frecuencias;
create trigger frecuencias_set_updated_at
  before update on public.frecuencias
  for each row execute function private.set_updated_at();

-- ============ frecuencias_servicios (detalle) ============
create table if not exists public.frecuencias_servicios (
  id uuid primary key default gen_random_uuid(),
  frecuencia_id uuid not null references public.frecuencias(id) on delete cascade,
  servicio_id uuid not null references public.servicios(id) on delete cascade,
  frecuencia numeric not null check (frecuencia >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (frecuencia_id, servicio_id)
);

comment on table public.frecuencias_servicios is 'Detalle de frecuencias: servicio asociado y su valor de frecuencia.';
comment on column public.frecuencias_servicios.servicio_id is 'Servicio al que aplica la frecuencia.';
comment on column public.frecuencias_servicios.frecuencia is 'Valor de la frecuencia del servicio (número decimal).';

create index if not exists frecuencias_servicios_frecuencia_idx on public.frecuencias_servicios (frecuencia_id);
create index if not exists frecuencias_servicios_servicio_idx on public.frecuencias_servicios (servicio_id);

drop trigger if exists frecuencias_servicios_set_updated_at on public.frecuencias_servicios;
create trigger frecuencias_servicios_set_updated_at
  before update on public.frecuencias_servicios
  for each row execute function private.set_updated_at();

-- ============ eliminar modelo anterior ============
drop table if exists public.frecuencias_uso cascade;

-- ============ RLS ============
alter table public.regimenes enable row level security;
alter table public.frecuencias enable row level security;
alter table public.frecuencias_servicios enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['regimenes', 'frecuencias', 'frecuencias_servicios']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_select_authenticated', t);
    execute format('create policy %I on public.%I for select to authenticated using (true)', t || '_select_authenticated', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert_admin', t);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select private.is_rol(''superadmin'')))', t || '_insert_admin', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_admin', t);
    execute format('create policy %I on public.%I for update to authenticated using ((select private.is_rol(''superadmin''))) with check ((select private.is_rol(''superadmin'')))', t || '_update_admin', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_admin', t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select private.is_rol(''superadmin'')))', t || '_delete_admin', t);
  end loop;
end;
$$;

-- ============ seed idempotente ============
insert into public.regimenes (nombre) values
  ('Contributivo'),
  ('Subsidiado'),
  ('Especial'),
  ('Excepción'),
  ('Particular')
on conflict (nombre) do nothing;
