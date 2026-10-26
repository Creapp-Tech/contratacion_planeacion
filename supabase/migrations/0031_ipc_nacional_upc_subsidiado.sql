-- 0031_ipc_nacional_upc_subsidiado.sql
-- Agrega el valor anual de la UPC del régimen subsidiado al histórico nacional.
--
-- Notas:
-- - `ipc_nacional.valor_upc` se conserva como la UPC del régimen contributivo.
-- - La columna nueva es nullable para no inventar datos en los registros
--   existentes; se puede completar desde Configuración > IPC Nacional.

begin;

alter table public.ipc_nacional
  add column valor_upc_subsidiado numeric(14,2)
    check (valor_upc_subsidiado >= 0);

comment on column public.ipc_nacional.valor_upc is
  'Valor de la UPC del régimen contributivo en pesos.';
comment on column public.ipc_nacional.valor_upc_subsidiado is
  'Valor de la UPC del régimen subsidiado en pesos.';
comment on table public.ipc_nacional is
  'Histórico nacional de IPC y valores de UPC (contributivo y subsidiado) por país y año.';

notify pgrst, 'reload schema';

commit;
