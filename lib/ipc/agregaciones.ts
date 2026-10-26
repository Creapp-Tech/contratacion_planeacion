import {
  ETIQUETAS_ESTADO_IPC,
  type EstadoIpc,
} from "@/lib/ipc/constantes"
import type { IpcConReferencia } from "@/lib/ipc/queries"

export type ResumenIpc = {
  totalRegistros: number
  totalContratos: number
  promedioIpc: number | null
  promedioNacional: number | null
  debajo: number
  comparables: number
  porcentajeDebajo: number | null
  costoPromedio: number | null
  costoTotal: number
}

function promedio(valores: number[]): number | null {
  if (valores.length === 0) return null
  return valores.reduce((total, valor) => total + valor, 0) / valores.length
}

export function resumirIpc(filas: IpcConReferencia[]): ResumenIpc {
  const conNacional = filas.filter((fila) => fila.ipc_nacional != null)
  const comparables = filas.filter(
    (fila) => fila.estado !== "sin_referencia"
  ).length
  const debajo = filas.filter((fila) => fila.estado === "debajo").length

  return {
    totalRegistros: filas.length,
    totalContratos: new Set(filas.map((fila) => fila.contrato_id)).size,
    promedioIpc: promedio(filas.map((fila) => fila.porcentaje_ipc)),
    promedioNacional: promedio(
      conNacional.map((fila) => fila.ipc_nacional as number)
    ),
    debajo,
    comparables,
    porcentajeDebajo:
      comparables > 0 ? (debajo / comparables) * 100 : null,
    costoPromedio: promedio(filas.map((fila) => fila.costo_usuario)),
    costoTotal: filas.reduce(
      (total, fila) => total + fila.costo_usuario,
      0
    ),
  }
}

export type PuntoEvolucion = {
  anio: number
  ipc: number
  nacional: number | null
}

export function serieEvolucion(
  filas: IpcConReferencia[]
): PuntoEvolucion[] {
  const porAnio = new Map<
    number,
    { valores: number[]; nacional: number | null }
  >()

  for (const fila of filas) {
    const acumulado = porAnio.get(fila.anio) ?? {
      valores: [],
      nacional: null,
    }
    acumulado.valores.push(fila.porcentaje_ipc)
    if (fila.ipc_nacional != null) {
      acumulado.nacional = fila.ipc_nacional
    }
    porAnio.set(fila.anio, acumulado)
  }

  return [...porAnio.entries()]
    .map(([anio, acumulado]) => ({
      anio,
      ipc: promedio(acumulado.valores) ?? 0,
      nacional: acumulado.nacional,
    }))
    .sort((a, b) => a.anio - b.anio)
}

export type PuntoContrato = {
  id: string
  etiqueta: string
  contrato: number
  nacional: number
  diferencia: number
  anio: number
}

/**
 * Devuelve los contratos con la mayor brecha negativa frente al IPC nacional.
 */
export function serieComparativo(
  filas: IpcConReferencia[],
  limite = 10
): PuntoContrato[] {
  return filas
    .filter(
      (fila) => fila.ipc_nacional != null && fila.diferencia != null
    )
    .sort((a, b) => (a.diferencia as number) - (b.diferencia as number))
    .slice(0, limite)
    .map((fila) => ({
      id: fila.id,
      etiqueta: `${fila.contratos.numero_contrato} · ${fila.anio}`,
      contrato: fila.porcentaje_ipc,
      nacional: fila.ipc_nacional as number,
      diferencia: fila.diferencia as number,
      anio: fila.anio,
    }))
}

export type PuntoCosto = {
  anio: number
  costo: number
}

export function serieCosto(filas: IpcConReferencia[]): PuntoCosto[] {
  const porAnio = new Map<number, number>()

  for (const fila of filas) {
    porAnio.set(
      fila.anio,
      (porAnio.get(fila.anio) ?? 0) + fila.costo_usuario
    )
  }

  return [...porAnio.entries()]
    .map(([anio, costo]) => ({ anio, costo }))
    .sort((a, b) => a.anio - b.anio)
}

export const COLORES_ESTADO_IPC: Record<EstadoIpc, string> = {
  debajo: "#dc2626",
  igual: "#d97706",
  arriba: "#16a34a",
  sin_referencia: "#94a3b8",
}

export type PuntoDistribucion = {
  estado: EstadoIpc
  etiqueta: string
  total: number
  color: string
}

const ORDEN_ESTADOS: EstadoIpc[] = [
  "debajo",
  "igual",
  "arriba",
  "sin_referencia",
]

export function serieDistribucion(
  filas: IpcConReferencia[]
): PuntoDistribucion[] {
  return ORDEN_ESTADOS.map((estado) => ({
    estado,
    etiqueta: ETIQUETAS_ESTADO_IPC[estado],
    total: filas.filter((fila) => fila.estado === estado).length,
    color: COLORES_ESTADO_IPC[estado],
  })).filter((punto) => punto.total > 0)
}

export function peoresBrechas(
  filas: IpcConReferencia[],
  limite = 5
): IpcConReferencia[] {
  return filas
    .filter((fila) => fila.estado === "debajo")
    .sort((a, b) => (a.diferencia as number) - (b.diferencia as number))
    .slice(0, limite)
}
