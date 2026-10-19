-- 0009_poblacion_asegurador_regimen_nullables.sql
-- Permite registrar población sin asegurador y/o sin régimen (carga masiva con
-- celdas en blanco). La clave única pasa a tratar los NULL como iguales para
-- evitar duplicados cuando el asegurador o el régimen no se especifican.

alter table public.poblacion_aseguradora
  alter column asegurador_eps_id drop not null,
  alter column regimen_id drop not null;

alter table public.poblacion_aseguradora
  drop constraint if exists poblacion_aseguradora_sede_asegurador_regimen_key;

alter table public.poblacion_aseguradora
  add constraint poblacion_aseguradora_sede_asegurador_regimen_key
  unique nulls not distinct (sede_id, asegurador_eps_id, regimen_id);

comment on column public.poblacion_aseguradora.asegurador_eps_id is 'Asegurador (EPS) de la población. NULL cuando la carga no lo especifica.';
comment on column public.poblacion_aseguradora.regimen_id is 'Régimen de afiliación de la población registrada. NULL cuando la carga no lo especifica.';
