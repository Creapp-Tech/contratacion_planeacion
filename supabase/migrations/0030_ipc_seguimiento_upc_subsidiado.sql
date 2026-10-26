-- 0030_ipc_seguimiento_upc_subsidiado.sql
-- Agrega el valor de la UPC del régimen subsidiado al seguimiento IPC.
--
-- Notas:
-- - `ipc_seguimiento.upc` queda identificada como la UPC del régimen
--   contributivo.
-- - El histórico nacional (`public.ipc_nacional.valor_upc`) no se modifica.
-- - La tabla estaba vacía al crear la columna, por lo que puede ser NOT NULL.

begin;

alter table public.ipc_seguimiento
  add column upc_subsidiado numeric(14,2) not null
    check (upc_subsidiado >= 0);

comment on column public.ipc_seguimiento.upc is
  'Valor de la UPC del régimen contributivo del contrato para el año, en pesos.';
comment on column public.ipc_seguimiento.upc_subsidiado is
  'Valor de la UPC del régimen subsidiado del contrato para el año, en pesos.';
comment on table public.ipc_seguimiento is
  'Registro anual de costo usuario, % IPC y UPC (contributivo y subsidiado) por contrato.';

notify pgrst, 'reload schema';

commit;
