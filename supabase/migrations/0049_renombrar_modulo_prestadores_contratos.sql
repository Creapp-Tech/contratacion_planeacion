-- 0049_renombrar_modulo_prestadores_contratos.sql
-- Renombra el módulo Direccionamiento a Prestadores y contratos.
-- Las migraciones 0045-0048 se conservan como registro histórico.

begin;

-- ============ tablas ============
do $$
begin
  if to_regclass('public.novedades_direccionamiento') is not null
     and to_regclass('public.novedades_prestadores_contratos') is null then
    alter table public.novedades_direccionamiento
      rename to novedades_prestadores_contratos;
  end if;

  if to_regclass('public.historial_cambios_direccionamiento') is not null
     and to_regclass('public.historial_cambios_prestadores_contratos') is null then
    alter table public.historial_cambios_direccionamiento
      rename to historial_cambios_prestadores_contratos;
  end if;
end $$;

-- ============ constraints ============
do $$
declare
  item record;
begin
  for item in
    select old_name, new_name, table_name
    from (values
      ('novedades_direccionamiento_pkey', 'novedades_prestadores_contratos_pkey', 'novedades_prestadores_contratos'),
      ('novedades_direccionamiento_fechas_check', 'novedades_prestadores_contratos_fechas_check', 'novedades_prestadores_contratos'),
      ('novedades_direccionamiento_estado_validacion_check', 'novedades_prestadores_contratos_estado_validacion_check', 'novedades_prestadores_contratos'),
      ('novedades_direccionamiento_especialista_id_fkey', 'novedades_prestadores_contratos_especialista_id_fkey', 'novedades_prestadores_contratos'),
      ('novedades_direccionamiento_contrato_especialista_id_fkey', 'novedades_prestadores_contratos_contrato_especialista_id_fkey', 'novedades_prestadores_contratos'),
      ('novedades_direccionamiento_servicio_contratado_id_fkey', 'novedades_prestadores_contratos_servicio_contratado_id_fkey', 'novedades_prestadores_contratos'),
      ('novedades_direccionamiento_asignacion_sede_id_fkey', 'novedades_prestadores_contratos_asignacion_sede_id_fkey', 'novedades_prestadores_contratos'),
      ('novedades_direccionamiento_created_by_fkey', 'novedades_prestadores_contratos_created_by_fkey', 'novedades_prestadores_contratos'),
      ('novedades_direccionamiento_updated_by_fkey', 'novedades_prestadores_contratos_updated_by_fkey', 'novedades_prestadores_contratos'),
      ('historial_cambios_direccionamiento_pkey', 'historial_cambios_prestadores_contratos_pkey', 'historial_cambios_prestadores_contratos'),
      ('historial_cambios_direccionamiento_usuario_id_fkey', 'historial_cambios_prestadores_contratos_usuario_id_fkey', 'historial_cambios_prestadores_contratos')
    ) as v(old_name, new_name, table_name)
  loop
    if exists (
      select 1 from pg_constraint
      where conrelid = to_regclass('public.' || item.table_name)
        and conname = item.old_name
    ) and not exists (
      select 1 from pg_constraint
      where conrelid = to_regclass('public.' || item.table_name)
        and conname = item.new_name
    ) then
      execute format(
        'alter table public.%I rename constraint %I to %I',
        item.table_name, item.old_name, item.new_name
      );
    end if;
  end loop;
end $$;

-- ============ índices ============
do $$
declare
  item record;
begin
  for item in
    select old_name, new_name
    from (values
      ('novedades_direccionamiento_pkey', 'novedades_prestadores_contratos_pkey'),
      ('novedades_direccionamiento_especialista_idx', 'novedades_prestadores_contratos_especialista_idx'),
      ('novedades_direccionamiento_contrato_idx', 'novedades_prestadores_contratos_contrato_idx'),
      ('novedades_direccionamiento_servicio_idx', 'novedades_prestadores_contratos_servicio_idx'),
      ('novedades_direccionamiento_asignacion_idx', 'novedades_prestadores_contratos_asignacion_idx'),
      ('novedades_direccionamiento_vigencia_idx', 'novedades_prestadores_contratos_vigencia_idx'),
      ('historial_cambios_direccionamiento_pkey', 'historial_cambios_prestadores_contratos_pkey'),
      ('historial_direccionamiento_registro_idx', 'historial_prestadores_contratos_registro_idx'),
      ('historial_direccionamiento_usuario_idx', 'historial_prestadores_contratos_usuario_idx'),
      ('historial_direccionamiento_fecha_idx', 'historial_prestadores_contratos_fecha_idx')
    ) as v(old_name, new_name)
  loop
    if to_regclass('public.' || item.old_name) is not null
       and to_regclass('public.' || item.new_name) is null then
      execute format('alter index public.%I rename to %I', item.old_name, item.new_name);
    end if;
  end loop;
end $$;

-- ============ triggers ============
do $$
declare
  item record;
begin
  for item in
    select old_name, new_name, table_name
    from (values
      ('novedades_direccionamiento_set_updated_at', 'novedades_prestadores_contratos_set_updated_at', 'novedades_prestadores_contratos'),
      ('novedades_direccionamiento_historial', 'novedades_prestadores_contratos_historial', 'novedades_prestadores_contratos')
    ) as v(old_name, new_name, table_name)
  loop
    if exists (
      select 1 from pg_trigger
      where tgrelid = to_regclass('public.' || item.table_name)
        and tgname = item.old_name
        and not tgisinternal
    ) and not exists (
      select 1 from pg_trigger
      where tgrelid = to_regclass('public.' || item.table_name)
        and tgname = item.new_name
        and not tgisinternal
    ) then
      execute format(
        'alter trigger %I on public.%I rename to %I',
        item.old_name, item.table_name, item.new_name
      );
    end if;
  end loop;
end $$;

-- ============ políticas RLS ============
do $$
declare
  item record;
begin
  for item in
    select old_name, new_name, table_name
    from (values
      ('novedades_direccionamiento_select', 'novedades_prestadores_contratos_select', 'novedades_prestadores_contratos'),
      ('novedades_direccionamiento_insert', 'novedades_prestadores_contratos_insert', 'novedades_prestadores_contratos'),
      ('novedades_direccionamiento_update', 'novedades_prestadores_contratos_update', 'novedades_prestadores_contratos'),
      ('novedades_direccionamiento_delete', 'novedades_prestadores_contratos_delete', 'novedades_prestadores_contratos'),
      ('historial_direccionamiento_select', 'historial_prestadores_contratos_select', 'historial_cambios_prestadores_contratos')
    ) as v(old_name, new_name, table_name)
  loop
    if exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = item.table_name
        and policyname = item.old_name
    ) and not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = item.table_name
        and policyname = item.new_name
    ) then
      execute format(
        'alter policy %I on public.%I rename to %I',
        item.old_name, item.table_name, item.new_name
      );
    end if;
  end loop;
end $$;

-- ============ funciones ============
do $$
declare
  item record;
begin
  for item in
    select old_signature, new_signature, new_name
    from (values
      ('private.puede_ver_direccionamiento(text)', 'private.puede_ver_prestadores_contratos(text)', 'puede_ver_prestadores_contratos'),
      ('private.puede_editar_direccionamiento(text)', 'private.puede_editar_prestadores_contratos(text)', 'puede_editar_prestadores_contratos'),
      ('private.puede_editar_sede_direccionamiento(uuid)', 'private.puede_editar_sede_prestadores_contratos(uuid)', 'puede_editar_sede_prestadores_contratos'),
      ('private.validar_asignacion_sede_direccionamiento()', 'private.validar_asignacion_sede_prestadores_contratos()', 'validar_asignacion_sede_prestadores_contratos'),
      ('private.registrar_historial_direccionamiento()', 'private.registrar_historial_prestadores_contratos()', 'registrar_historial_prestadores_contratos')
    ) as v(old_signature, new_signature, new_name)
  loop
    if to_regprocedure(item.old_signature) is not null
       and to_regprocedure(item.new_signature) is null then
      execute format('alter function %s rename to %I', item.old_signature, item.new_name);
    end if;
  end loop;
end $$;

-- Los cuerpos que llamaban a las funciones renombradas se reconstruyen porque
-- Postgres no reescribe el texto interno de las funciones al renombrarlas.
create or replace function private.puede_ver_especialista(p_especialista_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
       (select private.puede_ver_prestadores_contratos(''))
    or exists (
      select 1
      from private.regionales_especialista(p_especialista_id) r
      where (select private.puede_ver_prestadores_contratos(r))
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
       (select private.puede_editar_prestadores_contratos(''))
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
      where (select private.puede_editar_prestadores_contratos(r))
    );
$$;

create or replace function private.puede_editar_sede_prestadores_contratos(p_sede_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
       (select private.puede_editar_prestadores_contratos(''))
    or exists (
      select 1 from public.sedes s
      where s.id = p_sede_id
        and (select private.puede_editar_prestadores_contratos(s.regional))
    );
$$;

create or replace function private.registrar_historial_prestadores_contratos()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  campo text;
  anterior text;
  nuevo text;
  usuario uuid;
begin
  usuario := coalesce(new.updated_by, (select auth.uid()));

  foreach campo in array tg_argv loop
    anterior := to_jsonb(old) ->> campo;
    nuevo := to_jsonb(new) ->> campo;
    if anterior is distinct from nuevo then
      insert into public.historial_cambios_prestadores_contratos
        (tabla, registro_id, campo, valor_anterior, valor_nuevo, usuario_id)
      values
        (tg_table_name, old.id, campo, anterior, nuevo, usuario);
    end if;
  end loop;

  return new;
end;
$$;

create or replace function private.puede_ver_aseguradores_contratos(p_contrato_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.puede_ver_prestadores_contratos(''))
    or exists (
      select 1
      from private.regionales_contrato_aseguradores(p_contrato_id) regional
      where (select private.puede_ver_prestadores_contratos(regional))
    );
$$;

create or replace function private.puede_editar_aseguradores_contratos(p_contrato_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.puede_editar_prestadores_contratos(''))
    or exists (
      select 1
      from private.regionales_contrato_aseguradores(p_contrato_id) regional
      where (select private.puede_editar_prestadores_contratos(regional))
    );
$$;

revoke all on function private.puede_ver_prestadores_contratos(text) from public, anon;
revoke all on function private.puede_editar_prestadores_contratos(text) from public, anon;
revoke all on function private.puede_editar_sede_prestadores_contratos(uuid) from public, anon;
revoke all on function private.validar_asignacion_sede_prestadores_contratos() from public, anon;
revoke all on function private.registrar_historial_prestadores_contratos() from public, anon;
grant execute on function private.puede_ver_prestadores_contratos(text) to authenticated;
grant execute on function private.puede_editar_prestadores_contratos(text) to authenticated;
grant execute on function private.puede_editar_sede_prestadores_contratos(uuid) to authenticated;
grant execute on function private.validar_asignacion_sede_prestadores_contratos() to authenticated;
grant execute on function private.registrar_historial_prestadores_contratos() to authenticated;

-- ============ trazabilidad existente ============
update public.historial_cambios_prestadores_contratos
set tabla = 'novedades_prestadores_contratos'
where tabla = 'novedades_direccionamiento';

-- ============ alias de políticas ============
-- Recrear las políticas cuyas expresiones conservaban alias con el nombre
-- antiguo tras el renombre de las funciones.
drop policy if exists especialistas_insert on public.especialistas;
create policy especialistas_insert on public.especialistas
  for insert to authenticated
  with check (
       (select private.puede_editar_prestadores_contratos(''))
    or (select private.is_rol('gerente_regional'))
  );

drop policy if exists historial_prestadores_contratos_select
  on public.historial_cambios_prestadores_contratos;
create policy historial_prestadores_contratos_select
  on public.historial_cambios_prestadores_contratos
  for select to authenticated
  using (
    (select private.puede_ver_prestadores_contratos(''))
    or exists (
      select 1 from public.especialistas e
      where (select private.puede_ver_especialista(e.id))
    )
  );

drop policy if exists sedes_servicios_especialistas_insert
  on public.sedes_servicios_especialistas;
create policy sedes_servicios_especialistas_insert
  on public.sedes_servicios_especialistas
  for insert to authenticated
  with check (
    exists (
      select 1 from public.especialistas e
      where public.sedes_servicios_especialistas.especialista_id = e.id
        and (select private.puede_editar_especialista(e.id))
        and (select private.puede_editar_sede_prestadores_contratos(
          public.sedes_servicios_especialistas.sede_id
        ))
    )
  );

drop policy if exists sedes_servicios_especialistas_update
  on public.sedes_servicios_especialistas;
create policy sedes_servicios_especialistas_update
  on public.sedes_servicios_especialistas
  for update to authenticated
  using (
    exists (
      select 1 from public.especialistas e
      where public.sedes_servicios_especialistas.especialista_id = e.id
        and (select private.puede_editar_especialista(e.id))
        and (select private.puede_editar_sede_prestadores_contratos(
          public.sedes_servicios_especialistas.sede_id
        ))
    )
  )
  with check (
    exists (
      select 1 from public.especialistas e
      where public.sedes_servicios_especialistas.especialista_id = e.id
        and (select private.puede_editar_especialista(e.id))
        and (select private.puede_editar_sede_prestadores_contratos(
          public.sedes_servicios_especialistas.sede_id
        ))
    )
  );

drop policy if exists sedes_servicios_especialistas_delete
  on public.sedes_servicios_especialistas;
create policy sedes_servicios_especialistas_delete
  on public.sedes_servicios_especialistas
  for delete to authenticated
  using (
    exists (
      select 1 from public.especialistas e
      where public.sedes_servicios_especialistas.especialista_id = e.id
        and (select private.puede_editar_especialista(e.id))
        and (select private.puede_editar_sede_prestadores_contratos(
          public.sedes_servicios_especialistas.sede_id
        ))
    )
  );

notify pgrst, 'reload schema';

commit;
