"use server"

import { revalidatePath } from "next/cache"

import { requireSuperadmin } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  aseguradorSchema,
  type AseguradorInput,
} from "@/lib/validations/asegurador"

export type AseguradorActionResult = { success: true } | { error: string }

const ASEGURADORES_PATH = "/configuracion/aseguradores"
const UNIQUE_VIOLATION = "23505"
const FOREIGN_KEY_VIOLATION = "23503"

function mensajeError(error: { code?: string; message: string }) {
  if (error.code === UNIQUE_VIOLATION) {
    return "Ya existe un asegurador con ese nombre"
  }
  if (error.code === FOREIGN_KEY_VIOLATION) {
    return "No se puede eliminar: el asegurador está asignado a una o más sedes"
  }
  return error.message
}

export async function crearAsegurador(
  input: AseguradorInput
): Promise<AseguradorActionResult> {
  await requireSuperadmin()

  const parsed = aseguradorSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const { error } = await createAdminClient()
    .from("aseguradores_eps")
    .insert([parsed.data])

  if (error) return { error: mensajeError(error) }

  revalidatePath(ASEGURADORES_PATH)
  return { success: true }
}

export async function actualizarAsegurador(
  id: string,
  input: AseguradorInput
): Promise<AseguradorActionResult> {
  await requireSuperadmin()

  const parsed = aseguradorSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const { error } = await createAdminClient()
    .from("aseguradores_eps")
    .update(parsed.data)
    .eq("id", id)

  if (error) return { error: mensajeError(error) }

  revalidatePath(ASEGURADORES_PATH)
  return { success: true }
}

export async function eliminarAsegurador(
  id: string
): Promise<AseguradorActionResult> {
  await requireSuperadmin()

  const { error } = await createAdminClient()
    .from("aseguradores_eps")
    .delete()
    .eq("id", id)

  if (error) return { error: mensajeError(error) }

  revalidatePath(ASEGURADORES_PATH)
  return { success: true }
}
