-- 0022_contratos_campos_ampliados.sql
-- Amplía el módulo de contratos: catálogos de clasificación/estado, sedes
-- cubiertas, programas, valores por régimen, vigencia, periodicidad, notas, etc.

alter table public.catalogos_opciones
  drop constraint if exists catalogos_opciones_dominio_check;

alter table public.catalogos_opciones
  add constraint catalogos_opciones_dominio_check
  check (
    dominio in (
      'regional','zonal','marca','nivel','tipo_ips',
      'tipo_personal','categoria','programa',
      'categoria_contrato','tipo_contrato','estado_legalizacion','estado_ejecucion'
    )
  );

insert into public.catalogos_opciones (dominio, nombre) values
  ('categoria_contrato', 'Régimen Subsidiado'),
  ('categoria_contrato', 'Régimen Contributivo'),
  ('categoria_contrato', 'Complementario'),
  ('tipo_contrato', 'VIVA1A'),
  ('tipo_contrato', 'Unión Temporal'),
  ('estado_legalizacion', 'Legalizado'),
  ('estado_legalizacion', 'No legalizado'),
  ('estado_ejecucion', 'En ejecución'),
  ('estado_ejecucion', 'Terminado - Liquidado'),
  ('estado_ejecucion', 'Terminado - No liquidado'),
  ('estado_ejecucion', 'Finalizado')
on conflict (dominio, nombre) do nothing;

alter table public.contratos
  add column if not exists categoria_contrato_id uuid references public.catalogos_opciones(id) on delete restrict,
  add column if not exists tipo_contrato_id uuid references public.catalogos_opciones(id) on delete restrict,
  add column if not exists estado_legalizacion_id uuid references public.catalogos_opciones(id) on delete restrict,
  add column if not exists estado_ejecucion_id uuid references public.catalogos_opciones(id) on delete restrict,
  add column if not exists fecha_inicio date,
  add column if not exists fecha_fin date,
  add column if not exists prorroga_automatica boolean not null default false,
  add column if not exists periodicidad text,
  add column if not exists poblacion_total integer,
  add column if not exists valor_total numeric(14,2),
  add column if not exists valor_percapita_manual numeric(12,2),
  add column if not exists tiene_programas boolean not null default false,
  add column if not exists url_ubicacion text,
  add column if not exists notas text;

alter table public.contratos
  drop constraint if exists contratos_periodicidad_check;

alter table public.contratos
  add constraint contratos_periodicidad_check
  check (periodicidad is null or periodicidad in ('mensual','anual'));

comment on column public.contratos.categoria_contrato_id is 'Categoría del contrato (catálogo categoria_contrato).';
comment on column public.contratos.tipo_contrato_id is 'Tipo de contrato: VIVA1A o Unión Temporal (catálogo tipo_contrato).';
comment on column public.contratos.estado_legalizacion_id is 'Estado de legalización (catálogo estado_legalizacion).';
comment on column public.contratos.estado_ejecucion_id is 'Estado de ejecución (catálogo estado_ejecucion).';
comment on column public.contratos.fecha_inicio is 'Fecha de inicio de la vigencia del contrato.';
comment on column public.contratos.fecha_fin is 'Fecha de fin de la vigencia del contrato.';
comment on column public.contratos.prorroga_automatica is 'Indica si el contrato cuenta con prórroga automática.';
comment on column public.contratos.periodicidad is 'Periodicidad del contrato: mensual o anual.';
comment on column public.contratos.poblacion_total is 'Población asignada total cuando no se distribuye por régimen.';
comment on column public.contratos.valor_total is 'Valor total del contrato cuando es un valor único.';
comment on column public.contratos.valor_percapita_manual is 'Valor per cápita ingresado manualmente.';
comment on column public.contratos.tiene_programas is 'Indica si el contrato cuenta con programas asociados.';
comment on column public.contratos.url_ubicacion is 'URL con la ubicación del contrato.';
comment on column public.contratos.notas is 'Notas y observaciones del contrato.';

create index if not exists contratos_categoria_contrato_idx on public.contratos (categoria_contrato_id);
create index if not exists contratos_tipo_contrato_idx on public.contratos (tipo_contrato_id);
create index if not exists contratos_estado_legalizacion_idx on public.contratos (estado_legalizacion_id);
create index if not exists contratos_estado_ejecucion_idx on public.contratos (estado_ejecucion_id);

create table if not exists public.contratos_sedes (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references public.contratos(id) on delete cascade,
  sede_id uuid not null references public.sedes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (contrato_id, sede_id)
);

comment on table public.contratos_sedes is 'Sedes a las que un contrato presta servicio.';

create index if not exists contratos_sedes_contrato_idx on public.contratos_sedes (contrato_id);
create index if not exists contratos_sedes_sede_idx on public.contratos_sedes (sede_id);

create table if not exists public.contratos_programas (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references public.contratos(id) on delete cascade,
  opcion_id uuid not null references public.catalogos_opciones(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (contrato_id, opcion_id)
);

comment on table public.contratos_programas is 'Programas asociados a un contrato.';

create index if not exists contratos_programas_contrato_idx on public.contratos_programas (contrato_id);
create index if not exists contratos_programas_opcion_idx on public.contratos_programas (opcion_id);

create table if not exists public.contratos_valores (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references public.contratos(id) on delete cascade,
  regimen_id uuid references public.regimenes(id) on delete restrict,
  poblacion integer,
  valor_total numeric(14,2),
  valor_percapita_manual numeric(12,2),
  created_at timestamptz not null default now(),
  unique nulls not distinct (contrato_id, regimen_id)
);

comment on table public.contratos_valores is 'Valores y población del contrato discriminados por régimen.';
comment on column public.contratos_valores.regimen_id is 'Régimen asociado; NULL representa el valor único/total.';

create index if not exists contratos_valores_contrato_idx on public.contratos_valores (contrato_id);
create index if not exists contratos_valores_regimen_idx on public.contratos_valores (regimen_id);

alter table public.contratos_sedes enable row level security;
alter table public.contratos_programas enable row level security;
alter table public.contratos_valores enable row level security;

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
            join public.usuarios u on u.id = auth.uid()
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
            join public.usuarios u on u.id = auth.uid()
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
            join public.usuarios u on u.id = auth.uid()
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
            join public.usuarios u on u.id = auth.uid()
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
            join public.usuarios u on u.id = auth.uid()
            where c.id = %I.contrato_id
              and u.rol = 'gerente_regional'
              and u.regional_id = c.regional_id
          )
        )
    $f$, t, t, t);

    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end
$$;

notify pgrst, 'reload schema';
