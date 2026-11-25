/** Constantes puras (sin dependencias de servidor) del módulo Prestadores y contratos. */

export const TIPO_PERSONA = [
  { value: "natural", label: "Persona natural" },
  { value: "juridica", label: "Persona jurídica" },
] as const
export type TipoPersona = (typeof TIPO_PERSONA)[number]["value"]
export const TIPO_PERSONA_VALUES: [TipoPersona, ...TipoPersona[]] = (
  TIPO_PERSONA as readonly { value: TipoPersona }[]
).map((item) => item.value) as [TipoPersona, ...TipoPersona[]]

export const ESTADO_ESPECIALISTA = [
  { value: "activo", label: "Activo" },
  { value: "inactivo", label: "Inactivo" },
] as const
export type EstadoEspecialista = (typeof ESTADO_ESPECIALISTA)[number]["value"]
export const ESTADO_ESPECIALISTA_VALUES: [
  EstadoEspecialista,
  ...EstadoEspecialista[],
] = (
  ESTADO_ESPECIALISTA as readonly { value: EstadoEspecialista }[]
).map((item) => item.value) as [EstadoEspecialista, ...EstadoEspecialista[]]

export const ESTADO_VIGENCIA = [
  { value: "activo", label: "Activo" },
  { value: "pendiente_validacion", label: "Pendiente de validación" },
  { value: "inactivo", label: "Inactivo" },
  { value: "vencido", label: "Vencido" },
] as const
export type EstadoVigencia = (typeof ESTADO_VIGENCIA)[number]["value"]
export const ESTADO_VIGENCIA_VALUES: [EstadoVigencia, ...EstadoVigencia[]] = (
  ESTADO_VIGENCIA as readonly { value: EstadoVigencia }[]
).map((item) => item.value) as [EstadoVigencia, ...EstadoVigencia[]]

export const ESTADO_ASIGNACION = [
  { value: "activo", label: "Activo" },
  { value: "pendiente_validacion", label: "Pendiente de validación" },
  { value: "inactivo", label: "Inactivo" },
] as const
export type EstadoAsignacion = (typeof ESTADO_ASIGNACION)[number]["value"]
export const ESTADO_ASIGNACION_VALUES: [
  EstadoAsignacion,
  ...EstadoAsignacion[],
] = (
  ESTADO_ASIGNACION as readonly { value: EstadoAsignacion }[]
).map((item) => item.value) as [EstadoAsignacion, ...EstadoAsignacion[]]

export const ESTADO_VALIDACION = [
  { value: "pendiente", label: "Pendiente" },
  { value: "validado", label: "Validado" },
  { value: "rechazado", label: "Rechazado" },
] as const
export type EstadoValidacion = (typeof ESTADO_VALIDACION)[number]["value"]
export const ESTADO_VALIDACION_VALUES: [
  EstadoValidacion,
  ...EstadoValidacion[],
] = (
  ESTADO_VALIDACION as readonly { value: EstadoValidacion }[]
).map((item) => item.value) as [EstadoValidacion, ...EstadoValidacion[]]

export const TIPO_RED = [
  { value: "interna", label: "Interna" },
  { value: "externa", label: "Externa" },
] as const
export type TipoRed = (typeof TIPO_RED)[number]["value"]
export const TIPO_RED_VALUES: [TipoRed, ...TipoRed[]] = (
  TIPO_RED as readonly { value: TipoRed }[]
).map((item) => item.value) as [TipoRed, ...TipoRed[]]

/** Dominios de `catalogos_opciones` que alimentan los formularios. */
export const DOMINIOS_CATALOGO_PRESTADORES_CONTRATOS = [
  "regional",
  "especialidad",
  "tipo_identificacion",
  "modalidad_prestacion",
  "modalidad_contratacion",
  "tipo_red",
  "tipo_novedad",
  "agrupador",
  "tipo_imagen",
  "manual_tarifario",
] as const

export type DominioCatalogoPrestadoresContratos =
  (typeof DOMINIOS_CATALOGO_PRESTADORES_CONTRATOS)[number]

const ETIQUETAS: Record<string, string> = [
  ...TIPO_PERSONA,
  ...ESTADO_ESPECIALISTA,
  ...ESTADO_VIGENCIA,
  ...ESTADO_ASIGNACION,
  ...ESTADO_VALIDACION,
  ...TIPO_RED,
].reduce<Record<string, string>>((acc, item) => {
  acc[item.value] = item.label
  return acc
}, {})

export function etiquetaPrestadoresContratos(valor: string | null | undefined) {
  if (!valor) return "—"
  return ETIQUETAS[valor] ?? valor
}

export function varianteEstadoPrestadoresContratos(
  valor: string | null | undefined
): "default" | "secondary" | "destructive" | "outline" {
  switch (valor) {
    case "activo":
    case "validado":
      return "default"
    case "pendiente":
    case "pendiente_validacion":
      return "secondary"
    case "inactivo":
    case "rechazado":
    case "vencido":
      return "destructive"
    default:
      return "outline"
  }
}

export const TAMANO_PAGINA = 10
export const TAMANO_PAGINA_MAX = 50

export const TABLAS_HISTORIAL_PRESTADORES_CONTRATOS: Record<string, string> = {
  especialistas: "Especialista",
  contratos_especialistas: "Contrato",
  servicios_contratados_especialistas: "Servicio CUPS",
  sedes_servicios_especialistas: "Asignación de sede",
  novedades_prestadores_contratos: "Novedad",
}

export const CAMPOS_HISTORIAL_PRESTADORES_CONTRATOS: Record<string, string> = {
  tipo_identificacion: "Tipo de identificación",
  numero_identificacion: "Número de identificación",
  nombre_completo: "Nombre completo",
  tipo_persona: "Tipo de persona",
  especialidad: "Especialidad",
  regional: "Regional",
  ciudad: "Ciudad",
  estado: "Estado",
  asegurador_eps_id: "Asegurador",
  regimen_id: "Régimen",
  numero_contrato: "Número de contrato",
  modalidad_prestacion: "Modalidad de prestación",
  fecha_inicio: "Fecha de inicio",
  fecha_terminacion: "Fecha de terminación",
  cups_id: "CUPS",
  agrupador: "Agrupador",
  manual_tarifario: "Manual tarifario",
  porcentaje_descuento_incremento: "Descuento / incremento",
  modalidad_contratacion: "Modalidad de contratación",
  valor_tarifa: "Valor tarifa",
  atenciones_por_hora: "Atenciones por hora",
  sede_id: "Sede",
  tipo_red: "Tipo de red",
  validacion: "Validación",
  observaciones: "Observaciones",
  tipo_novedad: "Tipo de novedad",
  estado_validacion: "Estado de validación",
}
