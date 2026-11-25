-- 0051_cme_asegurador_opcional.sql
-- El CME del asegurador puede quedar sin dato al registrar servicios CUPS,
-- en especial durante la carga masiva. Los valores existentes no se modifican.

begin;

alter table public.servicios_cups_aseguradores
  alter column cme_contratado drop not null;

comment on column public.servicios_cups_aseguradores.cme_contratado is
  'CME contratado por el asegurador en COP; opcional y no negativo cuando tiene valor.';

notify pgrst, 'reload schema';

commit;
