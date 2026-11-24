export const TAMANO_PAGINA = 10
export const TAMANO_PAGINA_MAX = 100

export const CAMPO_CME = "cme_contratado" as const
export const CAMPO_PRIMERA_OPCION = "primera_opcion_especialista_id" as const
export const CAMPO_SEGUNDA_OPCION = "segunda_opcion_especialista_id" as const

export const CAMPOS_EDICION_INLINE = [
  CAMPO_CME,
  CAMPO_PRIMERA_OPCION,
  CAMPO_SEGUNDA_OPCION,
] as const

export type CampoEdicionInline = (typeof CAMPOS_EDICION_INLINE)[number]

export const CAMPOS_OPCION = [
  CAMPO_PRIMERA_OPCION,
  CAMPO_SEGUNDA_OPCION,
] as const

export type CampoOpcion = (typeof CAMPOS_OPCION)[number]

export const ETIQUETA_CAMPO: Record<CampoEdicionInline, string> = {
  [CAMPO_CME]: "CME contratado",
  [CAMPO_PRIMERA_OPCION]: "Primera opción",
  [CAMPO_SEGUNDA_OPCION]: "Segunda opción",
}

export function esCampoOpcion(campo: string): campo is CampoOpcion {
  return CAMPOS_OPCION.includes(campo as CampoOpcion)
}

export const RUTA = "/aseguradores-contratos"
