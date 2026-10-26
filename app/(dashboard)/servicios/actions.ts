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

async function hayServicioMismoNombreYGrupo(
  nombre: string,
  grupoId: string | null
): Promise<boolean> {
  const normalized = normalizarNombre(nombre)
  const client = createAdminClient()
  let query = client.from("servicios").select("id, nombre, grupo_id").eq("lower(trim(both from nombre))", normalized)

  if (grupoId === null) {
    query = query.is("grupo_id", null)
  } else {
    query = query.eq("grupo_id", grupoId)
  }

  return query.maybeSingle().then((res) => !!res.data)
}

function mensajeError(error: { code?: string; message: string }) {
  if (error.code === "23505") {
    return "El nombre del servicio ya está en uso en este grupo."
  }
  if (error.code === "23503") {
    return "El grupo o el área seleccionado ya no existe. Recarga la página."
  }
  return error.message
}

async function resolverGrupoTexto(
  grupoId: string | null
): Promise<{ grupo: string | null; error?: string }> {
  if (!grupoId) return { grupo: null }

  const { data, error } = await createAdminClient()
    .from("grupos_servicio")
    .select("nombre")
    .eq("id", grupoId)
    .maybeSingle()

  if (error) return { grupo: null, error: error.message }
  if (!data) return { grupo: null, error: "El grupo seleccionado no existe." }

  return { grupo: data.nombre as string }
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

  const { grupo, error: grupoError } = await resolverGrupoTexto(
    parsed.data.grupo_id
  )
  if (grupoError) return { error: grupoError }

  // Log temporal para depuración
  console.log("[DEBUG] crearServicio - nombre:", parsed.data.nombre, "grupo_id:", parsed.data.grupo_id)

  // Verificar si ya existe un servicio con el mismo nombre en el mismo grupo
  const nombreNormalizado = normalizarNombre(parsed.data.nombre)
  let existente = false
  try {
    existente = await hayServicioMismoNombreYGrupo(
      parsed.data.nombre,
      parsed.data.grupo_id
    )
  } catch {
    // Si la verificación falla (ej. índice viejo), permitimos la creación
    // y confiamos en la validación a nivel de BD
  }

  if (existente) {
    return {
      error:
        "Ya existe un servicio con ese nombre en el mismo grupo. " +
        "Los nombres de servicio son únicos por grupo, no a nivel global.",
    }
  }

  const { error } = await createAdminClient()
    .from("servicios")
    .insert([parsed.data])

  if (error) {
    // Manejo específico de violación única (índice viejo que no fue migrado)
    if (error.code === "23505") {
      return {
        error:
          "Ya existe un servicio con ese nombre. Los nombres de servicio son únicos por grupo, no a nivel global.",
      }
    }
    return { error: "Error al crear el servicio. Intenta de nuevo." }
  }

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

  const { grupo, error: grupoError } = await resolverGrupoTexto(
    parsed.data.grupo_id
  )
  if (grupoError) return { error: grupoError }

  // Verificar si ya existe otro servicio con el mismo nombre en el mismo grupo
  const nombreNormalizado = normalizarNombre(parsed.data.nombre)
  let existente = false
  try {
    existente = await hayServicioMismoNombreYGrupo(
      parsed.data.nombre,
      parsed.data.grupo_id
    )
  } catch {
    existente = false
  }

  // Si el servicio existente es el propio que se está actualizando, no es conflicto
  if (existente) {
    const { data: current } = await createAdminClient()
      .from("servicios")
      .select("id")
      .eq("id", id)
      .maybeSingle()
    if (!current || current.id !== id) {
      return {
        error:
          "Ya existe un servicio con ese nombre en el mismo grupo. " +
          "Los nombres de servicio son únicos por grupo, no a nivel global.",
      }
    }
  }

  const { error } = await createAdminClient()
    .from("servicios")
    .update({ ...parsed.data })
    .eq("id", id)

  if (error) {
    if (error.code === "23505") {
      return {
        error:
          "Ya existe un servicio con ese nombre en el mismo grupo. " +
          "Los nombres de servicio son únicos por grupo, no a nivel global.",
      }
    }
    return { error: "Error al actualizar el servicio. Intenta de nuevo." }
  }

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
  let grupos
  try {
    ;[areas, tiposPersonal, existentes, grupos] = await Promise.all([
      listAreas(),
      listCatalogos("tipo_personal"),
      createAdminClient()
        .from("servicios")
        .select("id,nombre"),
      createAdminClient()
        .from("grupos_servicio")
        .select("id,nombre")
        .eq("activo", true),
    ])
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudieron cargar áreas, servicios, grupos o tipos de personal.",
    }
  }

  if (existentes.error) return { error: existentes.error.message }
  if (grupos.error) return { error: grupos.error.message }

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
  const mapaGrupos = new Map(
    ((grupos.data ?? []) as { id: string; nombre: string }[]).map((grupo) => [
      normalizarNombre(grupo.nombre),
      { id: grupo.id, nombre: grupo.nombre },
    ])
  )

  const defecto = opciones.tipoPersonalDefecto?.trim()
  if (defecto && !mapaTipos.has(normalizarNombre(defecto))) {
    return { error: "El tipo de persona por defecto no existe en el catálogo." }
  }

  const omitidas: ImportarServiciosResultado["omitidas"] = []
  const payload: {
    nombre: string
    grupo: string | null
    grupo_id: string | null
    area_id: string | null
    tipo_personal: string
    duracion_minutos: number | null
  }[] = []
  const actualizaciones: {
    id: string
    grupo: string | null
    grupo_id: string | null
    area_id: string | null
    tipo_personal: string
    duracion_minutos: number | null
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

    const grupoCatalogo = mapaGrupos.get(normalizarNombre(servicio.grupo))
    if (!grupoCatalogo) {
      omitidas.push({
        fila: numeroFila,
        motivo: `Grupo no encontrado en el catálogo: ${servicio.grupo}`,
      })
      continue
    }

    let duracionMinutos: number | null = null
    if (servicio.duracion_minutos) {
      const limpio = servicio.duracion_minutos.trim()
      if (!/^\d+$/.test(limpio)) {
        omitidas.push({
          fila: numeroFila,
          motivo: `Duración inválida (debe ser un número entero): ${servicio.duracion_minutos}`,
        })
        continue
      }
      const numero = Number(limpio)
      if (numero < 1 || numero > 1440) {
        omitidas.push({
          fila: numeroFila,
          motivo: `Duración fuera de rango (1–1440 minutos): ${servicio.duracion_minutos}`,
        })
        continue
      }
      duracionMinutos = numero
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
        grupo: grupoCatalogo.nombre,
        grupo_id: grupoCatalogo.id,
        area_id: areaId,
        tipo_personal: tipoPersonal,
        duracion_minutos: duracionMinutos,
      })
    } else {
      payload.push({
        nombre: servicio.nombre,
        grupo: grupoCatalogo.nombre,
        grupo_id: grupoCatalogo.id,
        area_id: areaId,
        tipo_personal: tipoPersonal,
        duracion_minutos: duracionMinutos,
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
        grupo_id: actualizacion.grupo_id,
        area_id: actualizacion.area_id,
        tipo_personal: actualizacion.tipo_personal,
        duracion_minutos: actualizacion.duracion_minutos,
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