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
  /** Restricción de acceso por regional (no es filtro de UI). */
  regional?: string
  departamento?: string
  municipio?: string
  asegurador?: string
  marca?: string
}

export type OpcionesFiltros = {
  regionales: string[]
  departamentos: string[]
  municipios: string[]
  aseguradores: string[]
  marcas: string[]
}

export const OPCIONES_FILTROS_VACIAS: OpcionesFiltros = {
  regionales: [],
  departamentos: [],
  municipios: [],
  aseguradores: [],
  marcas: [],
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
  try {
    const admin = createAdminClient()

    let srf = admin
      .from("sedes_relacion_filtros")
      .select("sede_id, departamento, municipio, regional_id")
      .eq("activo", true)

    if (filtros.departamento) {
      srf = srf.eq("departamento", filtros.departamento)
    }
    if (filtros.municipio) {
      srf = srf.eq("municipio", filtros.municipio)
    }

    // Restricción de acceso por regional → resolver nombre a id del catálogo.
    if (filtros.regional) {
      const { data: catalogo, error: errorCatalogo } = await admin
        .from("catalogos_opciones")
        .select("id")
        .eq("dominio", "regional")
        .ilike("nombre", filtros.regional)
        .maybeSingle()

      if (errorCatalogo) {
        console.warn("[sedes] listSedes: error al resolver regional:", errorCatalogo.message)
        return []
      }
      if (!catalogo) return []

      srf = srf.eq("regional_id", catalogo.id)
    }

    const { data: relaciones, error: errorRelaciones } = await srf
    if (errorRelaciones) {
      console.warn("[sedes] listSedes: error al leer sedes_relacion_filtros:", errorRelaciones.message)
      return []
    }

    const ids = (relaciones ?? []).map(
      (relacion) => relacion.sede_id as string
    )
    if (ids.length === 0) return []

    let query = admin
      .from("sedes")
      .select("*, sedes_areas(cantidad, cantidad_habilitada, areas_catalogo(categoria, mide_capacidad_ocupacion))")
      .in("id", ids)
      .or("estado.neq.inactiva,estado.is.null")

    if (filtros.q) {
      query = query.ilike("nombre", `%${filtros.q}%`)
    }
    if (filtros.marca) {
      query = query.eq("marca", filtros.marca)
    }

    // Asegurador: EXISTS vía tabla puente (evita duplicados de la sede).
    if (filtros.asegurador) {
      const { data: asegurador, error: errorAsegurador } = await admin
        .from("aseguradores_eps")
        .select("id")
        .ilike("nombre_eps", filtros.asegurador)
        .maybeSingle()

      if (errorAsegurador) {
        console.warn("[sedes] listSedes: error al buscar asegurador:", errorAsegurador.message)
        return []
      }
      if (!asegurador) return []

      const { data: puente, error: errorPuente } = await admin
        .from("sedes_aseguradores")
        .select("sede_id")
        .eq("asegurador_eps_id", asegurador.id)
        .in("sede_id", ids)

      if (errorPuente) {
        console.warn("[sedes] listSedes: error al leer sedes_aseguradores:", errorPuente.message)
        return []
      }

      const idsAsegurador = new Set(
        (puente ?? []).map((fila) => fila.sede_id as string)
      )
      if (idsAsegurador.size === 0) return []

      query = query.in("id", [...idsAsegurador])
    }

    const { data, error } = await query.order("nombre", { ascending: true })

    if (error) {
      console.warn("[sedes] listSedes: error al leer sedes:", error.message)
      return []
    }
    return ((data ?? []) as SedeConAreas[]).map(mapearFila)
  } catch (error) {
    console.warn("[sedes] listSedes: error inesperado:", error)
    return []
  }
}

/**
 * Opciones de cada filtro en cascada, calculadas con el RPC
 * `obtener_opciones_filtros` (lógica facetada: cada filtro aplica los otros 4).
 */
export async function listOpcionesFiltros(
  filtros: SedeFiltros = {}
): Promise<OpcionesFiltros> {
  const { data, error } = await createAdminClient().rpc("obtener_opciones_filtros", {
    p_regional: filtros.regional ?? null,
    p_departamento: filtros.departamento ?? null,
    p_municipio: filtros.municipio ?? null,
    p_asegurador: filtros.asegurador ?? null,
    p_marca: filtros.marca ?? null,
  })

  if (error) {
    console.error("[sedes] obtener_opciones_filtros falló:", error)
    return OPCIONES_FILTROS_VACIAS
  }

  const opciones = (data ?? {}) as Partial<OpcionesFiltros>
  return {
    regionales: opciones.regionales ?? [],
    departamentos: opciones.departamentos ?? [],
    municipios: opciones.municipios ?? [],
    aseguradores: opciones.aseguradores ?? [],
    marcas: opciones.marcas ?? [],
  }
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

type SedeCruda = Omit<SedeDetalle, "areas" | "aseguradores"> & {
  sedes_areas: SedeArea[] | null
  sedes_aseguradores: SedeAsegurador[] | null
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

  const { sedes_areas, sedes_aseguradores, ...sede } = data as SedeCruda
  return {
    ...sede,
    areas: sedes_areas ?? [],
    aseguradores: sedes_aseguradores ?? [],
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

export async function listMunicipiosByDepartamento(
  departamento: string
): Promise<string[]> {
  const { data, error } = await createAdminClient()
    .from("sedes")
    .select("municipio")
    .eq("departamento", departamento)

  if (error) throw error
  const valores = (data ?? [] as { municipio: string | null }[]).map((f) => f.municipio).filter(Boolean)
  return [...new Set(valores)].sort((a, b) => a.localeCompare(b))
}
