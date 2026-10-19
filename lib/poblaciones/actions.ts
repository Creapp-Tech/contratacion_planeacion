"use server"

import { revalidatePath } from "next/cache"

import { requireSuperadmin } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  poblacionSchema,
  type PoblacionInput,
} from "@/lib/validations/poblacion"

export type PoblacionActionResult = { success: true } | { error: string }

const POBLACIONES_PATH = "/poblaciones"
const MAPA_PATH = "/sedes/mapa"
const UNIQUE_VIOLATION = "23505"
const FOREIGN_KEY_VIOLATION = "23503"

function mensajeError(error: { code?: string; message: string }) {
  if (error.code === UNIQUE_VIOLATION) {
    return "Ya existe una población registrada para esa sede, asegurador y régimen"
  }
  if (error.code === FOREIGN_KEY_VIOLATION) {
    return "La sede, el asegurador o el régimen seleccionado no existe"
  }
  return error.message
}

function revalidar() {
  revalidatePath(POBLACIONES_PATH)
  revalidatePath(MAPA_PATH)
}

export async function crearPoblacion(
  input: PoblacionInput
): Promise<PoblacionActionResult> {
  const usuario = await requireSuperadmin()

  const parsed = poblacionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const { error } = await createAdminClient()
    .from("poblacion_aseguradora")
    .insert([{ ...parsed.data, usuario_id: usuario.id }])

  if (error) return { error: mensajeError(error) }

  revalidar()
  return { success: true }
}

export async function actualizarPoblacion(
  id: string,
  input: PoblacionInput
): Promise<PoblacionActionResult> {
  const usuario = await requireSuperadmin()

  const parsed = poblacionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const { error } = await createAdminClient()
    .from("poblacion_aseguradora")
    .update({ ...parsed.data, usuario_id: usuario.id })
    .eq("id", id)

  if (error) return { error: mensajeError(error) }

  revalidar()
  return { success: true }
}

export async function eliminarPoblacion(
  id: string
): Promise<PoblacionActionResult> {
  await requireSuperadmin()

  const { error } = await createAdminClient()
    .from("poblacion_aseguradora")
    .delete()
    .eq("id", id)

  if (error) return { error: mensajeError(error) }

  revalidar()
  return { success: true }
}
