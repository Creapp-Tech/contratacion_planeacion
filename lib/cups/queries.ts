import { createAdminClient } from "@/lib/supabase/admin"

export type CupsRow = {
  id: string
  codigo: string
  descripcion: string
  grupo_id: string | null
  servicio_id: string | null
  seccion: string
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

export type CupsFiltros = {
  q?: string           // buscador en código + descripción
  grupo_id?: string    // filtro por grupo de servicio
  servicio_id?: string // filtro por servicio
  seccion?: string
  version?: string
  activo?: boolean
}

export async function listCups(filtros: CupsFiltros = {}): Promise<CupsRow[]> {
  let query = createAdminClient()
    .from("cups")
    .select(`
      *,
      grupos_servicio(nombre),
      servicios(nombre, grupo_id)
    `)
    .order("codigo", { ascending: true })

  if (filtros.q) {
    query = query.ilike("codigo", `%${filtros.q}%`).or(`ilike(descripcion, \`%${filtros.q}%\`)`)
  }

  if (filtros.grupo_id) {
    query = query.eq("grupo_id", filtros.grupo_id)
  }

  if (filtros.servicio_id) {
    query = query.eq("servicio_id", filtros.servicio_id)
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

  const { data, error } = await query

  if (error) throw error

  return (data ?? []) as CupsRow[]
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
