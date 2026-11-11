"use server"

import { revalidatePath } from "next/cache"

import { requireSuperadmin } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"
import { regionalSchema, type RegionalInput } from "@/lib/validations/regional"

export type RegionalActionResult = { success: true } | { error: string }

const REGIONALES_PATH = "/configuracion/regionales"

/**
 * El formulario de sedes lee las regionales del catálogo `catalogos_opciones`
 * (dominio `regional`). Se mantiene sincronizado al crear o renombrar una
 * regional para que pueda usarse de inmediato.
 */
async function sincronizarCatalogoRegional(nombre: string) {
  const { error } = await createAdminClient()
    .from("catalogos_opciones")
    .insert({ dominio: "regional", nombre })

  if (error && error.code !== "23505") {
    console.warn(
      "[regionales] no se pudo sincronizar el catálogo regional:",
      error.message
    )
  }
}

async function renombrarCatalogoRegional(anterior: string, nuevo: string) {
  if (anterior.trim().toLowerCase() === nuevo.trim().toLowerCase()) return

  const { error } = await createAdminClient()
    .from("catalogos_opciones")
    .update({ nombre: nuevo })
    .eq("dominio", "regional")
    .eq("nombre", anterior)

  if (error && error.code !== "23505") {
    console.warn(
      "[regionales] no se pudo renombrar el catálogo regional:",
      error.message
    )
  }
}

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

  await sincronizarCatalogoRegional(parsed.data.nombre)

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

  const admin = createAdminClient()
  const { data: anterior } = await admin
    .from("regionales")
    .select("nombre")
    .eq("id", id)
    .maybeSingle()

  const { error } = await admin
    .from("regionales")
    .update(parsed.data)
    .eq("id", id)

  if (error) return { error: error.message }

  const nombreAnterior = (anterior as { nombre: string } | null)?.nombre
  if (nombreAnterior) {
    await renombrarCatalogoRegional(nombreAnterior, parsed.data.nombre)
  }
  await sincronizarCatalogoRegional(parsed.data.nombre)

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
