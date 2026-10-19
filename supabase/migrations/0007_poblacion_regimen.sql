-- 0007_poblacion_regimen.sql
-- Agrega el régimen de afiliación a la población por sede y asegurador.
-- La clave única pasa a incluir el régimen (sede + asegurador + régimen).
-- Los registros existentes se asignan al régimen Contributivo.

-- ============ nueva columna ============
alter table public.poblacion_aseguradora
  add column if not exists regimen_id uuid references public.regimenes(id) on delete restrict;

-- ============ backfill registros existentes ============
update public.poblacion_aseguradora
set regimen_id = (
  select id from public.regimenes where nombre = 'Contributivo' limit 1
)
where regimen_id is null;

alter table public.poblacion_aseguradora
  alter column regimen_id set not null;

-- ============ nueva clave única ============
alter table public.poblacion_aseguradora
  drop constraint if exists poblacion_aseguradora_sede_id_asegurador_eps_id_key;

alter table public.poblacion_aseguradora
  drop constraint if exists poblacion_aseguradora_sede_asegurador_regimen_key;

alter table public.poblacion_aseguradora
  add constraint poblacion_aseguradora_sede_asegurador_regimen_key
  unique (sede_id, asegurador_eps_id, regimen_id);

create index if not exists poblacion_aseguradora_regimen_idx
  on public.poblacion_aseguradora (regimen_id);

comment on column public.poblacion_aseguradora.regimen_id is 'Régimen de afiliación de la población registrada.';
