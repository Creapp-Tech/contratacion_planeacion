import { createAdminClient } from "@/lib/supabase/admin"

export type CupsRow = {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  capitulo: string | null
  grupo_id: string | null
  servicio_id: string | null
  seccion: string | null
  extra_vii: string | null
  extra_viii: string | null
  extra_ix: string | null
  version_resolucion: string
  fecha_inicio: string
  fecha_fin: string | null
  activo: boolean
  created_at: string
  updated_at: string
  grupos_servicio?: {
    nombre: string
  } | null
  servicios?: {
    nombre: string
    grupo_id: string | null
  } | null
}

export type GrupoServicioOption = {
  id: string
  nombre: string
}

export type ServicioOption = {
  id: string
  nombre: string
  grupo_id: string | null
}

export type CupsOpciones = {
  capitulos: string[]
  secciones: string[]
}

export type CupsListado = {
  rows: CupsRow[]
  total: number
}

export type CupsPaginacionParams = {
  page: number
  pageSize: number
}

export const CUP_PAGE_SIZES = [10, 25, 50, 100] as const

export function normalizarPaginacion(
  pagina: string | string[] | undefined,
  porPagina: string | string[] | undefined
): CupsPaginacionParams {
  const page = typeof pagina === "string" ? Number(pagina) : NaN
  const pageSize = typeof porPagina === "string" ? Number(porPagina) : NaN

  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: CUP_PAGE_SIZES.find((size) => size === pageSize) ?? 10,
  }
}

const collator = new Intl.Collator("es", { numeric: true, sensitivity: "base" })

export async function listOpcionesCups(): Promise<CupsOpciones> {
  const { data, error } = await createAdminClient().rpc("cups_opciones_filtro")

  if (error) throw error

  const filas = (data ?? []) as CupsOpciones[]

  return {
    capitulos: [...(filas[0]?.capitulos ?? [])].sort((a, b) =>
      collator.compare(a, b)
    ),
    secciones: [...(filas[0]?.secciones ?? [])].sort((a, b) =>
      collator.compare(a, b)
    ),
  }
}

export type CupsFiltros = {
  q?: string           // buscador en código + nombre + descripción
  grupo_id?: string    // filtro por grupo de servicio
  servicio_id?: string // filtro por servicio
  capitulo?: string
  seccion?: string
  version?: string
  activo?: boolean
}

// PostgREST usa \, (, ), ', % y _ como caracteres especiales en los filtros.
function escaparValorLike(valor: string) {
  return valor.replace(/[\\%,()'._]/g, "\\$&")
}

export async function listCups(
  filtros: CupsFiltros = {},
  { page, pageSize }: CupsPaginacionParams = { page: 1, pageSize: 10 }
): Promise<CupsListado> {
  const consultarPagina = async (pagina: number): Promise<CupsListado> => {
    let query = createAdminClient()
      .from("cups")
      .select(
        `*, grupos_servicio(nombre), servicios(nombre, grupo_id)`,
        { count: "exact" }
      )
      .order("codigo", { ascending: true })
      .range((pagina - 1) * pageSize, pagina * pageSize - 1)

    if (filtros.q) {
      const q = escaparValorLike(filtros.q.trim())
      if (q) {
        query = query.or(
          `codigo.ilike.%${q}%,nombre.ilike.%${q}%,descripcion.ilike.%${q}%`
        )
      }
    }

    if (filtros.grupo_id) {
      query = query.eq("grupo_id", filtros.grupo_id)
    }

    if (filtros.servicio_id) {
      query = query.eq("servicio_id", filtros.servicio_id)
    }

    if (filtros.capitulo) {
      query = query.eq("capitulo", filtros.capitulo)
    }

    if (filtros.seccion) {
      query = query.eq("seccion", filtros.seccion)
    }

    if (filtros.version) {
      query = query.eq("version_resolucion", filtros.version)
    }

    if (filtros.activo !== undefined) {
      query = query.eq("activo", filtros.activo)
    }

    const { data, error, count } = await query

    if (error) throw error

    return {
      rows: (data ?? []) as CupsRow[],
      total: count ?? data?.length ?? 0,
    }
  }

  const resultado = await consultarPagina(page)

  // Si los filtros redujeron el total y la URL apuntaba a una página ya
  // inexistente, volvemos a la última página válida.
  if (resultado.rows.length === 0 && page > 1) {
    const totalPages = Math.max(1, Math.ceil(resultado.total / pageSize))
    if (page > totalPages) return consultarPagina(totalPages)
  }

  return resultado
}

export async function getCups(id: string): Promise<CupsRow | null> {
  const { data, error } = await createAdminClient()
    .from("cups")
    .select(`
      *,
      grupos_servicio(nombre),
      servicios(nombre, grupo_id)
    `)
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return data as CupsRow
}

export async function listGruposServicio(): Promise<GrupoServicioOption[]> {
  const { data, error } = await createAdminClient()
    .from("grupos_servicio")
    .select("id, nombre")
    .eq("activo", true)
    .order("nombre", { ascending: true })

  if (error) throw error

  return (data ?? []) as GrupoServicioOption[]
}

export async function listServiciosPorGrupo(grupoId: string): Promise<ServicioOption[]> {
  const { data, error } = await createAdminClient()
    .from("servicios")
    .select("id, nombre, grupo_id")
    .eq("activo", true)
    .eq("grupo_id", grupoId)
    .order("nombre", { ascending: true })

  if (error) throw error

  return (data ?? []) as ServicioOption[]
}

export async function listServiciosActivos(): Promise<ServicioOption[]> {
  const { data, error } = await createAdminClient()
    .from("servicios")
    .select("id, nombre, grupo_id")
    .eq("activo", true)
    .order("nombre", { ascending: true })

  if (error) throw error

  return (data ?? []) as ServicioOption[]
}
