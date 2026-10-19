"use server"

import { revalidatePath } from "next/cache"

import { requireSuperadmin } from "@/lib/auth/session"
import {
  mapearFila,
  normalizarNombre,
  type FilaImportacion,
} from "@/lib/sedes/importar"
import { createAdminClient } from "@/lib/supabase/admin"
import { sedeSchema, type SedeInput, type SedeOutput } from "@/lib/validations/sede"

export type SedeActionResult = { success: true } | { error: string }

export type ImportarSedesResultado = {
  importadas: number
  actualizadas: number
  omitidas: { fila: number; motivo: string }[]
}

const SEDES_PATH = "/sedes"

function construirPayload(parsed: SedeOutput) {
  const inactiva = parsed.estado === "inactiva"
  return {
    nombre: parsed.nombre,
    marca: parsed.marca,
    tipo_ips: parsed.tipo_ips,
    nivel: parsed.nivel,
    codigo_reps: parsed.codigo_reps,
    departamento: parsed.departamento,
    municipio: parsed.municipio,
    barrio: parsed.barrio,
    direccion: parsed.direccion,
    pais: parsed.pais ?? "Colombia",
    latitud: parsed.latitud,
    longitud: parsed.longitud,
    gerente: parsed.gerente,
    fecha_apertura: parsed.fecha_apertura,
    regional: parsed.regional,
    zonal: parsed.zonal,
    estado: parsed.estado,
    fecha_cierre: inactiva ? parsed.fecha_cierre : null,
    metros_cuadrado: parsed.metros_cuadrado,
    capacidad_inicial: parsed.capacidad_inicial,
    capacidad_usuarios: parsed.capacidad_usuarios,
    numero_pisos: parsed.numero_pisos,
    observaciones: parsed.observaciones,
  }
}

async function sincronizarRelaciones(
  sedeId: string,
  areas: SedeOutput["areas"],
  aseguradores: SedeOutput["aseguradores"],
  admin: ReturnType<typeof createAdminClient>
) {
  await admin.from("sedes_areas").delete().eq("sede_id", sedeId)
  await admin.from("sedes_aseguradores").delete().eq("sede_id", sedeId)

  if (areas.length > 0) {
    const { error } = await admin.from("sedes_areas").insert(
      areas.map((area) => ({
        sede_id: sedeId,
        area_id: area.area_id,
        cantidad: area.cantidad,
        cantidad_habilitada: area.cantidad_habilitada ?? area.cantidad,
      }))
    )
    if (error) throw error
  }

  if (aseguradores.length > 0) {
    const { error } = await admin.from("sedes_aseguradores").insert(
      aseguradores.map((aseguradorId) => ({
        sede_id: sedeId,
        asegurador_eps_id: aseguradorId,
      }))
    )
    if (error) throw error
  }
}

export async function crearSede(
  input: SedeInput
): Promise<SedeActionResult> {
  await requireSuperadmin()

  const parsed = sedeSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const admin = createAdminClient()
  const { areas, aseguradores } = parsed.data

  const { data, error } = await admin
    .from("sedes")
    .insert([construirPayload(parsed.data)])
    .select("id")
    .single()

  if (error) return { error: error.message }

  try {
    await sincronizarRelaciones(data.id, areas, aseguradores, admin)
  } catch (relacionError) {
    return {
      error:
        relacionError instanceof Error
          ? relacionError.message
          : "No se pudieron guardar las áreas o aseguradores",
    }
  }

  revalidatePath(SEDES_PATH)
  return { success: true }
}

export async function actualizarSede(
  id: string,
  input: SedeInput
): Promise<SedeActionResult> {
  await requireSuperadmin()

  const parsed = sedeSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const admin = createAdminClient()
  const { areas, aseguradores } = parsed.data

  const { error } = await admin
    .from("sedes")
    .update(construirPayload(parsed.data))
    .eq("id", id)

  if (error) return { error: error.message }

  try {
    await sincronizarRelaciones(id, areas, aseguradores, admin)
  } catch (relacionError) {
    return {
      error:
        relacionError instanceof Error
          ? relacionError.message
          : "No se pudieron guardar las áreas o aseguradores",
    }
  }

  revalidatePath(SEDES_PATH)
  revalidatePath(`${SEDES_PATH}/${id}`)
  return { success: true }
}

export async function cerrarSede(id: string): Promise<SedeActionResult> {
  await requireSuperadmin()

  const { error } = await createAdminClient()
    .from("sedes")
    .update({
      estado: "inactiva",
      fecha_cierre: new Date().toISOString().slice(0, 10),
    })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath(SEDES_PATH)
  revalidatePath(`${SEDES_PATH}/${id}`)
  return { success: true }
}

export async function importarSedes(
  filas: FilaImportacion[]
): Promise<ImportarSedesResultado | { error: string }> {
  await requireSuperadmin()

  const admin = createAdminClient()
  const { data: existentes, error } = await admin
    .from("sedes")
    .select("id, nombre")

  if (error) return { error: error.message }

  const mapa = new Map(
    ((existentes ?? []) as { id: string; nombre: string }[]).map((sede) => [
      normalizarNombre(sede.nombre),
      sede.id,
    ])
  )

  const resultado: ImportarSedesResultado = {
    importadas: 0,
    actualizadas: 0,
    omitidas: [],
  }

  for (let i = 0; i < filas.length; i++) {
    const numeroFila = i + 2
    const sede = mapearFila(filas[i])

    if (!sede.nombre) {
      resultado.omitidas.push({ fila: numeroFila, motivo: "Falta el nombre" })
      continue
    }

    const payload = { ...sede, pais: sede.pais ?? "Colombia" }
    const existenteId = mapa.get(normalizarNombre(sede.nombre))

    if (existenteId) {
      const camposLlenos = Object.fromEntries(
        Object.entries(payload).filter(
          ([, value]) => value !== null && value !== ""
        )
      )

      const { error: updateError } = await admin
        .from("sedes")
        .update(camposLlenos)
        .eq("id", existenteId)

      if (updateError) {
        resultado.omitidas.push({ fila: numeroFila, motivo: updateError.message })
        continue
      }
      resultado.actualizadas++
    } else {
      const { data, error: insertError } = await admin
        .from("sedes")
        .insert([payload])
        .select("id")
        .single()

      if (insertError) {
        resultado.omitidas.push({ fila: numeroFila, motivo: insertError.message })
        continue
      }
      mapa.set(normalizarNombre(sede.nombre), data.id)
      resultado.importadas++
    }
  }

  revalidatePath(SEDES_PATH)
  return resultado
}
