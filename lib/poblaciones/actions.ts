"use server"

import { revalidatePath } from "next/cache"

import {
  puedeGestionarRegional,
  usuarioEditor,
} from "@/lib/auth/session"
import { alcanceTotal } from "@/lib/constants/roles"
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

async function regionalDeSede(
  admin: ReturnType<typeof createAdminClient>,
  sedeId: string
): Promise<string | null> {
  const { data } = await admin
    .from("sedes")
    .select("regional")
    .eq("id", sedeId)
    .maybeSingle()

  return (data as { regional: string | null } | null)?.regional ?? null
}

function revalidar() {
  revalidatePath(POBLACIONES_PATH)
  revalidatePath(MAPA_PATH)
}

export async function crearPoblacion(
  input: PoblacionInput
): Promise<PoblacionActionResult> {
  const usuario = await usuarioEditor()
  if (!usuario) {
    return { error: "No tienes permiso para realizar esta acción" }
  }

  const parsed = poblacionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const admin = createAdminClient()

  if (!alcanceTotal(usuario.rol)) {
    const regional = await regionalDeSede(admin, parsed.data.sede_id)
    if (!(await puedeGestionarRegional(usuario, regional))) {
      return { error: "Solo puedes gestionar poblaciones de tu regional" }
    }
  }

  const { error } = await admin
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
  const usuario = await usuarioEditor()
  if (!usuario) {
    return { error: "No tienes permiso para realizar esta acción" }
  }

  const parsed = poblacionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const admin = createAdminClient()

  if (!alcanceTotal(usuario.rol)) {
    const { data: actual } = await admin
      .from("poblacion_aseguradora")
      .select("sede_id")
      .eq("id", id)
      .maybeSingle()

    if (!actual) {
      return { error: "La población no existe" }
    }

    const regionalActual = await regionalDeSede(
      admin,
      (actual as { sede_id: string }).sede_id
    )
    const regionalNueva = await regionalDeSede(admin, parsed.data.sede_id)

    if (
      !(await puedeGestionarRegional(usuario, regionalActual)) ||
      !(await puedeGestionarRegional(usuario, regionalNueva))
    ) {
      return { error: "Solo puedes gestionar poblaciones de tu regional" }
    }
  }

  const { error } = await admin
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
  const usuario = await usuarioEditor()
  if (!usuario) {
    return { error: "No tienes permiso para realizar esta acción" }
  }

  const admin = createAdminClient()

  if (!alcanceTotal(usuario.rol)) {
    const { data: actual } = await admin
      .from("poblacion_aseguradora")
      .select("sede_id")
      .eq("id", id)
      .maybeSingle()

    if (!actual) {
      return { error: "La población no existe" }
    }

    const regional = await regionalDeSede(
      admin,
      (actual as { sede_id: string }).sede_id
    )
    if (!(await puedeGestionarRegional(usuario, regional))) {
      return { error: "Solo puedes gestionar poblaciones de tu regional" }
    }
  }

  const { error } = await admin
    .from("poblacion_aseguradora")
    .delete()
    .eq("id", id)

  if (error) return { error: mensajeError(error) }

  revalidar()
  return { success: true }
}
