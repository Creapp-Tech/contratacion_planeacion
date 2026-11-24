-- 0045_modulo_direccionamiento.sql
-- Módulo Direccionamiento: contratos de especialistas con aseguradores,
-- servicios CUPS contratados, asignación independiente por sede, novedades e
-- historial de cambios. Reutiliza los catálogos existentes: aseguradores_eps,
-- sedes, cups, regimenes, catalogos_opciones, usuarios.

begin;

-- ============ dominios adicionales del catálogo ============
alter table public.catalogos_opciones
  drop constraint if exists catalogos_opciones_dominio_check;

alter table public.catalogos_opciones
  add constraint catalogos_opciones_dominio_check
  check (
    dominio = any (array[
      'regional', 'zonal', 'marca', 'nivel', 'tipo_ips',
      'tipo_personal', 'categoria', 'programa',
      'categoria_contrato', 'tipo_contrato', 'estado_legalizacion',
      'estado_ejecucion', 'responsable', 'cups', 'pais',
      'especialidad', 'tipo_identificacion', 'modalidad_prestacion',
      'modalidad_contratacion', 'tipo_red', 'tipo_novedad',
      'agrupador', 'tipo_imagen', 'manual_tarifario'
    ])
  );

insert into public.catalogos_opciones (dominio, nombre) values
  ('especialidad', 'Medicina General'),
  ('especialidad', 'Psiquiatría'),
  ('especialidad', 'Psicología'),
  ('especialidad', 'Cardiología'),
  ('especialidad', 'Dermatología'),
  ('especialidad', 'Ginecología'),
  ('especialidad', 'Oftalmología'),
  ('especialidad', 'Otorrinolaringología'),
  ('especialidad', 'Pediatría'),
  ('especialidad', 'Ortopedia'),
  ('especialidad', 'Radiología'),
  ('especialidad', 'Anestesiología'),
  ('especialidad', 'Cirugía General'),
  ('especialidad', 'Medicina Interna'),
  ('especialidad', 'Odontología'),
  ('especialidad', 'Fisioterapia'),
  ('especialidad', 'Laboratorio Clínico'),
  ('especialidad', 'Enfermería'),
  ('tipo_identificacion', 'Cédula de ciudadanía'),
  ('tipo_identificacion', 'Cédula de extranjería'),
  ('tipo_identificacion', 'Tarjeta de identidad'),
  ('tipo_identificacion', 'Pasaporte'),
  ('tipo_identificacion', 'NIT'),
  ('tipo_identificacion', 'Registro civil'),
  ('modalidad_prestacion', 'Presencial'),
  ('modalidad_prestacion', 'Telemedicina'),
  ('modalidad_prestacion', 'Mixta'),
  ('modalidad_contratacion', 'Capita'),
  ('modalidad_contratacion', 'Especial'),
  ('modalidad_contratacion', 'Evento'),
  ('modalidad_contratacion', 'Integral'),
  ('modalidad_contratacion', 'PGP'),
  ('tipo_red', 'Interna'),
  ('tipo_red', 'Externa'),
  ('tipo_novedad', 'Alta de contrato'),
  ('tipo_novedad', 'Baja de contrato'),
  ('tipo_novedad', 'Cambio de tarifa'),
  ('tipo_novedad', 'Cambio de sede'),
  ('tipo_novedad', 'Renovación'),
  ('tipo_novedad', 'Suspensión temporal'),
  ('agrupador', 'Consulta'),
  ('agrupador', 'Procedimiento'),
  ('agrupador', 'Imagenología'),
  ('agrupador', 'Laboratorio'),
  ('agrupador', 'Terapias'),
  ('tipo_imagen', 'Rayos X'),
  ('tipo_imagen', 'Ecografía'),
  ('tipo_imagen', 'Resonancia magnética'),
  ('tipo_imagen', 'Tomografía'),
  ('tipo_imagen', 'Mamografía'),
  ('manual_tarifario', 'SOAT'),
  ('manual_tarifario', 'ISS'),
  ('manual_tarifario', 'Particular'),
  ('manual_tarifario', 'Contrato')
on conflict (dominio, nombre) do nothing;

-- ============ ayudas de acceso ============
create or replace function private.puede_ver_direccionamiento(region text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
       (select private.is_rol('superadmin'))
    or (select private.is_rol('analista_contratacion'))
    or (select private.is_rol('ceo'))
    or (select private.is_rol('cfo'))
    or (select private.is_rol('gerente_general'))
    or (select private.is_rol('gerente_nacional'))
    or (
      (select private.is_rol('gerente_regional'))
      and exists (
        select 1
        from public.usuarios u
        join public.regionales r on r.id = u.regional_id
        where u.id = (select auth.uid())
          and lower(trim(coalesce(r.nombre, ''))) = lower(trim(coalesce(region, '')))
      )
    );
$$;

create or replace function private.puede_editar_direccionamiento(region text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
       (select private.is_rol('superadmin'))
    or (select private.is_rol('analista_contratacion'))
    or (
      (select private.is_rol('gerente_regional'))
      and exists (
        select 1
        from public.usuarios u
        join public.regionales r on r.id = u.regional_id
        where u.id = (select auth.uid())
          and lower(trim(coalesce(r.nombre, ''))) = lower(trim(coalesce(region, '')))
      )
    );
$$;

revoke all on function private.puede_ver_direccionamiento(text) from public, anon;
revoke all on function private.puede_editar_direccionamiento(text) from public, anon;
grant execute on function private.puede_ver_direccionamiento(text) to authenticated;
grant execute on function private.puede_editar_direccionamiento(text) to authenticated;

-- ============ especialistas ============
create table if not exists public.especialistas (
  id uuid primary key default gen_random_uuid(),
  tipo_identificacion text not null,
  numero_identificacion text not null,
  nombre_completo text not null,
  tipo_persona text not null check (tipo_persona in ('natural', 'juridica')),
  especialidad text not null,
  regional text not null,
  ciudad text not null,
  estado text not null default 'activo'
    check (estado in ('activo', 'inactivo')),
  created_by uuid references public.usuarios(id) on delete set null,
  updated_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.especialistas is 'Registro maestro de especialistas. Un especialista existe una sola vez por tipo y número de identificación.';
comment on column public.especialistas.tipo_persona is 'Natural o jurídica.';
comment on column public.especialistas.regional is 'Regional del catálogo catalogos_opciones (dominio regional).';
comment on column public.especialistas.ciudad is 'Ciudad de ubicación del especialista.';

-- Un especialista se registra una sola vez por tipo y número de identificación.
create unique index if not exists especialistas_identificacion_uq
  on public.especialistas (tipo_identificacion, lower(trim(numero_identificacion)));

create index if not exists especialistas_nombre_idx on public.especialistas (lower(nombre_completo));
create index if not exists especialistas_identificacion_idx on public.especialistas (lower(trim(numero_identificacion)));
create index if not exists especialistas_regional_idx on public.especialistas (regional);
create index if not exists especialistas_ciudad_idx on public.especialistas (ciudad);
create index if not exists especialistas_especialidad_idx on public.especialistas (lower(especialidad));
create index if not exists especialistas_estado_idx on public.especialistas (estado);

drop trigger if exists especialistas_set_updated_at on public.especialistas;
create trigger especialistas_set_updated_at
  before update on public.especialistas
  for each row execute function private.set_updated_at();

-- ============ contratos con aseguradores ============
create table if not exists public.contratos_especialistas (
  id uuid primary key default gen_random_uuid(),
  especialista_id uuid not null
    references public.especialistas(id) on delete restrict,
  asegurador_eps_id uuid not null
    references public.aseguradores_eps(id) on delete restrict,
  regimen_id uuid
    references public.regimenes(id) on delete restrict,
  numero_contrato text,
  modalidad_prestacion text,
  fecha_inicio date,
  fecha_terminacion date,
  estado text not null default 'activo'
    check (estado in ('activo', 'inactivo', 'vencido', 'pendiente_validacion')),
  observaciones text,
  created_by uuid references public.usuarios(id) on delete set null,
  updated_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contratos_especialistas_fechas_check
    check (fecha_terminacion is null or fecha_inicio is null or fecha_terminacion >= fecha_inicio)
);

comment on table public.contratos_especialistas is 'Relación contractual entre un especialista y un asegurador. Un especialista puede tener varios contratos y varios aseguradores.';

create unique index if not exists contratos_especialistas_numero_uq
  on public.contratos_especialistas (especialista_id, asegurador_eps_id, lower(trim(numero_contrato)))
  where numero_contrato is not null and trim(numero_contrato) <> '';
create index if not exists contratos_especialistas_especialista_idx
  on public.contratos_especialistas (especialista_id);
create index if not exists contratos_especialistas_asegurador_idx
  on public.contratos_especialistas (asegurador_eps_id);
create index if not exists contratos_especialistas_regimen_idx
  on public.contratos_especialistas (regimen_id);
create index if not exists contratos_especialistas_estado_idx
  on public.contratos_especialistas (estado);
create index if not exists contratos_especialistas_vigencia_idx
  on public.contratos_especialistas (fecha_inicio, fecha_terminacion);

drop trigger if exists contratos_especialistas_set_updated_at on public.contratos_especialistas;
create trigger contratos_especialistas_set_updated_at
  before update on public.contratos_especialistas
  for each row execute function private.set_updated_at();

-- ============ servicios contratados (CUPS) ============
create table if not exists public.servicios_contratados_especialistas (
  id uuid primary key default gen_random_uuid(),
  contrato_especialista_id uuid not null
    references public.contratos_especialistas(id) on delete restrict,
  cups_id uuid not null
    references public.cups(id) on delete restrict,
  agrupador text,
  especialidad text,
  tipo_imagen text,
  manual_tarifario text,
  porcentaje_descuento_incremento numeric(7,2) not null default 0,
  modalidad_contratacion text,
  valor_tarifa numeric(14,2),
  atenciones_por_hora integer check (atenciones_por_hora is null or atenciones_por_hora >= 0),
  modalidad_prestacion text,
  fecha_inicio date,
  fecha_terminacion date,
  estado text not null default 'activo'
    check (estado in ('activo', 'inactivo', 'vencido', 'pendiente_validacion')),
  created_by uuid references public.usuarios(id) on delete set null,
  updated_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint servicios_contratados_especialistas_uq
    unique (contrato_especialista_id, cups_id),
  constraint servicios_contratados_especialistas_fechas_check
    check (fecha_terminacion is null or fecha_inicio is null or fecha_terminacion >= fecha_inicio)
);

comment on table public.servicios_contratados_especialistas is 'Servicios CUPS contratados para un contrato de especialista, con condiciones económicas y operativas propias.';
comment on column public.servicios_contratados_especialistas.porcentaje_descuento_incremento is 'Negativo = descuento, positivo = incremento.';

create index if not exists servicios_contratados_contrato_idx
  on public.servicios_contratados_especialistas (contrato_especialista_id);
create index if not exists servicios_contratados_cups_idx
  on public.servicios_contratados_especialistas (cups_id);
create index if not exists servicios_contratados_estado_idx
  on public.servicios_contratados_especialistas (estado);
create index if not exists servicios_contratados_vigencia_idx
  on public.servicios_contratados_especialistas (fecha_inicio, fecha_terminacion);

drop trigger if exists servicios_contratados_especialistas_set_updated_at on public.servicios_contratados_especialistas;
create trigger servicios_contratados_especialistas_set_updated_at
  before update on public.servicios_contratados_especialistas
  for each row execute function private.set_updated_at();

-- ============ asignación individual de sedes por servicio ============
-- Esta tabla es el corazón del módulo: cada combinación contrato + servicio
-- CUPS + sede se administra de forma independiente. Nunca se propaga
-- automáticamente un servicio a todas las sedes.
create table if not exists public.sedes_servicios_especialistas (
  id uuid primary key default gen_random_uuid(),
  especialista_id uuid not null
    references public.especialistas(id) on delete restrict,
  contrato_especialista_id uuid not null
    references public.contratos_especialistas(id) on delete restrict,
  servicio_contratado_id uuid not null
    references public.servicios_contratados_especialistas(id) on delete restrict,
  sede_id uuid not null
    references public.sedes(id) on delete restrict,
  tipo_red text not null default 'interna'
    check (tipo_red in ('interna', 'externa')),
  estado text not null default 'activo'
    check (estado in ('activo', 'inactivo', 'pendiente_validacion')),
  validacion text not null default 'pendiente'
    check (validacion in ('pendiente', 'validado', 'rechazado')),
  observaciones text,
  created_by uuid references public.usuarios(id) on delete set null,
  updated_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sedes_servicios_especialistas_uq
    unique (contrato_especialista_id, servicio_contratado_id, sede_id)
);

comment on table public.sedes_servicios_especialistas is 'Asignación independiente de una sede a un servicio CUPS contratado por un especialista.';
comment on column public.sedes_servicios_especialistas.sede_id is 'Sede del catálogo public.sedes (no se crea un catálogo paralelo).';

create index if not exists sedes_servicios_especialista_idx
  on public.sedes_servicios_especialistas (especialista_id);
create index if not exists sedes_servicios_contrato_idx
  on public.sedes_servicios_especialistas (contrato_especialista_id);
create index if not exists sedes_servicios_servicio_idx
  on public.sedes_servicios_especialistas (servicio_contratado_id);
create index if not exists sedes_servicios_sede_idx
  on public.sedes_servicios_especialistas (sede_id);
create index if not exists sedes_servicios_estado_idx
  on public.sedes_servicios_especialistas (estado);

drop trigger if exists sedes_servicios_especialistas_set_updated_at on public.sedes_servicios_especialistas;
create trigger sedes_servicios_especialistas_set_updated_at
  before update on public.sedes_servicios_especialistas
  for each row execute function private.set_updated_at();

-- Integridad de la relación 5-way: el contrato debe pertenecer al especialista
-- y el servicio al contrato indicados.
create or replace function private.validar_asignacion_sede_direccionamiento()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  contrato_especialista uuid;
  servicio_contrato uuid;
begin
  select c.especialista_id into contrato_especialista
  from public.contratos_especialistas c
  where c.id = new.contrato_especialista_id;

  if contrato_especialista is null then
    raise exception 'El contrato indicado no existe';
  end if;

  if contrato_especialista <> new.especialista_id then
    raise exception 'El contrato no pertenece al especialista indicado';
  end if;

  select s.contrato_especialista_id into servicio_contrato
  from public.servicios_contratados_especialistas s
  where s.id = new.servicio_contratado_id;

  if servicio_contrato is null then
    raise exception 'El servicio contratado indicado no existe';
  end if;

  if servicio_contrato <> new.contrato_especialista_id then
    raise exception 'El servicio no pertenece al contrato indicado';
  end if;

  return new;
end;
$$;

drop trigger if exists sedes_servicios_validar_relacion on public.sedes_servicios_especialistas;
create trigger sedes_servicios_validar_relacion
  before insert or update of especialista_id, contrato_especialista_id, servicio_contratado_id
  on public.sedes_servicios_especialistas
  for each row execute function private.validar_asignacion_sede_direccionamiento();

-- ============ novedades ============
create table if not exists public.novedades_direccionamiento (
  id uuid primary key default gen_random_uuid(),
  especialista_id uuid not null
    references public.especialistas(id) on delete restrict,
  contrato_especialista_id uuid
    references public.contratos_especialistas(id) on delete restrict,
  servicio_contratado_id uuid
    references public.servicios_contratados_especialistas(id) on delete restrict,
  asignacion_sede_id uuid
    references public.sedes_servicios_especialistas(id) on delete restrict,
  tipo_novedad text not null,
  fecha_inicio date,
  fecha_terminacion date,
  observaciones text,
  estado_validacion text not null default 'pendiente'
    check (estado_validacion in ('pendiente', 'validado', 'rechazado')),
  created_by uuid references public.usuarios(id) on delete set null,
  updated_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint novedades_direccionamiento_fechas_check
    check (fecha_terminacion is null or fecha_inicio is null or fecha_terminacion >= fecha_inicio)
);

comment on table public.novedades_direccionamiento is 'Novedades de contratos, servicios y sedes. Conserva vigencia y estado de validación.';

create index if not exists novedades_direccionamiento_especialista_idx
  on public.novedades_direccionamiento (especialista_id);
create index if not exists novedades_direccionamiento_contrato_idx
  on public.novedades_direccionamiento (contrato_especialista_id);
create index if not exists novedades_direccionamiento_servicio_idx
  on public.novedades_direccionamiento (servicio_contratado_id);
create index if not exists novedades_direccionamiento_asignacion_idx
  on public.novedades_direccionamiento (asignacion_sede_id);
create index if not exists novedades_direccionamiento_vigencia_idx
  on public.novedades_direccionamiento (fecha_inicio, fecha_terminacion);

drop trigger if exists novedades_direccionamiento_set_updated_at on public.novedades_direccionamiento;
create trigger novedades_direccionamiento_set_updated_at
  before update on public.novedades_direccionamiento
  for each row execute function private.set_updated_at();

-- ============ historial de cambios (no destructivo) ============
create table if not exists public.historial_cambios_direccionamiento (
  id uuid primary key default gen_random_uuid(),
  tabla text not null,
  registro_id uuid not null,
  campo text not null,
  valor_anterior text,
  valor_nuevo text,
  usuario_id uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.historial_cambios_direccionamiento is 'Trazabilidad de cambios de tarifas, asignaciones y condiciones. Solo lectura: no se modifica ni se elimina.';

create index if not exists historial_direccionamiento_registro_idx
  on public.historial_cambios_direccionamiento (tabla, registro_id);
create index if not exists historial_direccionamiento_usuario_idx
  on public.historial_cambios_direccionamiento (usuario_id);
create index if not exists historial_direccionamiento_fecha_idx
  on public.historial_cambios_direccionamiento (created_at desc);

create or replace function private.registrar_historial_direccionamiento()
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
      insert into public.historial_cambios_direccionamiento
        (tabla, registro_id, campo, valor_anterior, valor_nuevo, usuario_id)
      values
        (tg_table_name, old.id, campo, anterior, nuevo, usuario);
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists especialistas_historial on public.especialistas;
create trigger especialistas_historial
  after update on public.especialistas
  for each row execute function private.registrar_historial_direccionamiento(
    'tipo_identificacion', 'numero_identificacion', 'nombre_completo',
    'tipo_persona', 'especialidad', 'regional', 'ciudad', 'estado'
  );

drop trigger if exists contratos_especialistas_historial on public.contratos_especialistas;
create trigger contratos_especialistas_historial
  after update on public.contratos_especialistas
  for each row execute function private.registrar_historial_direccionamiento(
    'asegurador_eps_id', 'regimen_id', 'numero_contrato',
    'modalidad_prestacion', 'fecha_inicio', 'fecha_terminacion', 'estado'
  );

drop trigger if exists servicios_contratados_historial on public.servicios_contratados_especialistas;
create trigger servicios_contratados_historial
  after update on public.servicios_contratados_especialistas
  for each row execute function private.registrar_historial_direccionamiento(
    'cups_id', 'agrupador', 'especialidad', 'manual_tarifario',
    'porcentaje_descuento_incremento', 'modalidad_contratacion',
    'valor_tarifa', 'atenciones_por_hora', 'fecha_inicio', 'fecha_terminacion', 'estado'
  );

drop trigger if exists sedes_servicios_historial on public.sedes_servicios_especialistas;
create trigger sedes_servicios_historial
  after update on public.sedes_servicios_especialistas
  for each row execute function private.registrar_historial_direccionamiento(
    'sede_id', 'tipo_red', 'estado', 'validacion', 'observaciones'
  );

drop trigger if exists novedades_direccionamiento_historial on public.novedades_direccionamiento;
create trigger novedades_direccionamiento_historial
  after update on public.novedades_direccionamiento
  for each row execute function private.registrar_historial_direccionamiento(
    'tipo_novedad', 'fecha_inicio', 'fecha_terminacion', 'estado_validacion', 'observaciones'
  );

-- ============ RLS ============
alter table public.especialistas enable row level security;
alter table public.contratos_especialistas enable row level security;
alter table public.servicios_contratados_especialistas enable row level security;
alter table public.sedes_servicios_especialistas enable row level security;
alter table public.novedades_direccionamiento enable row level security;
alter table public.historial_cambios_direccionamiento enable row level security;

-- Especialistas: la regional se evalúa contra la regional del especialista.
drop policy if exists especialistas_select on public.especialistas;
create policy especialistas_select on public.especialistas
  for select to authenticated
  using ((select private.puede_ver_direccionamiento(regional)));

drop policy if exists especialistas_insert on public.especialistas;
create policy especialistas_insert on public.especialistas
  for insert to authenticated
  with check ((select private.puede_editar_direccionamiento(regional)));

drop policy if exists especialistas_update on public.especialistas;
create policy especialistas_update on public.especialistas
  for update to authenticated
  using ((select private.puede_editar_direccionamiento(regional)))
  with check ((select private.puede_editar_direccionamiento(regional)));

drop policy if exists especialistas_delete on public.especialistas;
create policy especialistas_delete on public.especialistas
  for delete to authenticated
  using ((select private.is_rol('superadmin')));

-- Tablas dependientes: la regional se resuelve a través del especialista.
-- `servicios_contratados_especialistas` no guarda especialista_id: llega al
-- especialista a través de su contrato.
do $$
declare
  t text;
  pred text;
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

    execute format('drop policy if exists %I_select on public.%I', t || '_select', t);
    execute format($f$
      create policy %I_select on public.%I
      for select to authenticated
      using (
        exists (
          select 1 from public.especialistas e
          where %s
            and (select private.puede_ver_direccionamiento(e.regional))
        )
      )
    $f$, t || '_select', t, pred);

    execute format('drop policy if exists %I_insert on public.%I', t || '_insert', t);
    execute format($f$
      create policy %I_insert on public.%I
      for insert to authenticated
      with check (
        exists (
          select 1 from public.especialistas e
          where %s
            and (select private.puede_editar_direccionamiento(e.regional))
        )
      )
    $f$, t || '_insert', t, pred);

    execute format('drop policy if exists %I_update on public.%I', t || '_update', t);
    execute format($f$
      create policy %I_update on public.%I
      for update to authenticated
      using (
        exists (
          select 1 from public.especialistas e
          where %s
            and (select private.puede_editar_direccionamiento(e.regional))
        )
      )
      with check (
        exists (
          select 1 from public.especialistas e
          where %s
            and (select private.puede_editar_direccionamiento(e.regional))
        )
      )
    $f$, t || '_update', t, pred, pred);

    execute format('drop policy if exists %I_delete on public.%I', t || '_delete', t);
    execute format($f$
      create policy %I_delete on public.%I
      for delete to authenticated
      using (
        exists (
          select 1 from public.especialistas e
          where %s
            and (select private.puede_editar_direccionamiento(e.regional))
        )
      )
    $f$, t || '_delete', t, pred);
  end loop;
end $$;

-- Historial: solo lectura para quienes pueden ver el módulo. Los inserts los
-- hace el trigger (SECURITY DEFINER); no se permiten UPDATE ni DELETE.
drop policy if exists historial_direccionamiento_select on public.historial_cambios_direccionamiento;
create policy historial_direccionamiento_select on public.historial_cambios_direccionamiento
  for select to authenticated
  using (
    (select private.puede_ver_direccionamiento(''))
    or exists (
      select 1 from public.especialistas e
      where (select private.puede_ver_direccionamiento(e.regional))
    )
  );

grant select, insert, update, delete on public.especialistas to authenticated;
grant select, insert, update, delete on public.contratos_especialistas to authenticated;
grant select, insert, update, delete on public.servicios_contratados_especialistas to authenticated;
grant select, insert, update, delete on public.sedes_servicios_especialistas to authenticated;
grant select, insert, update, delete on public.novedades_direccionamiento to authenticated;
grant select on public.historial_cambios_direccionamiento to authenticated;
grant all on public.especialistas to service_role;
grant all on public.contratos_especialistas to service_role;
grant all on public.servicios_contratados_especialistas to service_role;
grant all on public.sedes_servicios_especialistas to service_role;
grant all on public.novedades_direccionamiento to service_role;
grant all on public.historial_cambios_direccionamiento to service_role;

notify pgrst, 'reload schema';

commit;
