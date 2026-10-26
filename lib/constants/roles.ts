export const ROLES = [
  { value: "superadmin", label: "Superadmin" },
  { value: "ceo", label: "CEO" },
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

export const ROLES_PLANEACION: Rol[] = [
  "superadmin",
  "ceo",
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
]

export function puedeAccederContratacion(rol: string): boolean {
  return (ROLES_CONTRATACION as readonly string[]).includes(rol)
}

export function puedeEditarContratacion(rol: string): boolean {
  return puedeAccederContratacion(rol)
}

export function esGerenteRegional(rol: string): boolean {
  return rol === "gerente_regional"
}

export function alcanceTotal(rol: string): boolean {
  return !esGerenteRegional(rol)
}

export function puedeEditarPlaneacion(rol: string): boolean {
  return rol === "superadmin" || esGerenteRegional(rol)
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
