-- 0005_marca_catalogo_exclusiva_viva1a.sql
-- Reduce el catálogo de marcas a dos opciones: Exclusiva y VIVA1A.
-- Remapea los datos existentes en sedes.marca.

delete from public.catalogos_opciones where dominio = 'marca';

insert into public.catalogos_opciones (dominio, nombre) values
  ('marca', 'Exclusiva'),
  ('marca', 'VIVA1A')
on conflict (dominio, nombre) do nothing;

-- Remapeo de datos existentes: 'VIVA 1A' -> 'VIVA1A'; el resto -> 'Exclusiva'.
update public.sedes
set marca = case
  when marca = 'VIVA 1A' then 'VIVA1A'
  else 'Exclusiva'
end
where marca is distinct from case
  when marca = 'VIVA 1A' then 'VIVA1A'
  else 'Exclusiva'
end;
