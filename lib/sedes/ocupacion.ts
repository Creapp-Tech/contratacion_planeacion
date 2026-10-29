"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { listAseguradores, type Asegurador } from "@/lib/sedes/queries"
import { calcularOcupacion, type SedeMapa, type OpcionesMapa, type ResumenMapa } from "@/lib/sedes/ocupacion-utils"

export type MapaFiltros = {
  regional?: string
  zonal?: string
  asegurador?: string
  sede?: string
  marca?: string
  tipoIps?: string
  departamento?: string
  municipio?: string
}

export type { SedeMapa, OpcionesMapa, ResumenMapa }

type SedeCruda = {
  id: string
  nombre: string
  regional: string | null
  zonal: string | null
  marca: string | null
  tipo_ips: string | null
  departamento: string | null
  municipio: string | null
  estado: string
  latitud: number | null
  longitud: number | null
  capacidad_usuarios: number | null
  poblacion_aseguradora: { poblacion_activa: number | null }[] | null
  sedes_aseguradores: { aseguradores_eps: { nombre_eps: string } | null }[] | null
}

function mapearSedeMapa(sede: SedeCruda): SedeMapa {
  const poblacion = (sede.poblacion_aseguradora ?? []).reduce(
    (total, fila) => total + (fila.poblacion_activa ?? 0),
    0
  )

  return {
    id: sede.id,
    nombre: sede.nombre,
    regional: sede.regional,
    zonal: sede.zonal,
    marca: sede.marca,
    tipo_ips: sede.tipo_ips,
    departamento: sede.departamento,
    municipio: sede.municipio,
    estado: sede.estado,
    latitud: sede.latitud == null ? null : Number(sede.latitud),
    longitud: sede.longitud == null ? null : Number(sede.longitud),
    capacidad_usuarios:
      sede.capacidad_usuarios == null ? null : Number(sede.capacidad_usuarios),
    poblacion,
    ocupacion: calcularOcupacion(poblacion, sede.capacidad_usuarios),
    aseguradores: (sede.sedes_aseguradores ?? [])
      .map((fila) => fila.aseguradores_eps?.nombre_eps)
      .filter((nombre): nombre is string => Boolean(nombre)),
  }
}

function unicos(valores: (string | null)[]): string[] {
  return [
    ...new Set(valores.filter((valor): valor is string => Boolean(valor))),
  ].sort((a, b) => a.localeCompare(b))
}

export async function listSedesMapa(
  filtros: MapaFiltros = {}
): Promise<SedeMapa[]> {
  const admin = createAdminClient()

  let sedeIds: string[] | null = null
  if (filtros.asegurador) {
    const { data, error } = await admin
      .from("sedes_aseguradores")
      .select("sede_id")
      .eq("asegurador_eps_id", filtros.asegurador)

    if (error) throw error
    sedeIds = (data ?? []).map((fila) => fila.sede_id)
    if (sedeIds.length === 0) return []
  }

  let query = admin.from("sedes").select(
    `id, nombre, regional, zonal, marca, tipo_ips, departamento, municipio,
     estado, latitud, longitud, capacidad_usuarios,
     poblacion_aseguradora(poblacion_activa),
     sedes_aseguradores(aseguradores_eps(nombre_eps))`
  )

  if (filtros.regional) query = query.ilike("regional", filtros.regional)
  if (filtros.zonal) query = query.eq("zonal", filtros.zonal)
  if (filtros.marca) query = query.eq("marca", filtros.marca)
  if (filtros.tipoIps) query = query.eq("tipo_ips", filtros.tipoIps)
  if (filtros.departamento) query = query.eq("departamento", filtros.departamento)
  if (filtros.municipio) query = query.eq("municipio", filtros.municipio)
  if (filtros.sede) query = query.eq("id", filtros.sede)
  if (sedeIds) query = query.in("id", sedeIds)

  const { data, error } = await query.order("nombre", { ascending: true })

  if (error) throw error
  return ((data ?? []) as unknown as SedeCruda[]).map(mapearSedeMapa)
}

export async function opcionesMapa(): Promise<OpcionesMapa> {
  const admin = createAdminClient()

  const [sedesRes, aseguradores] = await Promise.all([
    admin
      .from("sedes")
      .select("id, nombre, regional, zonal, marca, tipo_ips, departamento, municipio")
      .order("nombre", { ascending: true }),
    listAseguradores(),
  ])

  if (sedesRes.error) throw sedesRes.error

  const filas = (sedesRes.data ?? []) as {
    id: string
    nombre: string
    regional: string | null
    zonal: string | null
    marca: string | null
    tipo_ips: string | null
    departamento: string | null
    municipio: string | null
  }[]

  return {
    regionales: unicos(filas.map((fila) => fila.regional)),
    zonales: unicos(filas.map((fila) => fila.zonal)),
    marcas: unicos(filas.map((fila) => fila.marca)),
    tiposIps: unicos(filas.map((fila) => fila.tipo_ips)),
    departamentos: unicos(filas.map((fila) => fila.departamento)),
    municipios: unicos(filas.map((fila) => fila.municipio)),
    aseguradores,
    sedes: filas.map((fila) => ({ id: fila.id, nombre: fila.nombre })),
  }
}