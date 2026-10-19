"use server"

import { revalidatePath } from "next/cache"

import { requireSuperadmin } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  actualizarUsuarioSchema,
  crearUsuarioSchema,
  type ActualizarUsuarioInput,
  type CrearUsuarioInput,
} from "@/lib/validations/usuario"

export type UsuarioActionResult = { success: true } | { error: string }

const USUARIOS_PATH = "/usuarios"

export async function crearUsuario(
  input: CrearUsuarioInput
): Promise<UsuarioActionResult> {
  await requireSuperadmin()

  const parsed = crearUsuarioSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const admin = createAdminClient()
  const { email, password, nombre_completo, telefono, rol, estado } = parsed.data
  const regional_id = parsed.data.regional_id ? parsed.data.regional_id : null

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      nombre_completo,
      telefono: telefono ?? "",
      rol,
      regional_id: regional_id ?? "",
    },
  })

  if (authError) return { error: authError.message }

  const { error } = await admin.from("usuarios").upsert(
    [
      {
        id: authData.user.id,
        email,
        nombre_completo,
        telefono: telefono ?? null,
        rol,
        regional_id,
        estado,
      },
    ],
    { onConflict: "id" }
  )

  if (error) {
    await admin.auth.admin.deleteUser(authData.user.id)
    return { error: error.message }
  }

  revalidatePath(USUARIOS_PATH)
  return { success: true }
}

export async function actualizarUsuario(
  id: string,
  input: ActualizarUsuarioInput
): Promise<UsuarioActionResult> {
  await requireSuperadmin()

  const parsed = actualizarUsuarioSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const { password, nombre_completo, telefono, rol, estado } = parsed.data
  const regional_id = parsed.data.regional_id ? parsed.data.regional_id : null

  const admin = createAdminClient()

  const { error } = await admin
    .from("usuarios")
    .update({
      nombre_completo,
      telefono: telefono ?? null,
      rol,
      regional_id,
      estado,
    })
    .eq("id", id)

  if (error) return { error: error.message }

  if (password) {
    const { error: passwordError } = await admin.auth.admin.updateUserById(id, {
      password,
    })
    if (passwordError) return { error: passwordError.message }
  }

  revalidatePath(USUARIOS_PATH)
  return { success: true }
}

export async function desactivarUsuario(
  id: string
): Promise<UsuarioActionResult> {
  await requireSuperadmin()

  const { error } = await createAdminClient()
    .from("usuarios")
    .update({ estado: "inactivo" })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath(USUARIOS_PATH)
  return { success: true }
}
