import { createAdminClient } from "@/lib/supabase/admin"

export type ServicioRow = {
  id: string
  nombre: string
  grupo: string | null
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
}

export type Servicio = {
  id: string
  nombre: string
  grupo: string | null
  area_id: string | null
  area_nombre: string | null
  area_categoria: string | null
  tipo_personal: string
  activo: boolean
  created_at: string
}

function mapearServicio(fila: ServicioAnidado): Servicio {
  return {
    id: fila.id,
    nombre: fila.nombre,
    grupo: fila.grupo,
    area_id: fila.area_id,
    area_nombre: fila.areas_catalogo?.nombre ?? null,
    area_categoria: fila.areas_catalogo?.categoria ?? null,
    tipo_personal: fila.tipo_personal,
    activo: fila.activo,
    created_at: fila.created_at,
  }
}

export type ServicioFiltros = {
  q?: string
  tipo_personal?: string
}

export async function listServicios(
  filtros: ServicioFiltros = {}
): Promise<Servicio[]> {
  let query = createAdminClient()
    .from("servicios")
    .select(
      "id, nombre, grupo, area_id, tipo_personal, activo, created_at, updated_at, areas_catalogo(nombre, categoria)"
    )
    .order("nombre", { ascending: true })

  if (filtros.q) {
    query = query.ilike("nombre", `%${filtros.q}%`)
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
    .select(
      "id, nombre, grupo, area_id, tipo_personal, activo, created_at, updated_at, areas_catalogo(nombre, categoria)"
    )
    .eq("id", id)
    .maybeSingle()

  if (error) throw error

  if (!data) return null

  return mapearServicio(data as unknown as ServicioAnidado)
}

export async function listServiciosOpciones(): Promise<
  { id: string; nombre: string }[]
> {
  const { data, error } = await createAdminClient()
    .from("servicios")
    .select("id, nombre")
    .eq("activo", true)
    .order("nombre", { ascending: true })

  if (error) throw error

  return (data ?? []) as { id: string; nombre: string }[]
}