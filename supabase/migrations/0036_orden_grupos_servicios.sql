-- 0036_orden_grupos_servicios.sql
-- Agrega columna de orden a grupos de servicio y servicios para que se
-- organicen de forma consistente en planeaciones y frecuencias.

alter table public.grupos_servicio
  add column if not exists orden integer not null default 0;

alter table public.servicios
  add column if not exists orden integer not null default 0;

comment on column public.grupos_servicio.orden is
  'Orden de presentación del grupo en planeaciones y frecuencias (menor primero).';
comment on column public.servicios.orden is
  'Orden de presentación del servicio dentro de su grupo (menor primero).';

create index if not exists grupos_servicio_orden_idx
  on public.grupos_servicio (orden, nombre);

create index if not exists servicios_grupo_orden_idx
  on public.servicios (grupo_id, orden, nombre);

-- Backfill inicial: si todas las filas quedaron en 0, se asigna un orden
-- alfabético estable. En ejecuciones posteriores solo completa las que sigan
-- en 0 sin tocar las que ya fueron ordenadas manualmente.
with numerados as (
  select id, row_number() over (order by lower(trim(both from nombre))) - 1 as pos
  from public.grupos_servicio
)
update public.grupos_servicio g
set orden = n.pos
from numerados n
where g.id = n.id
  and g.orden = 0;

with numerados as (
  select id,
         row_number() over (
           partition by grupo_id
           order by lower(trim(both from nombre))
         ) - 1 as pos
  from public.servicios
)
update public.servicios s
set orden = n.pos
from numerados n
where s.id = n.id
  and s.orden = 0;
