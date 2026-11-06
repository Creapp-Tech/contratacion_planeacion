export const ROLES = [
  { value: "superadmin", label: "Superadmin" },
  { value: "ceo", label: "CEO" },
  { value: "cfo", label: "CFO" },
  { value: "gerente_general", label: "Gerente General" },
  { value: "gerente_nacional", label: "Gerente Nacional" },
  { value: "director_nacional", label: "Director Nacional" },
  { value: "gerente_regional", label: "Gerente regional" },
  { value: "analista_contratacion", label: "Analista de contratación" },
  { value: "profesional_planeacion", label: "Profesional de planeación" },
] as const

export type Rol = (typeof ROLES)[number]["value"]

export const ROL_VALUES: [Rol, ...Rol[]] = (
  ROLES as readonly { value: Rol }[]
).map((rol) => rol.value) as [Rol, ...Rol[]]

export function rolLabel(value: string) {
  return ROLES.find((rol) => rol.value === value)?.label ?? value
}

/**
 * Roles con acceso de solo lectura a TODOS los módulos.
 * Pueden VER todo (sedes, población, frecuencias, contratos, IPC,
 * configuraciones y usuarios), pero NO pueden CREAR, EDITAR ni ELIMINAR.
 *
 * Cada módulo sigue aplicando su guardia de escritura en el servidor, de modo
 * que aunque se acceda por URL directa a una pantalla de creación/edición, la
 * acción será rechazada.
 */
export const ROLES_SOLO_LECTURA: Rol[] = [
  "ceo",
  "cfo",
  "gerente_general",
  "gerente_nacional",
]

export function puedeVerTodoModulos(rol: string): boolean {
  return (ROLES_SOLO_LECTURA as readonly string[]).includes(rol)
}

/** Alias de compatibilidad. */
export const ROLES_LENGUAJE_TOTAL = ROLES_SOLO_LECTURA

/** Alias de compatibilidad. */
export function estaEnLenguajeTotal(rol: string): boolean {
  return puedeVerTodoModulos(rol)
}

export const ROLES_PLANEACION: Rol[] = [
  "superadmin",
  "ceo",
  "cfo",
  "gerente_general",
  "gerente_nacional",
  "director_nacional",
  "gerente_regional",
  "profesional_planeacion",
]

export function puedeAccederPlaneacion(rol: string): boolean {
  return (ROLES_PLANEACION as readonly string[]).includes(rol)
}

export const ROLES_CONTRATACION: Rol[] = [
  "superadmin",
  "analista_contratacion",
  "gerente_regional",
  "ceo",
  "cfo",
  "gerente_general",
  "gerente_nacional",
]

export function puedeAccederContratacion(rol: string): boolean {
  return (ROLES_CONTRATACION as readonly string[]).includes(rol)
}

export function puedeEditarContratacion(rol: string): boolean {
  // Los roles de solo lectura pueden ver todo, pero no escribir.
  if (puedeVerTodoModulos(rol)) {
    return false
  }
  return puedeAccederContratacion(rol)
}

/** Alias explícito para acciones de crear/editar/eliminar en Contratación. */
export function puedeEscribirEnContratacion(rol: string): boolean {
  return puedeEditarContratacion(rol)
}

export function esGerenteRegional(rol: string): boolean {
  return rol === "gerente_regional"
}

export function alcanceTotal(rol: string): boolean {
  return !esGerenteRegional(rol)
}

export function puedeEditarPlaneacion(rol: string): boolean {
  // Los roles de solo lectura pueden ver todo, pero no escribir.
  if (puedeVerTodoModulos(rol)) {
    return false
  }
  return rol === "superadmin" || esGerenteRegional(rol)
}

/**
 * Indica si el rol puede escribir (crear/editar/eliminar) en un módulo.
 * Pensado para ocultar botones de escritura en la UI. La autorización real
 * siempre se valida en el servidor con los guards de cada módulo.
 */
export function puedeEscribirModulo(rol: string): boolean {
  return !puedeVerTodoModulos(rol)
}

export const ESTADOS = [
  { value: "activo", label: "Activo" },
  { value: "inactivo", label: "Inactivo" },
] as const

export type Estado = (typeof ESTADOS)[number]["value"]

export const ESTADO_VALUES: [Estado, ...Estado[]] = (
  ESTADOS as readonly { value: Estado }[]
).map((estado) => estado.value) as [Estado, ...Estado[]]

export function estadoLabel(value: string) {
  return ESTADOS.find((estado) => estado.value === value)?.label ?? value
}
