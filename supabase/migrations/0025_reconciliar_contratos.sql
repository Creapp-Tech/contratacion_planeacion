-- 0025_reconciliar_contratos.sql
-- Fase 3 del módulo de contratos:
-- 1. Endurece las políticas RLS de las tablas hijas usando (select auth.uid()).
-- 2. Agrega el índice de contratos.created_by.
-- 3. Agrega una función transaccional para actualizar el contrato y reemplazar
--    sus sedes, programas y valores en una sola operación.
--
-- Nota: la migración 0024_historico_contrato.sql se descartó. Lo "histórico"
-- se determina con estado_ejecucion (Finalizado / Terminado), no con una
-- categoría de contrato.

begin;

-- ============ RLS de tablas hijas ============
do $$
declare
  t text;
begin
  foreach t in array array['contratos_sedes','contratos_programas','contratos_valores']
  loop
    execute format('drop policy if exists %I_select on public.%I', t, t);
    execute format('drop policy if exists %I_insert on public.%I', t, t);
    execute format('drop policy if exists %I_update on public.%I', t, t);
    execute format('drop policy if exists %I_delete on public.%I', t, t);

    execute format($f$
      create policy %I_select on public.%I
        for select to authenticated
        using (
          private.is_rol('superadmin')
          or private.is_rol('analista_contratacion')
          or exists (
            select 1
            from public.contratos c
            join public.usuarios u on u.id = (select auth.uid())
            where c.id = %I.contrato_id
              and u.rol = 'gerente_regional'
              and u.regional_id = c.regional_id
          )
        )
    $f$, t, t, t);

    execute format($f$
      create policy %I_insert on public.%I
        for insert to authenticated
        with check (
          private.is_rol('superadmin')
          or private.is_rol('analista_contratacion')
          or exists (
            select 1
            from public.contratos c
            join public.usuarios u on u.id = (select auth.uid())
            where c.id = %I.contrato_id
              and u.rol = 'gerente_regional'
              and u.regional_id = c.regional_id
          )
        )
    $f$, t, t, t);

    execute format($f$
      create policy %I_update on public.%I
        for update to authenticated
        using (
          private.is_rol('superadmin')
          or private.is_rol('analista_contratacion')
          or exists (
            select 1
            from public.contratos c
            join public.usuarios u on u.id = (select auth.uid())
            where c.id = %I.contrato_id
              and u.rol = 'gerente_regional'
              and u.regional_id = c.regional_id
          )
        )
        with check (
          private.is_rol('superadmin')
          or private.is_rol('analista_contratacion')
          or exists (
            select 1
            from public.contratos c
            join public.usuarios u on u.id = (select auth.uid())
            where c.id = %I.contrato_id
              and u.rol = 'gerente_regional'
              and u.regional_id = c.regional_id
          )
        )
    $f$, t, t, t, t);

    execute format($f$
      create policy %I_delete on public.%I
        for delete to authenticated
        using (
          private.is_rol('superadmin')
          or private.is_rol('analista_contratacion')
          or exists (
            select 1
            from public.contratos c
            join public.usuarios u on u.id = (select auth.uid())
            where c.id = %I.contrato_id
              and u.rol = 'gerente_regional'
              and u.regional_id = c.regional_id
          )
        )
    $f$, t, t, t);
  end loop;
end
$$;

-- ============ índices ============
create index if not exists contratos_created_by_idx
  on public.contratos (created_by);

-- ============ actualización transaccional ============
create or replace function public.actualizar_contrato_completo(
  p_id uuid,
  p_datos jsonb,
  p_sede_ids uuid[],
  p_programa_ids uuid[],
  p_valores jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.contratos c
  set nombre = d.nombre,
      asegurador_id = d.asegurador_id,
      numero_contrato = d.numero_contrato,
      regional_id = d.regional_id,
      ciudad = d.ciudad,
      modalidad = d.modalidad,
      responsable_id = d.responsable_id,
      categoria_contrato_id = d.categoria_contrato_id,
      tipo_contrato_id = d.tipo_contrato_id,
      estado_legalizacion_id = d.estado_legalizacion_id,
      estado_ejecucion_id = d.estado_ejecucion_id,
      fecha_inicio = d.fecha_inicio,
      fecha_fin = d.fecha_fin,
      prorroga_automatica = d.prorroga_automatica,
      periodicidad = d.periodicidad,
      poblacion_total = d.poblacion_total,
      valor_total = d.valor_total,
      valor_percapita_manual = d.valor_percapita_manual,
      tiene_programas = d.tiene_programas,
      url_ubicacion = d.url_ubicacion,
      notas = d.notas
  from jsonb_to_recordset(jsonb_build_array(p_datos)) as d(
    nombre text,
    asegurador_id uuid,
    numero_contrato text,
    regional_id uuid,
    ciudad text,
    modalidad text,
    responsable_id uuid,
    categoria_contrato_id uuid,
    tipo_contrato_id uuid,
    estado_legalizacion_id uuid,
    estado_ejecucion_id uuid,
    fecha_inicio date,
    fecha_fin date,
    prorroga_automatica boolean,
    periodicidad text,
    poblacion_total integer,
    valor_total numeric,
    valor_percapita_manual numeric,
    tiene_programas boolean,
    url_ubicacion text,
    notas text
  )
  where c.id = p_id;

  if not found then
    raise exception 'El contrato % no existe', p_id using errcode = 'P0002';
  end if;

  delete from public.contratos_sedes where contrato_id = p_id;
  delete from public.contratos_programas where contrato_id = p_id;
  delete from public.contratos_valores where contrato_id = p_id;

  insert into public.contratos_sedes (contrato_id, sede_id)
  select p_id, sede_id
  from (
    select distinct unnest(coalesce(p_sede_ids, array[]::uuid[])) as sede_id
  ) s;

  insert into public.contratos_programas (contrato_id, opcion_id)
  select p_id, opcion_id
  from (
    select distinct unnest(coalesce(p_programa_ids, array[]::uuid[])) as opcion_id
  ) o;

  insert into public.contratos_valores (
    contrato_id,
    regimen_id,
    poblacion,
    valor_total,
    valor_percapita_manual
  )
  select p_id,
         x.regimen_id,
         x.poblacion,
         x.valor_total,
         x.valor_percapita_manual
  from jsonb_to_recordset(coalesce(p_valores, '[]'::jsonb)) as x(
    regimen_id uuid,
    poblacion integer,
    valor_total numeric,
    valor_percapita_manual numeric
  );
end
$$;

revoke all on function public.actualizar_contrato_completo(
  uuid, jsonb, uuid[], uuid[], jsonb
) from public, anon, authenticated;

grant execute on function public.actualizar_contrato_completo(
  uuid, jsonb, uuid[], uuid[], jsonb
) to service_role;

commit;

notify pgrst, 'reload schema';
