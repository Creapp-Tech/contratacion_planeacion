# Plan de implementación — Mapa de sedes, ocupación y módulo de poblaciones (v2)

**Fecha:** 2026-10-15
**Estado:** en ejecución

## Objetivo

1. Ver la ubicación de las sedes en un **mapa interactivo** con filtros y **tooltips** que muestran la ocupación en %.
2. **Gráficos de ocupación** por sede (población asignada vs. capacidad actual).
3. **Cards/resumen** para mejor visualización de los totales.
4. **Tabla de poblaciones por sede** (población asignada por sede + asegurador) como módulo independiente para cargar/editar los datos.

## Decisiones acordadas

| Tema | Decisión |
|---|---|
| Estructura de población | Una fila por **sede + asegurador** (`unique (sede_id, asegurador_eps_id)`). La ocupación de la sede = `Σ población / capacidad_usuarios` |
| Carga de datos | **Página independiente** `/poblaciones` con tabla + "Nueva población" + editar/eliminar |
| Gráficos | **Recharts** (barras apiladas por sede + donut global) |
| UI del mapa | **Página aparte** `/sedes/mapa`, enlazada en el sidebar grupo **Planeación** |
| Filtros del mapa | Regional · Zonal · Asegurador · Sede (vía `searchParams`) |
| Datos geográficos | Ya existen: `sedes.latitud` / `sedes.longitud` (formulario de sede) |

## Fórmula de ocupación

```
ocupacion_pct = (Σ poblacion(sede) / capacidad_usuarios) * 100
```

- `capacidad_usuarios` = columna existente "Capacidad actual".
- Sin capacidad cargada → `null` (se muestra "—", color gris).
- ≥ 100 % → "Saturada" (rojo). 50–99 % → "Óptima" (verde). < 50 % → "Baja" (ámbar).

## Cambios de base de datos

### `supabase/migrations/0003_modulo_poblaciones.sql`

```sql
create table public.sedes_poblaciones (
  id uuid primary key default gen_random_uuid(),
  sede_id uuid not null references public.sedes(id) on delete cascade,
  asegurador_eps_id uuid not null references public.aseguradores_eps(id) on delete cascade,
  poblacion integer not null check (poblacion >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sede_id, asegurador_eps_id)
);
```

- Índices FK: `sedes_poblaciones (sede_id)`, `sedes_poblaciones (asegurador_eps_id)` + índice `sedes (zonal)` (filtro nuevo).
- Trigger `set_updated_at` (patrón `private.set_updated_at()`).
- RLS: mismo patrón de `0001` (select a `authenticated`; escritura solo `superadmin` vía `private.is_rol`).
- Seed idempotente: población de ejemplo para la sede `ALQUERIA` (28.560 usuarios entre los 4 aseguradores).
- **Pendiente de aplicación:** no hay CLI de Supabase/psql en el entorno → ejecutar el SQL en el editor de Supabase antes de usar el mapa.

## Archivos nuevos

### Módulo poblaciones (patrón STRUCTURE.md)

```
lib/validations/poblacion.ts            # zod: sede_id, asegurador_eps_id, poblacion >= 0
lib/poblaciones/queries.ts              # listPoblaciones, getPoblacion, opcionesPoblaciones, resumen
lib/poblaciones/actions.ts              # crearPoblacion, actualizarPoblacion, eliminarPoblacion
app/(dashboard)/poblaciones/page.tsx    # tabla + botón "Nueva población"
app/(dashboard)/poblaciones/nuevo/page.tsx
app/(dashboard)/poblaciones/[id]/editar/page.tsx
components/poblaciones/
  ├─ poblaciones-contenido.tsx
  ├─ poblaciones-tabla.tsx              # Sede · Regional · Zonal · Asegurador · Población · Cap. sede · % ocupación
  ├─ poblacion-form.tsx                 # selects Sede/Asegurador + número
  ├─ poblacion-acciones.tsx             # editar / eliminar (confirm dialog)
  ├─ poblacion-nuevo-contenido.tsx
  └─ poblacion-editar-contenido.tsx
```

### Mapa y ocupación

```
lib/sedes/ocupacion.ts                  # listSedesMapa(filtros), opcionesMapa(), resumenMapa(),
                                        # colorOcupacion(), calcularOcupacion(), formatoPct()
app/(dashboard)/sedes/mapa/page.tsx     # /sedes/mapa (ruta estática, precede a [id])
components/sedes/mapa/
  ├─ sedes-mapa-contenido.tsx           # server: datos + composición
  ├─ mapa-filtros.tsx                   # client: Regional · Zonal · Asegurador · Sede + Limpiar
  ├─ mapa-tarjetas.tsx                  # cards: sedes · capacidad · población · ocupación global
  ├─ mapa-sedes.tsx                     # client: dynamic(ssr:false) + leyenda + estados vacíos
  ├─ mapa-leaflet.tsx                   # MapContainer, CircleMarker, Tooltip con datos en %
  └─ mapa-graficos.tsx                  # recharts: barras apiladas por sede + donut global
```

### Sidebar

- `components/shell/nav-items.ts`: grupo **Planeación** → `Sedes`, `Mapa de sedes` (`/sedes/mapa`), `Poblaciones` (`/poblaciones`).

## Plan de trabajo

- [x] **F1** Migración `0003` (tabla, índices, RLS, seed)
- [x] **F2** Validaciones + queries + actions de poblaciones
- [x] **F3** Módulo `/poblaciones` (tabla, KPIs, form, acciones)
- [x] **F4** `lib/sedes/ocupacion.ts` (datos del mapa + colores)
- [x] **F5** Página `/sedes/mapa`: filtros + cards
- [x] **F6** Mapa Leaflet con tooltips de ocupación
- [x] **F7** Gráficos recharts (barras + donut)
- [x] **F8** Nav sidebar
- [x] **F9** `eslint` + `next build`
- [ ] **F10** Aplicar `0003_modulo_poblaciones.sql` en Supabase (manual)

## Criterios de aceptación

1. `/sedes/mapa` muestra un punto por sede con coordenadas; al pasar el cursor aparece el tooltip con sede, población, capacidad y **ocupación en %**.
2. Filtros Regional/Zonal/Asegurador/Sede actualizan mapa, cards y gráficos (URL con `searchParams`).
3. Cards: sedes en el mapa, capacidad total, población asignada, ocupación global.
4. Gráficos: barras por sede (población vs. disponible) y donut global, con tooltips.
5. `/poblaciones` permite crear/editar/eliminar población por sede+asegurador; la tabla muestra el % de ocupación de la sede.
6. El sidebar queda: Inicio → Planeación (Sedes, Mapa de sedes, Poblaciones) → Configuración → Administración.
