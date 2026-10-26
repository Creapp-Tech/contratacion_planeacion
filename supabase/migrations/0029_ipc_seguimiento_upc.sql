-- 0029_ipc_seguimiento_upc.sql
-- Agrega el valor de la UPC (Unidad de Pago por Capitación) al registro anual
-- de seguimiento IPC por contrato.
--
-- Notas:
-- - El histórico nacional (public.ipc_nacional.valor_upc) se conserva tal cual:
--   esos datos corresponden a la UPC del régimen contributivo.
-- - El valor se guarda en pesos con 2 decimales.
-- - La tabla estaba vacía al crear la columna, por lo que puede ser NOT NULL.

begin;

alter table public.ipc_seguimiento
  add column upc numeric(14,2) not null check (upc >= 0);

comment on column public.ipc_seguimiento.upc is
  'Valor de la Unidad de Pago por Capitación (UPC) del contrato para el año, en pesos.';

comment on table public.ipc_seguimiento is
  'Registro anual de costo usuario, % IPC y UPC por contrato.';

notify pgrst, 'reload schema';

commit;
