# Plan de implementación — Módulo Frecuencias de Uso

**Proyecto:** `planeacion_contratacion_v2` (Supabase ref `irlniztxypepdretcpsx`)  
**Estado:** Completado

## 1. Objetivo

Construir el módulo **Frecuencias de Uso** en v2 siguiendo el patrón estándar de módulos (`STRUCTURE.md`), incluyendo el catálogo de tipo de personal y el módulo de servicios. Permite registrar tipos de frecuencia (Nota técnica viva, Ejecución de servicios, Asegurador), asociados a servicios, con versión alfanumérica, frecuencia (decimal) y duración en minutos.

## 2. Cambios realizados

### Migración
- `supabase/migrations/0004_modulo_servicios_frecuencias.sql`
  - Extiende `catalogos_opciones.dominio` para incluir `tipo_personal`.
  - Crea `servicios` (nombre, grupo, area_id FK areas_catalogo, tipo_personal, activo, timestamps).
  - Crea `frecuencias_uso` (servicio_id FK servicios, tipo_frecuencia check, version alfanumérica, frecuencia numeric, duracion_minutos integer, activo, timestamps).
  - RLS y triggers, seed de tipos de personal.

### Catálogo tipo_personal (reutiliza sistema genérico)
- `lib/catalogos/dominios.ts`: agrega `tipo_personal` a `CatalogoDominio` y `CATALOGOS`.
- `app/(dashboard)/configuracion/tipos-personal/`: page.tsx, nuevo/page.tsx, [id]/page.tsx, [id]/editar/page.tsx (reutilizan componentes genéricos).

### Módulo Servicios (CRUD completo)
- `lib/servicios/queries.ts`
- `lib/validations/servicio.ts`
- `app/(dashboard)/servicios/actions.ts`, `page.tsx`, `nuevo/page.tsx`, `[id]/page.tsx`, `[id]/editar/page.tsx`
- `components/servicios/*`: servicios-contenido, servicios-tabla, servicio-form, servicio-acciones, servicio-nuevo-contenido, servicio-editar-contenido, servicio-detalle-contenido

### Módulo Frecuencias de Uso
- `lib/frecuencias/tipos.ts` (constantes, etiquetas)
- `lib/frecuencias/queries.ts`
- `lib/validations/frecuencia.ts`
- `app/(dashboard)/frecuencias/actions.ts`, `page.tsx`, `nuevo/page.tsx`, `[id]/page.tsx`, `[id]/editar/page.tsx`
- `components/frecuencias/*`: frecuencias-contenido, frecuencias-tabla, frecuencia-form, frecuencia-acciones, frecuencia-nuevo-contenido, frecuencia-editar-contenido, frecuencia-detalle-contenido

### Navegación
- `components/shell/nav-items.ts`: agrega Servicios y Frecuencias de uso a Planeación; agrega Tipos de personal a Configuración.

## 3. Detalles
- Tipos de frecuencia: nota_tecnica_viva, ejecucion_servicios, asegurador.
- Versión alfanumérica validada (inicia con alfanumérico, permite . _ -).
- Frecuencia almacenada como numeric (decimal grande).
- Duración en minutos (entero, > 0).
- Seguimiento estricto de patrones existentes (regionales).

## 4. Verificación
- `npx tsc --noEmit` OK
- `npm run build` OK (rutas nuevas generadas)
