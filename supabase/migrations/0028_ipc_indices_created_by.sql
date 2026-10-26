-- 0028_ipc_indices_created_by.sql
-- Índices de cobertura para las FK created_by de las tablas de Seguimiento IPC.
-- Evitan scans de tabla cuando se elimina o actualiza un usuario.

begin;

create index if not exists ipc_nacional_created_by_idx
  on public.ipc_nacional (created_by);

create index if not exists ipc_seguimiento_created_by_idx
  on public.ipc_seguimiento (created_by);

commit;
