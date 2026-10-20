import { createAdminClient } from "@/lib/supabase/admin"

export type FrecuenciaServicio = {
  id: string
  frecuencia_id: string
  servicio_id: string
  servicio_nombre: string
  servicio_grupo: string | null
  frecuencia: number
  area_id: string | null
  area_nombre: string | null
  area_categoria: string | null
  tipo_personal: string
}

export type Frecuencia = {
  id: string
  tipo_frecuencia: string
  nombre_nota_tecnica: string
  sede_id: string
  sede_nombre: string
  regional: string | null
  zonal: string | null
  regimen_id: string
  regimen_nombre: string
  asegurador_eps_id: string
  asegurador_nombre: string
  version: string
  activo: boolean
  created_at: string
  servicios: FrecuenciaServicio[]
}

type FrecuenciaAnidada = {
  id: string
  tipo_frecuencia: string
  nombre_nota_tecnica: string
  sede_id: string
  regimen_id: string
  asegurador_eps_id: string
  version: string
  activo: boolean
  created_at: string
  sedes: { nombre: string; regional: string | null; zonal: string | null } | null
  regimenes: { nombre: string } | null
  aseguradores_eps: { nombre_eps: string } | null
}

type FrecuenciaServicioAnidada = {
  id: string
  frecuencia_id: string
  servicio_id: string
  frecuencia: number
  servicios: {
    nombre: string
    grupo: string | null
    area_id: string | null
    tipo_personal: string
    areas_catalogo: { nombre: string; categoria: string } | null
  } | null
}

const CAMPOS_BASE =
  "id, tipo_frecuencia, nombre_nota_tecnica, sede_id, regimen_id, asegurador_eps_id, version, activo, created_at"

function selectEncabezado(sedeInterior = false) {
  return `${CAMPOS_BASE}, sedes${sedeInterior ? "!inner" : ""}(nombre, regional, zonal), regimenes(nombre), aseguradores_eps(nombre_eps)`
}

function mapearFrecuencia(
  fila: FrecuenciaAnidada,
  servicios: FrecuenciaServicio[]
): Frecuencia {
  return {
    id: fila.id,
    tipo_frecuencia: fila.tipo_frecuencia,
    nombre_nota_tecnica: fila.nombre_nota_tecnica,
    sede_id: fila.sede_id,
    sede_nombre: fila.sedes?.nombre ?? "—",
    regional: fila.sedes?.regional ?? null,
    zonal: fila.sedes?.zonal ?? null,
    regimen_id: fila.regimen_id,
    regimen_nombre: fila.regimenes?.nombre ?? "—",
    asegurador_eps_id: fila.asegurador_eps_id,
    asegurador_nombre: fila.aseguradores_eps?.nombre_eps ?? "—",
    version: fila.version,
    activo: fila.activo,
    created_at: fila.created_at,
    servicios,
  }
}

function mapearServicio(fila: FrecuenciaServicioAnidada): FrecuenciaServicio {
  return {
    id: fila.id,
    frecuencia_id: fila.frecuencia_id,
    servicio_id: fila.servicio_id,
    servicio_nombre: fila.servicios?.nombre ?? "—",
    servicio_grupo: fila.servicios?.grupo ?? null,
    frecuencia: fila.frecuencia,
    area_id: fila.servicios?.area_id ?? null,
    area_nombre: fila.servicios?.areas_catalogo?.nombre ?? null,
    area_categoria: fila.servicios?.areas_catalogo?.categoria ?? null,
    tipo_personal: fila.servicios?.tipo_personal ?? "",
  }
}

export type FrecuenciaFiltros = {
  q?: string
  tipo_frecuencia?: string
  sede_id?: string
  regional?: string
  regimen_id?: string
  asegurador_eps_id?: string
}

export async function listFrecuencias(
  filtros: FrecuenciaFiltros = {}
): Promise<Frecuencia[]> {
  let query = createAdminClient()
    .from("frecuencias")
    .select(selectEncabezado(Boolean(filtros.regional)))
    .order("created_at", { ascending: false })

  if (filtros.q) {
    query = query.ilike("nombre_nota_tecnica", `%${filtros.q}%`)
  }

  if (filtros.tipo_frecuencia) {
    query = query.eq("tipo_frecuencia", filtros.tipo_frecuencia)
  }

  if (filtros.sede_id) {
    query = query.eq("sede_id", filtros.sede_id)
  }

  if (filtros.regional) {
    query = query.eq("sedes.regional", filtros.regional)
  }

  if (filtros.regimen_id) {
    query = query.eq("regimen_id", filtros.regimen_id)
  }

  if (filtros.asegurador_eps_id) {
    query = query.eq("asegurador_eps_id", filtros.asegurador_eps_id)
  }

  const { data, error } = await query

  if (error) throw error

  return ((data ?? []) as unknown as FrecuenciaAnidada[]).map((fila) =>
    mapearFrecuencia(fila, [])
  )
}

export async function getFrecuencia(id: string): Promise<Frecuencia | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("frecuencias")
    .select(selectEncabezado())
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const { data: servicios, error: serviciosError } = await supabase
    .from("frecuencias_servicios")
    .select("id, frecuencia_id, servicio_id, frecuencia, servicios(nombre, grupo, area_id, tipo_personal, areas_catalogo(nombre, categoria))")
    .eq("frecuencia_id", id)
    .order("created_at", { ascending: true })

  if (serviciosError) throw serviciosError

  return mapearFrecuencia(
    data as unknown as FrecuenciaAnidada,
    ((servicios ?? []) as unknown as FrecuenciaServicioAnidada[]).map(
      mapearServicio
    )
  )
}

export type OpcionesFiltrosFrecuencias = {
  sedes: { id: string; nombre: string }[]
  regionales: string[]
  regimenes: { id: string; nombre: string }[]
  aseguradores: { id: string; nombre: string }[]
}

export async function listOpcionesFiltrosFrecuencias(): Promise<OpcionesFiltrosFrecuencias> {
  const supabase = createAdminClient()

  const [sedes, regimenes, aseguradores] = await Promise.all([
    supabase
      .from("sedes")
      .select("id, nombre, regional")
      .order("nombre", { ascending: true }),
    supabase
      .from("regimenes")
      .select("id, nombre")
      .order("nombre", { ascending: true }),
    supabase
      .from("aseguradores_eps")
      .select("id, nombre_eps")
      .order("nombre_eps", { ascending: true }),
  ])

  if (sedes.error) throw sedes.error
  if (regimenes.error) throw regimenes.error
  if (aseguradores.error) throw aseguradores.error

  const sedesData = (sedes.data ?? []) as {
    id: string
    nombre: string
    regional: string | null
  }[]

  const regionales = [
    ...new Set(
      sedesData
        .map((sede) => sede.regional)
        .filter((regional): regional is string => Boolean(regional))
    ),
  ].sort((a, b) => a.localeCompare(b))

  return {
    sedes: sedesData.map((sede) => ({ id: sede.id, nombre: sede.nombre })),
    regionales,
    regimenes: (regimenes.data ?? []) as { id: string; nombre: string }[],
    aseguradores: (
      (aseguradores.data ?? []) as { id: string; nombre_eps: string }[]
    ).map((fila) => ({ id: fila.id, nombre: fila.nombre_eps })),
  }
}
