-- 0042_catalogos_cups_secciones.sql
-- Opciones de sección para el módulo CUPS (Resolución 2808 de 2022).
-- Se guardan en catalogos_opciones con descripcion = 'Sección' para
-- distinguirlas de los capítulos y anexos.

insert into public.catalogos_opciones (dominio, nombre, descripcion, activo)
values
  ('cups', 'Códigos especiales para reporte de población indígena', 'Sección', true),
  ('cups', 'Códigos para el reporte de otras prestaciones en salud', 'Sección', true),
  ('cups', 'Códigos para el reporte de información de intervenciones colectivas', 'Sección', true),
  ('cups', 'Códigos para el reporte de información de gestión en salud pública', 'Sección', true),
  ('cups', 'Códigos para el reporte de procedimientos e intervenciones sobre las condiciones y el medio ambiente de trabajo', 'Sección', true),
  ('cups', 'Sistema nervioso', 'Sección', true),
  ('cups', 'Sistema endocrino', 'Sección', true),
  ('cups', 'Sistema visual', 'Sección', true),
  ('cups', 'Sistema auditivo', 'Sección', true),
  ('cups', 'Nariz, boca y faringe', 'Sección', true),
  ('cups', 'Sistema respiratorio', 'Sección', true),
  ('cups', 'Sistema circulatorio', 'Sección', true),
  ('cups', 'Sistema hemático y linfático', 'Sección', true),
  ('cups', 'Sistema digestivo', 'Sección', true),
  ('cups', 'Sistema urinario', 'Sección', true),
  ('cups', 'Sistema reproductor masculino', 'Sección', true),
  ('cups', 'Sistema reproductor femenino', 'Sección', true),
  ('cups', 'Sistema osteomuscular', 'Sección', true),
  ('cups', 'Sistema tegumentario', 'Sección', true),
  ('cups', 'Imagenología', 'Sección', true),
  ('cups', 'Consulta, monitorización y procedimientos diagnósticos', 'Sección', true),
  ('cups', 'Laboratorio clínico', 'Sección', true),
  ('cups', 'Medicina transfusional y banco de sangre', 'Sección', true),
  ('cups', 'Medicina nuclear y radioterapia', 'Sección', true),
  ('cups', 'Desempeño funcional y rehabilitación', 'Sección', true),
  ('cups', 'Salud mental', 'Sección', true),
  ('cups', 'Diagnóstico y tratamiento en sistemas visual y auditivo', 'Sección', true),
  ('cups', 'Otros procedimientos no quirúrgicos', 'Sección', true),
  ('cups', 'Procedimientos misceláneos', 'Sección', true)
on conflict (dominio, nombre) do nothing;
