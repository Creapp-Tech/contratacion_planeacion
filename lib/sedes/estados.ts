export const SEDE_ESTADOS = [
  { value: "activa", label: "Activa" },
  { value: "en_apertura", label: "En apertura" },
  { value: "inactiva", label: "Inactiva" },
] as const

export type SedeEstado = (typeof SEDE_ESTADOS)[number]["value"]

export const SEDE_ESTADO_VALUES: [SedeEstado, ...SedeEstado[]] = (
  SEDE_ESTADOS as readonly { value: SedeEstado }[]
).map((estado) => estado.value) as [SedeEstado, ...SedeEstado[]]

export function etiquetaEstadoSede(value: string) {
  return SEDE_ESTADOS.find((estado) => estado.value === value)?.label ?? value
}

export type SedeEstadoBadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"

export function varianteEstadoSede(value: string): SedeEstadoBadgeVariant {
  switch (value) {
    case "activa":
      return "default"
    case "en_apertura":
      return "secondary"
    case "inactiva":
      return "destructive"
    default:
      return "outline"
  }
}
