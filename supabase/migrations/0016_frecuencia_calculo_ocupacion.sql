alter table public.frecuencias
  add column if not exists usar_en_calculo boolean not null default false;

drop index if exists public.frecuencias_calculo_uq;

create unique index if not exists frecuencias_calculo_sede_tipo_uq
  on public.frecuencias (sede_id, tipo_frecuencia)
  where usar_en_calculo;
