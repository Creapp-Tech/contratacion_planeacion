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

const collator = new Intl.Collator("es", { numeric: true, sensitivity: "base" })

function esCapitulo(nombre: string, descripcion: string | null) {
  const valor = `${descripcion ?? ""} ${nombre}`.toLowerCase()
  return valor.includes("capítulo") || valor.includes("capitulo")
}

function esAnexo(nombre: string, descripcion: string | null) {
  const valor = `${descripcion ?? ""} ${nombre}`.toLowerCase()
  return valor.includes("anexo")
}

function esSeccion(nombre: string, descripcion: string | null) {
  const valor = `${descripcion ?? ""} ${nombre}`.toLowerCase()
  return valor.includes("sección") || valor.includes("seccion")
}

export async function listOpcionesCups(): Promise<CupsOpciones> {
  const { data, error } = await createAdminClient()
    .from("catalogos_opciones")
    .select("nombre, descripcion")
    .eq("dominio", "cups")
    .eq("activo", true)

  if (error) throw error

  const opciones = (data ?? []) as { nombre: string; descripcion: string | null }[]

  const capitulos = opciones
    .filter((opcion) =>
      esCapitulo(opcion.nombre, opcion.descripcion) || esAnexo(opcion.nombre, opcion.descripcion)
    )
    .map((opcion) => opcion.nombre)
    .sort((a, b) => collator.compare(a, b))

  const secciones = opciones
    .filter((opcion) => esSeccion(opcion.nombre, opcion.descripcion))
    .map((opcion) => opcion.nombre)
    .sort((a, b) => collator.compare(a, b))

  return { capitulos, secciones }
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
    const q = filtros.q.replace(/[,()]/g, " ").trim()
    query = query.or(
      `codigo.ilike.%${q}%,nombre.ilike.%${q}%,descripcion.ilike.%${q}%`
    )
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
