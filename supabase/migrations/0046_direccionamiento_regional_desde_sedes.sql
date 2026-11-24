-- 0046_direccionamiento_regional_desde_sedes.sql
-- El especialista ya no guarda una única regional: puede estar relacionado con
-- varias sedes, cada una con su propia regional. La regional efectiva se
-- resuelve desde public.sedes a través de sedes_servicios_especialistas.
-- Además, agrupador y especialidad de un servicio CUPS se toman del catálogo
-- (cups -> grupos_servicio / servicios), no de campos libres.

begin;

-- ============ ayudas de regional derivada ============
create or replace function private.regionales_especialista(p_especialista_id uuid)
returns setof text
language sql
stable
security definer
set search_path = ''
as $$
  select distinct lower(trim(s.regional))
  from public.sedes_servicios_especialistas sse
  join public.sedes s on s.id = sse.sede_id
  where sse.especialista_id = p_especialista_id
    and s.regional is not null
    and trim(s.regional) <> '';
$$;

create or replace function private.puede_ver_especialista(p_especialista_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
       (select private.puede_ver_direccionamiento(''))
    or exists (
      select 1
      from private.regionales_especialista(p_especialista_id) r
      where (select private.puede_ver_direccionamiento(r))
    );
$$;

create or replace function private.puede_editar_especialista(p_especialista_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
       (select private.puede_editar_direccionamiento(''))
    or (
      (select private.is_rol('gerente_regional'))
      and exists (
        select 1 from public.especialistas e
        where e.id = p_especialista_id
          and e.created_by = (select auth.uid())
      )
    )
    or exists (
      select 1
      from private.regionales_especialista(p_especialista_id) r
      where (select private.puede_editar_direccionamiento(r))
    );
$$;

create or replace function private.puede_editar_sede_direccionamiento(p_sede_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
       (select private.puede_editar_direccionamiento(''))
    or exists (
      select 1 from public.sedes s
      where s.id = p_sede_id
        and (select private.puede_editar_direccionamiento(s.regional))
    );
$$;

revoke all on function private.regionales_especialista(uuid) from public, anon;
revoke all on function private.puede_ver_especialista(uuid) from public, anon;
revoke all on function private.puede_editar_especialista(uuid) from public, anon;
revoke all on function private.puede_editar_sede_direccionamiento(uuid) from public, anon;
grant execute on function private.regionales_especialista(uuid) to authenticated;
grant execute on function private.puede_ver_especialista(uuid) to authenticated;
grant execute on function private.puede_editar_especialista(uuid) to authenticated;
grant execute on function private.puede_editar_sede_direccionamiento(uuid) to authenticated;

-- ============ quitar la columna única de regional ============
drop policy if exists especialistas_select on public.especialistas;
drop policy if exists especialistas_insert on public.especialistas;
drop policy if exists especialistas_update on public.especialistas;
drop policy if exists especialistas_delete on public.especialistas;
drop policy if exists contratos_especialistas_select_select on public.contratos_especialistas;
drop policy if exists contratos_especialistas_insert_insert on public.contratos_especialistas;
drop policy if exists contratos_especialistas_update_update on public.contratos_especialistas;
drop policy if exists contratos_especialistas_delete_delete on public.contratos_especialistas;
drop policy if exists servicios_contratados_especialistas_select_select on public.servicios_contratados_especialistas;
drop policy if exists servicios_contratados_especialistas_insert_insert on public.servicios_contratados_especialistas;
drop policy if exists servicios_contratados_especialistas_update_update on public.servicios_contratados_especialistas;
drop policy if exists servicios_contratados_especialistas_delete_delete on public.servicios_contratados_especialistas;
drop policy if exists sedes_servicios_especialistas_select_select on public.sedes_servicios_especialistas;
drop policy if exists sedes_servicios_especialistas_insert_insert on public.sedes_servicios_especialistas;
drop policy if exists sedes_servicios_especialistas_update_update on public.sedes_servicios_especialistas;
drop policy if exists sedes_servicios_especialistas_delete_delete on public.sedes_servicios_especialistas;
drop policy if exists novedades_direccionamiento_select_select on public.novedades_direccionamiento;
drop policy if exists novedades_direccionamiento_insert_insert on public.novedades_direccionamiento;
drop policy if exists novedades_direccionamiento_update_update on public.novedades_direccionamiento;
drop policy if exists novedades_direccionamiento_delete_delete on public.novedades_direccionamiento;
drop policy if exists contratos_especialistas_select on public.contratos_especialistas;
drop policy if exists contratos_especialistas_insert on public.contratos_especialistas;
drop policy if exists contratos_especialistas_update on public.contratos_especialistas;
drop policy if exists contratos_especialistas_delete on public.contratos_especialistas;
drop policy if exists servicios_contratados_especialistas_select on public.servicios_contratados_especialistas;
drop policy if exists servicios_contratados_especialistas_insert on public.servicios_contratados_especialistas;
drop policy if exists servicios_contratados_especialistas_update on public.servicios_contratados_especialistas;
drop policy if exists servicios_contratados_especialistas_delete on public.servicios_contratados_especialistas;
drop policy if exists sedes_servicios_especialistas_select on public.sedes_servicios_especialistas;
drop policy if exists sedes_servicios_especialistas_insert on public.sedes_servicios_especialistas;
drop policy if exists sedes_servicios_especialistas_update on public.sedes_servicios_especialistas;
drop policy if exists sedes_servicios_especialistas_delete on public.sedes_servicios_especialistas;
drop policy if exists novedades_direccionamiento_select on public.novedades_direccionamiento;
drop policy if exists novedades_direccionamiento_insert on public.novedades_direccionamiento;
drop policy if exists novedades_direccionamiento_update on public.novedades_direccionamiento;
drop policy if exists novedades_direccionamiento_delete on public.novedades_direccionamiento;
drop policy if exists historial_direccionamiento_select on public.historial_cambios_direccionamiento;

alter table public.especialistas drop column if exists regional;
drop index if exists public.especialistas_regional_idx;

comment on table public.especialistas is 'Registro maestro de especialistas. Un especialista existe una sola vez por tipo y número de identificación; sus regionales se derivan de las sedes asignadas.';

-- El historial ya no debe intentar registrar un campo eliminado.
drop trigger if exists especialistas_historial on public.especialistas;
create trigger especialistas_historial
  after update on public.especialistas
  for each row execute function private.registrar_historial_direccionamiento(
    'tipo_identificacion', 'numero_identificacion', 'nombre_completo',
    'tipo_persona', 'especialidad', 'ciudad', 'estado'
  );

-- ============ RLS ============
create policy especialistas_select on public.especialistas
  for select to authenticated
  using ((select private.puede_ver_especialista(id)));

create policy especialistas_insert on public.especialistas
  for insert to authenticated
  with check (
       (select private.puede_editar_direccionamiento(''))
    or (select private.is_rol('gerente_regional'))
  );

create policy especialistas_update on public.especialistas
  for update to authenticated
  using ((select private.puede_editar_especialista(id)))
  with check ((select private.puede_editar_especialista(id)));

create policy especialistas_delete on public.especialistas
  for delete to authenticated
  using ((select private.is_rol('superadmin')));

do $$
declare
  t text;
  pred text;
  predEscritura text;
begin
  foreach t in array array[
    'contratos_especialistas',
    'servicios_contratados_especialistas',
    'sedes_servicios_especialistas',
    'novedades_direccionamiento'
  ]
  loop
    if t = 'servicios_contratados_especialistas' then
      pred := format(
        'public.%I.contrato_especialista_id in (select c.id from public.contratos_especialistas c where c.especialista_id = e.id)',
        t
      );
    else
      pred := format('public.%I.especialista_id = e.id', t);
    end if;

    if t = 'sedes_servicios_especialistas' then
      predEscritura := format(
        '(select private.puede_editar_especialista(e.id)) and (select private.puede_editar_sede_direccionamiento(public.%I.sede_id))',
        t
      );
    else
      predEscritura := '(select private.puede_editar_especialista(e.id))';
    end if;

    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format($f$
      create policy %I on public.%I
      for select to authenticated
      using (
        exists (
          select 1 from public.especialistas e
          where %s
            and (select private.puede_ver_especialista(e.id))
        )
      )
    $f$, t || '_select', t, pred);

    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format($f$
      create policy %I on public.%I
      for insert to authenticated
      with check (
        exists (
          select 1 from public.especialistas e
          where %s
            and %s
        )
      )
    $f$, t || '_insert', t, pred, predEscritura);

    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format($f$
      create policy %I on public.%I
      for update to authenticated
      using (
        exists (
          select 1 from public.especialistas e
          where %s
            and %s
        )
      )
      with check (
        exists (
          select 1 from public.especialistas e
          where %s
            and %s
        )
      )
    $f$, t || '_update', t, pred, predEscritura, pred, predEscritura);

    execute format('drop policy if exists %I on public.%I', t || '_delete', t);
    execute format($f$
      create policy %I on public.%I
      for delete to authenticated
      using (
        exists (
          select 1 from public.especialistas e
          where %s
            and %s
        )
      )
    $f$, t || '_delete', t, pred, predEscritura);
  end loop;
end $$;

create policy historial_direccionamiento_select on public.historial_cambios_direccionamiento
  for select to authenticated
  using (
    (select private.puede_ver_direccionamiento(''))
    or exists (
      select 1 from public.especialistas e
      where (select private.puede_ver_especialista(e.id))
    )
  );

notify pgrst, 'reload schema';

commit;
