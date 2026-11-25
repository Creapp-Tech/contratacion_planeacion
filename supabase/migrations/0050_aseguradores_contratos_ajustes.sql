-- 0050_aseguradores_contratos_ajustes.sql
-- Ajustes al módulo Aseguradores y Contratos:
-- frecuencia de uso con decimal largo y retiro de las opciones de especialista.
-- El historial ya registrado se conserva.

begin;

-- La frecuencia de uso contratada admite decimales sin escala fija.
alter table public.servicios_cups_aseguradores
  alter column frecuencia_uso_contratada type numeric
  using frecuencia_uso_contratada::numeric;

comment on column public.servicios_cups_aseguradores.frecuencia_uso_contratada is
  'Frecuencia de uso contratada; admite decimales sin escala fija y valores no negativos.';

-- Las opciones primera/segunda ya no se capturan ni se consultan.
drop index if exists public.servicios_cups_asegurador_primera_idx;
drop index if exists public.servicios_cups_asegurador_segunda_idx;

alter table public.servicios_cups_aseguradores
  drop column if exists primera_opcion_especialista_id,
  drop column if exists segunda_opcion_especialista_id;

drop trigger if exists servicios_cups_asegurador_historial
  on public.servicios_cups_aseguradores;
create trigger servicios_cups_asegurador_historial
  after update on public.servicios_cups_aseguradores
  for each row execute function private.registrar_historial_prestadores_contratos(
    'cups_asegurador', 'cups_id', 'frecuencia_uso_contratada', 'cme_contratado'
  );

comment on table public.servicios_cups_aseguradores is
  'Servicios CUPS contratados por asegurador/contrato con CME y trazabilidad.';

notify pgrst, 'reload schema';

commit;
