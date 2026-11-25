# AI Development Memory

## Last Updated
2026-11-24

## Recent Patterns Learned
- Modules should have: table listing + create button + CRUD operations
- Use server actions for data mutations
- Use Supabase Client for read operations
- shadcn/ui components for consistency
- TypeScript strict mode enabled

## Decisions Made
- Table columns defined in types, rendered dynamically
- Create button always primary variant with PlusIcon
- Edit/Delete in dropdown menu per row
- Filters component shared across modules
- Navigation via sidebar in `(dashboard)` layout
- Contratos usan un solo `ContratoForm` en modos `crear`, `ver` y `editar`.
- El responsable de un contrato es un `gerente_regional` activo de la misma regional.
- Los contratos se eliminan lógicamente con `estado = 'inactivo'`.
- El alcance por regional se valida en server actions; las queries usan `createAdminClient()`.
- La migración `0018_modulo_contratos.sql` se aplicó en Supabase el 2026-10-22 vía MCP.
- La migración `0022_contratos_campos_ampliados.sql` se aplicó en Supabase el 2026-10-23 vía MCP; agrega catálogos de clasificación/estado, sedes (N:M), programas (N:M), valores por régimen, vigencia, periodicidad y notas.
- La migración `0012_normalizar_regional.sql` se aplicó el 2026-10-23 para alinear `sedes.regional` y `regionales.nombre` con el catálogo (caso "Eje cafetero").
- En el formulario de contratos las sedes se muestran solo después de elegir una regional.
- `formatearMoneda` fija `minimumFractionDigits` y `maximumFractionDigits` en 2 para evitar diferencias de hidratación entre servidor y navegador.
- Auditoría 2026-10-26: `lib/contratos/queries.ts` estaba corrupto (sin `return`, `query` mal declarada y filtros PostgREST inválidos); se reescribió el final del archivo y se restauraron listado, detalle y opciones.
- Los filtros de listado ignoran UUID inválidos y `getContrato` devuelve `null` para ids malformados.
- Las server actions validan en el servidor asegurador activo, sedes activas de la regional, catálogos del dominio correcto y regímenes existentes antes de escribir.
- La edición de contratos usa `public.actualizar_contrato_completo(...)`, una función transaccional que actualiza el contrato y reemplaza sedes, programas y valores en una sola operación.
- La migración `0023_agregar_categorias_contrato_adicionales.sql` se aplicó el 2026-10-26 (Anexo, Adenda, Otrosí).
- La categoría del contrato se toma de `catalogos_opciones` con `dominio = 'categoria'` (el mismo catálogo que administra `/configuracion/categorias`); las filas del dominio `categoria_contrato` que crearon `0022`/`0023` quedaron sin uso y no están referenciadas por ningún contrato.
- La migración `0025_reconciliar_contratos.sql` se aplicó el 2026-10-26 (RLS con `(select auth.uid())`, índice `created_by` y RPC de edición transaccional).
- La migración `0026_duplicar_contrato.sql` se aplicó el 2026-10-26: RPC `duplicar_contrato(p_id, p_created_by)` copia contrato, sedes, programas y valores en una transacción; la copia nace activa, con nombre "Copia de …" y número `<original>-COPIA`, `<original>-COPIA-2`, etc.
- El módulo `Historial` (`/historial`) lista los contratos activos cuyo `estado_ejecucion` es distinto de "En ejecución" (incluye los que no tienen estado). `Contratos` solo lista los que están exactamente en "En ejecución". La constante `ESTADO_EJECUCION_EN_EJECUCION` centraliza ese nombre.
- La migración `0024_historico_contrato.sql` se descartó: lo histórico se determina con `estado_ejecucion`, no con una categoría.
- La migración `0027_seguimiento_ipc.sql` se aplicó el 2026-10-26: crea `ipc_nacional` (histórico por `pais`+`anio`, escritura solo `superadmin`) e `ipc_seguimiento` (un registro por `contrato_id`+`anio`, con alcance regional para `gerente_regional`), ambas con RLS, triggers de `updated_at` y grants.
- La migración `0028_ipc_indices_created_by.sql` se aplicó el 2026-10-26 para cubrir las FK `created_by` de `ipc_nacional` e `ipc_seguimiento` y silenciar el advisor de performance.
- El comparativo de Seguimiento IPC siempre usa el registro de `ipc_nacional` con `pais = 'Colombia'` del mismo año (`PAIS_IPC_COMPARACION`). Si no existe referencia, el estado es `sin_referencia` y no se marca en rojo.
- La migración `0029_ipc_seguimiento_upc.sql` se aplicó el 2026-10-26: agrega `ipc_seguimiento.upc` (numeric 14,2, no negativo), que corresponde a la UPC del régimen contributivo. No modifica la UPC nacional contributiva, que conserva sus datos existentes.
- La migración `0030_ipc_seguimiento_upc_subsidiado.sql` se aplicó el 2026-10-26: agrega `ipc_seguimiento.upc_subsidiado` (numeric 14,2, no negativo) para la UPC del régimen subsidiado.
- La migración `0031_ipc_nacional_upc_subsidiado.sql` se aplicó el 2026-10-26: agrega `ipc_nacional.valor_upc_subsidiado` (numeric 14,2, nullable y no negativo). No modifica la UPC contributiva; los registros existentes quedan sin dato subsidiado hasta completarlos desde Configuración.
- La migración `0032_ipc_nacional_rename_upc_contributivo.sql` se aplicó el 2026-10-26 para alinear el código con el esquema real de Supabase: `ipc_nacional.valor_upc` pasó a llamarse `valor_upc_contributivo`. Es idempotente y conserva los datos existentes.
- El % IPC se guarda como porcentaje (no fracción) con 3 decimales y admite rango -100 a 100; el costo usuario, las dos UPC del seguimiento y el valor UPC nacional se guardan en COP con 2 decimales.
- La UI de IPC usa tabs por URL (`?tab=analisis`), porque no existe un componente `Tabs` compartido. Los gráficos usan `recharts` (ya instalado).
- En el formulario de IPC los contratos se agrupan por asegurador y los que no están en ejecución se muestran en naranja oscuro con la etiqueta "No ejecución".
- El histórico nacional arranca vacío: debe cargarse manualmente desde Configuración antes de que existan comparaciones.
- La migración `0048_aseguradores_contratos.sql` se aplicó en Supabase vía MCP el 2026-11-24: crea `public.servicios_cups_aseguradores` (FK a asegurador, contrato, CUPS y especialistas), índice único funcional por `(contrato_id, lower(trim(cups_asegurador)))`, trigger de integridad asegurador↔contrato, trigger de historial reutilizando `private.registrar_historial_prestadores_contratos`, RLS por contrato y seed idempotente del especialista `VIVA1A` (NIT).
- El id del especialista VIVA1A se resolvía en código con `lib/aseguradores-contratos/queries.ts` (`idEspecialistaViva1a`), nunca como UUID fijo; ese helper se retiró en `0050` junto con las opciones que lo usaban como default. El centinela y la función `private.especialista_viva1a_id()` permanecen en la BD como registro histórico.
- En `0048` se hizo `revoke all ... from anon` de forma explícita; la ANON no tiene privilegios sobre la tabla.
- El módulo `/aseguradores-contratos` usa los mismos guards y helpers de permisos que Prestadores y contratos; la edición en línea del CME valida permisos en servidor antes de escribir.
- `npm run build` y `npx tsc --noEmit` pasan con el módulo nuevo; `npm run lint` reporta 20 errores preexistentes (`@typescript-eslint/no-explicit-any`) en otros archivos, ninguno del módulo nuevo.
- La migración `0049_renombrar_modulo_prestadores_contratos.sql` se aplicó en Supabase vía MCP el 2026-11-25: renombra `novedades_direccionamiento` → `novedades_prestadores_contratos`, `historial_cambios_direccionamiento` → `historial_cambios_prestadores_contratos`, las 5 funciones `private.*_direccionamiento` → `private.*_prestadores_contratos`, y constraints, índices, triggers, políticas y alias internos. Conserva los datos de historial. Las migraciones `0045`-`0048` se dejan como registro histórico; no se editan.
- El módulo `direccionamiento` se renombró por completo a `prestadores-contratos`: ruta `/prestadores-contratos`, carpetas `app/(dashboard)/prestadores-contratos`, `components/prestadores-contratos`, `lib/prestadores-contratos` y `lib/validations/prestadores-contratos.ts`, símbolos y textos UI. La ruta antigua `/direccionamiento` queda sin redirección (404). `/aseguradores-contratos` reutiliza los guards, `BuscadorCups`, `CLASE_SELECT` y el trigger de historial renombrado.
- La migración `0050_aseguradores_contratos_ajustes.sql` se aplicó en Supabase vía MCP el 2026-11-25: `frecuencia_uso_contratada` pasó de `numeric(14,2)` a `numeric` sin escala fija (mantiene `check >= 0` y conserva valores), se eliminaron `primera_opcion_especialista_id` / `segunda_opcion_especialista_id` y sus índices, y se recreó `servicios_cups_asegurador_historial` con `private.registrar_historial_prestadores_contratos` sin esos campos. El historial previo se conserva; los valores actuales de las opciones se pierden.
- En `/aseguradores-contratos` el label del CME es `CME Asegurador` en formulario, tabla y edición en línea; el identificador `cme_contratado` no cambió. La frecuencia usa `step="any"` en el form y hasta 8 decimales en la tabla. Se retiraron la barra de acciones masivas, la selección por checkbox, el filtro de opción y `CeldaOpcion`.
- La migración `0051_cme_asegurador_opcional.sql` se aplicó en Supabase vía MCP el 2026-11-25: `cme_contratado` pasó a nullable sin modificar valores existentes. El promedio del KPI se calcula solo sobre registros con CME.
- La carga masiva de `/aseguradores-contratos/nuevo` usa el patrón XLSX/CSV del repo: plantilla en `app/(dashboard)/aseguradores-contratos/plantilla/route.ts`, parseo en `lib/aseguradores-contratos/importar*.ts` y la action `importarServiciosCups`. El homólogo se resuelve solo por código del catálogo (sin columna de versión; se prefiere el registro activo); los duplicados por `(contrato_id, lower(trim(cups_asegurador)))` se omiten y se reportan por fila.
- Rol `juridica` agregado el 2026-11-25: enum `usuario_rol`, RLS de solo SELECT en contratos/tablas hijas/documentos y RLS activado en `contrato_documentos` (antes tenía `ALL` para anon/authenticated). No se agregó a `ROLES_CONTRATACION` para no habilitar IPC, Dashboard ni Prestadores/Aseguradores. Nuevos guards: `requireAccesoContratos()` (lectura) y `requireEditorContratacion()` (escritura). El endpoint `/api/contratos/cargue-masivo` ahora exige sesión y permiso de escritura.

## Pending Tasks
- [ ] Probar manualmente el CRUD de contratos con los tres roles
- [ ] Probar manualmente el rol `juridica`: ve contratos/historial de todas las regionales, no ve Dashboard/IPC/Prestadores, no puede escribir por UI, URL directa, server actions ni API de cargue masivo
- [ ] Probar manualmente el CRUD de Seguimiento IPC y de IPC Nacional con los roles `superadmin`, `analista_contratacion` y `gerente_regional`
- [ ] Extract usuarios module into standardized template
- [ ] Create module scaffolding script
- [ ] Update all module pages to use new pattern

## Learned Shortcuts
- `npm run dev` starts dev server
- `npm run lint` runs eslint
- Types generated from Supabase: `supabase gen types`
- Edge functions in `api/edge-functions/`