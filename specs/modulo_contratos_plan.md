# Plan de implementación — Grupo Contratación / Módulo Contratos

**Proyecto:** `planeacion_contratacion_v2`
**Estado:** Implementado; migraciones 0018, 0022 y 0012 aplicadas (2026-10-23); verificación manual de CRUD pendiente
**Depende de:** shell `(dashboard)`, auth por rol (`lib/auth/session.ts`), módulos de aseguradores y regionales.

---

## 1. Objetivo

Crear el grupo de navegación **Contratación** con el módulo **Contratos**, que permita registrar, listar, consultar, editar y eliminar lógicamente contratos asociados a aseguradores, regionales y gerentes regionales.

El módulo debe seguir el patrón estándar del proyecto (`STRUCTURE.md`): listado con filtros, botón primario "Nuevo contrato", formulario compartido y server actions.

## 2. Alcance

**Incluye:**

- Migración `public.contratos` con FKs, checks, índices, trigger y RLS.
- Constantes de modalidad y estado.
- Validación Zod del contrato.
- Guards de acceso con alcance por regional.
- Queries de listado, detalle y opciones.
- Server actions para crear, actualizar y eliminar lógicamente.
- Listado con buscador, filtro por asegurador y filtro por regional.
- Tabla con acciones ver, editar y eliminar.
- Formulario compartido para crear, ver y editar.
- Grupo "Contratación" en el sidebar.
- Actualización de `CONTEXT.md`, `PLANS.md` y `MEMORY.md`.

**No incluye:**

- Fechas, valores, prórrogas, adiciones o estados contractuales avanzados.
- Importación/exportación.
- Paginación.
- Eliminación física de contratos.

## 3. Decisiones

| Tema | Decisión |
| --- | --- |
| Responsable | Un gerente regional (`usuarios.rol = 'gerente_regional'`), guardado en `responsable_id` |
| Modalidades | `capita`, `especial`, `evento`, `integral`, `pgp` |
| Rutas | `/contratos`, `/contratos/nuevo`, `/contratos/[id]`, `/contratos/[id]/editar` |
| Eliminar | Borrado lógico: `estado = 'inactivo'` |
| Acceso | `superadmin`, `analista_contratacion` y `gerente_regional` |
| Alcance | Gerente regional solo ve y gestiona contratos de su `regional_id` |
| Formulario | Un solo `ContratoForm` en modos `crear`, `ver` y `editar` |
| Ciudad | Texto libre |
| Número de contrato | Único |

## 4. Modelo de datos

Migración: `supabase/migrations/0018_modulo_contratos.sql`

```sql
create table public.contratos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  asegurador_id uuid not null references public.aseguradores_eps(id) on delete restrict,
  numero_contrato text not null,
  regional_id uuid not null references public.regionales(id) on delete restrict,
  ciudad text not null,
  modalidad text not null check (modalidad in ('capita','especial','evento','integral','pgp')),
  responsable_id uuid references public.usuarios(id) on delete set null,
  estado text not null default 'activo' check (estado in ('activo','inactivo')),
  created_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

- Índice único en `numero_contrato`.
- Índices en `asegurador_id`, `regional_id`, `estado`, `responsable_id` y `nombre`.
- Trigger `updated_at` con `private.set_updated_at()`.
- RLS de lectura para `superadmin`, `analista_contratacion` y `gerente_regional`.
- Escritura para `superadmin`, `analista_contratacion` y `gerente_regional`.
- El gerente regional solo puede escribir contratos cuya `regional_id` coincida con la de su usuario.

## 5. Roles y seguridad

- `ROLES_CONTRATACION`: `superadmin`, `analista_contratacion`, `gerente_regional`.
- `requireAccesoContratacion()`: autentica, valida perfil activo y permite solo esos roles.
- `alcanceContratos(usuario)`:
  - `superadmin` y `analista_contratacion`: acceso total.
  - `gerente_regional`: acceso limitado a `usuario.regional_id`.
- Las server actions siempre validan autenticación, rol y alcance; no confían en datos del cliente.
- Las escrituras usan `createAdminClient()` y la RLS queda como defensa en profundidad.

## 6. Rutas

| Ruta | Contenido |
| --- | --- |
| `/contratos` | Listado, filtros y botón "Nuevo contrato" |
| `/contratos/nuevo` | `ContratoForm` modo crear |
| `/contratos/[id]` | `ContratoForm` modo ver |
| `/contratos/[id]/editar` | `ContratoForm` modo editar |

## 7. Estructura de archivos

### Nuevos

```text
supabase/migrations/0018_modulo_contratos.sql
lib/contratos/constantes.ts
lib/contratos/queries.ts
lib/validations/contrato.ts
app/(dashboard)/contratos/page.tsx
app/(dashboard)/contratos/actions.ts
app/(dashboard)/contratos/nuevo/page.tsx
app/(dashboard)/contratos/[id]/page.tsx
app/(dashboard)/contratos/[id]/editar/page.tsx
components/contratos/contratos-contenido.tsx
components/contratos/contratos-tabla.tsx
components/contratos/contrato-filtros.tsx
components/contratos/contrato-form.tsx
components/contratos/contrato-acciones.tsx
components/contratos/contrato-nuevo-contenido.tsx
components/contratos/contrato-editar-contenido.tsx
components/contratos/contrato-detalle-contenido.tsx
```

### Modificados

```text
components/shell/nav-items.ts
lib/constants/roles.ts
lib/auth/session.ts
CONTEXT.md
PLANS.md
MEMORY.md
```

## 8. Tareas

### Fase 0 — Base de datos y validaciones

- [x] **CON-001 — Migración `0018_modulo_contratos.sql`** (aplicada 2026-10-22)
  - Crear tabla, checks, FKs, índices, trigger y RLS.
  - **Aceptación:** tabla consultable, número único, modalidades restringidas y políticas activas.
  - **Verificación:** aplicar migración y revisar advisors de seguridad.

- [x] **CON-002 — Constantes y validación Zod**
  - `lib/contratos/constantes.ts`: `MODALIDADES`, `ESTADOS_CONTRATO` y etiquetas.
  - `lib/validations/contrato.ts`: `contratoSchema` y tipos.
  - **Aceptación:** rechaza modalidades, UUIDs y campos inválidos.

### Fase 1 — Acceso y datos

- [x] **CON-003 — Roles y guards**
  - Agregar `ROLES_CONTRATACION` y `puedeAccederContratacion()`.
  - Agregar `requireAccesoContratacion()` y `alcanceContratos()`.
  - **Aceptación:** roles no autorizados redirigen; gerente regional queda limitado a su regional.

- [x] **CON-004 — Queries**
  - `listContratos(filtros, alcance)`.
  - `getContrato(id, alcance)`.
  - `listOpcionesContrato(alcance)`.
  - **Aceptación:** filtros por nombre/número, asegurador y regional; solo activos.

- [x] **CON-005 — Server actions**
  - `crearContrato`, `actualizarContrato`, `eliminarContrato`.
  - Validar alcance regional y manejar `23505`.
  - **Aceptación:** crear/editar/eliminar funcionan y revalidan `/contratos`.

### Fase 2 — Listado

- [x] **CON-006 — Página `/contratos`**
  - Header, botón "Nuevo contrato" y Suspense.
  - Contenido con manejo de errores.
  - **Aceptación:** cumple `STRUCTURE.md`.

- [x] **CON-007 — Filtros**
  - Buscador, asegurador y regional.
  - Params `q`, `asegurador`, `regional`.
  - Regional oculto para gerente regional.
  - **Aceptación:** filtros persistentes y botón limpiar.

- [x] **CON-008 — Tabla y acciones**
  - Columnas: Nombre, Número, Asegurador, Regional, Modalidad, Estado, Acciones.
  - Ver, editar y eliminar con confirmación.
  - **Aceptación:** acciones navegan y el eliminado desaparece del listado.

### Fase 3 — Formulario y detalle

- [x] **CON-009 — `ContratoForm`**
  - Modos crear, ver y editar.
  - Campos: nombre, asegurador, número, regional, ciudad, modalidad y responsable.
  - Modalidad con `ChoiceChips`.
  - Responsable filtrado por regional.
  - **Aceptación:** mismo componente en las tres rutas; modo ver deshabilitado.

- [x] **CON-010 — Páginas de formulario y detalle**
  - `nuevo`, `[id]`, `[id]/editar` y contenidos server.
  - `notFound()` fuera de alcance.
  - **Aceptación:** crear, ver y editar funcionan.

### Fase 4 — Navegación, contexto y cierre

- [x] **CON-011 — Sidebar**
  - Grupo "Contratación" con módulo "Contratos".
  - **Aceptación:** visible solo para `ROLES_CONTRATACION`.

- [x] **CON-012 — Contexto**
  - Actualizar `CONTEXT.md`, `PLANS.md` y `MEMORY.md`.
  - **Aceptación:** el módulo y sus reglas quedan documentados.

- [ ] **CON-013 — Verificación final**
  - `npm run lint`, `npx tsc --noEmit`, `npm run build`.
  - Checklist manual de CRUD, filtros y roles.

## 9. Verificación

```text
npm run lint
npx tsc --noEmit
npm run build
```

Checklist manual:

- Crear contrato con todos los campos.
- Editar contrato.
- Ver detalle con el formulario compartido.
- Filtrar por asegurador, regional y buscador.
- Eliminar contrato y confirmar borrado lógico.
- Probar acceso como superadmin, analista de contratación y gerente regional.

## 10. Riesgos y supuestos

- La migración asume que `regionales`, `usuarios` y `aseguradores_eps` existen en v2.
- `responsable_id` es nullable en base de datos para tolerar usuarios eliminados, pero requerido en el formulario.
- Los contratos inactivos no se listan, pero siguen accesibles por URL.
- Si el MCP de Supabase no está disponible, la migración se aplica manualmente.
- El esquema queda preparado para agregar fechas, valores y otros campos en una iteración posterior.

## 11. Ampliación de campos (migración 0022)

La migración `0022_contratos_campos_ampliados.sql` agrega:

- Catálogos en `catalogos_opciones`: `categoria_contrato`, `tipo_contrato`,
  `estado_legalizacion` y `estado_ejecucion`.
  - Nota 2026-10-26: el formulario de contratos toma la categoría del dominio
    `categoria` (compartido con `/configuracion/categorias`), no de
    `categoria_contrato`; las filas de `0022`/`0023` en ese dominio están sin uso.
- Columnas en `contratos`: categoría, tipo de contrato, estados de legalización
  y ejecución, `fecha_inicio`, `fecha_fin`, `prorroga_automatica`,
  `periodicidad`, `poblacion_total`, `valor_total`,
  `valor_percapita_manual`, `tiene_programas`, `url_ubicacion` y `notas`.
- Tabla `contratos_sedes` (N:M) para las sedes cubiertas.
- Tabla `contratos_programas` (N:M) contra el catálogo de programas.
- Tabla `contratos_valores` con población y valor por régimen; la fila con
  `regimen_id = NULL` representa el valor único/total.

Cálculos (en `lib/contratos/constantes.ts`):

- Valor mensual = `valor_total / 12` cuando la periodicidad es anual; en otro
  caso `valor_total`.
- Per cápita calculado = `valor_mensual / poblacion_total`.
- El per cápita aplicado usa el valor manual si existe; si no, el calculado.
- La población y el valor total se calculan como suma de las filas por régimen
  cuando hay valores discriminados.

## 12. Correcciones 2026-10-23

- Se aplicó `0022_contratos_campos_ampliados.sql` en Supabase, que faltaba: sin
  ella el listado fallaba y los desplegables de categoría, tipo y estados
  quedaban vacíos.
- Se aplicó `0012_normalizar_regional.sql` para alinear `sedes.regional` con el
  catálogo (`"Eje Cafetero"` → `"Eje cafetero"`).
- En `ContratoForm`, las sedes se ocultan hasta que se elige una regional y se
  comparan con `trim().toLowerCase()`.
- `formatearMoneda` fija 2 decimales para evitar el mismatch de hidratación
  entre Node y el navegador.

## 13. Duplicado de contratos (migración 0026)

- `public.duplicar_contrato(p_id uuid, p_created_by uuid)` copia en una sola
  transacción el contrato, sus sedes, programas y valores.
- La copia nace `activo`, con `nombre = "Copia de …"` y número
  `<original>-COPIA`, `<original>-COPIA-2`, etc. (el número es único).
- Los estados de legalización y ejecución se copian tal cual.
- La server action `duplicarContrato` valida el alcance regional y redirige a la
  edición de la copia; está disponible en la fila del listado y en el detalle.

## 14. Módulo Historial

- Ruta `/historial`, dentro del grupo "Contratación" del sidebar, debajo de
  Contratos.
- `Contratos` lista únicamente contratos activos con
  `estado_ejecucion = "En ejecución"`.
- `Historial` lista los contratos activos con cualquier otro estado de
  ejecución, incluidos los que no tienen estado asignado.
- El criterio se centraliza en `ESTADO_EJECUCION_EN_EJECUCION`
  (`lib/contratos/constantes.ts`) y en la vista `VistaContratos` de
  `listContratos`.
- Editar, ver o duplicar desde Historial conserva el regreso a `/historial`.

## 15. Módulo Seguimiento IPC (migraciones 0027–0032)

### Modelo de datos

- `public.ipc_nacional`: histórico administrable con `pais`, `anio`,
  `porcentaje_ipc` (numeric 7,3; rango -100 a 100),
  `valor_upc_contributivo` (UPC contributivo, numeric 14,2) y
  `valor_upc_subsidiado` (UPC subsidiado, `0031`, nullable). Restricción única
  `(pais, anio)`.
- `public.ipc_seguimiento`: registro anual por contrato con `contrato_id`,
  `anio`, `costo_usuario`, `upc` (UPC contributivo, `0029`),
  `upc_subsidiado` (UPC subsidiado, `0030`) y `porcentaje_ipc`. Restricción
  única `(contrato_id, anio)` y borrado en cascada al eliminar el contrato.
- RLS: lectura para los tres roles de Contratación; escritura de
  `ipc_nacional` solo `superadmin`; escritura de `ipc_seguimiento` con alcance
  regional para `gerente_regional`.
- Triggers `*_set_updated_at` reutilizan `private.set_updated_at()`.

### Regla de comparación

- El comparativo usa siempre `ipc_nacional` con `pais = "Colombia"`
  (`PAIS_IPC_COMPARACION`) y el mismo año del registro.
- La comparación se hace redondeando a 3 decimales para evitar falsos
  negativos por punto flotante (`compararIpc` en `lib/ipc/constantes.ts`).
- Estados posibles: `debajo`, `igual`, `arriba` y `sin_referencia`.
- Los valores `debajo` se muestran en rojo (texto, ícono y badge) en la tabla y
  en las alertas del análisis.

### Rutas y UI

- `/ipc`: tabs por URL `Resumen` (`?tab` ausente) y `Gráficas y análisis`
  (`?tab=analisis`). El resumen incluye tarjetas, filtros por asegurador,
  contrato, regional y año, y la tabla comparativa.
- `/ipc/nuevo`: formulario con asegurador, contrato (agrupado por asegurador;
  los contratos fuera de ejecución se resaltan en naranja oscuro y llevan la
  etiqueta "No ejecución"), año, costo usuario, UPC contributivo, UPC
  subsidiado y % IPC.
- `/ipc/[id]/editar`: mismo formulario en modo edición; el listado permite
  eliminar con confirmación.
- `/configuracion/ipc-nacional` (solo `superadmin`): CRUD del histórico
  nacional con país, año, % IPC, valores de UPC contributivo y subsidiado, y
  fecha de actualización; formulario a ancho completo. La tabla de `/ipc`
  muestra las columnas UPC contributivo y UPC subsidiado del seguimiento.
- El sidebar agrega `Seguimiento IPC` en Contratación e `IPC Nacional` en
  Configuración.

### Archivos clave

- `lib/ipc/constantes.ts`, `lib/ipc/queries.ts`, `lib/ipc/agregaciones.ts`
- `lib/validations/ipc.ts`
- `app/(dashboard)/ipc/actions.ts`,
  `app/(dashboard)/configuracion/ipc-nacional/actions.ts`
- `components/ipc/*`, `components/ipc-nacional/*`
