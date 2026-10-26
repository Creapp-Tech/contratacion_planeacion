"use server"

import { revalidatePath } from "next/cache"

import {
  alcanceContratos,
  requireAccesoContratacion,
} from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"
import { ipcSchema, type IpcInput } from "@/lib/validations/ipc"

export type IpcActionResult = { success: true } | { error: string }

const IPC_PATH = "/ipc"
const UNIQUE_VIOLATION = "23505"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type SupabaseError = {
  code?: string
  message: string
  details?: string | null
}

type Alcance = {
  verTodo: boolean
  regionalId: string | null
}

function mensajeError(error: SupabaseError) {
  if (error.code === UNIQUE_VIOLATION) {
    return "Ya existe un registro IPC para ese contrato y año"
  }
  return error.message
}

type ContratoValidado = {
  id: string
  regional_id: string
}

async function validarContrato(
  contratoId: string,
  alcance: Alcance
): Promise<{ error: string } | { contrato: ContratoValidado }> {
  const { data, error } = await createAdminClient()
    .from("contratos")
    .select("id, estado, regional_id")
    .eq("id", contratoId)
    .maybeSingle()

  if (error) throw error

  if (!data) {
    return { error: "El contrato seleccionado no existe" }
  }

  const contrato = data as { id: string; estado: string; regional_id: string }

  if (contrato.estado !== "activo") {
    return { error: "El contrato seleccionado no está activo" }
  }

  if (!alcance.verTodo && contrato.regional_id !== alcance.regionalId) {
    return {
      error: "Solo puedes registrar IPC de contratos de tu regional",
    }
  }

  return { contrato: { id: contrato.id, regional_id: contrato.regional_id } }
}

async function validarRegistroEnAlcance(
  id: string,
  alcance: Alcance
): Promise<{ error: string } | { ok: true }> {
  if (!UUID_RE.test(id)) return { error: "El registro IPC no existe" }

  const { data, error } = await createAdminClient()
    .from("ipc_seguimiento")
    .select("id, contratos!inner(regional_id)")
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  if (!data) return { error: "El registro IPC no existe" }

  const contrato = (
    data as unknown as { contratos: { regional_id: string } }
  ).contratos

  if (!alcance.verTodo && contrato.regional_id !== alcance.regionalId) {
    return { error: "Solo puedes modificar registros IPC de tu regional" }
  }

  return { ok: true }
}

export async function crearIpc(input: IpcInput): Promise<IpcActionResult> {
  const usuario = await requireAccesoContratacion()
  const alcance = alcanceContratos(usuario)

  const parsed = ipcSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const validacion = await validarContrato(
    parsed.data.contrato_id,
    alcance
  )
  if ("error" in validacion) return validacion

  const { error } = await createAdminClient()
    .from("ipc_seguimiento")
    .insert([
      {
        contrato_id: parsed.data.contrato_id,
        anio: parsed.data.anio,
        costo_usuario: parsed.data.costo_usuario,
        porcentaje_ipc: parsed.data.porcentaje_ipc,
        created_by: usuario.id,
      },
    ])

  if (error) return { error: mensajeError(error) }

  revalidatePath(IPC_PATH, "layout")
  return { success: true }
}

export async function actualizarIpc(
  id: string,
  input: IpcInput
): Promise<IpcActionResult> {
  const usuario = await requireAccesoContratacion()
  const alcance = alcanceContratos(usuario)

  const permiso = await validarRegistroEnAlcance(id, alcance)
  if ("error" in permiso) return permiso

  const parsed = ipcSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const validacion = await validarContrato(
    parsed.data.contrato_id,
    alcance
  )
  if ("error" in validacion) return validacion

  const { error } = await createAdminClient()
    .from("ipc_seguimiento")
    .update({
      contrato_id: parsed.data.contrato_id,
      anio: parsed.data.anio,
      costo_usuario: parsed.data.costo_usuario,
      porcentaje_ipc: parsed.data.porcentaje_ipc,
    })
    .eq("id", id)

  if (error) return { error: mensajeError(error) }

  revalidatePath(IPC_PATH, "layout")
  return { success: true }
}

export async function eliminarIpc(id: string): Promise<IpcActionResult> {
  const usuario = await requireAccesoContratacion()
  const alcance = alcanceContratos(usuario)

  const permiso = await validarRegistroEnAlcance(id, alcance)
  if ("error" in permiso) return permiso

  const { error } = await createAdminClient()
    .from("ipc_seguimiento")
    .delete()
    .eq("id", id)

  if (error) return { error: mensajeError(error) }

  revalidatePath(IPC_PATH, "layout")
  return { success: true }
}
