# Plan de implementación — Módulo Sedes (v2)

**Proyecto:** `planeacion_contratacion_v2` (Supabase ref `irlniztxypepdretcpsx`)
**Estado:** Borrador para aprobación
**Depende de:** shell `(dashboard)`, auth por rol (`lib/auth/session.ts`), módulos `regionales` y `usuarios` (patrón de referencia).
**Referencia de diseño:** rediseño de sedes de v1 (`planeacion_contratacion`) + mockup `Sedes-html/Main.dc.html`.

---

## 1. Objetivo

Construir el módulo **Sedes** en v2 replicando el patrón estándar de módulos (`STRUCTURE.md`) y el rediseño aprobado de v1: listado con KPIs y filtros, formulario por secciones con chips, vista de detalle, import/export y **cierre suave** (nunca `DELETE`).

La base v2 hoy solo tiene `public.regionales` y `public.usuarios`. Por lo tanto, a diferencia de v1 (donde `sedes` ya existía desde FEAT-02), aquí hay que **crear el esquema completo de sedes** desde cero.

## 2. Alcance

**Incluye:**
- Migración SQL: `sedes`, `area_categorias`, `areas_catalogo`, `sedes_areas`, `aseguradores_eps`, `sedes_aseguradores`, `catalogos_opciones` + RLS + seed idempotente.
- Capa de datos `lib/sedes/queries.ts`: listado con filtros y agregados por área, `getSede(id)`, resumen de KPIs, valores únicos para filtros.
- Validaciones `lib/validations/sede.ts` (Zod).
- Server actions `app/(dashboard)/sedes/actions.ts` (crear, actualizar, cerrar).
- UI por módulo según patrón obligatorio: `page.tsx`, `nuevo/`, `[id]/`, `[id]/editar/` y componentes en `components/sedes/`.
- Listado con 4 KPIs, filtros (buscar, departamento, regional, marca, estado) y columnas del rediseño.
- Formulario por secciones con chips; detalle de solo lectura.
- Import/export (CSV/Excel) con `pais` y `capacidad_inicial`.
- Ítem de navegación "Sedes".

**No incluye (fuera de este alcance):**
- RLS fina por regional / restricción de lectura por rol regional (se difiere a un feature de permisos).
- Módulo de catálogos gestionables en UI (los seeds se cargan por migración; la gestión en `/configuracion` puede ser un feature posterior).
- Población, notas técnicas, contratos y reportes/dashboards.
- E2E automatizado si se decide no incorporar Playwright a v2 (v2 hoy no tiene `test:e2e`).

## 3. Decisiones de arquitectura

| Decisión | Elección | Por qué |
| --- | --- | --- |
| Patrón de módulo | Seguir `STRUCTURE.md` al pie de la letra | Requisito de revisión; sin tablas únicas |
| Acceso a datos | `createAdminClient()` en `lib/sedes/queries.ts` (como `regionales`/`usuarios`) | Consistente con v2; la RLS se define igual para defensa en profundidad |
| Guard de escritura | `requireSuperadmin()` en las actions | v2 no tiene rol "Analista Planeación"; se usa el guard existente |
| Listado vs. `standard-table` | Usar `components/ui/table.tsx` (como `regionales-tabla`), manteniendo el header/KPIs con el patrón de `page.tsx` | v2 ya usa `Table` directo en módulos; `standard-table` aún no se usa en producción |
| Formulario | Páginas dedicadas `nuevo` y `[id]/editar` (como `regionales`) | Muchos campos + checklist de áreas no caben en modal |
| Eliminación | **Cierre suave**: `estado='inactiva'` + `fecha_cierre` | Conserva históricos y FKs futuras; nunca `DELETE` |
| Estado de sede | 3 valores: `activa` / `en_apertura` / `inactiva` | Rediseño aprobado v1 |
| Capacidad | `capacidad_inicial` (diseño/arranque) y `capacidad_usuarios` (actual) | Rediseño aprobado v1 |
| Import/export | CSV/Excel con columnas tolerantes a acentos | Rediseño aprobado v1 |

## 4. Modelo de datos

Migración propuesta: `supabase/migrations/0001_modulo_sedes.sql` (y aplicarla vía MCP con `apply_migration` cuando esté disponible).

```sql
-- helper de rol adaptado a v2 (usuarios.rol es text)
create or replace function public.is_rol(rol_nombre text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.usuarios u
    where u.id = (select auth.uid()) and u.rol = rol_nombre
  );
$$;

create table public.sedes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  codigo_reps text,
  departamento text, municipio text, barrio text, direccion text,
  pais text default 'Colombia',
  latitud numeric, longitud numeric,
  gerente text, fecha_apertura date,
  regional text, zonal text, marca text, nivel text, tipo_ips text,
  estado text not null default 'activa'
    check (estado in ('activa','en_apertura','inactiva')),
  fecha_cierre date,
  metros_cuadrado numeric,
  capacidad_inicial integer check (capacidad_inicial >= 0),
  capacidad_usuarios integer,
  numero_pisos integer check (numero_pisos >= 1),
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- índices: regional, estado, marca, nombre

create table public.area_categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique, activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.areas_catalogo (
  id uuid primary key default gen_random_uuid(),
  nombre text not null, categoria text not null,
  etiquetas text[] not null default '{}',
  mide_capacidad_ocupacion boolean not null default false,
  created_at timestamptz not null default now(),
  unique (categoria, nombre)
);

create table public.sedes_areas (
  id uuid primary key default gen_random_uuid(),
  sede_id uuid not null references public.sedes(id) on delete cascade,
  area_id uuid not null references public.areas_catalogo(id) on delete cascade,
  cantidad integer not null default 1 check (cantidad >= 1),
  created_at timestamptz not null default now(), unique (sede_id, area_id)
);

create table public.aseguradores_eps (
  id uuid primary key default gen_random_uuid(),
  nombre_eps text not null unique, codigo text not null,
  estado text not null default 'activo' check (estado in ('activo','inactivo')),
  created_at timestamptz not null default now()
);

create table public.sedes_aseguradores (
  id uuid primary key default gen_random_uuid(),
  sede_id uuid not null references public.sedes(id) on delete cascade,
  asegurador_eps_id uuid not null references public.aseguradores_eps(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (sede_id, asegurador_eps_id)
);

create table public.catalogos_opciones (
  id uuid primary key default gen_random_uuid(),
  dominio text not null check (dominio in ('regional','zonal','marca','nivel','tipo_ips')),
  nombre text not null, activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), unique (dominio, nombre)
);
```

**RLS:** lectura `authenticated`; escritura `using/with check ((select public.is_rol('superadmin')))` en todas las tablas. Trigger `updated_at` en `sedes`, `area_categorias`, `catalogos_opciones`.

**Seed idempotente (`on conflict do nothing`):**
- `area_categorias`: Consultorios, Espacios Generales, Laboratorio, Imágenes, Línea de Frente, Odontología, Terapias, Procedimientos.
- `catalogos_opciones`: marcas (VIVA 1A, SOS, Nueva EPS, Compensar, Sura, Otra), niveles (Primario, Imagenología), tipos IPS (Primaria, Central de Especialistas), regionales y zonales.
- `areas_catalogo`: set inicial de áreas (incluye las categorías `Consultorios` y `Odontología` con `mide_capacidad_ocupacion=true`).
- `aseguradores_eps`: set inicial si aplica.

## 5. Estructura de archivos (patrón obligatorio v2)

```
supabase/migrations/0001_modulo_sedes.sql
lib/
  sedes/
    queries.ts            # listSedes(filtros), getSede(id), resumenSedes(filtros), listOpcionesFiltros()
    estados.ts            # SEDE_ESTADOS, etiqueta/variante de estado
    importar.ts           # parseo CSV/Excel + action de importación
  validations/
    sede.ts               # sedeSchema
app/(dashboard)/sedes/
  page.tsx                # header + "Nueva sede" + Suspense
  actions.ts              # crearSede, actualizarSede, cerrarSede, importarSedes
  nuevo/page.tsx
  [id]/page.tsx           # detalle (solo lectura)
  [id]/editar/page.tsx
components/
  sedes/
    sedes-contenido.tsx   # server: requireSuperadmin + queries
    sedes-tabla.tsx       # KPIs + tabla + filtros (client wrapper)
    sede-filtros.tsx      # client (usa useSearchParams, patrón usuario-filtros)
    sede-form.tsx         # client (RHF + Zod)
    sede-nuevo-contenido.tsx
    sede-editar-contenido.tsx
    sede-detalle-contenido.tsx
    sede-acciones.tsx     # dropdown ver/editar/cerrar
    importar-sedes.tsx    # modal de importación
  shared/
    choice-chips.tsx      # grupo de chips selección única (reutilizable)
components/shell/nav-items.ts   # agregar ítem "Sedes"
```

## 6. Fases y backlog

### Fase 0 — Esquema y tipos
- [ ] **SED-001** Migración `0001_modulo_sedes.sql` (tablas + RLS + triggers + seed) y aplicarla vía MCP.
- [ ] **SED-002** Regenerar tipos (`supabase gen types typescript`) o declarar tipos de fila en `lib/sedes/queries.ts`.

### Fase 1 — Datos y validación
- [ ] **SED-003** `lib/sedes/estados.ts` (`SEDE_ESTADOS`, `etiquetaEstadoSede`, `varianteEstadoSede`: activa→success, en_apertura→warning, inactiva→destructive).
- [ ] **SED-004** `lib/validations/sede.ts` (`sedeSchema`: lat/lng en rango, numéricos ≥ 0, fechas coherentes, estado enum de 3 valores).
- [ ] **SED-005** `lib/sedes/queries.ts`:
  - `listSedes(filtros)` con agregados por categoría (`Consultorios`, `Odontología`).
  - `resumenSedes(filtros)` → totales: sedes, Σ `capacidad_usuarios`, Σ `capacidad_inicial`, Σ consultorios, Σ unidades odontológicas.
  - `getSede(id)` con áreas y aseguradores asignados.
  - `listOpcionesFiltros()` (departamentos, regionales, marcas, estados usados).

### Fase 2 — Server actions
- [ ] **SED-006** `app/(dashboard)/sedes/actions.ts`: `crearSede`, `actualizarSede` (sincroniza `sedes_areas`/`sedes_aseguradores` con delete + insert del set), `cerrarSede` (soft), con `requireSuperadmin()` y `revalidatePath("/sedes")`.

### Fase 3 — Listado
- [ ] **SED-007** `page.tsx` con header + botón "Nueva sede" + Suspense.
- [ ] **SED-008** `sedes-tabla.tsx`: 4 KPIs; columnas Sede / Regional / Marca / Cap. inicial / Cap. actual / m² / Consultorios / Unid. odontológicas / Estado / Acciones.
- [ ] **SED-009** `sede-filtros.tsx`: Buscar / Departamento / Regional / Marca / Estado (patrón `usuario-filtros`, query params).
- [ ] **SED-010** `sede-acciones.tsx`: dropdown Ver / Editar / Cerrar sede (conservar "Cerrar sede").

### Fase 4 — Formulario y detalle
- [ ] **SED-011** `components/shared/choice-chips.tsx` (chips de selección única con input oculto).
- [ ] **SED-012** `sede-form.tsx` en secciones: Identificación / Ubicación / Organización / Área y capacidad / Áreas de la sede / Aseguradores / Observaciones; `regional` y `zonal` deshabilitados para Gerente Regional (regla de rol).
- [ ] **SED-013** Rutas `nuevo/`, `[id]/editar/`, `[id]/` (detalle con País y Capacidad inicial y badge de 3 estados).

### Fase 5 — Import / export
- [ ] **SED-014** Import CSV/Excel (columnas con `pais` y `capacidad_inicial`; duplicados por nombre → update solo de campos llenos; valores de catálogo inexistentes → fila omitida y reportada).
- [ ] **SED-015** Export con etiqueta de estado de 3 valores y encabezado "Capacidad actual".

### Fase 6 — Navegación y cierre
- [ ] **SED-016** `components/shell/nav-items.ts`: ítem "Sedes" (icono `Building2` o `MapPin`) con roles correspondientes.
- [ ] **SED-017** Verificación final (lint/tsc/build) y checklist manual funcional.

## 7. Detalle de UI

**KPIs del listado:** Sedes · Capacidad actual (con delta vs. inicial) · Consultorios · Unidades odontológicas.

**Formulario (secciones):**
| Sección | Campos |
| --- | --- |
| Identificación | nombre\*, código REPS, marca\*, nivel, tipo_ips\* (chips) |
| Ubicación | país, departamento, municipio, barrio, dirección, latitud, longitud |
| Organización | gerente, fecha_apertura, regional, zonal, estado\*, fecha_cierre (si inactiva) |
| Área y capacidad | metros_cuadrado, capacidad_inicial, capacidad_usuarios, numero_pisos |
| Áreas de la sede | checklist de `areas_catalogo` agrupado por categoría + cantidad |
| Aseguradores | checklist de `aseguradores_eps` |
| Observaciones | observaciones |

`*` requerido. Marca VIVA (azul `#00A0DC` / verde `#74B900`); **no** usar el teal del mockup.

## 8. Roles y seguridad

- Escritura: `requireSuperadmin()` (rol `superadmin`). Lectura: usuarios autenticados.
- RLS en BD con `public.is_rol('superadmin')` como defensa en profundidad.
- Gerente Regional: regional/zonal fijas y deshabilitadas en el formulario.
- Sin secretos en cliente; `SUPABASE_SERVICE_ROLE_KEY` solo en server.

## 9. Verificación

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- Revisión funcional manual (checklist):
  - Crear/editar sede con áreas y aseguradores.
  - Filtros (buscar, departamento, regional, marca, estado) + KPIs del conjunto filtrado.
  - Cierre suave: `estado='inactiva'` + `fecha_cierre`, sin `DELETE`.
  - Import CSV/Excel; export con `pais`/`capacidad_inicial`.
  - Guard: usuario no superadmin no puede escribir.
- `supabase_get_advisors` (security) tras la migración: sin hallazgos nuevos.

## 10. Bloqueos y riesgos

- **MCP Supabase:** la sesión actual responde `MCP error -32600: You do not have permission to perform this action`. La config apunta a v2 (`irlniztxypepdretcpsx`), pero requiere **reiniciar opencode** para reconectar. Sin MCP no se puede aplicar la migración `SED-001`.
- **Sin `supabase/` ni migraciones locales en v2:** la migración se crea desde cero; no hay historial previo que respetar.
- **Sin suite E2E en v2:** decidir si se incorpora Playwright (feature aparte) o se valida manualmente.
- **`standard-table.tsx`** existe pero no se usa en módulos productivos; se decide usar `components/ui/table.tsx` como `regionales`, documentándolo.

## 11. Definition of Done

- [ ] Migración de sedes aplicada en v2 y `sedes` con datos consultables.
- [ ] Módulo sigue el patrón de `STRUCTURE.md` (header + botón Nuevo + Suspense; sin tablas únicas).
- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` en verde.
- [ ] Listado con 4 KPIs, filtros y columnas del rediseño.
- [ ] Formulario por secciones con chips; detalle con País y Capacidad inicial.
- [ ] Import/export con `pais` y `capacidad_inicial`.
- [ ] Cierre suave verificado (sin `DELETE`).
- [ ] Guard de rol verificado.
- [ ] `supabase_get_advisors` sin hallazgos nuevos.

## 12. Estado de ejecución (implementado en esta iteración)

**Código: completo.** Archivos creados/actualizados:

- `supabase/migrations/0001_modulo_sedes.sql` — esquema, RLS (`private.is_rol('superadmin')`), triggers y seed. **Aplicado en la base v2 (migración `modulo_sedes`).**
- `lib/sedes/estados.ts`, `lib/sedes/queries.ts`, `lib/sedes/importar.ts`.
- `lib/validations/sede.ts`.
- `app/(dashboard)/sedes/actions.ts` (crear/actualizar/cerrar/importar).
- `app/(dashboard)/sedes/page.tsx`, `nuevo/page.tsx`, `[id]/page.tsx`, `[id]/editar/page.tsx`, `exportar/route.ts`.
- `components/sedes/{sedes-contenido,sedes-tabla,sede-filtros,sede-acciones,sede-form,sede-nuevo-contenido,sede-editar-contenido,sede-detalle-contenido,sede-herramientas}.tsx`.
- `components/shared/choice-chips.tsx`.
- `components/shell/nav-items.ts` — ítem "Sedes" (grupo Operación).

**Verificación:** `npx tsc --noEmit` sin errores · `npm run build` en verde (rutas `/sedes*` compiladas) · `eslint` sobre el módulo sin errores.

**Pendiente / ajustes:**
- **SED-001 aplicado:** `0001_modulo_sedes.sql` ejecutado en v2 vía MCP (`modulo_sedes`). Ajuste: `private.is_rol` usa `u.rol::text` porque `usuarios.rol` es el enum `public.usuario_rol`. Advisors de seguridad sin hallazgos nuevos del módulo (2 warnings preexistentes: `public.es_superadmin` SECURITY DEFINER y leaked-password protection).
- **SED-014 cubierto para CSV y Excel:** `lib/sedes/importar-excel.ts` (`parseExcel` con `xlsx`) + selector `.csv,.xlsx,.xls` en `sede-herramientas.tsx`. Export permanece en CSV.
- Regla de rol "Gerente Regional con regional bloqueada": no aplicable hoy porque el formulario exige `superadmin`; queda para el feature de permisos regionales.

