# Project Context: planeacion_contratacion_v2

## Overview
Next.js 16.4.0 with App Router, TypeScript, and shadcn/ui component library. Supabase for backend services (Auth, Database, Storage).

## Tech Stack
- **Framework**: Next.js 16.4.0 (App Router)
- **Language**: TypeScript 5.x
- **UI**: shadcn/ui with Tailwind CSS 4.3.3
- **State**: React Hook Form + Zod validation
- **Backend**: Supabase (Postgres, Auth, RLS)
- **Components**: @base-ui/react, lucide-react icons

## Architecture
- App Router with `(dashboard)` protected route group
- Server Actions for mutations (create, edit, delete)
- Client components for interactivity
- Database-first approach: types generated from Supabase schema

## Modules
- **Capacidad instalada**: sedes, mapa de sedes, capacidad instalada, poblaciones.
- **Planeación**: infraestructura y personal (en construcción), indicadores y reglas (en construcción), frecuencias de uso.
- **Contratación**: contratos (`/contratos`), historial (`/historial`) y seguimiento IPC (`/ipc`).
  - Roles: `superadmin`, `analista_contratacion`, `gerente_regional` y `juridica` (solo lectura de contratos e historial en todas las regionales; sin Dashboard, IPC ni Prestadores/Aseguradores). Los roles de lectura total (`ceo`, `cfo`, `gerente_general`, `gerente_nacional`) también pueden ver contratos.
  - Gerente regional limitado a contratos de su `regional_id`.
  - Modalidades: `capita`, `especial`, `evento`, `integral`, `pgp`.
  - Eliminación lógica (`estado = 'inactivo'`).
  - `Contratos` muestra solo los contratos con `estado_ejecucion = "En ejecución"`; el resto (finalizados, terminados o sin estado) se lista en `Historial` (`/historial`).
  - Duplicado de contratos con sedes, programas y valores (RPC `duplicar_contrato`, migración `0026`); la copia nace activa con número nuevo y abre en edición.
  - `Seguimiento IPC` (`/ipc`) registra costo usuario, UPC contributivo, UPC subsidiado y % IPC por contrato y año (un registro por contrato+año), con tabs Resumen y Gráficas y análisis. Compara contra el IPC nacional de Colombia del mismo año y marca en rojo los valores por debajo. Incluye creación, edición y eliminación.
  - `IPC Nacional` (`/configuracion/ipc-nacional`, solo `superadmin`) administra el histórico por país y año (% IPC y valores de UPC contributivo y subsidiado); alimenta el comparativo.
  - Migraciones: `0018_modulo_contratos.sql`, `0022_contratos_campos_ampliados.sql`, `0023_agregar_categorias_contrato_adicionales.sql`, `0025_reconciliar_contratos.sql` (RLS endurecido y RPC transaccional de edición), `0026_duplicar_contrato.sql` y `0027_seguimiento_ipc.sql` + `0028_ipc_indices_created_by.sql` + `0029_ipc_seguimiento_upc.sql` + `0030_ipc_seguimiento_upc_subsidiado.sql` + `0031_ipc_nacional_upc_subsidiado.sql` + `0032_ipc_nacional_rename_upc_contributivo.sql`.
  - Rol `juridica`: `0054_rol_juridica_enum.sql`, `0055_rol_juridica_rls_lectura.sql` y `0056_rol_juridica_documentos_rls.sql`. Lectura de contratos/documentos en todas las regionales; sin políticas de escritura y con guards de servidor en acciones, formularios y cargue masivo.
- **Prestadores y contratos**: `/prestadores-contratos` (especialistas, contratos, servicios CUPS y sedes), migraciones `0045_modulo_direccionamiento.sql`, `0046_direccionamiento_regional_desde_sedes.sql`, `0047_direccionamiento_quitar_campos.sql` y `0049_renombrar_modulo_prestadores_contratos.sql` (renombre del módulo; la ruta antigua `/direccionamiento` ya no existe).
- **Aseguradores y Contratos**: `/aseguradores-contratos`, tabla global de servicios CUPS por asegurador/contrato con frecuencia de uso y CME; migraciones `0048_aseguradores_contratos.sql`, `0050_aseguradores_contratos_ajustes.sql` y `0051_cme_asegurador_opcional.sql`.
  - La frecuencia de uso contratada admite decimales sin escala fija; el CME se muestra con el label `CME Asegurador` y es opcional en `0051`.
  - Edición en línea de `cme_contratado`; el historial conserva los cambios anteriores. Las opciones de especialista (`primera_opcion_especialista_id`, `segunda_opcion_especialista_id`) se retiraron del formulario, la tabla y la base de datos en `0050`.
  - Permisos idénticos a Prestadores y contratos; la regional se deriva del contrato (principal + `contrato_regionales`).
  - `BuscadorCups` se reutiliza desde `components/prestadores-contratos/buscador-cups.tsx`.
  - `/aseguradores-contratos/nuevo` alterna entre registro individual y carga masiva (CSV/XLSX) para un mismo contrato: `cups_asegurador` y `cups_homologo` son obligatorios; frecuencia y CME son opcionales. Los duplicados se omiten y se reporta el detalle de filas rechazadas.

## Conventions
- All modules follow: **table + create button** pattern
- Components live in `components/ui/` (shared) and `components/[module]/` (module-specific)
- Types in `lib/types/` or inline within module folders
- Server actions in `app/(dashboard)/[module]/actions.ts`
- Queries in `lib/[module]/queries.ts`

## AI Development Guidelines
- Use `CONTEXT.md` for project state tracking
- Use `MEMORY.md` for conversation history and learned patterns
- New modules MUST use the standardized template in `STRUCTURE.md`
- Never create unique table designs - reuse `components/ui/standard-table`
- Always include a primary "Nuevo" button linking to `[module]/nuevo`