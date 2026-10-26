-- 0011_sedes_relacion_filtros.sql
-- Tabla de relación plana para filtros dependientes entre sedes, regional, zonal, departamento y municipio.
-- Permite ver, crear, editar y eliminar (CRUD completo) con control por RLS.

-- ============ sedes_relacion_filtros ============
create table public.sedes_relacion_filtros (
  id uuid primary key default gen_random_uuid(),
  regional_id uuid not null references public.catalogos_opciones(id) on delete restrict,
  zonal_id uuid not null references public.catalogos_opciones(id) on delete restrict,
  departamento text not null,
  municipio text not null,
  sede_id uuid not null references public.sedes(id) on delete cascade,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.sedes_relacion_filtros is 'Relación plana entre regional, zonal, departamento, municipio y sede para filtros dependientes.';
comment on column public.sedes_relacion_filtros.id is 'Identificador único (Primary Key).';
comment on column public.sedes_relacion_filtros.regional_id is 'Referencia a la regional (catálogo catalogos_opciones, dominio regional).';
comment on column public.sedes_relacion_filtros.zonal_id is 'Referencia a la zonal (catálogo catalogos_opciones, dominio zonal).';
comment on column public.sedes_relacion_filtros.departamento is 'Nombre del departamento (Texto/Varchar).';
comment on column public.sedes_relacion_filtros.municipio is 'Nombre del municipio (Texto/Varchar).';
comment on column public.sedes_relacion_filtros.sede_id is 'Referencia a la sede (tabla sedes). Equivale a sede_id.';
comment on column public.sedes_relacion_filtros.activo is 'Indica si la relación está activa.';

-- Índices solicitados para optimizar filtros dependientes
create index sedes_relacion_filtros_departamento_idx on public.sedes_relacion_filtros (departamento);
create index sedes_relacion_filtros_municipio_idx on public.sedes_relacion_filtros (municipio);
create index sedes_relacion_filtros_regional_id_idx on public.sedes_relacion_filtros (regional_id);
create index sedes_relacion_filtros_zonal_id_idx on public.sedes_relacion_filtros (zonal_id);

-- Índices adicionales útiles
create index sedes_relacion_filtros_sede_id_idx on public.sedes_relacion_filtros (sede_id);
create index sedes_relacion_filtros_activo_idx on public.sedes_relacion_filtros (activo);

-- Trigger para updated_at
create trigger sedes_relacion_filtros_set_updated_at
  before update on public.sedes_relacion_filtros
  for each row execute function private.set_updated_at();

-- RLS habilitado
alter table public.sedes_relacion_filtros enable row level security;

-- Políticas: Ver (todos autenticados), Crear/Editar/Eliminar (solo superadmin)
create policy sedes_relacion_filtros_select_authenticated
  on public.sedes_relacion_filtros
  for select
  to authenticated
  using (true);

create policy sedes_relacion_filtros_insert_admin
  on public.sedes_relacion_filtros
  for insert
  to authenticated
  with check ((select private.is_rol('superadmin')));

create policy sedes_relacion_filtros_update_admin
  on public.sedes_relacion_filtros
  for update
  to authenticated
  using ((select private.is_rol('superadmin')))
  with check ((select private.is_rol('superadmin')));

create policy sedes_relacion_filtros_delete_admin
  on public.sedes_relacion_filtros
  for delete
  to authenticated
  using ((select private.is_rol('superadmin')));
