/** Tipos de datos del módulo Prestadores y contratos. */

export type EspecialistaRow = {
  id: string
  tipo_identificacion: string
  numero_identificacion: string
  nombre_completo: string
  tipo_persona: string
  especialidad: string
  ciudad: string
  estado: string
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export type EspecialistaListaFila = EspecialistaRow & {
  /** Regionales derivadas de las sedes asignadas (no campo del especialista). */
  regionales: string[]
  contratos: number
  aseguradores: number
  servicios: number
  sedes: number
}

export type ContratoEspecialistaRow = {
  id: string
  especialista_id: string
  asegurador_eps_id: string
  regimen_id: string | null
  numero_contrato: string | null
  modalidad_prestacion: string | null
  fecha_inicio: string | null
  fecha_terminacion: string | null
  estado: string
  observaciones: string | null
  created_at: string
  updated_at: string
  aseguradores_eps?: { nombre_eps: string } | null
  regimenes?: { nombre: string } | null
}

export type ServicioContratadoRow = {
  id: string
  contrato_especialista_id: string
  cups_id: string
  agrupador: string | null
  especialidad: string | null
  tipo_imagen: string | null
  manual_tarifario: string | null
  porcentaje_descuento_incremento: number | string | null
  modalidad_contratacion: string | null
  valor_tarifa: number | string | null
  atenciones_por_hora: number | null
  modalidad_prestacion: string | null
  created_at: string
  updated_at: string
}

export type AsignacionSedeRow = {
  id: string
  especialista_id: string
  contrato_especialista_id: string
  servicio_contratado_id: string
  sede_id: string
  tipo_red: string
  observaciones: string | null
  created_at: string
  updated_at: string
}

export type NovedadRow = {
  id: string
  especialista_id: string
  contrato_especialista_id: string | null
  servicio_contratado_id: string | null
  asignacion_sede_id: string | null
  tipo_novedad: string
  fecha_inicio: string | null
  fecha_terminacion: string | null
  observaciones: string | null
  estado_validacion: string
  created_at: string
  updated_at: string
}

export type HistorialRow = {
  id: string
  tabla: string
  registro_id: string
  campo: string
  valor_anterior: string | null
  valor_nuevo: string | null
  usuario_id: string | null
  created_at: string
  usuarios?: { nombre_completo: string } | null
}

export type ContratoDetalle = ContratoEspecialistaRow & {
  servicios: number
  sedes: number
}

export type ServicioDetalle = ServicioContratadoRow & {
  cups: { id: string; codigo: string; nombre: string | null } | null
  contratos_especialistas:
    | {
        id: string
        numero_contrato: string | null
        asegurador_eps_id: string
        aseguradores_eps: { nombre_eps: string } | null
      }
    | null
  sedes_servicios_especialistas: { id: string }[] | null
  sedes: number
}

export type AsignacionDetalle = AsignacionSedeRow & {
  sedes: { id: string; nombre: string; regional: string | null } | null
  contratos_especialistas:
    | {
        id: string
        numero_contrato: string | null
        aseguradores_eps: { nombre_eps: string } | null
      }
    | null
  servicios_contratados_especialistas:
    | {
        id: string
        cups: { codigo: string; nombre: string | null } | null
      }
    | null
}

export type NovedadDetalle = NovedadRow & {
  contratos_especialistas:
    | {
        id: string
        numero_contrato: string | null
        aseguradores_eps: { nombre_eps: string } | null
      }
    | null
  servicios_contratados_especialistas:
    | { id: string; cups: { codigo: string; nombre: string | null } | null }
    | null
  sedes_servicios_especialistas:
    | { id: string; sedes: { nombre: string } | null }
    | null
}

export type PrestadoresContratosDetalle = {
  especialista: EspecialistaRow
  /** Regionales derivadas de las sedes asignadas al especialista. */
  regionales: string[]
  contratos: ContratoDetalle[]
  servicios: ServicioDetalle[]
  asignaciones: AsignacionDetalle[]
  novedades: NovedadDetalle[]
  historial: HistorialRow[]
}

export type PrestadoresContratosFiltros = {
  q?: string
  regional?: string
  ciudad?: string
  aseguradorId?: string
  especialidad?: string
  estado?: string
  page?: number
  pageSize?: number
}

export type ListaResultado<T> = {
  rows: T[]
  total: number
  page: number
  pageSize: number
}

export type ResumenPrestadoresContratos = {
  especialistas: number
  conContratosVigentes: number
  aseguradoresRelacionados: number
  sedesAsignadas: number
  pendientesValidacion: number
}

export type OpcionCatalogo = { id: string; nombre: string }

export type OpcionesPrestadoresContratos = {
  tiposIdentificacion: string[]
  especialidades: string[]
  modalidadesPrestacion: string[]
  modalidadesContratacion: string[]
  tiposRed: string[]
  tiposNovedad: string[]
  agrupadores: string[]
  tiposImagen: string[]
  manualesTarifario: string[]
  regionales: string[]
  aseguradores: OpcionCatalogo[]
  regimenes: OpcionCatalogo[]
  sedes: { id: string; nombre: string; regional: string | null }[]
}

export const OPCIONES_PRESTADORES_CONTRATOS_VACIAS: OpcionesPrestadoresContratos = {
  tiposIdentificacion: [],
  especialidades: [],
  modalidadesPrestacion: [],
  modalidadesContratacion: [],
  tiposRed: [],
  tiposNovedad: [],
  agrupadores: [],
  tiposImagen: [],
  manualesTarifario: [],
  regionales: [],
  aseguradores: [],
  regimenes: [],
  sedes: [],
}

export type CupsOpcion = {
  id: string
  codigo: string
  nombre: string | null
  descripcion: string | null
  /** Derivados del catálogo: cups.grupo_id -> grupos_servicio.nombre. */
  agrupador: string | null
  /** Derivados del catálogo: cups.servicio_id -> servicios.nombre. */
  especialidad: string | null
}
