-- 0026_duplicar_contrato.sql
-- Agrega una función transaccional para duplicar un contrato con todo su
-- contenido: datos del contrato, sedes, programas y valores por régimen.
--
-- Reglas:
-- - La copia nace activa y con created_by del usuario que la ejecuta.
-- - El nombre se prefija con "Copia de ".
-- - El número de contrato se genera como <original>-COPIA, <original>-COPIA-2,
--   ... hasta encontrar uno libre (el índice numero_contrato es único).
-- - Los estados de legalización y ejecución se copian tal cual.

begin;

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

  -- Limita la base para que el sufijo no exceda los 100 caracteres que valida
  -- el formulario.
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
  'Duplica un contrato con sus sedes, programas y valores. Devuelve el id de la copia.';

commit;
