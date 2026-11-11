-- 0043_contratos_pais.sql
-- Clasifica los contratos por país para separar el módulo en:
--   * Contratos nacionales  -> país Colombia
--   * Contratos internacionales -> cualquier otro país
--
-- El país se administra desde catalogos_opciones (dominio 'pais') y
-- contratos.pais_id referencia ese catálogo. También se crean las regionales
-- de Perú y República Dominicana para que sus sedes puedan asociarse a
-- contratos internacionales sin relajar las reglas actuales.

begin;

-- ============ catálogo de países ============
alter table public.catalogos_opciones
  drop constraint if exists catalogos_opciones_dominio_check;

alter table public.catalogos_opciones
  add constraint catalogos_opciones_dominio_check
  check (
    dominio = any (array[
      'regional',
      'zonal',
      'marca',
      'nivel',
      'tipo_ips',
      'tipo_personal',
      'categoria',
      'programa',
      'categoria_contrato',
      'tipo_contrato',
      'estado_legalizacion',
      'estado_ejecucion',
      'responsable',
      'cups',
      'pais'
    ])
  );

insert into public.catalogos_opciones (dominio, nombre)
values
  ('pais', 'Colombia'),
  ('pais', 'Perú'),
  ('pais', 'República Dominicana')
on conflict (dominio, nombre) do nothing;

-- ============ regionales por país ============
-- La tabla regionales alimenta contratos y sus vínculos; el catálogo
-- 'regional' alimenta el formulario de sedes. Ambos deben existir.
insert into public.regionales (nombre)
values ('Perú'), ('República Dominicana')
on conflict (nombre) do nothing;

insert into public.catalogos_opciones (dominio, nombre)
values
  ('regional', 'Perú'),
  ('regional', 'República Dominicana')
on conflict (dominio, nombre) do nothing;

-- ============ país del contrato ============
alter table public.contratos
  add column if not exists pais_id uuid;

-- Los contratos existentes quedan como Colombia (todos son nacionales).
update public.contratos
set pais_id = (
  select id
  from public.catalogos_opciones
  where dominio = 'pais'
    and nombre = 'Colombia'
)
where pais_id is null;

alter table public.contratos
  alter column pais_id set not null;

alter table public.contratos
  drop constraint if exists contratos_pais_id_fkey;

alter table public.contratos
  add constraint contratos_pais_id_fkey
  foreign key (pais_id) references public.catalogos_opciones(id)
  on delete restrict;

create index if not exists contratos_pais_idx
  on public.contratos (pais_id);

comment on column public.contratos.pais_id is
  'País del contrato (catálogo catalogos_opciones, dominio pais). Colombia = nacional.';

-- ============ actualización transaccional con país ============
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
      pais_id = d.pais_id,
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
    pais_id uuid,
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

-- ============ duplicar contrato: copiar país ============
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
        pais_id,
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
        v_origen.pais_id,
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
