import { createAdminClient } from "@/lib/supabase/admin"

export type PoblacionFila = {
  id: string
  sede_id: string
  asegurador_eps_id: string | null
  regimen_id: string | null
  poblacion_activa: number | null
  poblacion_pagada: number | null
  poblacion_certificada: number | null
  fecha_actualizacion: string
  usuario_id: string | null
  created_at: string
  updated_at: string
  sedes: {
    nombre: string
    regional: string | null
    zonal: string | null
    departamento: string | null
    municipio: string | null
  } | null
  aseguradores_eps: { nombre_eps: string } | null
  regimenes: { nombre: string } | null
}

export type PoblacionOpciones = {
  sedes: { id: string; nombre: string }[]
  aseguradores: { id: string; nombre_eps: string }[]
  regimenes: { id: string; nombre: string }[]
}

export type PoblacionFiltros = {
  regimen_id?: string
  asegurador_eps_id?: string
  regional?: string
  municipio?: string
  departamento?: string
}

export type OpcionesFiltrosPoblaciones = {
  regimenes: { id: string; nombre: string }[]
  aseguradores: { id: string; nombre_eps: string }[]
  regionales: string[]
  departamentos: string[]
  municipios: string[]
  municipiosPorDepartamento: Record<string, string[]>
}

export type ResumenPoblaciones = {
  registros: number
  activa: number
  pagada: number
  certificada: number
}

const SELECT_POBLACION = `id, sede_id, asegurador_eps_id, regimen_id, poblacion_activa, poblacion_pagada,
  poblacion_certificada, fecha_actualizacion, usuario_id, created_at, updated_at,
  sedes!inner(nombre, regional, zonal, departamento, municipio),
  aseguradores_eps(nombre_eps),
  regimenes(nombre)`

export async function listPoblaciones(
  filtros: PoblacionFiltros = {}
): Promise<PoblacionFila[]> {
  let query = createAdminClient()
    .from("poblacion_aseguradora")
    .select(SELECT_POBLACION)

  if (filtros.regimen_id) {
    query = query.eq("regimen_id", filtros.regimen_id)
  }

  if (filtros.asegurador_eps_id) {
    query = query.eq("asegurador_eps_id", filtros.asegurador_eps_id)
  }

  if (filtros.regional) {
    query = query.ilike("sedes.regional", filtros.regional)
  }

  if (filtros.departamento) {
    query = query.eq("sedes.departamento", filtros.departamento)
  }

  if (filtros.municipio) {
    query = query.eq("sedes.municipio", filtros.municipio)
  }

  const { data, error } = await query

  if (error) throw error

  return ((data ?? []) as unknown as PoblacionFila[]).sort((a, b) => {
    const sedeA = a.sedes?.nombre ?? ""
    const sedeB = b.sedes?.nombre ?? ""
    const porSede = sedeA.localeCompare(sedeB)
    if (porSede !== 0) return porSede
    const epsA = a.aseguradores_eps?.nombre_eps ?? ""
    const epsB = b.aseguradores_eps?.nombre_eps ?? ""
    const porEps = epsA.localeCompare(epsB)
    if (porEps !== 0) return porEps
    const regimenA = a.regimenes?.nombre ?? ""
    const regimenB = b.regimenes?.nombre ?? ""
    return regimenA.localeCompare(regimenB)
  })
}

export async function getPoblacion(id: string): Promise<PoblacionFila | null> {
  const { data, error } = await createAdminClient()
    .from("poblacion_aseguradora")
    .select(SELECT_POBLACION)
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  return (data ?? null) as unknown as PoblacionFila | null
}

export async function opcionesPoblaciones(): Promise<PoblacionOpciones> {
  const admin = createAdminClient()

  const [sedesRes, aseguradoresRes, regimenesRes] = await Promise.all([
    admin
      .from("sedes")
      .select("id, nombre")
      .eq("estado", "activa")
      .order("nombre", { ascending: true }),
    admin
      .from("aseguradores_eps")
      .select("id, nombre_eps")
      .eq("estado", "activo")
      .order("nombre_eps", { ascending: true }),
    admin
      .from("regimenes")
      .select("id, nombre")
      .order("nombre", { ascending: true }),
  ])

  if (sedesRes.error) throw sedesRes.error
  if (aseguradoresRes.error) throw aseguradoresRes.error
  if (regimenesRes.error) throw regimenesRes.error

  return {
    sedes: (sedesRes.data ?? []) as PoblacionOpciones["sedes"],
    aseguradores: (aseguradoresRes.data ??
      []) as PoblacionOpciones["aseguradores"],
    regimenes: (regimenesRes.data ?? []) as PoblacionOpciones["regimenes"],
  }
}

function unicos(valores: (string | null)[]) {
  return [...new Set(valores.filter((valor): valor is string => !!valor))].sort(
    (a, b) => a.localeCompare(b)
  )
}

export async function opcionesFiltrosPoblaciones(): Promise<OpcionesFiltrosPoblaciones> {
  const admin = createAdminClient()

  const [sedesRes, regimenesRes, aseguradoresRes] = await Promise.all([
    admin.from("sedes").select("regional, departamento, municipio"),
    admin
      .from("regimenes")
      .select("id, nombre")
      .order("nombre", { ascending: true }),
    admin
      .from("aseguradores_eps")
      .select("id, nombre_eps")
      .order("nombre_eps", { ascending: true }),
  ])

  if (sedesRes.error) throw sedesRes.error
  if (regimenesRes.error) throw regimenesRes.error
  if (aseguradoresRes.error) throw aseguradoresRes.error

  const filas = (sedesRes.data ?? []) as {
    regional: string | null
    departamento: string | null
    municipio: string | null
  }[]

  const municipiosPorDepartamento: Record<string, string[]> = {}
  for (const fila of filas) {
    if (!fila.departamento || !fila.municipio) continue
    const lista = municipiosPorDepartamento[fila.departamento] ?? []
    if (!lista.includes(fila.municipio)) lista.push(fila.municipio)
    municipiosPorDepartamento[fila.departamento] = lista
  }
  for (const departamento of Object.keys(municipiosPorDepartamento)) {
    municipiosPorDepartamento[departamento].sort((a, b) => a.localeCompare(b))
  }

  return {
    regimenes: (regimenesRes.data ??
      []) as OpcionesFiltrosPoblaciones["regimenes"],
    aseguradores: (aseguradoresRes.data ??
      []) as OpcionesFiltrosPoblaciones["aseguradores"],
    regionales: unicos(filas.map((fila) => fila.regional)),
    departamentos: unicos(filas.map((fila) => fila.departamento)),
    municipios: unicos(filas.map((fila) => fila.municipio)),
    municipiosPorDepartamento,
  }
}

export function resumenPoblaciones(filas: PoblacionFila[]): ResumenPoblaciones {
  return filas.reduce<ResumenPoblaciones>(
    (total, fila) => ({
      registros: total.registros + 1,
      activa: total.activa + (fila.poblacion_activa ?? 0),
      pagada: total.pagada + (fila.poblacion_pagada ?? 0),
      certificada: total.certificada + (fila.poblacion_certificada ?? 0),
    }),
    { registros: 0, activa: 0, pagada: 0, certificada: 0 }
  )
}
