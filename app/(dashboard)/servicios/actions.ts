"use server"

import { revalidatePath } from "next/cache"

import { listAreas } from "@/lib/areas/queries"
import { listCatalogos } from "@/lib/catalogos/queries"
import { requireSuperadmin } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  mapearFila,
  normalizarNombre,
  type FilaImportacion,
} from "@/lib/servicios/importar"
import { servicioSchema, type ServicioInput } from "@/lib/validations/servicio"

export type ServicioActionResult = { success: true } | { error: string }

const SERVICIOS_PATH = "/servicios"

function mensajeError(error: { code?: string; message: string }) {
  if (error.code === "23505") {
    return "Ya existe un servicio con ese nombre."
  }
  return error.message
}

export async function crearServicio(
  input: ServicioInput
): Promise<ServicioActionResult> {
  await requireSuperadmin()

  const parsed = servicioSchema.safeParse(input)
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    }
  }

  const { error } = await createAdminClient()
    .from("servicios")
    .insert([parsed.data])

  if (error) return { error: mensajeError(error) }

  revalidatePath(SERVICIOS_PATH)
  return { success: true }
}

export async function actualizarServicio(
  id: string,
  input: ServicioInput
): Promise<ServicioActionResult> {
  await requireSuperadmin()

  const parsed = servicioSchema.safeParse(input)
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    }
  }

  const { error } = await createAdminClient()
    .from("servicios")
    .update(parsed.data)
    .eq("id", id)

  if (error) return { error: mensajeError(error) }

  revalidatePath(SERVICIOS_PATH)
  return { success: true }
}

export async function eliminarServicio(
  id: string
): Promise<ServicioActionResult> {
  await requireSuperadmin()

  const { error } = await createAdminClient()
    .from("servicios")
    .delete()
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath(SERVICIOS_PATH)
  return { success: true }
}

export type ImportarServiciosResultado = {
  insertadas: number
  actualizadas: number
  omitidas: { fila: number; motivo: string }[]
}

export async function importarServicios(
  filas: FilaImportacion[],
  opciones: { tipoPersonalDefecto?: string } = {}
): Promise<ImportarServiciosResultado | { error: string }> {
  await requireSuperadmin()

  let areas
  let tiposPersonal
  let existentes
  try {
    ;[areas, tiposPersonal, existentes] = await Promise.all([
      listAreas(),
      listCatalogos("tipo_personal"),
      createAdminClient()
        .from("servicios")
        .select("id,nombre"),
    ])
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudieron cargar áreas, servicios o tipos de personal.",
    }
  }

  if (existentes.error) return { error: existentes.error.message }

  const mapaAreas = new Map(
    areas.map((area) => [normalizarNombre(area.nombre), area.id])
  )
  const mapaTipos = new Map(
    tiposPersonal.map((tipo) => [normalizarNombre(tipo.nombre), tipo.nombre])
  )
  const mapaExistentes = new Map(
    (existentes.data ?? []).map((servicio) => [
      normalizarNombre(servicio.nombre),
      servicio.id,
    ])
  )

  const defecto = opciones.tipoPersonalDefecto?.trim()
  if (defecto && !mapaTipos.has(normalizarNombre(defecto))) {
    return { error: "El tipo de persona por defecto no existe en el catálogo." }
  }

  const omitidas: ImportarServiciosResultado["omitidas"] = []
  const payload: {
    nombre: string
    grupo: string
    area_id: string | null
    tipo_personal: string
  }[] = []
  const actualizaciones: {
    id: string
    grupo: string
    area_id: string | null
    tipo_personal: string
  }[] = []
  const vistos = new Set<string>()

  for (let i = 0; i < filas.length; i++) {
    const numeroFila = i + 2
    const servicio = mapearFila(filas[i])

    if (!servicio.nombre) {
      omitidas.push({ fila: numeroFila, motivo: "Falta el nombre" })
      continue
    }

    if (!servicio.grupo) {
      omitidas.push({ fila: numeroFila, motivo: "Falta el grupo" })
      continue
    }

    const claveNombre = normalizarNombre(servicio.nombre)

    if (vistos.has(claveNombre)) {
      omitidas.push({
        fila: numeroFila,
        motivo: "Nombre repetido en el archivo",
      })
      continue
    }

    const idExistente = mapaExistentes.get(claveNombre)

    let areaId: string | null = null
    if (servicio.area) {
      const encontrado = mapaAreas.get(normalizarNombre(servicio.area))
      if (!encontrado) {
        omitidas.push({
          fila: numeroFila,
          motivo: `Área no encontrada: ${servicio.area}`,
        })
        continue
      }
      areaId = encontrado
    }

    let tipoPersonal: string
    if (servicio.tipo_personal) {
      const canonico = mapaTipos.get(normalizarNombre(servicio.tipo_personal))
      if (!canonico) {
        omitidas.push({
          fila: numeroFila,
          motivo: `Tipo de persona no encontrado: ${servicio.tipo_personal}`,
        })
        continue
      }
      tipoPersonal = canonico
    } else if (defecto) {
      tipoPersonal = mapaTipos.get(normalizarNombre(defecto)) ?? defecto
    } else {
      omitidas.push({
        fila: numeroFila,
        motivo: "Falta el tipo de persona",
      })
      continue
    }

    vistos.add(claveNombre)
    if (idExistente) {
      actualizaciones.push({
        id: idExistente,
        grupo: servicio.grupo,
        area_id: areaId,
        tipo_personal: tipoPersonal,
      })
    } else {
      payload.push({
        nombre: servicio.nombre,
        grupo: servicio.grupo,
        area_id: areaId,
        tipo_personal: tipoPersonal,
      })
    }
  }

  if (payload.length > 0) {
    const { error } = await createAdminClient().from("servicios").insert(payload)

    if (error) return { error: mensajeError(error) }
  }

  for (const actualizacion of actualizaciones) {
    const { error } = await createAdminClient()
      .from("servicios")
      .update({
        grupo: actualizacion.grupo,
        area_id: actualizacion.area_id,
        tipo_personal: actualizacion.tipo_personal,
      })
      .eq("id", actualizacion.id)

    if (error) return { error: mensajeError(error) }
  }

  revalidatePath(SERVICIOS_PATH)
  return {
    insertadas: payload.length,
    actualizadas: actualizaciones.length,
    omitidas,
  }
}