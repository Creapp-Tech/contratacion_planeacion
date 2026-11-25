-- Jurídica ve todos los contratos (igual que analista_contratacion), pero no
-- tiene políticas de INSERT/UPDATE/DELETE. Solo se recrean las políticas SELECT
-- existentes, conservando el alcance regional de gerente_regional.

-- ============ contrato_regionales ============
drop policy if exists contrato_regionales_select on public.contrato_regionales;

create policy contrato_regionales_select
  on public.contrato_regionales
  for select
  to authenticated
  using (
    (select private.is_rol('superadmin'))
    or (select private.is_rol('analista_contratacion'))
    or (select private.is_rol('juridica'))
    or exists (
      select 1
      from public.usuarios u
      where u.id = (select auth.uid())
        and u.rol = 'gerente_regional'
        and u.regional_id = contrato_regionales.regional_id
    )
  );

-- ============ contratos ============
drop policy if exists contratos_select_roles on public.contratos;

create policy contratos_select_roles
  on public.contratos
  for select
  to authenticated
  using (
    (select private.is_rol('superadmin'))
    or (select private.is_rol('analista_contratacion'))
    or (select private.is_rol('juridica'))
    or (
      (select private.is_rol('gerente_regional'))
      and exists (
        select 1
        from public.contrato_regionales cr
        join public.usuarios u on u.id = (select auth.uid())
        where cr.contrato_id = contratos.id
          and u.rol = 'gerente_regional'
          and u.regional_id = cr.regional_id
      )
    )
  );

-- ============ tablas hijas ============
do $$
declare
  t text;
begin
  foreach t in array array['contratos_sedes','contratos_programas','contratos_valores']
  loop
    execute format('drop policy if exists %I_select on public.%I', t, t);

    execute format($f$
      create policy %I_select on public.%I
        for select to authenticated
        using (
          private.is_rol('superadmin')
          or private.is_rol('analista_contratacion')
          or private.is_rol('juridica')
          or exists (
            select 1
            from public.contrato_regionales cr
            join public.usuarios u on u.id = (select auth.uid())
            where cr.contrato_id = %I.contrato_id
              and u.rol = 'gerente_regional'
              and u.regional_id = cr.regional_id
          )
        )
    $f$, t, t, t);
  end loop;
end
$$;
