-- 0003_poblacion_aseguradora.sql
-- Módulo Población (v2): reemplaza `sedes_poblaciones` por `poblacion_aseguradora`.
-- Registra población activa, pagada y certificada por sede y asegurador; insumo
-- para la ocupación del mapa y el resto de informes. RLS + políticas estilo proyecto.
-- Seguro de re-ejecutar (idempotente) salvo el drop del esquema anterior.

-- ============ reemplazo del esquema anterior ============
-- La tabla `sedes_poblaciones` (población única por sede+asegurador) queda obsoleta.
drop table if exists public.sedes_poblaciones cascade;

-- ============ poblacion_aseguradora ============
create table if not exists public.poblacion_aseguradora (
  id uuid primary key default gen_random_uuid(),
  sede_id uuid not null references public.sedes(id) on delete cascade,
  asegurador_eps_id uuid not null references public.aseguradores_eps(id) on delete cascade,
  poblacion_activa integer not null default 0 check (poblacion_activa >= 0),
  poblacion_pagada integer not null default 0 check (poblacion_pagada >= 0),
  poblacion_certificada integer not null default 0 check (poblacion_certificada >= 0),
  fecha_actualizacion date not null default current_date,
  usuario_id uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sede_id, asegurador_eps_id)
);

comment on table public.poblacion_aseguradora is 'Población registrada por sede y asegurador: activa, pagada y certificada.';
comment on column public.poblacion_aseguradora.poblacion_activa is 'Usuarios activos del asegurador en la sede. Insumo de ocupación e informes.';
comment on column public.poblacion_aseguradora.poblacion_pagada is 'Usuarios con pago vigente del asegurador en la sede.';
comment on column public.poblacion_aseguradora.poblacion_certificada is 'Usuarios certificados del asegurador en la sede.';
comment on column public.poblacion_aseguradora.fecha_actualizacion is 'Fecha de corte de la información poblacional.';
comment on column public.poblacion_aseguradora.usuario_id is 'Usuario (auth.uid) que creó o modificó por última vez el registro.';

create index if not exists poblacion_aseguradora_sede_idx on public.poblacion_aseguradora (sede_id);
create index if not exists poblacion_aseguradora_asegurador_idx on public.poblacion_aseguradora (asegurador_eps_id);
create index if not exists poblacion_aseguradora_usuario_idx on public.poblacion_aseguradora (usuario_id);

-- Índice para el filtro por zonal del mapa
create index if not exists sedes_zonal_idx on public.sedes (zonal);

drop trigger if exists poblacion_aseguradora_set_updated_at on public.poblacion_aseguradora;
create trigger poblacion_aseguradora_set_updated_at
  before update on public.poblacion_aseguradora
  for each row execute function private.set_updated_at();

-- ============ RLS ============
alter table public.poblacion_aseguradora enable row level security;

drop policy if exists poblacion_aseguradora_select_authenticated on public.poblacion_aseguradora;
create policy poblacion_aseguradora_select_authenticated
  on public.poblacion_aseguradora for select to authenticated using (true);

drop policy if exists poblacion_aseguradora_insert_admin on public.poblacion_aseguradora;
create policy poblacion_aseguradora_insert_admin
  on public.poblacion_aseguradora for insert to authenticated
  with check ((select private.is_rol('superadmin')));

drop policy if exists poblacion_aseguradora_update_admin on public.poblacion_aseguradora;
create policy poblacion_aseguradora_update_admin
  on public.poblacion_aseguradora for update to authenticated
  using ((select private.is_rol('superadmin')))
  with check ((select private.is_rol('superadmin')));

drop policy if exists poblacion_aseguradora_delete_admin on public.poblacion_aseguradora;
create policy poblacion_aseguradora_delete_admin
  on public.poblacion_aseguradora for delete to authenticated
  using ((select private.is_rol('superadmin')));
