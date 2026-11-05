-- 0038_cups_catalogo.sql
-- Catálogo de CUPS (Código Único de Prestaciones de Salud)

-- ============ cups ============
create table if not exists public.cups (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,
  descripcion text not null,
  grupo_id uuid references public.grupos_servicio(id),
  servicio_id uuid references public.servicios(id),
  seccion text not null,
  version_resolucion text not null,
  fecha_inicio date not null,
  fecha_fin date,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Constraint: código debe tener exactamente 6 dígitos
alter table public.cups
  add constraint cups_codigo_length_check
  check (length(trim(both from codigo)) = 6);

-- Índice único: código + versión de resolución
create unique index if not exists cups_codigo_version_unique
  on public.cups (lower(trim(both from codigo)), lower(trim(both from version_resolucion)));

-- Índices
create index if not exists idx_cups_codigo
  on public.cups (lower(trim(both from codigo)));
create index if not exists idx_cups_activo
  on public.cups (activo);
create index if not exists idx_cups_vigencia
  on public.cups (fecha_inicio, fecha_fin);
create index if not exists idx_cups_grupo_id
  on public.cups (grupo_id);
create index if not exists idx_cups_servicio_id
  on public.cups (servicio_id);

comment on table public.cups is 'Catálogo de CUPS (Código Único de Prestaciones de Salud)';
comment on column public.cups.codigo is 'Código de 6 dígitos identificador del CUPS';
comment on column public.cups.descripcion is 'Descripción del CUPS';
comment on column public.cups.grupo_id is 'Grupo de servicio al que pertenece el CUPS';
comment on column public.cups.servicio_id is 'Servicio al que pertenece el CUPS';
comment on column public.cups.seccion is 'Sección del CUPS (texto libre)';
comment on column public.cups.version_resolucion is 'Versión de la resolución (ej. v1, Resolución 2808 de 2022)';
comment on column public.cups.fecha_inicio is 'Fecha desde la cual el CUPS rige';
comment on column public.cups.fecha_fin is 'Fecha hasta la cual el CUPS rige (null = vigente permanente)';
comment on column public.cups.activo is 'Indica si el CUPS está activo en el catálogo';

-- RLS
alter table public.cups enable row level security;

drop policy if exists cups_select_authenticated on public.cups;
create policy cups_select_authenticated
  on public.cups for select to authenticated using (true);

drop policy if exists cups_insert_admin on public.cups;
create policy cups_insert_admin
  on public.cups for insert to authenticated
  with check ((select private.is_rol('superadmin')));

drop policy if exists cups_update_admin on public.cups;
create policy cups_update_admin
  on public.cups for update to authenticated
  using ((select private.is_rol('superadmin')))
  with check ((select private.is_rol('superadmin')));

drop policy if exists cups_delete_admin on public.cups;
create policy cups_delete_admin
  on public.cups for delete to authenticated
  using ((select private.is_rol('superadmin')));
