-- contrato_documentos estaba expuesto sin RLS y con ALL para anon/authenticated.
-- Se habilita RLS con lectura para los roles que pueden ver contratos (incluida
-- Jurídica) y escritura únicamente para los roles que pueden editarlos.
alter table public.contrato_documentos enable row level security;

revoke all on public.contrato_documentos from anon;
revoke insert, update, delete, truncate on public.contrato_documentos from authenticated;
grant select on public.contrato_documentos to authenticated;

drop policy if exists contrato_documentos_select on public.contrato_documentos;
drop policy if exists contrato_documentos_insert on public.contrato_documentos;
drop policy if exists contrato_documentos_update on public.contrato_documentos;
drop policy if exists contrato_documentos_delete on public.contrato_documentos;

create policy contrato_documentos_select
  on public.contrato_documentos
  for select
  to authenticated
  using (
    private.is_rol('superadmin')
    or private.is_rol('analista_contratacion')
    or private.is_rol('juridica')
    or exists (
      select 1
      from public.contrato_regionales cr
      join public.usuarios u on u.id = (select auth.uid())
      where cr.contrato_id = contrato_documentos.contrato_id
        and u.rol = 'gerente_regional'
        and u.regional_id = cr.regional_id
    )
  );

create policy contrato_documentos_insert
  on public.contrato_documentos
  for insert
  to authenticated
  with check (
    private.is_rol('superadmin')
    or private.is_rol('analista_contratacion')
    or exists (
      select 1
      from public.contrato_regionales cr
      join public.usuarios u on u.id = (select auth.uid())
      where cr.contrato_id = contrato_documentos.contrato_id
        and u.rol = 'gerente_regional'
        and u.regional_id = cr.regional_id
    )
  );

create policy contrato_documentos_update
  on public.contrato_documentos
  for update
  to authenticated
  using (
    private.is_rol('superadmin')
    or private.is_rol('analista_contratacion')
    or exists (
      select 1
      from public.contrato_regionales cr
      join public.usuarios u on u.id = (select auth.uid())
      where cr.contrato_id = contrato_documentos.contrato_id
        and u.rol = 'gerente_regional'
        and u.regional_id = cr.regional_id
    )
  )
  with check (
    private.is_rol('superadmin')
    or private.is_rol('analista_contratacion')
    or exists (
      select 1
      from public.contrato_regionales cr
      join public.usuarios u on u.id = (select auth.uid())
      where cr.contrato_id = contrato_documentos.contrato_id
        and u.rol = 'gerente_regional'
        and u.regional_id = cr.regional_id
    )
  );

create policy contrato_documentos_delete
  on public.contrato_documentos
  for delete
  to authenticated
  using (
    private.is_rol('superadmin')
    or private.is_rol('analista_contratacion')
    or exists (
      select 1
      from public.contrato_regionales cr
      join public.usuarios u on u.id = (select auth.uid())
      where cr.contrato_id = contrato_documentos.contrato_id
        and u.rol = 'gerente_regional'
        and u.regional_id = cr.regional_id
    )
  );
