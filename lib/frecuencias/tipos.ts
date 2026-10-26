export const TIPOS_FRECUENCIA = [
  { value: "nota_tecnica_viva", label: "Nota técnica viva" },
  { value: "ejecucion_servicios", label: "Ejecución de servicios" },
  { value: "asegurador", label: "Asegurador" },
] as const

export type TipoFrecuencia = (typeof TIPOS_FRECUENCIA)[number]["value"]

export const TIPO_FRECUENCIA_VALUES: [TipoFrecuencia, ...TipoFrecuencia[]] = [
  "nota_tecnica_viva",
  "ejecucion_servicios",
  "asegurador",
]

export function etiquetaTipoFrecuencia(value: string): string {
  return TIPOS_FRECUENCIA.find((t) => t.value === value)?.label ?? value
}

export function tipoCalculaOcupacion(value: string): boolean {
  return value === "nota_tecnica_viva" || value === "ejecucion_servicios"
}