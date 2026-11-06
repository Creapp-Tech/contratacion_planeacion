-- 0040_cups_campos_nombre_capitulo_extra.sql
-- Ajusta el catálogo de CUPS: agrega nombre, capítulo y campos extra VII/VIII/IX.
-- Descripción y sección pasan a ser opcionales.

-- ============ nuevos campos ============
alter table public.cups
  add column if not exists nombre text,
  add column if not exists capitulo text,
  add column if not exists extra_vii text,
  add column if not exists extra_viii text,
  add column if not exists extra_ix text;

-- Backfill defensivo para entornos con datos previos: el nombre toma la
-- descripción existente (o el código si la descripción está vacía).
update public.cups
set nombre = coalesce(nullif(trim(descripcion), ''), codigo)
where nombre is null;

alter table public.cups
  alter column nombre set not null;

-- ============ campos opcionales ============
alter table public.cups
  alter column descripcion drop not null,
  alter column seccion drop not null;

-- ============ comentarios ============
comment on column public.cups.nombre is 'Nombre del CUPS';
comment on column public.cups.descripcion is 'Descripción del CUPS (opcional)';
comment on column public.cups.capitulo is 'Capítulo del CUPS (opcional)';
comment on column public.cups.seccion is 'Sección del CUPS (opcional)';
comment on column public.cups.extra_vii is 'Campo extra VII del CUPS (opcional)';
comment on column public.cups.extra_viii is 'Campo extra VIII del CUPS (opcional)';
comment on column public.cups.extra_ix is 'Campo extra IX del CUPS (opcional)';
