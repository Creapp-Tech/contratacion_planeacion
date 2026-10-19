-- 0004_modulo_servicios_frecuencias.sql
-- Módulos Servicios y Frecuencias de uso (v2).
-- Crea el catálogo de tipo de personal (dominio en catalogos_opciones),
-- la tabla servicios y la tabla frecuencias_uso. RLS + seed idempotente.

-- ============ dominios de catalogos_opciones ============
alter table public.catalogos_opciones
  drop constraint if exists catalogos_opciones_dominio_check;

alter table public.catalogos_opciones
  add constraint catalogos_opciones_dominio_check
  check (dominio in ('regional','zonal','marca','nivel','tipo_ips','tipo_personal'));

-- ============ servicios ============
create table if not exists public.servicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  grupo text,
  area_id uuid references public.areas_catalogo(id) on delete set null,
  tipo_personal text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.servicios is 'Servicios ofrecidos: nombre, grupo, área relacionada y tipo de personal.';
comment on column public.servicios.area_id is 'Área del catálogo (areas_catalogo) relacionada con el servicio.';
comment on column public.servicios.tipo_personal is 'Tipo de personal (catálogo tipo_personal) que presta el servicio.';

create unique index if not exists servicios_nombre_key on public.servicios (nombre);
create index if not exists servicios_area_idx on public.servicios (area_id);
create index if not exists servicios_tipo_personal_idx on public.servicios (tipo_personal);

drop trigger if exists servicios_set_updated_at on public.servicios;
create trigger servicios_set_updated_at
  before update on public.servicios
  for each row execute function private.set_updated_at();

-- ============ frecuencias_uso ============
create table if not exists public.frecuencias_uso (
  id uuid primary key default gen_random_uuid(),
  servicio_id uuid not null references public.servicios(id) on delete cascade,
  tipo_frecuencia text not null
    check (tipo_frecuencia in ('nota_tecnica_viva','ejecucion_servicios','asegurador')),
  version text not null check (version ~ '^[A-Za-z0-9][A-Za-z0-9._-]*$'),
  frecuencia numeric not null check (frecuencia >= 0),
  duracion_minutos integer not null check (duracion_minutos > 0),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (servicio_id, tipo_frecuencia, version)
);

comment on table public.frecuencias_uso is 'Frecuencia de uso por servicio, tipo de frecuencia y versión.';
comment on column public.frecuencias_uso.tipo_frecuencia is 'Origen de la frecuencia: nota_tecnica_viva, ejecucion_servicios o asegurador.';
comment on column public.frecuencias_uso.version is 'Versión alfanumérica de la frecuencia.';
comment on column public.frecuencias_uso.frecuencia is 'Valor de la frecuencia (número decimal).';
comment on column public.frecuencias_uso.duracion_minutos is 'Duración en minutos.';

create index if not exists frecuencias_uso_servicio_idx on public.frecuencias_uso (servicio_id);
create index if not exists frecuencias_uso_tipo_idx on public.frecuencias_uso (tipo_frecuencia);

drop trigger if exists frecuencias_uso_set_updated_at on public.frecuencias_uso;
create trigger frecuencias_uso_set_updated_at
  before update on public.frecuencias_uso
  for each row execute function private.set_updated_at();

-- ============ RLS ============
alter table public.servicios enable row level security;
alter table public.frecuencias_uso enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['servicios', 'frecuencias_uso']
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
insert into public.catalogos_opciones (dominio, nombre) values
  ('tipo_personal', 'Médico general'),
  ('tipo_personal', 'Médico especialista'),
  ('tipo_personal', 'Odontólogo'),
  ('tipo_personal', 'Enfermero(a)'),
  ('tipo_personal', 'Auxiliar de enfermería'),
  ('tipo_personal', 'Bacteriólogo(a)'),
  ('tipo_personal', 'Terapeuta'),
  ('tipo_personal', 'Regente de farmacia'),
  ('tipo_personal', 'Recepcionista')
on conflict (dominio, nombre) do nothing;