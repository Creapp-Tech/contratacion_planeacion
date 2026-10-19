"use server"

import { revalidatePath } from "next/cache"

import { requireSuperadmin } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"
import { areaSchema, type AreaInput } from "@/lib/validations/area"
import {
  grupoAreaSchema,
  type GrupoAreaInput,
} from "@/lib/validations/grupo-area"

export type AreaActionResult = { success: true } | { error: string }

const AREAS_PATH = "/configuracion/areas"

function mensajeError(error: { code?: string; message: string }) {
  if (error.code === "23505") {
    return "Ya existe un área con ese nombre en el grupo seleccionado."
  }
  return error.message
}

export async function crearArea(input: AreaInput): Promise<AreaActionResult> {
  await requireSuperadmin()

  const parsed = areaSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const { error } = await createAdminClient()
    .from("areas_catalogo")
    .insert([parsed.data])

  if (error) return { error: mensajeError(error) }

  revalidatePath(AREAS_PATH)
  return { success: true }
}

export async function actualizarArea(
  id: string,
  input: AreaInput
): Promise<AreaActionResult> {
  await requireSuperadmin()

  const parsed = areaSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const { error } = await createAdminClient()
    .from("areas_catalogo")
    .update(parsed.data)
    .eq("id", id)

  if (error) return { error: mensajeError(error) }

  revalidatePath(AREAS_PATH)
  return { success: true }
}

export async function eliminarArea(id: string): Promise<AreaActionResult> {
  await requireSuperadmin()

  const { error } = await createAdminClient()
    .from("areas_catalogo")
    .delete()
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath(AREAS_PATH)
  return { success: true }
}

export type GrupoAreaActionResult = { success: true } | { error: string }

function mensajeErrorGrupo(error: { code?: string; message: string }) {
  if (error.code === "23505") {
    return "Ya existe un grupo con ese nombre."
  }
  return error.message
}

function revalidarAreas() {
  revalidatePath(AREAS_PATH, "layout")
}

export async function crearGrupoArea(
  input: GrupoAreaInput
): Promise<GrupoAreaActionResult> {
  await requireSuperadmin()

  const parsed = grupoAreaSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const { error } = await createAdminClient()
    .from("area_categorias")
    .insert([parsed.data])

  if (error) return { error: mensajeErrorGrupo(error) }

  revalidarAreas()
  return { success: true }
}

export async function renombrarGrupoArea(
  id: string,
  nombre: string
): Promise<GrupoAreaActionResult> {
  await requireSuperadmin()

  const parsed = grupoAreaSchema.safeParse({ nombre })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const admin = createAdminClient()

  const { data: actual, error: errorActual } = await admin
    .from("area_categorias")
    .select("nombre")
    .eq("id", id)
    .maybeSingle()

  if (errorActual) return { error: errorActual.message }
  if (!actual) return { error: "El grupo no existe." }

  if (actual.nombre === parsed.data.nombre) {
    return { success: true }
  }

  const { error } = await admin
    .from("area_categorias")
    .update({ nombre: parsed.data.nombre })
    .eq("id", id)

  if (error) return { error: mensajeErrorGrupo(error) }

  const { error: errorCascada } = await admin
    .from("areas_catalogo")
    .update({ categoria: parsed.data.nombre })
    .eq("categoria", actual.nombre)

  if (errorCascada) return { error: errorCascada.message }

  revalidarAreas()
  return { success: true }
}

export async function cambiarEstadoGrupoArea(
  id: string,
  activo: boolean
): Promise<GrupoAreaActionResult> {
  await requireSuperadmin()

  const { error } = await createAdminClient()
    .from("area_categorias")
    .update({ activo })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidarAreas()
  return { success: true }
}
