export const MODALIDADES = [
  { value: "capita", label: "Capita" },
  { value: "especial", label: "Especial" },
  { value: "evento", label: "Evento" },
  { value: "integral", label: "Integral" },
  { value: "pgp", label: "PGP" },
] as const

export type Modalidad = (typeof MODALIDADES)[number]["value"]

export const MODALIDAD_VALUES: [Modalidad, ...Modalidad[]] = [
  "capita",
  "especial",
  "evento",
  "integral",
  "pgp",
]

export function etiquetaModalidad(value: string): string {
  return MODALIDADES.find((modalidad) => modalidad.value === value)?.label ?? value
}

export const ESTADOS_CONTRATO = [
  { value: "activo", label: "Activo" },
  { value: "inactivo", label: "Inactivo" },
] as const

export type EstadoContrato = (typeof ESTADOS_CONTRATO)[number]["value"]

export function etiquetaEstadoContrato(value: string): string {
  return ESTADOS_CONTRATO.find((estado) => estado.value === value)?.label ?? value
}

export const PERIODICIDADES = [
  { value: "mensual", label: "Mensual" },
  { value: "anual", label: "Anual" },
] as const

// Estado de ejecución que determina si un contrato está vigente en el módulo
// Contratos. El resto de estados (finalizados/terminados) se muestran en
// Historial.
export const ESTADO_EJECUCION_EN_EJECUCION = "En ejecución"

export type Periodicidad = (typeof PERIODICIDADES)[number]["value"]

export const PERIODICIDAD_VALUES: [Periodicidad, ...Periodicidad[]] = [
  "mensual",
  "anual",
]

export function etiquetaPeriodicidad(value: string | null): string {
  if (!value) return "—"
  return (
    PERIODICIDADES.find((periodicidad) => periodicidad.value === value)?.label ??
    value
  )
}

export type ValorRegimen = {
  regimen_id: string | null
  poblacion: number | null
  valor_total: number | null
  valor_percapita_manual: number | null
}

export type CalculosContrato = {
  poblacionTotal: number
  valorTotal: number
  valorMensual: number
  valorPercapitaCalculado: number | null
  valorPercapita: number | null
}

export function calcularContrato(
  contrato: {
    periodicidad: string | null
    poblacion_total: number | null
    valor_total: number | null
    valor_percapita_manual: number | null
  },
  valores: ValorRegimen[] = []
): CalculosContrato {
  const poblacionDiscriminada = valores.reduce(
    (total, valor) => total + (valor.poblacion ?? 0),
    0
  )
  const valorDiscriminado = valores.reduce(
    (total, valor) => total + (valor.valor_total ?? 0),
    0
  )

  const poblacionTotal = valores.length
    ? poblacionDiscriminada
    : (contrato.poblacion_total ?? 0)

  const valorTotal = valores.length
    ? valorDiscriminado
    : (contrato.valor_total ?? 0)

  const valorMensual =
    contrato.periodicidad === "anual" ? valorTotal / 12 : valorTotal

  const valorPercapitaCalculado =
    poblacionTotal > 0 ? valorMensual / poblacionTotal : null

  return {
    poblacionTotal,
    valorTotal,
    valorMensual,
    valorPercapitaCalculado,
    valorPercapita:
      contrato.valor_percapita_manual ?? valorPercapitaCalculado,
  }
}

export function formatearMoneda(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "—"
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatearFecha(value: string | null): string {
  if (!value) return "—"
  const partes = value.split("-")
  if (partes.length !== 3) return value
  const fecha = new Date(
    Number(partes[0]),
    Number(partes[1]) - 1,
    Number(partes[2])
  )
  if (Number.isNaN(fecha.getTime())) return value
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(fecha)
}

// Días antes de la fecha de fin en los que un contrato se considera
// "Próximo a vencer" en el listado.
export const DIAS_PROXIMO_VENCER = 75

export type EstadoVigencia =
  | "vigente"
  | "proximo_vencer"
  | "vencido"
  | "sin_fecha"

// Filtro aplicable desde las tarjetas de resumen. "sin_fecha" no se ofrece
// como filtro porque agrupa contratos sin fecha de fin registrada.
export type FiltroVigencia =
  | "todos"
  | "vigente"
  | "proximo_vencer"
  | "vencido"

export type VigenciaContrato = {
  estado: EstadoVigencia
  etiqueta: string
  diasRestantes: number | null
}

export function calcularVigencia(
  fechaFin: string | null,
  hoy: Date = new Date()
): VigenciaContrato {
  if (!fechaFin) {
    return { estado: "sin_fecha", etiqueta: "Sin fecha", diasRestantes: null }
  }

  const partes = fechaFin.split("-")
  const fin =
    partes.length === 3
      ? new Date(
          Number(partes[0]),
          Number(partes[1]) - 1,
          Number(partes[2])
        )
      : new Date(fechaFin)

  if (Number.isNaN(fin.getTime())) {
    return { estado: "sin_fecha", etiqueta: "Sin fecha", diasRestantes: null }
  }

  const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  const diasRestantes = Math.round(
    (fin.getTime() - inicioDia.getTime()) / 86_400_000
  )

  if (diasRestantes < 0) {
    return { estado: "vencido", etiqueta: "Vencido", diasRestantes }
  }
  if (diasRestantes <= DIAS_PROXIMO_VENCER) {
    return {
      estado: "proximo_vencer",
      etiqueta: "Próximo a vencer",
      diasRestantes,
    }
  }
  return { estado: "vigente", etiqueta: "Vigente", diasRestantes }
}
