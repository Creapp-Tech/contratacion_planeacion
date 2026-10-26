"use server"

import { revalidatePath } from "next/cache"

import { requireSuperadmin } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  grupoServicioSchema,
  type GrupoServicioInput,
} from "@/lib/validations/grupo-servicio"

export type GrupoServicioActionResult =
  | { success: true }
  | { error: string }

const GRUPOS_PATH = "/configuracion/grupos-servicio"

const UNIQUE_VIOLATION = "23505"
const FK_VIOLATION = "23503"

function mensajeError(error: { code?: string; message: string }) {
  if (error.code === UNIQUE_VIOLATION) {
    return "Ya existe un grupo con ese nombre."
  }
  if (error.code === FK_VIOLATION) {
    return "El grupo tiene servicios asociados. Desactívalo en su lugar."
  }
  return error.message
}

function revalidarGrupos() {
  revalidatePath(GRUPOS_PATH, "layout")
  revalidatePath("/servicios", "layout")
  revalidatePath("/frecuencias", "layout")
}

export async function crearGrupoServicio(
  input: GrupoServicioInput
): Promise<GrupoServicioActionResult> {
  await requireSuperadmin()

  const parsed = grupoServicioSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const { error } = await createAdminClient()
    .from("grupos_servicio")
    .insert([{ nombre: parsed.data.nombre }])

  if (error) return { error: mensajeError(error) }

  revalidarGrupos()
  return { success: true }
}

export async function actualizarGrupoServicio(
  id: string,
  input: GrupoServicioInput
): Promise<GrupoServicioActionResult> {
  await requireSuperadmin()

  const parsed = grupoServicioSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const admin = createAdminClient()

  const { data: actual, error: errorActual } = await admin
    .from("grupos_servicio")
    .select("nombre")
    .eq("id", id)
    .maybeSingle()

  if (errorActual) return { error: errorActual.message }
  if (!actual) return { error: "El grupo no existe." }

  if (actual.nombre === parsed.data.nombre) {
    return { success: true }
  }

  const { error } = await admin
    .from("grupos_servicio")
    .update({ nombre: parsed.data.nombre })
    .eq("id", id)

  if (error) return { error: mensajeError(error) }

  const { error: errorCascada } = await admin
    .from("servicios")
    .update({ grupo: parsed.data.nombre })
    .eq("grupo_id", id)

  if (errorCascada) return { error: errorCascada.message }

  revalidarGrupos()
  return { success: true }
}

export async function cambiarEstadoGrupoServicio(
  id: string,
  activo: boolean
): Promise<GrupoServicioActionResult> {
  await requireSuperadmin()

  const { error } = await createAdminClient()
    .from("grupos_servicio")
    .update({ activo })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidarGrupos()
  return { success: true }
}

export async function eliminarGrupoServicio(
  id: string
): Promise<GrupoServicioActionResult> {
  await requireSuperadmin()

  const { error } = await createAdminClient()
    .from("grupos_servicio")
    .delete()
    .eq("id", id)

  if (error) return { error: mensajeError(error) }

  revalidarGrupos()
  return { success: true }
}
