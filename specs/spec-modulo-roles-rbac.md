# SPEC: Módulo de Roles y Permisos (RBAC) — ruta `/roles`

> **Para el agente:** este documento es una orden de ejecución, no una propuesta. Ejecuta las tareas en el orden indicado (T0 → T16). No agregues funcionalidades, no cambies decisiones, no refactorices código ajeno a este spec. Si algo no está cubierto o hay una contradicción con el código existente, **detente y pregunta** en lugar de decidir por tu cuenta. Al terminar cada tarea, verifica su criterio de aceptación antes de pasar a la siguiente.

---

## 0. Contexto

- Aplicación web: **Next.js + Supabase** (mismo stack de los módulos Frecuencias, Contratos, Planeaciones).
- Ya existen módulos con CRUD: **Sedes, Población, Frecuencias de uso, Contratos, Seguimiento IPC, Configuraciones, Usuarios**.
- Objetivo: crear un módulo nuevo **Roles** en la ruta **`/roles`**, ubicado en el menú lateral **inmediatamente debajo de "Usuarios"**, que permita definir por rol y por módulo los permisos **Ver, Crear, Editar, Eliminar** (matriz RBAC) y que esos permisos se apliquen en la app.

## 1. Decisiones cerradas (NO se discuten ni se cambian)

1. **Un usuario tiene exactamente un rol** (`usuarios.rol_id`).
2. **Acciones:** `ver`, `crear`, `editar`, `eliminar`. Marcar crear/editar/eliminar fuerza `ver = true`. Desmarcar `ver` desmarca las otras tres.
3. **Roles iniciales (8):** CEO, CFO, Gerente General, Gerente Nacional, Director Nacional, Gerente Regional, Analista de Contratación, Profesional de Planeación.
4. **Módulos (8), con su `clave`:** `sedes`, `poblacion`, `frecuencias`, `contratos`, `seguimiento_ipc`, `configuraciones`, `usuarios`, `roles`.
5. **Administran la matriz:** quien tenga `roles.editar = true` (por seed: CEO y Gerente General).
6. **Anti-bloqueo:** el rol **Gerente General** no puede perder `ver/crear/editar/eliminar` sobre `roles` ni `usuarios`. La UI deshabilita esas casillas y el guardado lo valida también.
7. **Eliminación de roles:** solo si ningún usuario lo tiene asignado; si lo tiene, se bloquea con mensaje. No se hace borrado de los 8 roles semilla (botón deshabilitado para ellos).
8. **Textos de la UI en español.**

## 2. Fuera de alcance (NO hacer en esta entrega)

- Alcance por regional/sede (filtrar datos del Gerente Regional a su regional).
- Varios roles por usuario.
- Permisos especiales (exportar, cargue masivo, aprobar).
- Aplicar RLS a las tablas de datos **existentes** (sedes, contratos, etc.). Solo se crea la función `tiene_permiso` para usarla después.
- Cambiar el diseño visual global, el layout o librerías de UI ya usadas.
- Instalar dependencias nuevas (usa las que ya tiene el proyecto).

---

## 3. Matriz semilla

Letras: **V**=ver, **C**=crear, **E**=editar, **X**=eliminar, `-`=sin acceso.

| Rol | sedes | poblacion | frecuencias | contratos | seguimiento_ipc | configuraciones | usuarios | roles |
|---|---|---|---|---|---|---|---|---|
| CEO | V | V | V | V | V | VCEX | VCEX | VCEX |
| CFO | V | V | V | V | V | - | - | - |
| Gerente General | VCEX | VCEX | VCEX | VCEX | VCEX | VCEX | VCEX | VCEX |
| Gerente Nacional | V | V | V | V | V | - | - | - |
| Director Nacional | VCE | VCE | VCE | VCE | VCE | - | - | - |
| Gerente Regional | V | V | V | V | V | - | - | - |
| Analista de Contratación | VCE | VCE | VCE | VCE | VCE | - | - | - |
| Profesional de Planeación | V | VCE | VCE | V | V | - | - | - |

---

## 4. Tareas atómicas

### FASE A — Descubrimiento (solo lectura)

**T0. Inspeccionar el proyecto (no modificar nada).**
Reporta por escrito, en una lista corta, estos 7 datos antes de continuar:
1. Router: `app/` (App Router) o `pages/`.
2. Ruta y archivo del módulo **Usuarios** y del componente del **menú lateral** (sidebar).
3. Nombre exacto de la tabla de usuarios de la app y la **columna que enlaza con `auth.users.id`** (puede ser `id`, `auth_user_id`, `user_id`…). A partir de aquí se llama `<COL_AUTH>`.
4. Si la tabla de usuarios ya tiene una columna de rol (texto u otra) y cómo se usa hoy.
5. Cómo se crea el cliente Supabase en cliente y en servidor (archivos helper).
6. Qué librería de UI/tablas/toasts usa el proyecto (shadcn, MUI, Tailwind plano…).
7. Carpeta de migraciones SQL (o si se ejecutan manualmente en Supabase).

*Aceptación:* los 7 datos reportados. Si algún dato no se encuentra, **detente y pregunta**.

---

### FASE B — Base de datos

Crea **un solo archivo de migración** `YYYYMMDDHHMM_rbac_roles_permisos.sql` (en la carpeta detectada en T0.7; si no existe, en `supabase/migrations/`). Reemplaza `<COL_AUTH>` por el valor real de T0.3. Las tareas T1–T6 son secciones de ese mismo archivo, en este orden.

**T1. Tablas.**
```sql
create table if not exists public.roles (
  id serial primary key,
  nombre text unique not null,
  descripcion text,
  es_sistema boolean not null default false,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.modulos (
  id serial primary key,
  clave text unique not null,
  nombre text not null,
  orden int not null default 0
);

create table if not exists public.permisos_rol (
  rol_id int not null references public.roles(id) on delete cascade,
  modulo_id int not null references public.modulos(id) on delete cascade,
  puede_ver boolean not null default false,
  puede_crear boolean not null default false,
  puede_editar boolean not null default false,
  puede_eliminar boolean not null default false,
  primary key (rol_id, modulo_id),
  constraint chk_ver_implicito check (
    (puede_crear or puede_editar or puede_eliminar) is false or puede_ver
  )
);

alter table public.usuarios add column if not exists rol_id int references public.roles(id);
```
> Si la tabla de usuarios no se llama `usuarios` (T0.3), usa el nombre real.

**T2. Seed de roles y módulos.**
```sql
insert into public.roles (nombre, es_sistema) values
 ('CEO',true),('CFO',true),('Gerente General',true),('Gerente Nacional',true),
 ('Director Nacional',true),('Gerente Regional',true),
 ('Analista de Contratación',true),('Profesional de Planeación',true)
on conflict (nombre) do nothing;

insert into public.modulos (clave, nombre, orden) values
 ('sedes','Sedes',1),('poblacion','Población',2),('frecuencias','Frecuencias de uso',3),
 ('contratos','Contratos',4),('seguimiento_ipc','Seguimiento IPC',5),
 ('configuraciones','Configuraciones',6),('usuarios','Usuarios',7),('roles','Roles',8)
on conflict (clave) do nothing;
```

**T3. Seed de la matriz** (usa la tabla de la sección 3; la cadena `VCEX` se interpreta por presencia de letra).
```sql
with m(rol, modulo, p) as (values
 ('CEO','sedes','V'),('CEO','poblacion','V'),('CEO','frecuencias','V'),('CEO','contratos','V'),('CEO','seguimiento_ipc','V'),('CEO','configuraciones','VCEX'),('CEO','usuarios','VCEX'),('CEO','roles','VCEX'),
 ('CFO','sedes','V'),('CFO','poblacion','V'),('CFO','frecuencias','V'),('CFO','contratos','V'),('CFO','seguimiento_ipc','V'),
 ('Gerente General','sedes','VCEX'),('Gerente General','poblacion','VCEX'),('Gerente General','frecuencias','VCEX'),('Gerente General','contratos','VCEX'),('Gerente General','seguimiento_ipc','VCEX'),('Gerente General','configuraciones','VCEX'),('Gerente General','usuarios','VCEX'),('Gerente General','roles','VCEX'),
 ('Gerente Nacional','sedes','V'),('Gerente Nacional','poblacion','V'),('Gerente Nacional','frecuencias','V'),('Gerente Nacional','contratos','V'),('Gerente Nacional','seguimiento_ipc','V'),
 ('Director Nacional','sedes','VCE'),('Director Nacional','poblacion','VCE'),('Director Nacional','frecuencias','VCE'),('Director Nacional','contratos','VCE'),('Director Nacional','seguimiento_ipc','VCE'),
 ('Gerente Regional','sedes','V'),('Gerente Regional','poblacion','V'),('Gerente Regional','frecuencias','V'),('Gerente Regional','contratos','V'),('Gerente Regional','seguimiento_ipc','V'),
 ('Analista de Contratación','sedes','VCE'),('Analista de Contratación','poblacion','VCE'),('Analista de Contratación','frecuencias','VCE'),('Analista de Contratación','contratos','VCE'),('Analista de Contratación','seguimiento_ipc','VCE'),
 ('Profesional de Planeación','sedes','V'),('Profesional de Planeación','poblacion','VCE'),('Profesional de Planeación','frecuencias','VCE'),('Profesional de Planeación','contratos','V'),('Profesional de Planeación','seguimiento_ipc','V')
)
insert into public.permisos_rol (rol_id, modulo_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
select r.id, mo.id,
  position('V' in m.p)>0, position('C' in m.p)>0, position('E' in m.p)>0, position('X' in m.p)>0
from m
join public.roles r on r.nombre = m.rol
join public.modulos mo on mo.clave = m.modulo
on conflict (rol_id, modulo_id) do update set
  puede_ver=excluded.puede_ver, puede_crear=excluded.puede_crear,
  puede_editar=excluded.puede_editar, puede_eliminar=excluded.puede_eliminar;
```
Las combinaciones sin fila quedan como "sin acceso" (el frontend trata la ausencia de fila como todo `false`).

**T4. Función `tiene_permiso` y RPC `mis_permisos`.**
```sql
create or replace function public.tiene_permiso(p_modulo text, p_accion text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select case p_accion
        when 'ver' then pr.puede_ver
        when 'crear' then pr.puede_crear
        when 'editar' then pr.puede_editar
        when 'eliminar' then pr.puede_eliminar
        else false end
     from public.usuarios u
     join public.permisos_rol pr on pr.rol_id = u.rol_id
     join public.modulos m on m.id = pr.modulo_id
     where u.<COL_AUTH> = auth.uid() and m.clave = p_modulo
     limit 1), false);
$$;

create or replace function public.mis_permisos()
returns table (modulo text, puede_ver boolean, puede_crear boolean, puede_editar boolean, puede_eliminar boolean)
language sql stable security definer set search_path = public as $$
  select m.clave, pr.puede_ver, pr.puede_crear, pr.puede_editar, pr.puede_eliminar
  from public.usuarios u
  join public.permisos_rol pr on pr.rol_id = u.rol_id
  join public.modulos m on m.id = pr.modulo_id
  where u.<COL_AUTH> = auth.uid();
$$;
```

**T5. RLS solo sobre las 3 tablas nuevas.**
```sql
alter table public.roles enable row level security;
alter table public.modulos enable row level security;
alter table public.permisos_rol enable row level security;

create policy roles_select on public.roles for select to authenticated using (true);
create policy modulos_select on public.modulos for select to authenticated using (true);
create policy permisos_select on public.permisos_rol for select to authenticated using (true);

create policy roles_insert on public.roles for insert to authenticated with check (public.tiene_permiso('roles','crear'));
create policy roles_update on public.roles for update to authenticated using (public.tiene_permiso('roles','editar')) with check (public.tiene_permiso('roles','editar'));
create policy roles_delete on public.roles for delete to authenticated using (public.tiene_permiso('roles','eliminar') and es_sistema = false);

create policy permisos_insert on public.permisos_rol for insert to authenticated with check (public.tiene_permiso('roles','editar'));
create policy permisos_update on public.permisos_rol for update to authenticated using (public.tiene_permiso('roles','editar')) with check (public.tiene_permiso('roles','editar'));
create policy permisos_delete on public.permisos_rol for delete to authenticated using (public.tiene_permiso('roles','editar'));
```
`modulos` es de solo lectura desde la app (sin políticas de escritura).

**T6. Asignar rol a usuarios existentes.**
NO asignes roles automáticamente por suposición. Agrega al final de la migración un comentario con este SQL de ejemplo para que lo ejecute el usuario:
```sql
-- update public.usuarios set rol_id = (select id from public.roles where nombre='Gerente General') where email = 'TU_CORREO';
```
Y **pregunta al usuario** el correo que debe quedar como Gerente General para no dejar la app sin administrador. Hasta que lo confirme, no ejecutes ningún UPDATE.

*Aceptación Fase B:* la migración corre sin errores y `select count(*) from permisos_rol` devuelve **46** (CEO 8 + CFO 5 + Gerente General 8 + Gerente Nacional 5 + Director Nacional 5 + Gerente Regional 5 + Analista 5 + Profesional de Planeación 5). Las combinaciones con `-` no tienen fila.

---

### FASE C — Frontend: permisos en toda la app

**T7. Tipos y contexto de permisos.**
Crea `lib/permisos/types.ts`:
```ts
export type Accion = 'ver' | 'crear' | 'editar' | 'eliminar';
export type ModuloClave = 'sedes'|'poblacion'|'frecuencias'|'contratos'|'seguimiento_ipc'|'configuraciones'|'usuarios'|'roles';
export type PermisosModulo = { ver: boolean; crear: boolean; editar: boolean; eliminar: boolean };
export type MapaPermisos = Partial<Record<ModuloClave, PermisosModulo>>;
```
(Ajusta la ruta a la convención detectada en T0.)

**T8. Provider y hook.**
Crea `PermisosProvider` que, una sola vez tras autenticarse, llama `supabase.rpc('mis_permisos')`, construye un `MapaPermisos` y lo expone con un hook `usePermiso(modulo)` que devuelve `{ ver, crear, editar, eliminar, cargando }`. Ausencia de un módulo en el mapa = todo `false`. Envuelve la app con el provider en el layout autenticado.

**T9. Componente de guardia.**
Crea `<Can modulo="..." accion="...">{children}</Can>` que renderiza `children` solo si `usePermiso(modulo)[accion]` es `true`.

**T10. Guardia de ruta.**
En el layout o página de cada módulo (`sedes, poblacion, frecuencias, contratos, seguimiento_ipc, configuraciones, usuarios, roles`), si `ver` es `false` (y ya no está cargando), mostrar una pantalla "No tienes permiso para ver este módulo" (sin redirección en bucle). Hazlo con un componente reutilizable `<GuardiaModulo modulo="...">`.

**T11. Menú lateral.**
Oculta cada ítem del sidebar cuyo módulo tenga `ver = false`. Agrega el ítem **"Roles"** con ruta `/roles` **inmediatamente debajo de "Usuarios"**, con el mismo estilo/ícono de familia que los demás.

**T12. Aplicar permisos a los botones de los módulos existentes.**
Para **cada uno** de los 7 módulos existentes, en este orden: sedes, población, frecuencias, contratos, seguimiento IPC, configuraciones, usuarios:
- Envolver con `<Can ... accion="crear">` el botón/ruta "Nuevo/Crear/Cargue masivo de creación".
- Envolver con `accion="editar"` los botones/acciones de edición (incluida edición en línea).
- Envolver con `accion="eliminar"` los botones de eliminar.
No cambies lógica de negocio, validaciones ni estilos. Un commit por módulo.

---

### FASE D — Módulo `/roles`

**T13. Ruta y página.**
Crea la página `/roles` protegida con `<GuardiaModulo modulo="roles">`. Título: "Roles y permisos".

**T14. Pantalla de matriz.**
Diseño:
- **Barra superior:** selector de rol (lista de `roles`) + botones "Nuevo rol" (visible solo con `roles.crear`), "Renombrar" (con `roles.editar`), "Eliminar rol" (con `roles.eliminar`).
- **Tabla:** filas = los 8 módulos (orden por `modulos.orden`), columnas = **Módulo | Ver | Crear | Editar | Eliminar**, cada celda es un checkbox.
- Reglas de interacción:
  - Marcar Crear, Editar o Eliminar marca Ver automáticamente.
  - Desmarcar Ver desmarca Crear, Editar y Eliminar.
  - Checkbox "marcar toda la fila" y "marcar toda la columna" (opcionales: **omitir**, no entran en esta entrega).
  - Para el rol **Gerente General**, las filas `roles` y `usuarios` quedan con los 4 checkboxes **deshabilitados** y marcados.
  - Si el usuario no tiene `roles.editar`, toda la tabla es de solo lectura.
- Botón **"Guardar cambios"** (deshabilitado si no hay cambios), botón "Descartar cambios", e indicador de cambios sin guardar. Advertir al salir con cambios sin guardar.
- Al guardar: `upsert` en `permisos_rol` con `onConflict: 'rol_id,modulo_id'` de las filas modificadas (si todo queda en `false`, haz `upsert` igualmente con `false`, no borres filas). Toast de éxito o error. Tras guardar, refrescar `mis_permisos` en el provider por si el usuario editó su propio rol.

**T15. Crear / renombrar / eliminar rol.**
- **Nuevo rol:** modal con campo `nombre` (obligatorio, único, sin espacios al inicio/fin) y `descripcion` (opcional). Se crea con `es_sistema=false` y sin permisos.
- **Renombrar:** solo roles con `es_sistema=false`.
- **Eliminar:** bloquear si `es_sistema=true` o si hay usuarios con ese `rol_id` (consulta `count` previa y mensaje "Hay N usuarios con este rol. Reasígnalos primero."). Confirmación con modal antes de borrar.

**T16. Asignación de rol en el módulo Usuarios.**
En el formulario de crear/editar usuario agrega un `<Select>` "Rol" (lista de `roles` activos) que guarde `usuarios.rol_id`; en la tabla de usuarios agrega la columna "Rol". Visible/editable solo con `usuarios.editar`. Sin cambiar otros campos.

---

## 5. Criterios de aceptación finales (verificar TODOS)

1. Existen las tablas `roles`, `modulos`, `permisos_rol`, la columna `usuarios.rol_id`, las funciones `tiene_permiso` y `mis_permisos`, y la migración quedó versionada.
2. `permisos_rol` tiene **46** filas tras el seed, equivalentes a la sección 3.
3. Un usuario con rol *Analista de Contratación* **no** ve "Usuarios", "Roles" ni "Configuraciones" en el menú, y al entrar por URL directa ve el mensaje de falta de permiso.
4. Ese mismo usuario ve y usa "Nuevo" y "Editar" en Sedes, pero **no** ve "Eliminar".
5. Un usuario *CFO* solo ve (sin botones de crear/editar/eliminar) en los 5 módulos de negocio.
6. En `/roles`, el *Gerente General* puede editar la matriz de cualquier otro rol; sus casillas de `roles` y `usuarios` están bloqueadas.
7. Marcar "Eliminar" activa "Ver" automáticamente; desmarcar "Ver" limpia las demás.
8. Intentar guardar permisos desde un usuario sin `roles.editar` (probando la llamada directa a Supabase) es **rechazado por RLS**.
9. No se puede eliminar un rol semilla ni un rol con usuarios asignados.
10. `npm run build` y el linter pasan sin errores nuevos.

## 6. Entregable final del agente

Al terminar, responde con: (a) lista de archivos creados/modificados, (b) nombre del archivo de migración, (c) resultado de cada criterio de la sección 5 (✅/❌), (d) pendientes o preguntas. **No** agregues nada más.
