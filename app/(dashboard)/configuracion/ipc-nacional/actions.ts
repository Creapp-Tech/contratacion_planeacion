"use server"

import { revalidatePath } from "next/cache"

import { requireSuperadmin } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  ipcNacionalSchema,
  type IpcNacionalInput,
} from "@/lib/validations/ipc"

export type IpcNacionalActionResult =
  | { success: true }
  | { error: string }

const IPC_NACIONAL_PATH = "/configuracion/ipc-nacional"
const IPC_PATH = "/ipc"
const UNIQUE_VIOLATION = "23505"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function mensajeError(error: { code?: string; message: string }) {
  if (error.code === UNIQUE_VIOLATION) {
    return "Ya existe un registro de IPC nacional para ese país y año"
  }
  return error.message
}

export async function crearIpcNacional(
  input: IpcNacionalInput
): Promise<IpcNacionalActionResult> {
  const usuario = await requireSuperadmin()

  const parsed = ipcNacionalSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const { error } = await createAdminClient()
    .from("ipc_nacional")
    .insert([
      {
        ...parsed.data,
        valor_upc_subsidiado: parsed.data.valor_upc_subsidiado ?? null,
        created_by: usuario.id,
      },
    ])

  if (error) return { error: mensajeError(error) }

  revalidatePath(IPC_NACIONAL_PATH, "layout")
  revalidatePath(IPC_PATH, "layout")
  return { success: true }
}

export async function actualizarIpcNacional(
  id: string,
  input: IpcNacionalInput
): Promise<IpcNacionalActionResult> {
  await requireSuperadmin()

  if (!UUID_RE.test(id)) {
    return { error: "El registro de IPC nacional no existe" }
  }

  const parsed = ipcNacionalSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const { error } = await createAdminClient()
    .from("ipc_nacional")
    .update({
      ...parsed.data,
      valor_upc_subsidiado: parsed.data.valor_upc_subsidiado ?? null,
    })
    .eq("id", id)

  if (error) return { error: mensajeError(error) }

  revalidatePath(IPC_NACIONAL_PATH, "layout")
  revalidatePath(IPC_PATH, "layout")
  return { success: true }
}

export async function eliminarIpcNacional(
  id: string
): Promise<IpcNacionalActionResult> {
  await requireSuperadmin()

  if (!UUID_RE.test(id)) {
    return { error: "El registro de IPC nacional no existe" }
  }

  const { error } = await createAdminClient()
    .from("ipc_nacional")
    .delete()
    .eq("id", id)

  if (error) return { error: mensajeError(error) }

  revalidatePath(IPC_NACIONAL_PATH, "layout")
  revalidatePath(IPC_PATH, "layout")
  return { success: true }
}
