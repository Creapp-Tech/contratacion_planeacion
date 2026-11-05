-- 0039_ipc_seguimiento_upc_opcional.sql
-- El formulario de seguimiento IPC captura únicamente año, costo usuario y % IPC.
-- La UPC contributiva y subsidiada se conservan en la tabla para datos históricos
-- o cargas externas, pero dejan de ser obligatorias.
--
-- Notas:
-- - No se eliminan las columnas ni los datos existentes.
-- - La interfaz muestra «—» cuando no hay UPC registrada.

begin;

alter table public.ipc_seguimiento
  alter column upc drop not null,
  alter column upc_subsidiado drop not null;

comment on column public.ipc_seguimiento.upc is
  'Valor opcional de la UPC del régimen contributivo del contrato para el año, en pesos.';
comment on column public.ipc_seguimiento.upc_subsidiado is
  'Valor opcional de la UPC del régimen subsidiado del contrato para el año, en pesos.';

notify pgrst, 'reload schema';

commit;
