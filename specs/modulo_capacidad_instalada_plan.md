# Plan de implementación — Módulo Análisis de capacidad instalada

**Proyecto:** `planeacion_contratacion_v2` (Supabase ref `irlniztxypepdretcpsx`)
**Estado:** En ejecución
**Depende de:** módulos `sedes`, `poblaciones`, `aseguradores` (datos existentes).
**Referencia de diseño:** mockup `Análisis de capacidad instalada (1).html` (raíz del repo).

---

## 1. Objetivo

Módulo de solo lectura **"Análisis de capacidad instalada"** en `/capacidad-instalada` con dos pestañas:

1. **Infraestructura** (default): capacidad física instalada por área (`sedes_areas.cantidad_habilitada`) vs. población, con KPIs y tabla por área.
2. **por Población**: ocupación de sedes (población activa/pagada/certificada vs. capacidad inicial/actual) con tarjetas de categoría y tablas jerárquicas expandibles.

Sin migraciones: consume datos existentes de `sedes`, `sedes_areas`/`areas_catalogo`, `poblacion_aseguradora`, `aseguradores_eps`.

## 2. Alcance

**Incluye:**
- Ítem de navegación "Análisis de capacidad instalada" en grupo Planeación, debajo de "Mapa de sedes" (`components/shell/nav-items.ts`).
- Ruta `/capacidad-instalada` con `?tab=infraestructura|poblacion` (default `infraestructura`).
- Capa de datos `lib/capacidad/queries.ts` (fetch con `createAdminClient`) + `lib/capacidad/agregaciones.ts` (funciones puras).
- UI en `components/capacidad-instalada/`: tabs, filtros URL-sync, tarjetas KPI, tabla por área, tablas jerárquicas expandibles, multiselect de áreas.
- Guard `requireSuperadmin()` (consistente con sedes/poblaciones).

**No incluye:**
- Tabla "Talento humano" (vista oculta del mockup, sin pestaña).
- Columnas *Capacidad por planeación* / *por ejecución*: se muestran con `—` hasta que exista un módulo de contratación que las alimente.
- Migraciones o tablas nuevas.

## 3. Decisiones de arquitectura

| Decisión | Elección | Por qué |
| --- | --- | --- |
| Ruta | `/capacidad-instalada` (ruta propia) | Aprobado por usuario; no es sub-recurso de sedes |
| Estado de filtros | URL `searchParams` con prefijos `i_*` (infra) y `p_*` (población) | Patrón del repo (filtros URL-sync) y preserva el estado de cada pestaña al cambiar de tab |
| Capacidad por área | `sedes_areas.cantidad_habilitada` | Unidades realmente habilitadas (consistente con el concepto del mapa) |
| Áreas del multiselect | Áreas de `areas_catalogo` con al menos una asignación en `sedes_areas` | "Solo van a quedar esas": las ya creadas para el informe |
| Tabla EPS›Regional›Sede | Capacidad = total de la sede (no se reparte entre EPS); % = porción de la capacidad usada por esa EPS | La capacidad no está atribuida por EPS en el modelo real |
| Umbrales de categoría | Sin capacidad `≥100%` (o sin capacidad registrada), Cerca del límite `>80%`, Disponible `≤80%` | Fidelidad al mockup (distintos a los del mapa) |
| Datos | Fetch único por pestaña + filtrado/agregación en funciones puras | Volumen pequeño; testeable y consistente con `ocupacion.ts` |
| Sedes | Sin filtro de estado (como el mapa) | Consistencia con módulo existente |

## 4. Modelo de datos (sin migración)

Fuentes existentes:
- `sedes`: `nombre`, `regional`, `capacidad_inicial`, `capacidad_usuarios`.
- `sedes_areas` + `areas_catalogo`: `cantidad`, `cantidad_habilitada`, `nombre`, `categoria`.
- `poblacion_aseguradora`: `poblacion_activa`, `poblacion_pagada`, `poblacion_certificada`, FK `aseguradores_eps`.

## 5. Estructura de archivos

```
app/(dashboard)/capacidad-instalada/page.tsx
components/capacidad-instalada/
  capacidad-contenido.tsx      (server: guard + fetch por tab)
  capacidad-tabs.tsx           (client: pestañas ?tab=)
  multi-select.tsx             (client: dropdown con checkboxes)
  poblacion/
    pob-vista.tsx              (client: compone vista)
    pob-filtros.tsx            (regional, sede, EPS, capacidad, población)
    pob-tarjetas.tsx           (KPIs + 3 categorías clickeables + chip)
    pob-tabla-jerarquia.tsx    (tabla colapsable País/EPS › Regional › Sede)
  infraestructura/
    infra-vista.tsx
    infra-filtros.tsx          (regional, sede, áreas multiselect, tipo población)
    infra-tarjetas.tsx
    infra-tabla.tsx            (áreas + fila Total)
lib/capacidad/
  queries.ts                   (types + fetch createAdminClient)
  agregaciones.ts              (funciones puras: jerarquía, ocupación, categorías)
```

**Edita:** `components/shell/nav-items.ts` (ítem tras "Mapa de sedes", icono `BarChart3`).

## 6. Fases y backlog

- **CAP-001 (F0):** Spec + ítem de navegación.
- **CAP-002 (F1):** `lib/capacidad/queries.ts` y `agregaciones.ts`.
- **CAP-003 (F2):** Pestaña Infraestructura (default): filtros, tarjetas (Población Activa/Pagada, Capacidad Actual; planeación/ejecución en `—`), tabla por área con Total, multiselect.
- **CAP-004 (F3):** Pestaña por Población: filtros cascada, KPIs, tarjetas-categoría clickeables, chip de filtro activo, tablas jerárquicas con expandir/contraer todo.
- **CAP-005 (F4):** Verificación: `npm run lint`, `npx tsc --noEmit`, `npm run build` + checklist.

## 7. Detalle de UI

### Pestaña Infraestructura
- Filtros: Regional (Todas), Sede (Todas, cascade por regional), Áreas (multiselect, todas marcadas por defecto), Tipo de población (Activa | Pagada | Personalizada + input numérico).
- Tarjetas: Población Activa, Población Pagada, Capacidad Actual, Capacidad por planeación (`—`), Capacidad por Ejecución (`—`), Diferencia Actual−Planeación (`—`), Diferencia Actual−Ejecución (`—`). Con Personalizada: tarjeta extra "Población personalizada".
- Tabla: Áreas | Capacidad Actual | Cap. por planeación | Cap. por Ejecución | Dif. (Actual−Planeación) | Dif. (Actual−Ejecución) + fila Total (resaltada).

### Pestaña por Población
- Filtros: Regional (Todas), Sede (Todas, cascade), EPS (Todas), Capacidad de la sede (Inicial | Actual), Población (Activa | Pagada | Certificada).
- Tarjetas: Total capacidad, Población, % ocupación global + 3 categorías clickeables (Sin capacidad ≥100%, Cerca del límite >80%, Disponible ≤80%) que filtran las tablas; chip "Filtrando por: … ✕".
- Tablas (con Expandir/Contraer todo):
  1. País › Regional › Sede — Capacidad | Población | % Ocupación (pill) | Disponibilidad.
  2. EPS › Regional › Sede — mismas columnas (capacidad = total de la sede).

## 8. Roles y seguridad

- Lectura vía `createAdminClient()` en server components (patrón del repo).
- `requireSuperadmin()` al inicio de `CapacidadContenido`.

## 9. Verificación

- `npm run lint`, `npx tsc --noEmit`, `npm run build` sin errores.
- Checklist: pestaña default Infraestructura; cambio de tab preserva filtros de cada tab; cascada regional→sede; categorías filtran tablas y muestran chip; expandir/contraer todo; planeación/ejecución en `—`; ítem visible solo para superadmin.
