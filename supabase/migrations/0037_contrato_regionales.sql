-- 0037_contrato_regionales.sql
-- Relación muchos-a-muchos entre contratos y regionales.
--
-- Reglas:
-- - Un contrato pertenece a una o varias regionales.
-- - Las sedes de un contrato deben pertenecer a alguna de sus regionales,
--   salvo que la regional del contrato sea "Nacional" (en ese caso se eligen
--   sedes puntuales de cualquier regional).
-- - "Nacional" es excluyente: no se puede combinar con otras regionales.
-- - contratos.regional_id se conserva como "regional principal" heredada para
--   no romper IPC, RLS, plantilla y filtros. Se sincroniza desde la aplicación
--   y el RPC de actualización.
-- - contratos_sedes ya existía como N:M; no se duplica.

begin;

-- ============ tabla puente contrato-regional ============
create table if not exists public.contrato_regionales (
  contrato_id uuid not null references public.contratos(id) on delete cascade,
  regional_id uuid not null references public.regionales(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (contrato_id, regional_id)
);

comment on table public.contrato_regionales is
  'Regionales a las que pertenece un contrato (N:M). Fuente de verdad del alcance territorial.';
comment on column public.contrato_regionales.contrato_id is
  'Contrato asociado. Se elimina en cascada con el contrato.';
comment on column public.contrato_regionales.regional_id is
  'Regional asociada. Se restringe el borrado para no perder alcance.';

create index if not exists contrato_regionales_regional_idx
  on public.contrato_regionales (regional_id);

-- ============ backfill de datos existentes ============
insert into public.contrato_regionales (contrato_id, regional_id)
select c.id, c.regional_id
from public.contratos c
on conflict (contrato_id, regional_id) do nothing;

-- Ningún contrato existente debe quedar sin regional.
do $$
declare
  v_sin_regional integer;
begin
  select count(*)
  into v_sin_regional
  from public.contratos c
  where not exists (
    select 1
    from public.contrato_regionales cr
    where cr.contrato_id = c.id
  );

  if v_sin_regional > 0 then
    raise exception 'Backfill incompleto: % contrato(s) sin regional', v_sin_regional;
  end if;
end
$$;

-- ============ RLS de la tabla puente ============
alter table public.contrato_regionales enable row level security;

drop policy if exists contrato_regionales_select on public.contrato_regionales;
drop policy if exists contrato_regionales_insert on public.contrato_regionales;
drop policy if exists contrato_regionales_update on public.contrato_regionales;
drop policy if exists contrato_regionales_delete on public.contrato_regionales;

create policy contrato_regionales_select
  on public.contrato_regionales
  for select
  to authenticated
  using (
    (select private.is_rol('superadmin'))
    or (select private.is_rol('analista_contratacion'))
    or exists (
      select 1
      from public.usuarios u
      where u.id = (select auth.uid())
        and u.rol = 'gerente_regional'
        and u.regional_id = contrato_regionales.regional_id
    )
  );

create policy contrato_regionales_insert
  on public.contrato_regionales
  for insert
  to authenticated
  with check (
    (select private.is_rol('superadmin'))
    or (select private.is_rol('analista_contratacion'))
    or exists (
      select 1
      from public.usuarios u
      where u.id = (select auth.uid())
        and u.rol = 'gerente_regional'
        and u.regional_id = contrato_regionales.regional_id
    )
  );

create policy contrato_regionales_update
  on public.contrato_regionales
  for update
  to authenticated
  using (
    (select private.is_rol('superadmin'))
    or (select private.is_rol('analista_contratacion'))
    or exists (
      select 1
      from public.usuarios u
      where u.id = (select auth.uid())
        and u.rol = 'gerente_regional'
        and u.regional_id = contrato_regionales.regional_id
    )
  )
  with check (
    (select private.is_rol('superadmin'))
    or (select private.is_rol('analista_contratacion'))
    or exists (
      select 1
      from public.usuarios u
      where u.id = (select auth.uid())
        and u.rol = 'gerente_regional'
        and u.regional_id = contrato_regionales.regional_id
    )
  );

create policy contrato_regionales_delete
  on public.contrato_regionales
  for delete
  to authenticated
  using (
    (select private.is_rol('superadmin'))
    or (select private.is_rol('analista_contratacion'))
    or exists (
      select 1
      from public.usuarios u
      where u.id = (select auth.uid())
        and u.rol = 'gerente_regional'
        and u.regional_id = contrato_regionales.regional_id
    )
  );

grant select, insert, update, delete on public.contrato_regionales to authenticated;
grant all on public.contrato_regionales to service_role;

-- ============ RLS de contratos basada en la tabla puente ============
-- En INSERT se mantiene la comparación con regional_id porque la fila puente
-- todavía no existe en ese momento. En SELECT/UPDATE/DELETE se acepta tanto la
-- regional principal como cualquier regional vinculada.
drop policy if exists contratos_select_roles on public.contratos;
drop policy if exists contratos_insert_roles on public.contratos;
drop policy if exists contratos_update_roles on public.contratos;
drop policy if exists contratos_delete_roles on public.contratos;

create policy contratos_select_roles
  on public.contratos
  for select
  to authenticated
  using (
    (select private.is_rol('superadmin'))
    or (select private.is_rol('analista_contratacion'))
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

create policy contratos_insert_roles
  on public.contratos
  for insert
  to authenticated
  with check (
    (select private.is_rol('superadmin'))
    or (select private.is_rol('analista_contratacion'))
    or (
      (select private.is_rol('gerente_regional'))
      and exists (
        select 1
        from public.usuarios u
        where u.id = (select auth.uid())
          and u.regional_id = contratos.regional_id
      )
    )
  );

create policy contratos_update_roles
  on public.contratos
  for update
  to authenticated
  using (
    (select private.is_rol('superadmin'))
    or (select private.is_rol('analista_contratacion'))
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
  )
  with check (
    (select private.is_rol('superadmin'))
    or (select private.is_rol('analista_contratacion'))
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

create policy contratos_delete_roles
  on public.contratos
  for delete
  to authenticated
  using (
    (select private.is_rol('superadmin'))
    or (select private.is_rol('analista_contratacion'))
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

-- ============ RLS de tablas hijas basada en la tabla puente ============
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
            from public.contrato_regionales cr
            join public.usuarios u on u.id = (select auth.uid())
            where cr.contrato_id = %I.contrato_id
              and u.rol = 'gerente_regional'
              and u.regional_id = cr.regional_id
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
            from public.contrato_regionales cr
            join public.usuarios u on u.id = (select auth.uid())
            where cr.contrato_id = %I.contrato_id
              and u.rol = 'gerente_regional'
              and u.regional_id = cr.regional_id
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
            from public.contrato_regionales cr
            join public.usuarios u on u.id = (select auth.uid())
            where cr.contrato_id = %I.contrato_id
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
            where cr.contrato_id = %I.contrato_id
              and u.rol = 'gerente_regional'
              and u.regional_id = cr.regional_id
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

-- ============ actualización transaccional con regionales ============
-- Se reemplaza la firma anterior (sin p_regional_ids) para que la tabla puente
-- quede siempre sincronizada con las sedes.
drop function if exists public.actualizar_contrato_completo(
  uuid, jsonb, uuid[], uuid[], jsonb
);

create or replace function public.actualizar_contrato_completo(
  p_id uuid,
  p_datos jsonb,
  p_regional_ids uuid[],
  p_sede_ids uuid[],
  p_programa_ids uuid[],
  p_valores jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_regional_ids uuid[];
  v_principal uuid;
  v_es_nacional boolean;
  v_num_sedes integer;
begin
  select coalesce(array_agg(distinct x), array[]::uuid[])
  into v_regional_ids
  from unnest(coalesce(p_regional_ids, array[]::uuid[])) as x;

  if coalesce(array_length(v_regional_ids, 1), 0) = 0 then
    raise exception 'El contrato debe tener al menos una regional';
  end if;

  select count(distinct x)
  into v_num_sedes
  from unnest(coalesce(p_sede_ids, array[]::uuid[])) as x;

  if coalesce(v_num_sedes, 0) = 0 then
    raise exception 'El contrato debe tener al menos una sede';
  end if;

  select exists (
    select 1
    from public.regionales r
    where r.id = any(v_regional_ids)
      and lower(trim(r.nombre)) = 'nacional'
  )
  into v_es_nacional;

  if v_es_nacional and array_length(v_regional_ids, 1) > 1 then
    raise exception 'La regional Nacional no se puede combinar con otras regionales';
  end if;

  if not v_es_nacional then
    if exists (
      select 1
      from unnest(coalesce(p_sede_ids, array[]::uuid[])) as s(sede_id)
      left join public.sedes se on se.id = s.sede_id
      where se.id is null
         or not exists (
           select 1
           from public.regionales r
           where r.id = any(v_regional_ids)
             and lower(trim(r.nombre)) = lower(trim(coalesce(se.regional, '')))
         )
    ) then
      raise exception 'Todas las sedes deben pertenecer a una de las regionales del contrato';
    end if;
  end if;

  -- Regional principal heredada: primera no Nacional por nombre; si solo está
  -- Nacional, se conserva Nacional.
  select r.id
  into v_principal
  from public.regionales r
  where r.id = any(v_regional_ids)
  order by (lower(trim(r.nombre)) = 'nacional'), r.nombre
  limit 1;

  update public.contratos c
  set nombre = d.nombre,
      asegurador_id = d.asegurador_id,
      numero_contrato = d.numero_contrato,
      regional_id = v_principal,
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

  delete from public.contrato_regionales where contrato_id = p_id;
  delete from public.contratos_sedes where contrato_id = p_id;
  delete from public.contratos_programas where contrato_id = p_id;
  delete from public.contratos_valores where contrato_id = p_id;

  insert into public.contrato_regionales (contrato_id, regional_id)
  select p_id, regional_id
  from unnest(v_regional_ids) as regional_id;

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

comment on function public.actualizar_contrato_completo(
  uuid, jsonb, uuid[], uuid[], uuid[], jsonb
) is
  'Actualiza un contrato y reemplaza sus regionales, sedes, programas y valores en una transacción.';

revoke all on function public.actualizar_contrato_completo(
  uuid, jsonb, uuid[], uuid[], uuid[], jsonb
) from public, anon, authenticated;

grant execute on function public.actualizar_contrato_completo(
  uuid, jsonb, uuid[], uuid[], uuid[], jsonb
) to service_role;

-- ============ duplicar contrato: copiar regionales ============
create or replace function public.duplicar_contrato(
  p_id uuid,
  p_created_by uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_origen public.contratos%rowtype;
  v_nuevo_id uuid;
  v_base text;
  v_numero text;
  v_intento integer := 0;
begin
  select *
  into v_origen
  from public.contratos
  where id = p_id;

  if not found then
    raise exception 'El contrato % no existe', p_id using errcode = 'P0002';
  end if;

  v_base := left(v_origen.numero_contrato, 90) || '-COPIA';

  loop
    v_intento := v_intento + 1;
    v_numero := case
      when v_intento = 1 then v_base
      else v_base || '-' || v_intento::text
    end;

    begin
      insert into public.contratos (
        nombre,
        asegurador_id,
        numero_contrato,
        regional_id,
        ciudad,
        modalidad,
        responsable_id,
        categoria_contrato_id,
        tipo_contrato_id,
        estado_legalizacion_id,
        estado_ejecucion_id,
        fecha_inicio,
        fecha_fin,
        prorroga_automatica,
        periodicidad,
        poblacion_total,
        valor_total,
        valor_percapita_manual,
        tiene_programas,
        url_ubicacion,
        notas,
        estado,
        created_by
      )
      values (
        left('Copia de ' || v_origen.nombre, 200),
        v_origen.asegurador_id,
        v_numero,
        v_origen.regional_id,
        v_origen.ciudad,
        v_origen.modalidad,
        v_origen.responsable_id,
        v_origen.categoria_contrato_id,
        v_origen.tipo_contrato_id,
        v_origen.estado_legalizacion_id,
        v_origen.estado_ejecucion_id,
        v_origen.fecha_inicio,
        v_origen.fecha_fin,
        v_origen.prorroga_automatica,
        v_origen.periodicidad,
        v_origen.poblacion_total,
        v_origen.valor_total,
        v_origen.valor_percapita_manual,
        v_origen.tiene_programas,
        v_origen.url_ubicacion,
        v_origen.notas,
        'activo',
        p_created_by
      )
      returning id into v_nuevo_id;

      exit;
    exception
      when unique_violation then
        if v_intento >= 20 then
          raise exception
            'No se pudo generar un número de contrato único para la copia';
        end if;
    end;
  end loop;

  insert into public.contrato_regionales (contrato_id, regional_id)
  select v_nuevo_id, regional_id
  from public.contrato_regionales
  where contrato_id = p_id;

  -- Respaldo: si el origen no tuviera vínculos, conserva la regional principal.
  insert into public.contrato_regionales (contrato_id, regional_id)
  select v_nuevo_id, v_origen.regional_id
  where not exists (
    select 1
    from public.contrato_regionales
    where contrato_id = v_nuevo_id
  );

  insert into public.contratos_sedes (contrato_id, sede_id)
  select v_nuevo_id, sede_id
  from public.contratos_sedes
  where contrato_id = p_id;

  insert into public.contratos_programas (contrato_id, opcion_id)
  select v_nuevo_id, opcion_id
  from public.contratos_programas
  where contrato_id = p_id;

  insert into public.contratos_valores (
    contrato_id,
    regimen_id,
    poblacion,
    valor_total,
    valor_percapita_manual
  )
  select
    v_nuevo_id,
    regimen_id,
    poblacion,
    valor_total,
    valor_percapita_manual
  from public.contratos_valores
  where contrato_id = p_id;

  return v_nuevo_id;
end;
$$;

comment on function public.duplicar_contrato(uuid, uuid) is
  'Duplica un contrato con sus regionales, sedes, programas y valores. Devuelve el id de la copia.';

commit;

notify pgrst, 'reload schema';
