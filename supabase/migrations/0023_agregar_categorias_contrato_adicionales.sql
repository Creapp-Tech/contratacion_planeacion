-- 0023_agregar_categorias_contrato_adicionales.sql
-- Agrega categorías de contrato adicionales: anexo, adenda, otrosí
-- Estas se conectan al catálogo de opciones con dominio categoria_contrato

insert into public.catalogos_opciones (dominio, nombre) values
  ('categoria_contrato', 'Anexo'),
  ('categoria_contrato', 'Adenda'),
  ('categoria_contrato', 'Otrosí')
on conflict (dominio, nombre) do nothing;
