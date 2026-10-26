-- 0015_grupos_servicio_catalogo.sql
-- Catálogo de grupos de servicio + columna duracion_minutos en servicios.
-- (La tabla ya fue creada manualmente en producción; este archivo la replica
-- de forma idempotente para entornos nuevos y agrega la política RLS de SELECT.)

-- ============ grupos_servicio ============
create table if not exists public.grupos_servicio (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.grupos_servicio is 'Catálogo de grupos de servicio a los que pertenecen los servicios.';

create unique index if not exists grupos_servicio_nombre_uq
  on public.grupos_servicio (lower(trim(both from nombre)));

-- ============ servicios: grupo_id y duracion_minutos ============
alter table public.servicios add column if not exists grupo_id uuid
  references public.grupos_servicio(id);
alter table public.servicios add column if not exists duracion_minutos smallint;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'servicios_duracion_minutos_check'
      and conrelid = 'public.servicios'::regclass
  ) then
    alter table public.servicios
      add constraint servicios_duracion_minutos_check
      check (duracion_minutos > 0 and duracion_minutos <= 1440);
  end if;
end $$;

comment on column public.servicios.grupo_id is 'Referencia al grupo de servicio (catálogo grupos_servicio).';
comment on column public.servicios.duracion_minutos is 'Duración del servicio en minutos (entero, 1–1440, opcional).';

-- Backfill idempotente: grupo_id desde el texto legacy en servicios.grupo
update public.servicios s
set grupo_id = g.id
from public.grupos_servicio g
where s.grupo_id is null
  and s.grupo is not null
  and lower(trim(both from s.grupo)) = lower(trim(both from g.nombre));

-- ============ índice único compuesto en servicios ============
-- Un mismo servicio puede existir en distintos grupos, por lo que la
-- unicidad es sobre (nombre del servicio + grupo_id), no solo sobre el nombre.
drop index if exists servicios_nombre_key;
create unique index if not exists servicios_nombre_grupo_key
  on public.servicios (lower(trim(both from nombre)), grupo_id);
-- ================================================

drop policy if exists grupos_servicio_select_authenticated
  on public.grupos_servicio;
create policy grupos_servicio_select_authenticated
  on public.grupos_servicio
  for select
  to authenticated
  using (true);
