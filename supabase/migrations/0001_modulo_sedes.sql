-- 0001_modulo_sedes.sql
-- Módulo Sedes (v2): esquema completo, RLS y seed idempotente.
-- v2 no tenía tablas de sedes; se crean desde cero.

-- ============ helpers ============
create schema if not exists private;

create or replace function private.is_rol(rol_nombre text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.usuarios u
    where u.id = (select auth.uid()) and u.rol::text = rol_nombre
  );
$$;

revoke all on function private.is_rol(text) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_rol(text) to authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============ sedes ============
create table public.sedes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  codigo_reps text,
  departamento text,
  municipio text,
  barrio text,
  direccion text,
  pais text default 'Colombia',
  latitud numeric,
  longitud numeric,
  gerente text,
  fecha_apertura date,
  regional text,
  zonal text,
  marca text,
  nivel text,
  tipo_ips text,
  estado text not null default 'activa'
    check (estado in ('activa', 'en_apertura', 'inactiva')),
  fecha_cierre date,
  metros_cuadrado numeric,
  capacidad_inicial integer check (capacidad_inicial >= 0),
  capacidad_usuarios integer,
  numero_pisos integer check (numero_pisos >= 1),
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.sedes is 'Sedes de la organización con datos administrativos y geográficos';
comment on column public.sedes.capacidad_inicial is 'Capacidad inicial (diseño/arranque) de la sede en usuarios.';
comment on column public.sedes.capacidad_usuarios is 'Capacidad actual de la sede en usuarios.';
comment on column public.sedes.pais is 'País de la sede (por defecto Colombia).';
comment on column public.sedes.estado is 'Estado de la sede: activa, en_apertura o inactiva.';

create index sedes_regional_idx on public.sedes (regional);
create index sedes_estado_idx on public.sedes (estado);
create index sedes_marca_idx on public.sedes (marca);
create index sedes_nombre_idx on public.sedes (nombre);

create trigger sedes_set_updated_at
  before update on public.sedes
  for each row execute function private.set_updated_at();

-- ============ area_categorias ============
create table public.area_categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger area_categorias_set_updated_at
  before update on public.area_categorias
  for each row execute function private.set_updated_at();

-- ============ areas_catalogo ============
create table public.areas_catalogo (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text not null,
  etiquetas text[] not null default '{}',
  mide_capacidad_ocupacion boolean not null default false,
  created_at timestamptz not null default now(),
  unique (categoria, nombre)
);

create index areas_catalogo_categoria_idx on public.areas_catalogo (categoria);

-- ============ sedes_areas (N:M) ============
create table public.sedes_areas (
  id uuid primary key default gen_random_uuid(),
  sede_id uuid not null references public.sedes(id) on delete cascade,
  area_id uuid not null references public.areas_catalogo(id) on delete cascade,
  cantidad integer not null default 1 check (cantidad >= 1),
  created_at timestamptz not null default now(),
  unique (sede_id, area_id)
);

create index sedes_areas_sede_idx on public.sedes_areas (sede_id);
create index sedes_areas_area_idx on public.sedes_areas (area_id);

-- ============ aseguradores_eps ============
create table public.aseguradores_eps (
  id uuid primary key default gen_random_uuid(),
  nombre_eps text not null unique,
  codigo text not null,
  estado text not null default 'activo' check (estado in ('activo', 'inactivo')),
  created_at timestamptz not null default now()
);

-- ============ sedes_aseguradores (N:M) ============
create table public.sedes_aseguradores (
  id uuid primary key default gen_random_uuid(),
  sede_id uuid not null references public.sedes(id) on delete cascade,
  asegurador_eps_id uuid not null references public.aseguradores_eps(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (sede_id, asegurador_eps_id)
);

create index sedes_aseguradores_sede_idx on public.sedes_aseguradores (sede_id);
create index sedes_aseguradores_asegurador_idx on public.sedes_aseguradores (asegurador_eps_id);

-- ============ catalogos_opciones ============
create table public.catalogos_opciones (
  id uuid primary key default gen_random_uuid(),
  dominio text not null check (dominio in ('regional', 'zonal', 'marca', 'nivel', 'tipo_ips')),
  nombre text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dominio, nombre)
);

create index catalogos_opciones_dominio_idx on public.catalogos_opciones (dominio);
create index catalogos_opciones_activo_idx on public.catalogos_opciones (activo);

create trigger catalogos_opciones_set_updated_at
  before update on public.catalogos_opciones
  for each row execute function private.set_updated_at();

-- ============ RLS ============
alter table public.sedes enable row level security;
alter table public.area_categorias enable row level security;
alter table public.areas_catalogo enable row level security;
alter table public.sedes_areas enable row level security;
alter table public.aseguradores_eps enable row level security;
alter table public.sedes_aseguradores enable row level security;
alter table public.catalogos_opciones enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'sedes', 'area_categorias', 'areas_catalogo', 'sedes_areas',
    'aseguradores_eps', 'sedes_aseguradores', 'catalogos_opciones'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      t || '_select_authenticated', t
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select private.is_rol(''superadmin'')))',
      t || '_insert_admin', t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select private.is_rol(''superadmin''))) with check ((select private.is_rol(''superadmin'')))',
      t || '_update_admin', t
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select private.is_rol(''superadmin'')))',
      t || '_delete_admin', t
    );
  end loop;
end;
$$;

-- ============ seed idempotente ============
insert into public.area_categorias (nombre) values
  ('Consultorios'),
  ('Odontología'),
  ('Espacios Generales'),
  ('Laboratorio'),
  ('Imágenes'),
  ('Línea de Frente'),
  ('Terapias'),
  ('Procedimientos')
on conflict (nombre) do nothing;

insert into public.areas_catalogo (nombre, categoria, mide_capacidad_ocupacion) values
  ('Consulta Externa', 'Consultorios', true),
  ('Medicina General', 'Consultorios', true),
  ('Especialidades', 'Consultorios', true),
  ('Odontología General', 'Odontología', true),
  ('Ortodoncia', 'Odontología', true),
  ('Sala de Espera', 'Espacios Generales', false),
  ('Recepción', 'Espacios Generales', false),
  ('Baños', 'Espacios Generales', false),
  ('Toma de Muestras', 'Laboratorio', true),
  ('Rayos X', 'Imágenes', true),
  ('Ecografía', 'Imágenes', true),
  ('Asignación de Citas', 'Línea de Frente', false),
  ('Fisioterapia', 'Terapias', true),
  ('Sala de Procedimientos', 'Procedimientos', true)
on conflict (categoria, nombre) do nothing;

insert into public.aseguradores_eps (nombre_eps, codigo) values
  ('Nueva EPS', 'EPS001'),
  ('Sanitas', 'EPS002'),
  ('Sura', 'EPS003'),
  ('Compensar', 'EPS004')
on conflict (nombre_eps) do nothing;

insert into public.catalogos_opciones (dominio, nombre) values
  ('marca', 'Exclusiva'),
  ('marca', 'VIVA1A'),

  ('nivel', 'Primario'),
  ('nivel', 'Imagenología'),

  ('tipo_ips', 'Primaria'),
  ('tipo_ips', 'Central de Especialistas'),

  ('regional', 'Centro'),
  ('regional', 'Centro Occidente'),
  ('regional', 'Centro Oriente'),
  ('regional', 'Costa'),
  ('regional', 'Noroccidente'),
  ('regional', 'Norte'),
  ('regional', 'Eje cafetero'),
  ('regional', 'Suroccidente'),

  ('zonal', 'Centro'),
  ('zonal', 'Centro Occidente'),
  ('zonal', 'Centro Oriente'),
  ('zonal', 'Costa'),
  ('zonal', 'Noroccidente'),
  ('zonal', 'Norte'),
  ('zonal', 'Eje cafetero'),
  ('zonal', 'Suroccidente')
on conflict (dominio, nombre) do nothing;
