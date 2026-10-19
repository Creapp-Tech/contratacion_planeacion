import { createAdminClient } from "@/lib/supabase/admin"

export type SedeRow = {
  id: string
  nombre: string
  codigo_reps: string | null
  departamento: string | null
  municipio: string | null
  barrio: string | null
  direccion: string | null
  pais: string | null
  latitud: number | null
  longitud: number | null
  gerente: string | null
  fecha_apertura: string | null
  regional: string | null
  zonal: string | null
  marca: string | null
  nivel: string | null
  tipo_ips: string | null
  estado: string
  fecha_cierre: string | null
  metros_cuadrado: number | null
  capacidad_inicial: number | null
  capacidad_usuarios: number | null
  numero_pisos: number | null
  observaciones: string | null
  created_at: string
  updated_at: string
}

export type SedeListaFila = SedeRow & {
  consultorios: number
  odontologia: number
  consultoriosFisicos: number
  odontologiaFisica: number
}

export type SedeArea = {
  id: string
  area_id: string
  cantidad: number
  cantidad_habilitada: number
  areas_catalogo: {
    nombre: string
    categoria: string
    mide_capacidad_ocupacion: boolean
  } | null
}

export type SedeAsegurador = {
  id: string
  asegurador_eps_id: string
  aseguradores_eps: { nombre_eps: string } | null
}

export type SedeDetalle = SedeRow & {
  areas: SedeArea[]
  aseguradores: SedeAsegurador[]
}

export type SedeFiltros = {
  q?: string
  departamento?: string
  regional?: string
  marca?: string
  estado?: string
}

export type AreaCatalogo = {
  id: string
  nombre: string
  categoria: string
  mide_capacidad_ocupacion: boolean
}

export type Asegurador = {
  id: string
  nombre_eps: string
}

export type TipoIpsOpcion = {
  nombre: string
  descripcion: string | null
}

export type OpcionesCatalogo = {
  regional: string[]
  zonal: string[]
  marca: string[]
  nivel: string[]
  tipo_ips: TipoIpsOpcion[]
}

export type OpcionesFiltros = {
  departamentos: string[]
  regionales: string[]
  marcas: string[]
}

export type ResumenSedes = {
  sedes: number
  capacidadActual: number
  capacidadInicial: number
  consultorios: number
  odontologia: number
  consultoriosFisicos: number
  odontologiaFisica: number
}

type AreaAnidada = {
  cantidad: number | null
  cantidad_habilitada: number | null
  areas_catalogo:
    | { categoria: string | null; mide_capacidad_ocupacion: boolean | null }
    | null
}

type SedeConAreas = SedeRow & { sedes_areas: AreaAnidada[] | null }

const CAMPOS_AREA = {
  cantidad: (area: AreaAnidada) => area.cantidad ?? 0,
  cantidad_habilitada: (area: AreaAnidada) => area.cantidad_habilitada ?? 0,
} as const

function sumarPorCategoria(
  areas: AreaAnidada[] | null,
  categoria: string,
  campo: keyof typeof CAMPOS_AREA
) {
  if (!areas) return 0
  const leer = CAMPOS_AREA[campo]
  return areas.reduce((total, area) => {
    if (area.areas_catalogo?.categoria !== categoria) return total
    return total + leer(area)
  }, 0)
}

function mapearFila(sede: SedeConAreas): SedeListaFila {
  const { sedes_areas, ...resto } = sede
  return {
    ...resto,
    consultorios: sumarPorCategoria(sedes_areas, "Consultorios", "cantidad_habilitada"),
    odontologia: sumarPorCategoria(sedes_areas, "Odontología", "cantidad_habilitada"),
    consultoriosFisicos: sumarPorCategoria(sedes_areas, "Consultorios", "cantidad"),
    odontologiaFisica: sumarPorCategoria(sedes_areas, "Odontología", "cantidad"),
  }
}

export async function listSedes(
  filtros: SedeFiltros = {}
): Promise<SedeListaFila[]> {
  let query = createAdminClient()
    .from("sedes")
    .select("*, sedes_areas(cantidad, cantidad_habilitada, areas_catalogo(categoria, mide_capacidad_ocupacion))")

  if (filtros.q) {
    query = query.ilike("nombre", `%${filtros.q}%`)
  }
  if (filtros.departamento) {
    query = query.eq("departamento", filtros.departamento)
  }
  if (filtros.regional) {
    query = query.eq("regional", filtros.regional)
  }
  if (filtros.marca) {
    query = query.eq("marca", filtros.marca)
  }
  if (filtros.estado) {
    query = query.eq("estado", filtros.estado)
  }

  const { data, error } = await query.order("nombre", { ascending: true })

  if (error) throw error
  return ((data ?? []) as SedeConAreas[]).map(mapearFila)
}

export function resumenSedes(sedes: SedeListaFila[]): ResumenSedes {
  return sedes.reduce<ResumenSedes>(
    (total, sede) => ({
      sedes: total.sedes + 1,
      capacidadActual: total.capacidadActual + (sede.capacidad_usuarios ?? 0),
      capacidadInicial: total.capacidadInicial + (sede.capacidad_inicial ?? 0),
      consultorios: total.consultorios + sede.consultorios,
      odontologia: total.odontologia + sede.odontologia,
      consultoriosFisicos: total.consultoriosFisicos + sede.consultoriosFisicos,
      odontologiaFisica: total.odontologiaFisica + sede.odontologiaFisica,
    }),
    {
      sedes: 0,
      capacidadActual: 0,
      capacidadInicial: 0,
      consultorios: 0,
      odontologia: 0,
      consultoriosFisicos: 0,
      odontologiaFisica: 0,
    }
  )
}

export async function getSede(id: string): Promise<SedeDetalle | null> {
  const { data, error } = await createAdminClient()
    .from("sedes")
    .select(
      "*, sedes_areas(id, area_id, cantidad, cantidad_habilitada, areas_catalogo(nombre, categoria, mide_capacidad_ocupacion)), sedes_aseguradores(id, asegurador_eps_id, aseguradores_eps(nombre_eps))"
    )
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const sede = data as SedeDetalle
  return {
    ...sede,
    areas: sede.areas ?? [],
    aseguradores: sede.aseguradores ?? [],
  }
}

export type SedeOpcion = {
  id: string
  nombre: string
  regional: string | null
  zonal: string | null
}

export async function listSedesOpciones(): Promise<SedeOpcion[]> {
  const { data, error } = await createAdminClient()
    .from("sedes")
    .select("id, nombre, regional, zonal")
    .order("nombre", { ascending: true })

  if (error) throw error
  return (data ?? []) as SedeOpcion[]
}

export async function listAreasCatalogo(): Promise<AreaCatalogo[]> {
  const { data, error } = await createAdminClient()
    .from("areas_catalogo")
    .select("id, nombre, categoria, mide_capacidad_ocupacion")
    .order("categoria", { ascending: true })
    .order("nombre", { ascending: true })

  if (error) throw error
  return (data ?? []) as AreaCatalogo[]
}

export async function listAseguradores(): Promise<Asegurador[]> {
  const { data, error } = await createAdminClient()
    .from("aseguradores_eps")
    .select("id, nombre_eps")
    .eq("estado", "activo")
    .order("nombre_eps", { ascending: true })

  if (error) throw error
  return (data ?? []) as Asegurador[]
}

const DOMINIOS_TEXTUALES = ["regional", "zonal", "marca", "nivel"] as const

type FilaCatalogo = {
  dominio: string
  nombre: string
  descripcion: string | null
}

export async function listOpcionesCatalogo(): Promise<OpcionesCatalogo> {
  const { data, error } = await createAdminClient()
    .from("catalogos_opciones")
    .select("dominio, nombre, descripcion")
    .eq("activo", true)
    .order("nombre", { ascending: true })

  if (error) throw error

  const opciones: OpcionesCatalogo = {
    regional: [],
    zonal: [],
    marca: [],
    nivel: [],
    tipo_ips: [],
  }

  for (const fila of (data ?? []) as FilaCatalogo[]) {
    if (fila.dominio === "tipo_ips") {
      opciones.tipo_ips.push({
        nombre: fila.nombre,
        descripcion: fila.descripcion,
      })
    } else if (
      (DOMINIOS_TEXTUALES as readonly string[]).includes(fila.dominio)
    ) {
      opciones[fila.dominio as (typeof DOMINIOS_TEXTUALES)[number]].push(
        fila.nombre
      )
    }
  }

  return opciones
}

export async function listOpcionesFiltros(): Promise<OpcionesFiltros> {
  const { data, error } = await createAdminClient()
    .from("sedes")
    .select("departamento, regional, marca")

  if (error) throw error

  const filas = (data ?? []) as {
    departamento: string | null
    regional: string | null
    marca: string | null
  }[]

  const unicos = (valores: (string | null)[]) =>
    [...new Set(valores.filter((valor): valor is string => !!valor))].sort(
      (a, b) => a.localeCompare(b)
    )

  return {
    departamentos: unicos(filas.map((fila) => fila.departamento)),
    regionales: unicos(filas.map((fila) => fila.regional)),
    marcas: unicos(filas.map((fila) => fila.marca)),
  }
}
