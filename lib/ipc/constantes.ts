// Constantes y formateadores del módulo Seguimiento IPC.

// País contra el que se compara el % IPC de los contratos. El histórico
// nacional puede contener otros países, pero el comparativo del dashboard usa
// este valor.
export const PAIS_IPC_COMPARACION = "Colombia"

export const ANIO_IPC_MIN = 2000
export const ANIO_IPC_MAX = 2100
export const IPC_PORCENTAJE_MIN = -100
export const IPC_PORCENTAJE_MAX = 100

export type EstadoIpc = "debajo" | "igual" | "arriba" | "sin_referencia"

export const ETIQUETAS_ESTADO_IPC: Record<EstadoIpc, string> = {
  debajo: "Por debajo",
  igual: "En línea",
  arriba: "Por encima",
  sin_referencia: "Sin referencia",
}

/**
 * Compara el % IPC del contrato contra el nacional. Se redondea a 3 decimales
 * (la precisión de la base) para evitar falsos negativos por punto flotante.
 */
export function compararIpc(
  contrato: number,
  nacional: number | null | undefined
): EstadoIpc {
  if (nacional == null || !Number.isFinite(nacional)) return "sin_referencia"

  const contratoMil = Math.round(contrato * 1000)
  const nacionalMil = Math.round(nacional * 1000)

  if (contratoMil < nacionalMil) return "debajo"
  if (contratoMil > nacionalMil) return "arriba"
  return "igual"
}

export function formatearMoneda(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—"
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatearPorcentaje(
  value: number | null | undefined,
  decimales = 2
): string {
  if (value == null || !Number.isFinite(value)) return "—"
  const formateado = new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(value)
  return `${formateado}%`
}

export function formatearPuntos(
  value: number | null | undefined,
  decimales = 2
): string {
  if (value == null || !Number.isFinite(value)) return "—"
  const formateado = new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(value)
  return `${value > 0 ? "+" : ""}${formateado} pp`
}
