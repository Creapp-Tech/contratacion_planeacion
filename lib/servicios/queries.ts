import { createAdminClient } from "@/lib/supabase/admin"

export type ServicioRow = {
  id: string
  nombre: string
  grupo_id: string | null
  duracion_minutos: number | null
  area_id: string | null
  tipo_personal: string
  activo: boolean
  created_at: string
  updated_at: string
}

export type ServicioAnidado = ServicioRow & {
  areas_catalogo: {
    nombre: string
    categoria: string
  } | null
  grupos_servicio: {
    nombre: string
  } | null
}

export type Servicio = {
  id: string
  nombre: string
  grupo_id: string | null
  grupo_nombre: string | null
  duracion_minutos: number | null
  area_id: string | null
  area_nombre: string | null
  area_categoria: string | null
  tipo_personal: string
  activo: boolean
  created_at: string
}

export type GrupoServicio = {
  id: string
  nombre: string
}

export type GrupoServicioAdmin = GrupoServicio & {
  activo: boolean
  created_at: string
  servicios_count: number
}

export function etiquetaServicio(
  nombre: string,
  grupo: string | null | undefined
) {
  return grupo ? `${nombre} (${grupo})` : nombre
}

function mapearServicio(fila: ServicioAnidado): Servicio {
  return {
    id: fila.id,
    nombre: fila.nombre,
    grupo_id: fila.grupo_id,
    grupo_nombre: fila.grupos_servicio?.nombre ?? null,
    duracion_minutos: fila.duracion_minutos,
    area_id: fila.area_id,
    area_nombre: fila.areas_catalogo?.nombre ?? null,
    area_categoria: fila.areas_catalogo?.categoria ?? null,
    tipo_personal: fila.tipo_personal,
    activo: fila.activo,
    created_at: fila.created_at,
  }
}

const SELECT_SERVICIO =
  "id, nombre, grupo_id, duracion_minutos, area_id, tipo_personal, activo, created_at, updated_at, areas_catalogo(nombre, categoria), grupos_servicio(nombre)"

export type ServicioFiltros = {
  q?: string
  grupo_id?: string
  area_id?: string
  tipo_personal?: string
}

export async function listServicios(
  filtros: ServicioFiltros = {}
): Promise<Servicio[]> {
  let query = createAdminClient()
    .from("servicios")
    .select(SELECT_SERVICIO)
    .order("nombre", { ascending: true })

  if (filtros.q) {
    query = query.ilike("nombre", `%${filtros.q}%`)
  }

  if (filtros.grupo_id) {
    query = query.eq("grupo_id", filtros.grupo_id)
  }

  if (filtros.area_id) {
    query = query.eq("area_id", filtros.area_id)
  }

  if (filtros.tipo_personal) {
    query = query.eq("tipo_personal", filtros.tipo_personal)
  }

  const { data, error } = await query

  if (error) throw error

  return ((data ?? []) as unknown as ServicioAnidado[]).map(mapearServicio)
}

export async function getServicio(id: string): Promise<Servicio | null> {
  const { data, error } = await createAdminClient()
    .from("servicios")
    .select(SELECT_SERVICIO)
    .eq("id", id)
    .maybeSingle()

  if (error) throw error

  if (!data) return null

  return mapearServicio(data as unknown as ServicioAnidado)
}

export async function listServiciosOpciones(): Promise<
  { id: string; nombre: string; grupo: string | null }[]
> {
  const { data, error } = await createAdminClient()
    .from("servicios")
    .select("id, nombre, grupos_servicio(nombre)")
    .eq("activo", true)
    .order("nombre", { ascending: true })

  if (error) throw error

  return ((data ?? []) as unknown as {
    id: string
    nombre: string
    grupos_servicio: { nombre: string }[] | null
  }[]).map((fila) => ({
    id: fila.id,
    nombre: fila.nombre,
    grupo: fila.grupos_servicio?.[0]?.nombre ?? null,
  }))
}

export async function listGruposServicio(): Promise<GrupoServicio[]> {
  const { data, error } = await createAdminClient()
    .from("grupos_servicio")
    .select("id, nombre")
    .eq("activo", true)
    .order("nombre", { ascending: true })

  if (error) throw error

  return (data ?? []) as GrupoServicio[]
}

type GrupoServicioAdminRow = {
  id: string
  nombre: string
  activo: boolean
  created_at: string
  servicios: { count: number }[]
}

export async function listGruposServicioAdmin(): Promise<
  GrupoServicioAdmin[]
> {
  const { data, error } = await createAdminClient()
    .from("grupos_servicio")
    .select("id, nombre, activo, created_at, servicios(count)")
    .order("nombre", { ascending: true })

  if (error) throw error

  return ((data ?? []) as unknown as GrupoServicioAdminRow[]).map((fila) => ({
    id: fila.id,
    nombre: fila.nombre,
    activo: fila.activo,
    created_at: fila.created_at,
    servicios_count: fila.servicios?.[0]?.count ?? 0,
  }))
}

export async function getGrupoServicio(
  id: string
): Promise<GrupoServicioAdmin | null> {
  const { data, error } = await createAdminClient()
    .from("grupos_servicio")
    .select("id, nombre, activo, created_at, servicios(count)")
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const fila = data as unknown as GrupoServicioAdminRow
  return {
    id: fila.id,
    nombre: fila.nombre,
    activo: fila.activo,
    created_at: fila.created_at,
    servicios_count: fila.servicios?.[0]?.count ?? 0,
  }
}