# Plan: Gestión de grupos de áreas desde /configuracion/areas

## Contexto

- Los grupos de áreas viven en `public.area_categorias` (`nombre` único, `activo`), sembrados en `0001_modulo_sedes.sql:200`.
- `listGrupos()` (`lib/areas/queries.ts:76`) alimenta el select de grupo del formulario de áreas, filtrando por `activo` (`components/areas/area-form.tsx:110`).
- **No existe UI ni action para crear/editar grupos**; solo seed + select.
- `areas_catalogo.categoria` es texto libre (no FK), así que un rename debe propagarse a las áreas existentes.
- RLS ya permite insert/update a superadmin en `area_categorias` (`0001_modulo_sedes.sql:175-186`) y las actions usan `createAdminClient` → **no se requiere migración**.
- Decisión del usuario: botón "Nuevo grupo" en la página de Áreas que abre un diálogo (crear y gestionar los existentes).

## Alcance

1. **Crear** un grupo nuevo (nombre único).
2. **Renombrar** un grupo, propagando el cambio a `areas_catalogo.categoria` de las áreas que lo usen.
3. **Activar/desactivar** un grupo (los desactivados dejan de aparecer en el select del formulario de área).
4. **No eliminar** grupos (evita romper el naming de áreas); se desactivan.

## Cambios por archivo

### Nuevo: `lib/validations/grupo-area.ts`
- `grupoAreaSchema`: `{ nombre: string.trim().min(1).max(100) }` (estilo `lib/validations/area.ts`).
- Exporta `GrupoAreaInput`.

### Nuevo: `components/ui/dialog.tsx`
- Wrapper de `@base-ui/react/dialog` (ya en deps: `@base-ui/react@^1.9.0`), copiando las convenciones de `components/ui/alert-dialog.tsx` (data-slot, clases animate-in/out, `size` default/sm).
- Exporta: `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`, `DialogClose` (+ `DialogContent` con `open/onOpenChange` controlado).

### Edit: `lib/areas/queries.ts`
- `GrupoArea` pasa a incluir `id: string`.
- `listGrupos()` selecciona `id, nombre, activo`.

### Edit: `app/(dashboard)/configuracion/areas/actions.ts`
Agregar tres server actions (mismo patrón que `crearArea`, con `requireSuperadmin`, zod y `mensajeError` para 23505):
- `crearGrupoArea(input: GrupoAreaInput)` → insert en `area_categorias`; 23505 → "Ya existe un grupo con ese nombre."
- `renombrarGrupoArea(id: string, nombre: string)` → update de `area_categorias` + update en cascada `areas_catalogo.categoria = nuevo` donde `categoria = viejo`; valida schema y unicidad.
- `cambiarEstadoGrupoArea(id: string, activo: boolean)` → update del flag.
- Todas con `revalidatePath("/configuracion/areas", "layout")` (cubre listado, nuevo y editar).

### Nuevo: `components/areas/grupo-herramientas.tsx` (client)
- Botón outline **"Nuevo grupo"** (icono `TagsIcon` o `PlusIcon`) que abre el `Dialog`.
- Dentro del diálogo:
  - Formulario con `Input` + botón "Crear" (state pending), llamando `crearGrupoArea`; en éxito limpia el input, muestra confirmación y `router.refresh()`.
  - Debajo, lista de grupos existentes (`props: grupos: GrupoArea[]`):
    - Nombre + `Switch` de activo (llama `cambiarEstadoGrupoArea`).
    - Botón de renombrar: al hacer clic el nombre se vuelve `Input` editable con botón guardar (llama `renombrarGrupoArea`).
  - Errores en `Alert variant="destructive"` (convención de `servicio-herramientas.tsx`).
- El select de áreas se actualiza solo al entrar al formulario de área (se consulta en el server component `area-nuevo-contenido.tsx`).

### Edit: `components/areas/areas-contenido.tsx`
- Fetch adicional `listGrupos()` (en `Promise.all` con `listAreas()`).
- Fila de encabezado: h2 existente + `<GrupoHerramientas grupos={grupos} />` alineado a la derecha (mismo layout flex justify-between que la página).

## Verificación

1. `npx tsc --noEmit`
2. `npx eslint lib/areas lib/validations/grupo-area.ts components/areas components/ui/dialog.tsx "app/(dashboard)/configuracion/areas/actions.ts"`
3. `npm run build`
4. Prueba manual sugerida: crear grupo "Prueba", verificar que aparece en el select al crear área, renombrar y comprobar que las áreas existentes cambian de grupo, desactivar y confirmar que desaparece del select.

## Fuera de alcance

- Eliminar grupos (solo desactivar).
- Migraciones o cambios de RLS (ya soportados).
- Mover grupos al módulo de catálogos genérico (`catalogos_opciones`); `area_categorias` se mantiene como tabla propia.
