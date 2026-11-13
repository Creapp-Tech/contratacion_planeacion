const FORMATO_BOGOTA = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

/**
 * Devuelve el `updated_at` más reciente del conjunto de contratos, o `null`
 * cuando no hay datos con fecha válida.
 */
export function ultimaActualizacionDe(
  contratos: Array<{ updated_at: string }>
): string | null {
  let ultima: string | null = null
  let ultimaMs = Number.NEGATIVE_INFINITY

  for (const contrato of contratos) {
    const ms = new Date(contrato.updated_at).getTime()
    if (Number.isNaN(ms) || ms <= ultimaMs) continue
    ultimaMs = ms
    ultima = contrato.updated_at
  }

  return ultima
}

/**
 * Formatea una fecha ISO como `DD/MM/AAAA HH:mm` en la zona horaria de
 * Bogotá, independientemente de la zona horaria del servidor.
 */
export function formatearFechaHoraBogota(value: string | null): string {
  if (!value) return "—"

  const fecha = new Date(value)
  if (Number.isNaN(fecha.getTime())) return "—"

  const partes = FORMATO_BOGOTA.formatToParts(fecha)
  const obtener = (tipo: Intl.DateTimeFormatPartTypes): string =>
    partes.find((parte) => parte.type === tipo)?.value ?? ""

  return `${obtener("day")}/${obtener("month")}/${obtener("year")} ${obtener(
    "hour"
  )}:${obtener("minute")}`
}
