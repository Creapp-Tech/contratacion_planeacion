import { createAdminClient } from "@/lib/supabase/admin"

export type SedePoblacionCruda = {
  id: string
  nombre: string
  regional: string | null
  departamento: string | null
  municipio: string | null
  capacidad_inicial: number | null
  capacidad_usuarios: number | null
  poblacion_aseguradora: {
    poblacion_activa: number | null
    poblacion_pagada: number | null
    poblacion_certificada: number | null
    aseguradores_eps: { nombre_eps: string } | null
  }[] | null
}

export type SedeInfraCruda = {
  id: string
  nombre: string
  regional: string | null
  poblacion_aseguradora: {
    poblacion_activa: number | null
    poblacion_pagada: number | null
  }[] | null
  sedes_areas: {
    area_id: string
    cantidad: number
    cantidad_habilitada: number
    areas_catalogo: {
      nombre: string
      categoria: string
      mide_capacidad_ocupacion: boolean
    } | null
  }[] | null
}

export async function listSedesPoblacion(): Promise<SedePoblacionCruda[]> {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from("sedes")
    .select(
      `id, nombre, regional, capacidad_inicial, capacidad_usuarios,
       poblacion_aseguradora(
         poblacion_activa, poblacion_pagada, poblacion_certificada,
         aseguradores_eps(nombre_eps)
       )`
    )
    .order("nombre", { ascending: true })

  if (error) throw error
  return (data ?? []) as unknown as SedePoblacionCruda[]
}

export async function listSedesInfraestructura(): Promise<SedeInfraCruda[]> {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from("sedes")
    .select(
      `id, nombre, regional,
       poblacion_aseguradora(poblacion_activa, poblacion_pagada),
       sedes_areas(area_id, cantidad, cantidad_habilitada, areas_catalogo(nombre, categoria, mide_capacidad_ocupacion))`
    )
    .order("nombre", { ascending: true })

  if (error) throw error
  return (data ?? []) as unknown as SedeInfraCruda[]
}

export type FrecuenciaAreaCruda = {
  sedeId: string
  areaId: string
  tipoFrecuencia: "nota_tecnica_viva" | "ejecucion_servicios"
  frecuencia: number
  nombreNotaTecnica: string
  version: string
}

type FrecuenciaAnidadaCruda = {
  sede_id: string
  tipo_frecuencia: string
  nombre_nota_tecnica: string
  version: string
  frecuencias_servicios:
    | {
        frecuencia: number
        servicios: { area_id: string | null; activo: boolean } | null
      }[]
    | null
}

export async function listFrecuenciasAreas(): Promise<FrecuenciaAreaCruda[]> {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from("frecuencias")
    .select(
      `sede_id,
       tipo_frecuencia,
       nombre_nota_tecnica,
       version,
       frecuencias_servicios(
         frecuencia,
         servicios(area_id, activo)
       )`
    )
    .eq("activo", true)
    .eq("usar_en_calculo", true)
    .in("tipo_frecuencia", ["nota_tecnica_viva", "ejecucion_servicios"])

  if (error) throw error

  const resultado: FrecuenciaAreaCruda[] = []

  for (const fila of (data ?? []) as unknown as FrecuenciaAnidadaCruda[]) {
    if (
      fila.tipo_frecuencia !== "nota_tecnica_viva" &&
      fila.tipo_frecuencia !== "ejecucion_servicios"
    ) {
      continue
    }

    for (const detalle of fila.frecuencias_servicios ?? []) {
      const servicio = detalle.servicios
      if (!servicio?.area_id || !servicio.activo) continue

      resultado.push({
        sedeId: fila.sede_id,
        areaId: servicio.area_id,
        tipoFrecuencia: fila.tipo_frecuencia,
        frecuencia: detalle.frecuencia,
        nombreNotaTecnica: fila.nombre_nota_tecnica,
        version: fila.version,
      })
    }
  }

  return resultado
}
