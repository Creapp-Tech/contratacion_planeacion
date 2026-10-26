-- 0013_rpc_obtener_opciones_filtros.sql
-- Ejecutar ESTE archivo completo en SQL Editor de Supabase PRIMERO.

create or replace function public.obtener_opciones_filtros(
  p_regional text default null,
  p_departamento text default null,
  p_municipio text default null,
  p_asegurador text default null,
  p_marca text default null
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_resultado jsonb;
begin
  with base as (
    select
      srf.sede_id,
      srf.departamento,
      srf.municipio,
      coalesce(reg.nombre, s.regional) as regional,
      s.marca,
      ae.nombre_eps as asegurador
    from sedes_relacion_filtros srf
    left join catalogos_opciones reg
      on srf.regional_id = reg.id
      and reg.dominio = 'regional'
    join sedes s
      on srf.sede_id = s.id
    left join sedes_aseguradores sa
      on srf.sede_id = sa.sede_id
    left join aseguradores_eps ae
      on sa.asegurador_eps_id = ae.id
    where srf.activo = true
      and s.estado is distinct from 'inactiva'
  ),

  opciones_regional as (
    select distinct b.regional
    from base b
    where (p_departamento is null or b.departamento = p_departamento)
      and (p_municipio    is null or b.municipio    = p_municipio)
      and (p_asegurador   is null or b.asegurador   = p_asegurador)
      and (p_marca        is null or b.marca        = p_marca)
      and b.regional is not null
  ),

  opciones_departamento as (
    select distinct b.departamento
    from base b
    where (p_regional    is null or b.regional    = p_regional)
      and (p_municipio   is null or b.municipio   = p_municipio)
      and (p_asegurador  is null or b.asegurador  = p_asegurador)
      and (p_marca       is null or b.marca       = p_marca)
      and b.departamento is not null
  ),

  opciones_municipio as (
    select distinct b.municipio
    from base b
    where (p_regional     is null or b.regional     = p_regional)
      and (p_departamento is null or b.departamento = p_departamento)
      and (p_asegurador   is null or b.asegurador   = p_asegurador)
      and (p_marca        is null or b.marca        = p_marca)
      and b.municipio is not null
  ),

  opciones_asegurador as (
    select distinct b.asegurador
    from base b
    where (p_regional     is null or b.regional     = p_regional)
      and (p_departamento is null or b.departamento = p_departamento)
      and (p_municipio    is null or b.municipio    = p_municipio)
      and (p_marca        is null or b.marca        = p_marca)
      and b.asegurador is not null
  ),

  opciones_marca as (
    select distinct b.marca
    from base b
    where (p_regional     is null or b.regional     = p_regional)
      and (p_departamento is null or b.departamento = p_departamento)
      and (p_municipio    is null or b.municipio    = p_municipio)
      and (p_asegurador   is null or b.asegurador   = p_asegurador)
      and b.marca is not null
  )

  select jsonb_build_object(
    'regionales',     coalesce((select jsonb_agg(regional     order by regional)     from opciones_regional),     '[]'::jsonb),
    'departamentos',  coalesce((select jsonb_agg(departamento  order by departamento)  from opciones_departamento),  '[]'::jsonb),
    'municipios',     coalesce((select jsonb_agg(municipio     order by municipio)     from opciones_municipio),     '[]'::jsonb),
    'aseguradores',   coalesce((select jsonb_agg(asegurador    order by asegurador)    from opciones_asegurador),    '[]'::jsonb),
    'marcas',         coalesce((select jsonb_agg(marca         order by marca)         from opciones_marca),         '[]'::jsonb)
  ) into v_resultado;

  return v_resultado;
end;
$$;

grant execute on function public.obtener_opciones_filtros(text, text, text, text, text) to anon;
grant execute on function public.obtener_opciones_filtros(text, text, text, text, text) to authenticated;
grant execute on function public.obtener_opciones_filtros(text, text, text, text, text) to service_role;

notify pgrst, 'reload schema';
