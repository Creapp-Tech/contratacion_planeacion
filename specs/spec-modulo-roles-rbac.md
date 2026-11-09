# SPEC: Módulo de Roles y Permisos (RBAC) — ruta `/roles`

> **Para el agente:** este documento es una orden de ejecución, no una propuesta. Ejecuta las tareas en el orden indicado (T0 → T16). No agregues funcionalidades, no cambies decisiones, no refactorices código ajeno a este spec. Si algo no está cubierto o hay una contradicción con el código existente, **detente y pregunta** en lugar de decidir por tu cuenta. Al terminar cada tarea, verifica su criterio de aceptación antes de pasar a la siguiente.

---

## Enmiendas de revisión (2026-11-09)

El documento fue revisado contra el código y la base de datos reales antes de ejecutar. E1–E5 fueron **confirmadas por el propietario**; E6–E7 son **supuestos reversibles** (hablar si no aplica); E8–E9 son ajustes de forma verificados contra el repo:

- **E1.** Rol semilla adicional **Superadmin** (los roles iniciales son 9, ver matriz): VCEX en los 8 módulos, incluido en el anti-bloqueo y en quienes administran la matriz.
- **E2.** Asignación inicial de `rol_id` por **mapeo determinístico** enum→rol dentro de la migración (T6).
- **E3.** Los **guards server-side** (`requireSuperadmin`, `requireAccesoPlaneacion/Contratacion`, `puedeEditar*`, `requireEditorPlaneacion`) se **alinean a la matriz** en esta entrega (T12). Sin esto los criterios 4, 5 y 6 son imposibles.
- **E4.** Ítems del menú sin módulo propio **heredan del módulo padre** (T11).
- **E5.** Anti-bloqueo de Gerente General y Superadmin con **trigger en BD** (T5b), no solo UI.
- **E6.** *(supuesto)* La columna enum `usuarios.rol` queda **congelada**: deja de escribirse y de leerse (T16); los labels salen de la tabla `roles`. `lib/constants/roles.ts` se retira de los guards.
- **E7.** *(supuesto)* Checkbox y toasts se construyen con los **primitivos de `@base-ui/react`** ya instalados (sin dependencias nuevas) (T14).
- **E8.** Migración con la convención del repo: `supabase/migrations/0039_rbac_roles_permisos.sql`.
- **E9.** `<COL_AUTH>` = `usuarios.id` (uuid, FK a `auth.users(id) ON DELETE CASCADE`); resultados de T0 registrados en la Fase A.

---

## 0. Contexto

- Aplicación web: **Next.js + Supabase** (mismo stack de los módulos Frecuencias, Contratos, Planeaciones).
- Ya existen módulos con CRUD: **Sedes, Población, Frecuencias de uso, Contratos, Seguimiento IPC, Configuraciones, Usuarios**.
- Objetivo: crear un módulo nuevo **Roles** en la ruta **`/roles`**, ubicado en el menú lateral **inmediatamente debajo de "Usuarios"**, que permita definir por rol y por módulo los permisos **Ver, Crear, Editar, Eliminar** (matriz RBAC) y que esos permisos se apliquen en la app.

## 1. Decisiones cerradas (NO se discuten ni se cambian)

1. **Un usuario tiene exactamente un rol** (`usuarios.rol_id`).
2. **Acciones:** `ver`, `crear`, `editar`, `eliminar`. Marcar crear/editar/eliminar fuerza `ver = true`. Desmarcar `ver` desmarca las otras tres.
3. **Roles iniciales (9):** Superadmin, CEO, CFO, Gerente General, Gerente Nacional, Director Nacional, Gerente Regional, Analista de Contratación, Profesional de Planeación. *(E1: Superadmin se agregó en revisión; el enum legacy tenía `superadmin` con 2 usuarios activos.)*
4. **Módulos (8), con su `clave`:** `sedes`, `poblacion`, `frecuencias`, `contratos`, `seguimiento_ipc`, `configuraciones`, `usuarios`, `roles`.
5. **Administran la matriz:** quien tenga `roles.editar = true` (por seed: Superadmin, CEO y Gerente General).
6. **Anti-bloqueo:** los roles **Gerente General** y **Superadmin** no pueden perder `ver/crear/editar/eliminar` sobre `roles` ni `usuarios`. La UI deshabilita esas casillas, el guardado lo valida y un **trigger en la base de datos** lo impone también (T5b).
7. **Eliminación de roles:** solo si ningún usuario lo tiene asignado; si lo tiene, se bloquea con mensaje. No se hace borrado de los 9 roles semilla (botón deshabilitado para ellos).
8. **Textos de la UI en español.**
9. **`<COL_AUTH>`** = `usuarios.id` (uuid, FK a `auth.users(id) ON DELETE CASCADE`), confirmado en la BD.
10. **Asignación inicial:** mapeo determinístico enum `usuario_rol` → rol semilla dentro de la migración (E2). Nadie queda sin rol tras la migración.
11. **Guards server-side** alineados a la matriz en esta entrega (E3): dejan de consultar el enum `usuarios.rol`.
12. **Menú:** los ítems sin módulo propio heredan del módulo padre (E4); Dashboard siempre visible.
13. **Enum `usuarios.rol` congelado** (E6): deja de escribirse/leerse; los labels de rol salen de la tabla `roles`. No se elimina la columna.
14. **Checkbox y toasts** con primitivos de `@base-ui/react` ya instalados, sin dependencias nuevas (E7).
15. **Migración:** `supabase/migrations/0039_rbac_roles_permisos.sql` (convención `00NN_` del repo, E8).

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
| Superadmin | VCEX | VCEX | VCEX | VCEX | VCEX | VCEX | VCEX | VCEX |
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

**Resultado de T0 (registrado el 2026-11-09, no repetir):**
1. **Router:** App Router (`app/`), Next.js 16.4.3 + React 19; módulos en `app/(dashboard)/`.
2. **Usuarios:** `app/(dashboard)/usuarios/` (page, nuevo, `[id]`, `[id]/editar`, `actions.ts`). **Sidebar:** `components/shell/app-sidebar.tsx` (cliente) + ítems en `components/shell/nav-items.ts`; lo envuelve `AuthShell` en `app/(dashboard)/layout.tsx`.
3. **Tabla:** `public.usuarios`; `<COL_AUTH>` = **`id`** (uuid, FK `auth.users(id) ON DELETE CASCADE`). 14 filas.
4. **Columna de rol existente:** `usuarios.rol` es un **enum** `usuario_rol` (`superadmin, ceo, gerente_general, gerente_nacional, director_nacional, gerente_regional, analista_contratacion, profesional_planeacion` — sin CFO, con superadmin). Se usa en `lib/constants/roles.ts`, guards de `lib/auth/session.ts`, `nav-items.ts` y `es_superadmin()` en BD. Distribución actual: 9 gerente_regional, 2 superadmin, 1 gerente_general, 1 gerente_nacional, 1 director_nacional.
5. **Clientes Supabase:** `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server, cookies), `lib/supabase/admin.ts` (service_role, server-only), `lib/supabase/middleware.ts`.
6. **UI:** shadcn sobre **Base UI** (`@base-ui/react`), Tailwind v4, lucide-react, react-hook-form + zod, `components/ui/standard-table.tsx`. No hay checkbox ni toasts en `components/ui/` (Base UI trae primitivos para ambos).
7. **Migraciones:** `supabase/migrations/`, convención `00NN_nombre.sql` (0001–0038; siguiente: 0039). RLS ya habilitada en `usuarios` (políticas select self / `es_superadmin()`); las funciones `tiene_permiso`/`mis_permisos` **no existen aún**.

---

### FASE B — Base de datos

Crea **un solo archivo de migración** `supabase/migrations/0039_rbac_roles_permisos.sql` (convención del repo, E8). `<COL_AUTH>` = `id` (T0.3, decisión 9). Las tareas T1–T6 son secciones de ese mismo archivo, en este orden.

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
 ('Superadmin',true),('CEO',true),('CFO',true),('Gerente General',true),('Gerente Nacional',true),
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
 ('Superadmin','sedes','VCEX'),('Superadmin','poblacion','VCEX'),('Superadmin','frecuencias','VCEX'),('Superadmin','contratos','VCEX'),('Superadmin','seguimiento_ipc','VCEX'),('Superadmin','configuraciones','VCEX'),('Superadmin','usuarios','VCEX'),('Superadmin','roles','VCEX'),
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

**T5b. Trigger anti-bloqueo (decisión 6, E5).**
Impone en base de datos que Gerente General y Superadmin conserven las 4 acciones sobre `roles` y `usuarios`, incluso ante llamadas directas a la API de un usuario con `roles.editar`:
```sql
create or replace function public.protege_roles_admin()
returns trigger language plpgsql set search_path = public as $$
declare
  es_protegido boolean;
begin
  if tg_op = 'DELETE' then
    select exists (
      select 1 from public.roles r
      where r.id = old.rol_id and r.nombre in ('Gerente General','Superadmin')
    ) into es_protegido;
    if es_protegido
       and (select clave from public.modulos where id = old.modulo_id) in ('roles','usuarios') then
      raise exception 'Gerente General y Superadmin no pueden perder permisos sobre roles o usuarios';
    end if;
    return old;
  else
    select exists (
      select 1 from public.roles r
      where r.id = new.rol_id and r.nombre in ('Gerente General','Superadmin')
    ) into es_protegido;
    if es_protegido
       and (select clave from public.modulos where id = new.modulo_id) in ('roles','usuarios')
       and not (new.puede_ver and new.puede_crear and new.puede_editar and new.puede_eliminar) then
      raise exception 'Gerente General y Superadmin deben conservar ver/crear/editar/eliminar sobre roles y usuarios';
    end if;
    return new;
  end if;
end;
$$;

drop trigger if exists trg_protege_roles_admin on public.permisos_rol;
create trigger trg_protege_roles_admin
before insert or update or delete on public.permisos_rol
for each row execute function public.protege_roles_admin();
```
> Puede crearse antes o después del seed (T3): las filas de Gerente General y Superadmin ya son VCEX y pasan la validación del trigger.

**T6. Asignar rol a usuarios existentes (mapeo determinístico, E2).**
Ejecuta al final de la migración este UPDATE. Los 14 usuarios actuales tienen el enum `rol` con valores válidos, y el mapeo es 1:1 con el rol semilla homónimo:
```sql
update public.usuarios u
set rol_id = r.id
from public.roles r
where r.nombre = case u.rol::text
  when 'superadmin' then 'Superadmin'
  when 'ceo' then 'CEO'
  when 'gerente_general' then 'Gerente General'
  when 'gerente_nacional' then 'Gerente Nacional'
  when 'director_nacional' then 'Director Nacional'
  when 'gerente_regional' then 'Gerente Regional'
  when 'analista_contratacion' then 'Analista de Contratación'
  when 'profesional_planeacion' then 'Profesional de Planeación'
end;
```

*Aceptación Fase B:* la migración corre sin errores, `select count(*) from permisos_rol` devuelve **54** (Superadmin 8 + CEO 8 + CFO 5 + Gerente General 8 + Gerente Nacional 5 + Director Nacional 5 + Gerente Regional 5 + Analista 5 + Profesional de Planeación 5), `select count(*) from usuarios where rol_id is null` devuelve **0**, y las combinaciones con `-` de la sección 3 no tienen fila.

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
Crea `PermisosProvider` que, una sola vez tras autenticarse, llama `supabase.rpc('mis_permisos')`, construye un `MapaPermisos` y lo expone con un hook `usePermiso(modulo)` que devuelve `{ ver, crear, editar, eliminar, cargando }`. Ausencia de un módulo en el mapa = todo `false`. Envuelve la app con el provider en `AuthShell` (`app/(dashboard)/layout.tsx`), de modo que el sidebar y las páginas lo consuman. El provider expone también `refrescar()` para recargar `mis_permisos` (lo usa T14).

**T9. Componente de guardia.**
Crea `<Can modulo="..." accion="...">{children}</Can>` que renderiza `children` solo si `usePermiso(modulo)[accion]` es `true`.

**T10. Guardia de ruta.**
En el layout o página de cada módulo (`sedes, poblacion, frecuencias, contratos, seguimiento_ipc, configuraciones, usuarios, roles`), si `ver` es `false` (y ya no está cargando), mostrar una pantalla "No tienes permiso para ver este módulo" (sin redirección en bucle). Hazlo con un componente reutilizable `<GuardiaModulo modulo="...">`.

**T11. Menú lateral.**
Oculta cada ítem del sidebar cuyo módulo tenga `ver = false`. Agrega el ítem **"Roles"** con ruta `/roles` **inmediatamente debajo de "Usuarios"** (grupo "Administración", en `components/shell/nav-items.ts`), con el mismo estilo/ícono de familia que los demás. El filtrado por roles estático de `nav-items.ts` se reemplaza por el filtrado por matriz.

Mapeo de ítems sin módulo propio (heredan del módulo padre, E4):
| Ítem del menú | Módulo que lo controla |
|---|---|
| Mapa de sedes | `sedes` |
| Análisis de capacidad instalada | `sedes` |
| Historial | `contratos` |
| Servicios | `configuraciones` |
| Todas las páginas de `/configuracion/*` (15 ítems) | `configuraciones` |
| Dashboard | siempre visible para autenticados |

**T12. Aplicar permisos a los módulos existentes.**
Para **cada uno** de los 7 módulos existentes, en este orden: sedes, población, frecuencias, contratos, seguimiento IPC, configuraciones, usuarios:
- Envolver con `<Can ... accion="crear">` el botón/ruta "Nuevo/Crear/Cargue masivo de creación".
- Envolver con `accion="editar"` los botones/acciones de edición (incluida edición en línea).
- Envolver con `accion="eliminar"` los botones de eliminar.
- **Alinear los guards server-side a la matriz (E3):** en cada módulo, reemplaza los controles basados en el enum (`puedeEditarPlaneacion`, `puedeAccederPlaneacion`, `puedeAccederContratacion`, `requireSuperadmin`, `requireEditorPlaneacion` en `lib/auth/session.ts` y su uso en páginas/componentes/actions) por verificaciones contra la matriz (helper server-side que consulte `tiene_permiso` con el cliente de servidor del usuario, o equivalente). En `configuraciones`, esto aplica a todas sus páginas (incluida Servicios y Grupos de servicio). Sin este punto los criterios 4, 5 y 6 no se cumplen.
- `configuraciones` es un solo módulo para toda la carpeta: las 15 páginas del grupo (más Servicios y Grupos de servicio) comparten los mismos permisos de la matriz.

No cambies lógica de negocio, validaciones ni estilos más allá del gating de permisos indicado. Un commit por módulo.

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
  - Para los roles **Gerente General** y **Superadmin**, las filas `roles` y `usuarios` quedan con los 4 checkboxes **deshabilitados** y marcados.
  - Si el usuario no tiene `roles.editar`, toda la tabla es de solo lectura.
- Componentes: crea `components/ui/checkbox.tsx` y un toast simple usando los primitivos de `@base-ui/react` (`checkbox`, `toast`) ya instalados; **sin dependencias nuevas** (E7).
- Botón **"Guardar cambios"** (deshabilitado si no hay cambios), botón "Descartar cambios", e indicador de cambios sin guardar. Advertir al salir con cambios sin guardar.
- Al guardar: `upsert` en `permisos_rol` con `onConflict: 'rol_id,modulo_id'` de las filas modificadas (si todo queda en `false`, haz `upsert` igualmente con `false`, no borres filas). Toast de éxito o error. Tras guardar, refrescar `mis_permisos` en el provider por si el usuario editó su propio rol.

**T15. Crear / renombrar / eliminar rol.**
- **Nuevo rol:** modal con campo `nombre` (obligatorio, único, sin espacios al inicio/fin) y `descripcion` (opcional). Se crea con `es_sistema=false` y sin permisos.
- **Renombrar:** solo roles con `es_sistema=false`.
- **Eliminar:** bloquear si `es_sistema=true` o si hay usuarios con ese `rol_id` (consulta `count` previa y mensaje "Hay N usuarios con este rol. Reasígnalos primero."). Confirmación con modal antes de borrar.

**T16. Asignación de rol en el módulo Usuarios (E6).**
En el formulario de crear/editar usuario, el `<Select>` "Rol" actual (enum `usuario_rol`) se **reemplaza** por un `<Select>` "Rol" con la lista de `roles` activos que guarda `usuarios.rol_id`. En la tabla de usuarios, la columna "Rol" muestra el nombre vía join a `roles` (ya no el enum); el header (`AppHeader`) también muestra el nombre desde `roles`. Actualiza `lib/validations/usuario.ts`: `rol_id` requerido y el enum `rol` deja de enviarse. El select es editable en creación (formulario accesible con `usuarios.crear`) y en edición (`usuarios.editar`). Sin cambiar otros campos.

---

## 5. Criterios de aceptación finales (verificar TODOS)

1. Existen las tablas `roles`, `modulos`, `permisos_rol`, la columna `usuarios.rol_id`, las funciones `tiene_permiso` y `mis_permisos`, y la migración quedó versionada.
2. `permisos_rol` tiene **54** filas tras el seed, equivalentes a la sección 3 (incluye Superadmin).
3. Un usuario con rol *Analista de Contratación* **no** ve "Usuarios", "Roles" ni "Configuraciones" en el menú, y al entrar por URL directa ve el mensaje de falta de permiso.
4. Ese mismo usuario ve y usa "Nuevo" y "Editar" en Sedes, pero **no** ve "Eliminar".
5. Un usuario *CFO* solo ve (sin botones de crear/editar/eliminar) en los 5 módulos de negocio.
6. En `/roles`, el *Gerente General* puede editar la matriz de cualquier otro rol; sus casillas de `roles` y `usuarios` están bloqueadas (igual que las del *Superadmin*).
7. Marcar "Eliminar" activa "Ver" automáticamente; desmarcar "Ver" limpia las demás.
8. Intentar guardar permisos desde un usuario sin `roles.editar` (probando la llamada directa a Supabase) es **rechazado por RLS**.
9. No se puede eliminar un rol semilla ni un rol con usuarios asignados.
10. `npm run build` y el linter pasan sin errores nuevos.
11. El trigger `trg_protege_roles_admin` rechaza (probando por API directa con un usuario con `roles.editar`) cualquier INSERT/UPDATE/DELETE que deje a Gerente General o Superadmin sin las 4 acciones sobre `roles`/`usuarios`.
12. Los guards server-side respetan la matriz: un *CFO* entra por URL a los 5 módulos de negocio en modo lectura, y un *Analista de Contratación* ve el botón "Nueva sede" en `/sedes`.
13. Tras la migración, los 14 usuarios existentes tienen `rol_id` asignado (mapeo E2) y la app funciona sin bloqueos; el enum `usuarios.rol` ya no se escribe ni se lee.

## 6. Entregable final del agente

Al terminar, responde con: (a) lista de archivos creados/modificados, (b) nombre del archivo de migración, (c) resultado de cada criterio de la sección 5 (✅/❌), (d) pendientes o preguntas. **No** agregues nada más.
