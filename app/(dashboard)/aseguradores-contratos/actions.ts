"use server"

import { revalidatePath } from "next/cache"

import {
  alcanceDelUsuario,
  requireAccesoDireccionamiento,
  requireEditorDireccionamiento,
  type CurrentUsuario,
} from "@/lib/auth/session"
import {
  CAMPO_CME,
  RUTA,
} from "@/lib/aseguradores-contratos/constantes"
import { puedeEditarServicioAsegurador } from "@/lib/aseguradores-contratos/permisos"
import {
  getServicioParaPermisos,
  regionalesDelContrato,
} from "@/lib/aseguradores-contratos/queries"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  cambioMasivoSchema,
  editarCmeSchema,
  editarOpcionSchema,
  servicioCupsSchema,
  type CambioMasivoInput,
  type ServicioCupsInput,
} from "@/lib/validations/aseguradores-contratos"

export type AccionServicioResultado =
  | { success: true; id?: string; actualizados?: number }
  | { error: string }

type SupabaseError = {
  code?: string
  message: string
  details?: string | null
}

function primerError(error: { issues: { message?: string }[] }) {
  return error.issues[0]?.message ?? "Datos inválidos"
}

function mensajeError(error: SupabaseError) {
  if (error.code === "23505") {
    return "Ya existe un servicio CUPS con ese nombre en el contrato seleccionado."
  }
  if (error.code === "23503") {
    return "Uno de los registros seleccionados ya no existe."
  }
  if (error.code === "23514") {
    return "Revisa los valores ingresados: hay un dato fuera del rango permitido."
  }
  if (error.code === "P0001") {
    return "El contrato seleccionado no pertenece al asegurador indicado."
  }
  return error.message || "No se pudo guardar la información."
}

function revalidar() {
  revalidatePath(RUTA)
}

async function aseguradorDelContrato(id: string): Promise<string | null> {
  const { data, error } = await createAdminClient()
    .from("contratos")
    .select("asegurador_id")
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  return (data as { asegurador_id: string } | null)?.asegurador_id ?? null
}

async function puedeEditar(
  usuario: CurrentUsuario,
  contratoId: string,
  createdBy: string | null = null
): Promise<boolean> {
  const [regionales, alcance] = await Promise.all([
    regionalesDelContrato(contratoId),
    alcanceDelUsuario(usuario),
  ])
  return puedeEditarServicioAsegurador(
    usuario.rol,
    alcance.regional,
    regionales,
    createdBy,
    usuario.id
  )
}

export async function crearServicioCups(
  values: ServicioCupsInput
): Promise<AccionServicioResultado> {
  const usuario = await requireEditorDireccionamiento()

  const parseado = servicioCupsSchema.safeParse(values)
  if (!parseado.success) return { error: primerError(parseado.error) }

  const datos = parseado.data
  const asegurador = await aseguradorDelContrato(datos.contrato_id)
  if (!asegurador) return { error: "No se encontró el contrato seleccionado." }
  if (asegurador !== datos.asegurador_id) {
    return { error: "El contrato seleccionado no pertenece al asegurador indicado." }
  }

  if (!(await puedeEditar(usuario, datos.contrato_id))) {
    return { error: "No tienes permiso para gestionar este contrato." }
  }

  const { data, error } = await createAdminClient()
    .from("servicios_cups_aseguradores")
    .insert({
      asegurador_id: datos.asegurador_id,
      contrato_id: datos.contrato_id,
      cups_asegurador: datos.cups_asegurador,
      cups_id: datos.cups_id,
      frecuencia_uso_contratada: datos.frecuencia_uso_contratada,
      cme_contratado: datos.cme_contratado,
      primera_opcion_especialista_id: datos.primera_opcion_especialista_id,
      segunda_opcion_especialista_id: datos.segunda_opcion_especialista_id,
      created_by: usuario.id,
      updated_by: usuario.id,
    })
    .select("id")
    .single()

  if (error) return { error: mensajeError(error) }
  revalidar()
  return { success: true, id: (data as { id: string }).id }
}

export async function actualizarServicioCups(
  id: string,
  values: ServicioCupsInput
): Promise<AccionServicioResultado> {
  const usuario = await requireEditorDireccionamiento()

  const parseado = servicioCupsSchema.safeParse(values)
  if (!parseado.success) return { error: primerError(parseado.error) }

  const registro = await getServicioParaPermisos(id)
  if (!registro) return { error: "No se encontró el servicio CUPS." }

  const datos = parseado.data
  const asegurador = await aseguradorDelContrato(datos.contrato_id)
  if (!asegurador) return { error: "No se encontró el contrato seleccionado." }
  if (asegurador !== datos.asegurador_id) {
    return { error: "El contrato seleccionado no pertenece al asegurador indicado." }
  }

  if (
    !(await puedeEditar(usuario, registro.contrato_id, registro.created_by)) ||
    !(await puedeEditar(usuario, datos.contrato_id, registro.created_by))
  ) {
    return { error: "No tienes permiso para gestionar este servicio CUPS." }
  }

  const { error } = await createAdminClient()
    .from("servicios_cups_aseguradores")
    .update({
      asegurador_id: datos.asegurador_id,
      contrato_id: datos.contrato_id,
      cups_asegurador: datos.cups_asegurador,
      cups_id: datos.cups_id,
      frecuencia_uso_contratada: datos.frecuencia_uso_contratada,
      cme_contratado: datos.cme_contratado,
      primera_opcion_especialista_id: datos.primera_opcion_especialista_id,
      segunda_opcion_especialista_id: datos.segunda_opcion_especialista_id,
      updated_by: usuario.id,
    })
    .eq("id", id)

  if (error) return { error: mensajeError(error) }
  revalidar()
  return { success: true, id }
}

export async function actualizarCeldaServicio(
  id: string,
  campo: string,
  valor: string | number | null
): Promise<AccionServicioResultado> {
  const usuario = await requireEditorDireccionamiento()

  const registro = await getServicioParaPermisos(id)
  if (!registro) return { error: "No se encontró el servicio CUPS." }
  if (!(await puedeEditar(usuario, registro.contrato_id, registro.created_by))) {
    return { error: "No tienes permiso para editar este servicio CUPS." }
  }

  let cambios: Record<string, unknown>
  if (campo === CAMPO_CME) {
    const parseado = editarCmeSchema.safeParse({ id, cme_contratado: valor })
    if (!parseado.success) return { error: primerError(parseado.error) }
    cambios = { cme_contratado: parseado.data.cme_contratado }
  } else {
    const parseado = editarOpcionSchema.safeParse({
      id,
      campo: campo as CambioMasivoInput["campo"],
      especialista_id: valor,
    })
    if (!parseado.success) return { error: primerError(parseado.error) }
    cambios = { [parseado.data.campo]: parseado.data.especialista_id }
  }

  const { error } = await createAdminClient()
    .from("servicios_cups_aseguradores")
    .update({ ...cambios, updated_by: usuario.id })
    .eq("id", id)

  if (error) return { error: mensajeError(error) }
  revalidar()
  return { success: true, id }
}

export async function aplicarCambioMasivo(
  ids: string[],
  campo: string,
  especialistaId: string | null
): Promise<AccionServicioResultado> {
  const usuario = await requireEditorDireccionamiento()

  const datos: CambioMasivoInput = {
    ids,
    campo: campo as CambioMasivoInput["campo"],
    especialista_id: especialistaId,
  }
  const parseado = cambioMasivoSchema.safeParse(datos)
  if (!parseado.success) return { error: primerError(parseado.error) }

  const unicos = [...new Set(parseado.data.ids)]
  const { data: registros, error: errorRegistros } = await createAdminClient()
    .from("servicios_cups_aseguradores")
    .select("id, contrato_id, created_by")
    .in("id", unicos)

  if (errorRegistros) return { error: mensajeError(errorRegistros) }
  const filas = (registros ?? []) as {
    id: string
    contrato_id: string
    created_by: string | null
  }[]
  if (filas.length !== unicos.length) {
    return { error: "Uno de los servicios seleccionados ya no existe." }
  }

  const contratos = [...new Set(filas.map((fila) => fila.contrato_id))]
  const regionalesPorContrato = new Map<string, string[]>()
  await Promise.all(
    contratos.map(async (contratoId) => {
      regionalesPorContrato.set(contratoId, await regionalesDelContrato(contratoId))
    })
  )
  const alcance = await alcanceDelUsuario(usuario)

  const sinPermiso = filas.some(
    (fila) =>
      !puedeEditarServicioAsegurador(
        usuario.rol,
        alcance.regional,
        regionalesPorContrato.get(fila.contrato_id) ?? [],
        fila.created_by,
        usuario.id
      )
  )
  if (sinPermiso) {
    return { error: "No tienes permiso para editar todos los servicios seleccionados." }
  }

  const { data, error } = await createAdminClient()
    .from("servicios_cups_aseguradores")
    .update({
      [parseado.data.campo]: parseado.data.especialista_id,
      updated_by: usuario.id,
    })
    .in("id", unicos)
    .select("id")

  if (error) return { error: mensajeError(error) }
  revalidar()
  return { success: true, actualizados: (data ?? []).length }
}

export async function eliminarServicioCups(
  id: string
): Promise<AccionServicioResultado> {
  const usuario = await requireEditorDireccionamiento()
  if (usuario.rol !== "superadmin") {
    return { error: "Solo un superadministrador puede eliminar servicios CUPS." }
  }

  const registro = await getServicioParaPermisos(id)
  if (!registro) return { error: "No se encontró el servicio CUPS." }

  const { error } = await createAdminClient()
    .from("servicios_cups_aseguradores")
    .delete()
    .eq("id", id)

  if (error) return { error: mensajeError(error) }
  revalidar()
  return { success: true, id }
}

/** Expuesto para el panel: la lectura usa el mismo guard que Direccionamiento. */
export async function verificarAcceso(): Promise<void> {
  await requireAccesoDireccionamiento()
}
