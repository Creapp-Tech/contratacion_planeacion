"use server"

import { revalidatePath } from "next/cache"

import { requireSuperadmin } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"
import { regionalSchema, type RegionalInput } from "@/lib/validations/regional"

export type RegionalActionResult = { success: true } | { error: string }

const REGIONALES_PATH = "/configuracion/regionales"

export async function crearRegional(
  input: RegionalInput
): Promise<RegionalActionResult> {
  await requireSuperadmin()

  const parsed = regionalSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const { error } = await createAdminClient()
    .from("regionales")
    .insert([parsed.data])

  if (error) return { error: error.message }

  revalidatePath(REGIONALES_PATH)
  return { success: true }
}

export async function actualizarRegional(
  id: string,
  input: RegionalInput
): Promise<RegionalActionResult> {
  await requireSuperadmin()

  const parsed = regionalSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const { error } = await createAdminClient()
    .from("regionales")
    .update(parsed.data)
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath(REGIONALES_PATH)
  return { success: true }
}

export async function eliminarRegional(
  id: string
): Promise<RegionalActionResult> {
  await requireSuperadmin()

  const { error } = await createAdminClient()
    .from("regionales")
    .delete()
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath(REGIONALES_PATH)
  return { success: true }
}
