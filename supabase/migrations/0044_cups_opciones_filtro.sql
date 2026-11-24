-- 0044_cups_opciones_filtro.sql
-- Opciones de los filtros de Capítulo y Sección derivadas de los datos reales
-- de public.cups. Evita la discrepancia con catalogos_opciones (p. ej.
-- "Capítulo 01" vs "Capítulo 1") y el tope de 1000 filas de PostgREST.

create or replace function public.cups_opciones_filtro()
returns table (capitulos text[], secciones text[])
language sql
stable
security invoker
set search_path = ''
as $$
  select
    coalesce(
      array_agg(distinct c.capitulo order by c.capitulo)
        filter (where c.capitulo is not null and btrim(c.capitulo) <> ''),
      array[]::text[]
    ),
    coalesce(
      array_agg(distinct c.seccion order by c.seccion)
        filter (where c.seccion is not null and btrim(c.seccion) <> ''),
      array[]::text[]
    )
  from public.cups c;
$$;

revoke all on function public.cups_opciones_filtro() from public;
grant execute on function public.cups_opciones_filtro() to service_role;
