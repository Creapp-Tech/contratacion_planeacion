import { createAdminClient } from "@/lib/supabase/admin"
import { ESTADO_EJECUCION_EN_EJECUCION } from "@/lib/contratos/constantes"

const CAMPOS_CONTRATO = `
  id,
  nombre,
  numero_contrato,
  ciudad,
  modalidad,
  estado,
  asegurador_id,
  regional_id,
  responsable_id,
  categoria_contrato_id,
  tipo_contrato_id,
  estado_legalizacion_id,
  estado_ejecucion_id,
  fecha_inicio,
  fecha_fin,
  prorroga_automatica,
  periodicidad,
  poblacion_total,
  valor_total,
  valor_percapita_manual,
  tiene_programas,
  url_ubicacion,
  notas,
  created_at,
  aseguradores_eps(nombre_eps),
  regionales(nombre),
  categoria_contrato:catalogos_opciones!contratos_categoria_contrato_id_fkey(nombre),
  tipo_contrato:catalogos_opciones!contratos_tipo_contrato_id_fkey(nombre),
  estado_legalizacion:catalogos_opciones!contratos_estado_legalizacion_id_fkey(nombre),
  estado_ejecucion:catalogos_opciones!contratos_estado_ejecucion_id_fkey(nombre)
`

const CAMPOS_DETALLE = `  sedes:contratos_sedes(
    sede_id,
    sedes(id, nombre, regional, municipio, codigo_reps)
  ),
  programas:contratos_programas(
    opcion_id,
    catalogos_opciones(nombre)
  ),
  valores:contratos_valores(
    id,
    regimen_id,
    poblacion,
    valor_total,
    valor_percapita_manual,
    regimenes(nombre)
  )`

const CAMPOS_DETALLE_STR = `${CAMPOS_CONTRATO}, ${CAMPOS_DETALLE}`

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function esUuid(value: string | undefined | null): value is string {
  return typeof value === "string" && UUID_RE.test(value)
}

export type ContratoRow = {
  id: string
  nombre: string
  numero_contrato: string
  ciudad: string
  modalidad: string
  estado: string
  asegurador_id: string
  regional_id: string
  responsable_id: string | null
  categoria_contrato_id: string | null
  tipo_contrato_id: string | null
  estado_legalizacion_id: string | null
  estado_ejecucion_id: string | null
  fecha_inicio: string | null
  fecha_fin: string | null
  prorroga_automatica: boolean
  periodicidad: string | null
  poblacion_total: number | null
  valor_total: number | null
  valor_percapita_manual: number | null
  tiene_programas: boolean
  url_ubicacion: string | null
  notas: string | null
  created_at: string
  aseguradores_eps: { nombre_eps: string } | null
  regionales: { nombre: string } | null
  responsable: { nombre: string } | null
  categoria_contrato: { nombre: string } | null
  tipo_contrato: { nombre: string } | null
  estado_legalizacion: { nombre: string } | null
  estado_ejecucion: { nombre: string } | null
}

export type ContratoSede = {
  sede_id: string
  sedes: {
    id: string
    nombre: string
    regional: string | null
    municipio: string | null
    codigo_reps: string | null
  } | null
}

export type ContratoPrograma = {
  opcion_id: string
  catalogos_opciones: { nombre: string } | null
}

export type ContratoValor = {
  id: string
  regimen_id: string | null
  poblacion: number | null
  valor_total: number | null
  valor_percapita_manual: number | null
  regimenes: { nombre: string } | null
}

export type ContratoDetalle = ContratoRow & {
  sedes: ContratoSede[]
  programas: ContratoPrograma[]
  valores: ContratoValor[]
}

export type ContratoFiltros = {
  q?: string
  asegurador?: string
  regional?: string
  vista?: VistaContratos
}

export type VistaContratos = "ejecucion" | "historial"

export type AlcanceContratosQuery = {
  verTodo: boolean
  regionalId: string | null
}

export type AseguradorOpcion = {
  id: string
  nombre_eps: string
}

export type RegionalOpcion = {
  id: string
  nombre: string
}

export type ResponsableOpcion = {
  id: string
  nombre: string
}

export type CatalogoOpcion = {
  id: string
  nombre: string
}

export type RegimenOpcion = {
  id: string
  nombre: string
}

export type SedeOpcion = {
  id: string
  nombre: string
  regional: string | null
  municipio: string | null
}

export type ContratoDocumentoRow = {
  id: string
  contrato_id: string
  tipo_documento: 'primigenio' | 'modificatorio' | 'otro_si' | 'anexo'
  numero_documento: string
  fecha_otorgamiento: string
  fecha_publicacion: string | null
  archivo_url: string
  resumen_cambios: string | null
  campos_afectados: string[] // JSON array of field names
  es_vigente: boolean
  numero_version: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export type OpcionesContrato = {
  aseguradores: AseguradorOpcion[]
  regionales: RegionalOpcion[]
  responsables: ResponsableOpcion[]
  categorias: CatalogoOpcion[]
  tiposContrato: CatalogoOpcion[]
  estadosLegalizacion: CatalogoOpcion[]
  estadosEjecucion: CatalogoOpcion[]
  programas: CatalogoOpcion[]
  regimenes: RegimenOpcion[]
  sedes: SedeOpcion[]
}

export async function getContrato(
  id: string,
  alcance: AlcanceContratosQuery
): Promise<ContratoDetalle | null> {
  if (!esUuid(id)) return null

  let query = createAdminClient()
    .from("contratos")
    .select(CAMPOS_DETALLE_STR)
    .eq("id", id)

  if (!alcance.verTodo) {
    if (!alcance.regionalId) return null
    query = query.eq("regional_id", alcance.regionalId)
  }

  const { data, error } = await query.maybeSingle()

  if (error) throw error
  if (!data) return null

  const detalle = data as unknown as ContratoDetalle
  const nombres = await obtenerNombresResponsables([detalle.responsable_id])
  return conNombreResponsable(detalle, nombres)
}

export const OPCIONES_CONTRATO_VACIAS: OpcionesContrato = {
  aseguradores: [],
  regionales: [],
  responsables: [],
  categorias: [],
  tiposContrato: [],
  estadosLegalizacion: [],
  estadosEjecucion: [],
  programas: [],
  regimenes: [],
  sedes: [],
}

function limpiarBusqueda(value: string) {
  return value.replace(/[%,()]/g, " ").trim()
}

async function obtenerNombresResponsables(
  ids: (string | null)[]
): Promise<Map<string, string>> {
  const unicos = [...new Set(ids.filter(esUuid))]
  if (unicos.length === 0) return new Map()

  const { data, error } = await createAdminClient()
    .from("catalogos_opciones")
    .select("id, nombre")
    .eq("dominio", "responsable")
    .in("id", unicos)

  if (error) throw error

  return new Map(
    ((data ?? []) as { id: string; nombre: string }[]).map((item) => [
      item.id,
      item.nombre,
    ])
  )
}

function conNombreResponsable<T extends ContratoRow>(fila: T, nombres: Map<string, string>): T {
  if (!fila.responsable_id) return { ...fila, responsable: null }
  const nombre = nombres.get(fila.responsable_id)
  return { ...fila, responsable: nombre ? { nombre } : null }
}

async function obtenerEstadoEnEjecucionId(): Promise<string> {
  const { data, error } = await createAdminClient()
    .from("catalogos_opciones")
    .select("id")
    .eq("dominio", "estado_ejecucion")
    .eq("nombre", ESTADO_EJECUCION_EN_EJECUCION)
    .eq("activo", true)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new Error(
      `No se encontró el estado de ejecución "${ESTADO_EJECUCION_EN_EJECUCION}" en el catálogo`
    )
  }

  return (data as { id: string }).id
}

export async function listContratos(
  filtros: ContratoFiltros,
  alcance: AlcanceContratosQuery
): Promise<ContratoRow[]> {
  const admin = createAdminClient()
  const vista = filtros.vista ?? "ejecucion"
  const estadoEnEjecucionId = await obtenerEstadoEnEjecucionId()

  let query = admin.from("contratos").select(CAMPOS_CONTRATO)

  // Solo se listan contratos activos. En Contratos únicamente los que están
  // "En ejecución"; en Historial el resto de estados (incluye sin estado).
  query = query.eq("estado", "activo")

  if (vista === "historial") {
    query = query.or(
      `estado_ejecucion_id.is.null,estado_ejecucion_id.neq.${estadoEnEjecucionId}`
    )
  } else {
    query = query.eq("estado_ejecucion_id", estadoEnEjecucionId)
  }

  if (!alcance.verTodo) {
    if (!alcance.regionalId) return []
    query = query.eq("regional_id", alcance.regionalId)
  } else if (esUuid(filtros.regional)) {
    query = query.eq("regional_id", filtros.regional)
  }

  if (esUuid(filtros.asegurador)) {
    query = query.eq("asegurador_id", filtros.asegurador)
  }

  if (filtros.q) {
    const q = limpiarBusqueda(filtros.q)
    if (q) {
      query = query.or(
        `nombre.ilike.%${q}%,numero_contrato.ilike.%${q}%`
      )
    }
  }

  const { data, error } = await query.order("nombre", { ascending: true })

  if (error) throw error

  const filas = (data ?? []) as unknown as ContratoRow[]
  const nombres = await obtenerNombresResponsables(
    filas.map((fila) => fila.responsable_id)
  )
  return filas.map((fila) => conNombreResponsable(fila, nombres))
}

export async function listOpcionesContrato(
  alcance: AlcanceContratosQuery
): Promise<OpcionesContrato> {
  const admin = createAdminClient()

  const [
    aseguradoresResult,
    regionalesResult,
    responsablesResult,
    categorias,
    tiposContrato,
    estadosLegalizacion,
    estadosEjecucion,
    programas,
    regimenesResult,
    sedesResult,
  ] = await Promise.all([
    admin
      .from("aseguradores_eps")
      .select("id, nombre_eps")
      .eq("estado", "activo")
      .order("nombre_eps", { ascending: true }),
    admin
      .from("regionales")
      .select("id, nombre")
      .order("nombre", { ascending: true }),
    admin
      .from("catalogos_opciones")
      .select("id, nombre, descripcion")
      .eq("dominio", "responsable")
      .eq("activo", true)
      .order("nombre", { ascending: true }),
    admin
      .from("catalogos_opciones")
      .select("id, nombre")
      .eq("dominio", "categoria")
      .eq("activo", true)
      .order("nombre", { ascending: true }),
    admin
      .from("catalogos_opciones")
      .select("id, nombre")
      .eq("dominio", "tipo_contrato")
      .eq("activo", true)
      .order("nombre", { ascending: true }),
    admin
      .from("catalogos_opciones")
      .select("id, nombre")
      .eq("dominio", "estado_legalizacion")
      .eq("activo", true)
      .order("nombre", { ascending: true }),
    admin
      .from("catalogos_opciones")
      .select("id, nombre")
      .eq("dominio", "estado_ejecucion")
      .eq("activo", true)
      .order("nombre", { ascending: true }),
    admin
      .from("catalogos_opciones")
      .select("id, nombre")
      .eq("dominio", "programa")
      .eq("activo", true)
      .order("nombre", { ascending: true }),
    admin
      .from("regimenes")
      .select("id, nombre")
      .order("nombre", { ascending: true }),
    admin
      .from("sedes")
      .select("id, nombre, regional, municipio")
      .eq("estado", "activa")
      .order("nombre", { ascending: true }),
  ])

  if (aseguradoresResult.error) throw aseguradoresResult.error
  if (regionalesResult.error) throw regionalesResult.error
  if (responsablesResult.error) throw responsablesResult.error
  if (categorias.error) throw categorias.error
  if (tiposContrato.error) throw tiposContrato.error
  if (estadosLegalizacion.error) throw estadosLegalizacion.error
  if (estadosEjecucion.error) throw estadosEjecucion.error
  if (programas.error) throw programas.error
  if (regimenesResult.error) throw regimenesResult.error
  if (sedesResult.error) throw sedesResult.error

  const aseguradores = (aseguradoresResult.data ?? []) as AseguradorOpcion[]
  let regionales = (regionalesResult.data ?? []) as RegionalOpcion[]
  const responsables = (responsablesResult.data ?? []) as ResponsableOpcion[]
  const categoriasData = (categorias.data ?? []) as CatalogoOpcion[]
  const tiposContratoData = (tiposContrato.data ?? []) as CatalogoOpcion[]
  const estadosLegalizacionData = (estadosLegalizacion.data ??
    []) as CatalogoOpcion[]
  const estadosEjecucionData = (estadosEjecucion.data ?? []) as CatalogoOpcion[]
  const programasData = (programas.data ?? []) as CatalogoOpcion[]
  const regimenesData = (regimenesResult.data ?? []) as RegimenOpcion[]
  let sedesData = (sedesResult.data ?? []) as SedeOpcion[]

  if (!alcance.verTodo) {
    if (!alcance.regionalId) {
      return { ...OPCIONES_CONTRATO_VACIAS, aseguradores }
    }

    regionales = regionales.filter(
      (regional) => regional.id === alcance.regionalId
    )

    const regionalNombre = regionales[0]?.nombre?.trim().toLowerCase() ?? null
    sedesData = regionalNombre
      ? sedesData.filter(
          (sede) => sede.regional?.trim().toLowerCase() === regionalNombre
        )
      : []
  }

  return {
    aseguradores,
    regionales,
    responsables,
    categorias: categoriasData,
    tiposContrato: tiposContratoData,
    estadosLegalizacion: estadosLegalizacionData,
    estadosEjecucion: estadosEjecucionData,
    programas: programasData,
    regimenes: regimenesData,
    sedes: sedesData,
  }
}

export async function listDocumentosContrato(
  contratoId: string
): Promise<ContratoDocumentoRow[]> {
  if (!esUuid(contratoId)) return []
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("contrato_documentos")
    .select("*")
    .eq("contrato_id", contratoId)
    .order("numero_version", { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as ContratoDocumentoRow[]
}

export async function getDocumentoVigente(
  contratoId: string
): Promise<ContratoDocumentoRow | null> {
  if (!esUuid(contratoId)) return null
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("contrato_documentos")
    .select("*")
    .eq("contrato_id", contratoId)
    .eq("es_vigente", true)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as unknown as ContratoDocumentoRow | null
}
