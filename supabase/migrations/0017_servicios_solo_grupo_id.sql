-- 0017_servicios_solo_grupo_id.sql
-- Remover columna texto legado 'grupo' y quedarse solo con grupo_id FK

-- Paso 1: Poblar grupo_id desde el texto grupo (idempotente)
-- Si grupo_id es null pero grupo tiene valor, buscar el grupo por nombre
update public.servicios s
set grupo_id = g.id
from public.grupos_servicio g
where s.grupo_id is null
  and s.grupo is not null
  and lower(trim(both from s.grupo)) = lower(trim(both from g.nombre));

-- Paso 2: Remover la columna texto (ya no necesaria)
alter table public.servicios drop column grupo;

-- Paso 3: (Opcional) Asegurar que grupo_id tenga un valor por defecto o NOT NULL
-- Si todos tus servicios vienen con grupo definido en el form, puedes descomentar:
-- alter table public.servicios alter column grupo_id set not null;