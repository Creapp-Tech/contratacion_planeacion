-- 0032_ipc_nacional_rename_upc_contributivo.sql
-- Alinea el nombre de la columna de UPC contributiva con el esquema actual de
-- Supabase: valor_upc -> valor_upc_contributivo.
--
-- Es idempotente: si la columna ya fue renombrada manualmente, no hace nada.

begin;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ipc_nacional'
      and column_name = 'valor_upc'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ipc_nacional'
      and column_name = 'valor_upc_contributivo'
  ) then
    alter table public.ipc_nacional
      rename column valor_upc to valor_upc_contributivo;
  end if;
end $$;

comment on column public.ipc_nacional.valor_upc_contributivo is
  'Valor de la UPC del régimen contributivo en pesos.';
comment on column public.ipc_nacional.valor_upc_subsidiado is
  'Valor de la UPC del régimen subsidiado en pesos.';
comment on table public.ipc_nacional is
  'Histórico nacional de IPC y valores de UPC (contributivo y subsidiado) por país y año.';

notify pgrst, 'reload schema';

commit;
