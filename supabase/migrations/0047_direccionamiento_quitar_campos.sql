-- Los campos de vigencia/estado ya no se capturan en los formularios del
-- módulo de direccionamiento. Se conserva el historial ya registrado.

drop index if exists public.servicios_contratados_estado_idx;
drop index if exists public.servicios_contratados_vigencia_idx;
drop index if exists public.sedes_servicios_estado_idx;

alter table public.servicios_contratados_especialistas
  drop constraint if exists servicios_contratados_especialistas_fechas_check,
  drop column if exists fecha_inicio,
  drop column if exists fecha_terminacion,
  drop column if exists estado;

alter table public.sedes_servicios_especialistas
  drop column if exists estado,
  drop column if exists validacion;

drop trigger if exists servicios_contratados_historial on public.servicios_contratados_especialistas;
create trigger servicios_contratados_historial
  after update on public.servicios_contratados_especialistas
  for each row execute function private.registrar_historial_direccionamiento(
    'cups_id', 'agrupador', 'especialidad', 'manual_tarifario',
    'porcentaje_descuento_incremento', 'modalidad_contratacion',
    'valor_tarifa', 'atenciones_por_hora'
  );

drop trigger if exists sedes_servicios_historial on public.sedes_servicios_especialistas;
create trigger sedes_servicios_historial
  after update on public.sedes_servicios_especialistas
  for each row execute function private.registrar_historial_direccionamiento(
    'sede_id', 'tipo_red', 'observaciones'
  );
