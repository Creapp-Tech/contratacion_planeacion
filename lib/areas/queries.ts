import { createAdminClient } from "@/lib/supabase/admin"

export type Area = {
  id: string
  nombre: string
  categoria: string
  medida: number
  mide_capacidad_ocupacion: boolean
  created_at: string
}

export type GrupoArea = {
  id: string
  nombre: string
  activo: boolean
}

export type AreaEnSede = {
  id: string
  area_id: string
  cantidad: number
  nombre: string
  categoria: string
  medida: number
  mide_capacidad_ocupacion: boolean
}

export type SedeOrganizacion = {
  id: string
  nombre: string
  estado: string
  areas: AreaEnSede[]
}

type AreaAnidada = {
  area_id: string
  cantidad: number
  areas_catalogo:
    | {
        nombre: string
        categoria: string
        medida: number
        mide_capacidad_ocupacion: boolean
      }
    | null
}

type SedeConAreas = {
  id: string
  nombre: string
  estado: string
  sedes_areas: AreaAnidada[] | null
}

export async function listAreas(): Promise<Area[]> {
  const { data, error } = await createAdminClient()
    .from("areas_catalogo")
    .select("id, nombre, categoria, medida, mide_capacidad_ocupacion, created_at")
    .order("categoria", { ascending: true })
    .order("nombre", { ascending: true })

  if (error) throw error
  return (data ?? []) as Area[]
}

export async function getArea(id: string): Promise<Area | null> {
  const { data, error } = await createAdminClient()
    .from("areas_catalogo")
    .select("id, nombre, categoria, medida, mide_capacidad_ocupacion, created_at")
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  return (data ?? null) as Area | null
}

export async function listGrupos(): Promise<GrupoArea[]> {
  const { data, error } = await createAdminClient()
    .from("area_categorias")
    .select("id, nombre, activo")
    .order("nombre", { ascending: true })

  if (error) throw error
  return (data ?? []) as GrupoArea[]
}

export async function listSedesOrganizacion(): Promise<SedeOrganizacion[]> {
  const { data, error } = await createAdminClient()
    .from("sedes")
    .select(
      "id, nombre, estado, sedes_areas(area_id, cantidad, areas_catalogo(nombre, categoria, medida, mide_capacidad_ocupacion))"
    )
    .order("nombre", { ascending: true })

  if (error) throw error

  return ((data ?? []) as unknown as SedeConAreas[]).map((sede) => ({
    id: sede.id,
    nombre: sede.nombre,
    estado: sede.estado,
    areas: (sede.sedes_areas ?? [])
      .filter((area) => area.areas_catalogo !== null)
      .map((area) => ({
        id: `${sede.id}-${area.area_id}`,
        area_id: area.area_id,
        cantidad: area.cantidad,
        nombre: area.areas_catalogo?.nombre ?? "Área",
        categoria: area.areas_catalogo?.categoria ?? "Sin grupo",
        medida: area.areas_catalogo?.medida ?? 0,
        mide_capacidad_ocupacion:
          area.areas_catalogo?.mide_capacidad_ocupacion ?? false,
      })),
  }))
}
