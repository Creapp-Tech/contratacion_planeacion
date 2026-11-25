/** Tipos del módulo Aseguradores y Contratos (Servicios CUPS). */

export type ServicioCupsRow = {
  id: string
  asegurador_id: string
  contrato_id: string
  cups_asegurador: string
  cups_id: string | null
  frecuencia_uso_contratada: number | string | null
  cme_contratado: number | string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export type OpcionCatalogo = { id: string; nombre: string }

export type ContratoOpcion = {
  id: string
  asegurador_id: string
  numero_contrato: string
  nombre: string
  estado: string
  regionales: string[]
}

export type OpcionesAseguradoresContratos = {
  aseguradores: OpcionCatalogo[]
  contratos: ContratoOpcion[]
}

export const OPCIONES_VACIAS: OpcionesAseguradoresContratos = {
  aseguradores: [],
  contratos: [],
}

export type ServicioCupsListaFila = ServicioCupsRow & {
  asegurador: string
  contrato: string
  contratoRegionales: string[]
  cupsResolucion: { id: string; codigo: string; nombre: string | null } | null
}

export type AseguradoresContratosFiltros = {
  q?: string
  aseguradorId?: string
  contratoId?: string
  cupsId?: string
  regional?: string
  page?: number
  pageSize?: number
}

export type ListaResultado<T> = {
  rows: T[]
  total: number
  page: number
  pageSize: number
}

export type ResumenAseguradoresContratos = {
  servicios: number
  contratos: number
  aseguradores: number
  conCupsResolucion: number
  cmePromedio: number
  conCme: number
}
