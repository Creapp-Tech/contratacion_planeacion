export const TAMANO_PAGINA = 10
export const TAMANO_PAGINA_MAX = 100

export const CAMPO_CME = "cme_contratado" as const

export const CAMPOS_EDICION_INLINE = [CAMPO_CME] as const

export type CampoEdicionInline = (typeof CAMPOS_EDICION_INLINE)[number]

export const ETIQUETA_CAMPO: Record<CampoEdicionInline, string> = {
  [CAMPO_CME]: "CME Asegurador",
}

export const RUTA = "/aseguradores-contratos"
