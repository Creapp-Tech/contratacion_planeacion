-- Rol Jurídica: lectura de contratos en todas las regionales, sin escritura.
-- Se aplica en una migración separada porque un valor de enum recién agregado
-- no puede utilizarse dentro de la misma transacción en que se crea.
alter type public.usuario_rol add value if not exists 'juridica';
