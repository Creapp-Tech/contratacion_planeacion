/** Tipos del módulo Aseguradores y Contratos (Servicios CUPS). */

export type ServicioCupsRow = {
  id: string
  asegurador_id: string
  contrato_id: string
  cups_asegurador: string
  cups_id: string | null
  frecuencia_uso_contratada: number | string | null
  cme_contratado: number | string
  primera_opcion_especialista_id: string | null
  segunda_opcion_especialista_id: string | null
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

export type EspecialistaOpcion = {
  id: string
  numero_identificacion: string
  nombre_completo: string
  esViva1a: boolean
}

export type OpcionesAseguradoresContratos = {
  aseguradores: OpcionCatalogo[]
  contratos: ContratoOpcion[]
  especialistas: EspecialistaOpcion[]
  viva1aId: string | null
}

export const OPCIONES_VACIAS: OpcionesAseguradoresContratos = {
  aseguradores: [],
  contratos: [],
  especialistas: [],
  viva1aId: null,
}

export type ServicioCupsListaFila = ServicioCupsRow & {
  asegurador: string
  contrato: string
  contratoRegionales: string[]
  cupsResolucion: { id: string; codigo: string; nombre: string | null } | null
  primeraOpcion: EspecialistaOpcion | null
  segundaOpcion: EspecialistaOpcion | null
}

export type AseguradoresContratosFiltros = {
  q?: string
  aseguradorId?: string
  contratoId?: string
  cupsId?: string
  opcionId?: string
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
}
