# Development Plan

## Phase 1: Foundation (Current)
- [x] Create context files (CONTEXT.md, MEMORY.md, PLANS.md)
- [x] Create STRUCTURE.md with module pattern
- [x] Create standardized components (standard-table, standard-create-btn)
- [ ] Extract existing usuarios module to follow new pattern
- [ ] Create module scaffolding utility

## Phase 2: Module Standardization
- [ ] Convert usuarios module to standardized template
- [ ] Create regionales module following pattern
- [ ] Create proyectos module following pattern
- [ ] Add authentication middleware to all dashboard routes

## Phase 3: Contratación
- [x] Crear migración `0018_modulo_contratos.sql`
- [x] Crear constantes, validación Zod, queries y server actions
- [x] Agregar guards de acceso y alcance por regional
- [x] Crear listado, filtros, tabla y acciones
- [x] Crear formulario compartido y rutas de crear/ver/editar
- [x] Agregar grupo "Contratación" al sidebar
- [x] Aplicar migración en Supabase
- [x] Ampliar contratos con catálogos, sedes, programas, valores por régimen, vigencia y notas (migración 0022)
- [x] Aplicar migraciones 0022 y 0012 en Supabase y corregir desplegables, sedes por regional e hidratación de valores
- [x] Auditar y corregir queries, filtros, detalle y opciones del listado de contratos
- [x] Validar en servidor relaciones (asegurador, sedes, catálogos, regímenes) y duplicados
- [x] Restaurar la migración `0022` completa y aplicar `0023` + `0025` (RLS, índice y RPC transaccional)
- [x] Duplicar contratos con todo su contenido mediante RPC `duplicar_contrato` (migración `0026`)
- [x] Separar contratos en ejecución (`/contratos`) e historial (`/historial`) según `estado_ejecucion`
- [x] Crear migración `0027_seguimiento_ipc.sql` y aplicarla en Supabase (tablas, constraints, RLS y triggers)
- [x] Agregar índices de `created_by` para las tablas IPC (migración `0028`)
- [x] Implementar Seguimiento IPC (`/ipc`): formulario, CRUD, resumen, filtros, tabla con comparativo y tab de gráficas/análisis
- [x] Implementar IPC Nacional (`/configuracion/ipc-nacional`): CRUD del histórico por país y año
- [ ] Verificación manual de CRUD y roles

## Phase 4: Enhancements
- [ ] Implement row-level actions (edit/delete) in table
- [ ] Add keyboard shortcuts (Ctrl+N for create focus)
- [ ] Create dashboard overview/stats section
- [ ] Add export/print functionality for tables
- [ ] Implement internationalization ready structure

## Module Priorities
1. **usuarios** - Already exists, needs standardization
2. **regionales** - Basic CRUD, low complexity
3. **proyectos** - Medium complexity, relationships
4. **configuraciones** - Settings, low frequency

## Success Criteria
- All dashboard modules use identical page layout
- No unique table designs exist
- Create button present in every module header
- Type-safe operations across all modules
- ESLint passes with no new violations