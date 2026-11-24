"use server"

import { randomUUID } from "node:crypto"

import { revalidatePath } from "next/cache"

import {
  alcanceDelUsuario,
  puedeGestionarRegional,
  requireAccesoDireccionamiento,
  requireEditorDireccionamiento,
  type CurrentUsuario,
} from "@/lib/auth/session"
import {
  ESTADO_VALIDACION_VALUES,
  ESTADO_ESPECIALISTA_VALUES,
} from "@/lib/direccionamiento/constantes"
import {
  getEspecialista,
  buscarCups,
  getCupsDerivados,
  regionalesEspecialista,
} from "@/lib/direccionamiento/queries"
import {
  puedeEditarRegistroDireccionamiento,
  puedeVerRegistroDireccionamiento,
} from "@/lib/direccionamiento/permisos"
import type { CupsOpcion, EspecialistaRow } from "@/lib/direccionamiento/types"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  asignacionSedeActualizarSchema,
  asignacionSedeCrearSchema,
  contratoEspecialistaSchema,
  especialistaSchema,
  novedadSchema,
  servicioContratadoSchema,
  type AsignacionSedeInput,
  type ContratoEspecialistaInput,
  type EspecialistaInput,
  type NovedadInput,
  type ServicioContratadoInput,
} from "@/lib/validations/direccionamiento"

export type DireccionamientoActionResult =
  | { success: true; id?: string }
  | { error: string }

type SupabaseError = {
  code?: string
  message: string
  details?: string | null
}

const RAIZ = "/direccionamiento"

function primerError(error: { issues: { message?: string }[] }) {
  return error.issues[0]?.message ?? "Datos inválidos"
}

function mensajeError(error: SupabaseError) {
  if (error.code === "23505") {
    const detalle = `${error.details ?? ""} ${error.message ?? ""}`
    if (detalle.includes("especialistas_identificacion")) {
      return "Ya existe un especialista con ese tipo y número de identificación."
    }
    if (detalle.includes("contratos_especialistas_numero")) {
      return "Ya existe un contrato con ese número para el asegurador seleccionado."
    }
    if (detalle.includes("servicios_contratados_especialistas_uq")) {
      return "Ese servicio CUPS ya está contratado en este contrato."
    }
    if (detalle.includes("sedes_servicios_especialistas_uq")) {
      return "Una o más sedes ya están asignadas a este servicio del contrato."
    }
    return "Ya existe un registro con esos datos."
  }
  if (error.code === "23503") {
    return "Uno de los catálogos seleccionados ya no existe."
  }
  return error.message || "No se pudo guardar la información."
}

function revalidar(especialistaId: string) {
  revalidatePath(RAIZ)
  revalidatePath(`${RAIZ}/${especialistaId}`)
}

type AccesoEspecialista =
  | { usuario: CurrentUsuario; especialista: EspecialistaRow }
  | { error: string }

async function especialistaAccesible(
  id: string,
  escribir: boolean
): Promise<AccesoEspecialista> {
  const usuario = escribir
    ? await requireEditorDireccionamiento()
    : await requireAccesoDireccionamiento()

  const especialista = await getEspecialista(id)
  if (!especialista) {
    return { error: "No se encontró el especialista." }
  }

  // La regional del especialista se deriva de las sedes asignadas.
  const [regionales, alcance] = await Promise.all([
    regionalesEspecialista(id),
    alcanceDelUsuario(usuario),
  ])
  const permitido = escribir
    ? puedeEditarRegistroDireccionamiento(
        usuario.rol,
        alcance.regional,
        regionales,
        especialista.created_by,
        usuario.id
      )
    : puedeVerRegistroDireccionamiento(
        usuario.rol,
        alcance.regional,
        regionales,
        especialista.created_by,
        usuario.id
      )
  if (!permitido) {
    return { error: "No tienes permiso para gestionar este especialista." }
  }
  return { usuario, especialista }
}

async function obtenerContrato(id: string) {
  const { data, error } = await createAdminClient()
    .from("contratos_especialistas")
    .select("id, especialista_id")
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  return data as { id: string; especialista_id: string } | null
}

async function obtenerServicio(id: string) {
  const { data, error } = await createAdminClient()
    .from("servicios_contratados_especialistas")
    .select("id, contrato_especialista_id")
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  return data as { id: string; contrato_especialista_id: string } | null
}

async function obtenerAsignacion(id: string) {
  const { data, error } = await createAdminClient()
    .from("sedes_servicios_especialistas")
    .select(
      "id, especialista_id, contrato_especialista_id, servicio_contratado_id, sede_id, created_by"
    )
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  return data as {
    id: string
    especialista_id: string
    contrato_especialista_id: string
    servicio_contratado_id: string
    sede_id: string
    created_by: string | null
  } | null
}

async function obtenerNovedad(id: string) {
  const { data, error } = await createAdminClient()
    .from("novedades_direccionamiento")
    .select("id, especialista_id")
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  return data as { id: string; especialista_id: string } | null
}

async function obtenerSede(id: string) {
  const { data, error } = await createAdminClient()
    .from("sedes")
    .select("id, regional")
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  return data as { id: string; regional: string | null } | null
}

async function validarSedesParaAsignacion(
  usuario: CurrentUsuario,
  sedeIds: string[]
): Promise<string | null> {
  const ids = [...new Set(sedeIds)]
  const { data, error } = await createAdminClient()
    .from("sedes")
    .select("id, regional")
    .in("id", ids)

  if (error) return mensajeError(error)

  const sedesPorId = new Map(
    ((data ?? []) as { id: string; regional: string | null }[]).map(
      (sede) => [sede.id, sede.regional]
    )
  )
  if (ids.some((sedeId) => !sedesPorId.has(sedeId))) {
    return "Una de las sedes seleccionadas no existe."
  }
  for (const sedeId of ids) {
    if (!(await puedeGestionarRegional(usuario, sedesPorId.get(sedeId) ?? null))) {
      return "No puedes asignar sedes de esa regional."
    }
  }
  return null
}

async function verificarPadresNovedad(input: {
    especialista_id: string
    contrato_especialista_id: string | null
    servicio_contratado_id: string | null
    asignacion_sede_id: string | null
  }
): Promise<string | null> {
  if (input.contrato_especialista_id) {
    const contrato = await obtenerContrato(input.contrato_especialista_id)
    if (!contrato) return "El contrato seleccionado no existe."
    if (contrato.especialista_id !== input.especialista_id) {
      return "El contrato no pertenece al especialista."
    }
  }
  if (input.servicio_contratado_id) {
    const servicio = await obtenerServicio(input.servicio_contratado_id)
    if (!servicio) return "El servicio seleccionado no existe."
    const contrato = await obtenerContrato(servicio.contrato_especialista_id)
    if (!contrato || contrato.especialista_id !== input.especialista_id) {
      return "El servicio no pertenece al especialista."
    }
  }
  if (input.asignacion_sede_id) {
    const asignacion = await obtenerAsignacion(input.asignacion_sede_id)
    if (!asignacion || asignacion.especialista_id !== input.especialista_id) {
      return "La asignación de sede no pertenece al especialista."
    }
  }
  return null
}

// ============ especialistas ============

export async function crearEspecialista(
  input: EspecialistaInput
): Promise<DireccionamientoActionResult> {
  const usuario = await requireEditorDireccionamiento()
  const parsed = especialistaSchema.safeParse(input)
  if (!parsed.success) return { error: primerError(parsed.error) }

  const admin = createAdminClient()
  const duplicado = await admin
    .from("especialistas")
    .select("id")
    .eq("tipo_identificacion", parsed.data.tipo_identificacion)
    .ilike("numero_identificacion", parsed.data.numero_identificacion)
    .maybeSingle()

  if (duplicado.error) return { error: duplicado.error.message }
  if (duplicado.data) {
    return {
      error: "Ya existe un especialista con ese tipo y número de identificación.",
    }
  }

  const { data, error } = await admin
    .from("especialistas")
    .insert({
      ...parsed.data,
      numero_identificacion: parsed.data.numero_identificacion.trim(),
      created_by: usuario.id,
      updated_by: usuario.id,
    })
    .select("id")
    .single()

  if (error) return { error: mensajeError(error) }
  revalidar(data.id as string)
  return { success: true, id: data.id as string }
}

export async function actualizarEspecialista(
  id: string,
  input: EspecialistaInput
): Promise<DireccionamientoActionResult> {
  const acceso = await especialistaAccesible(id, true)
  if ("error" in acceso) return { error: acceso.error }

  const parsed = especialistaSchema.safeParse(input)
  if (!parsed.success) return { error: primerError(parsed.error) }

  const { error } = await createAdminClient()
    .from("especialistas")
    .update({
      ...parsed.data,
      numero_identificacion: parsed.data.numero_identificacion.trim(),
      updated_by: acceso.usuario.id,
    })
    .eq("id", id)

  if (error) return { error: mensajeError(error) }
  revalidar(id)
  return { success: true }
}

export async function cambiarEstadoEspecialista(
  id: string,
  estado: string
): Promise<DireccionamientoActionResult> {
  const acceso = await especialistaAccesible(id, true)
  if ("error" in acceso) return { error: acceso.error }
  if (!ESTADO_ESPECIALISTA_VALUES.includes(estado as (typeof ESTADO_ESPECIALISTA_VALUES)[number])) {
    return { error: "Estado inválido." }
  }

  const { error } = await createAdminClient()
    .from("especialistas")
    .update({ estado, updated_by: acceso.usuario.id })
    .eq("id", id)

  if (error) return { error: mensajeError(error) }
  revalidar(id)
  return { success: true }
}

// ============ contratos con aseguradores ============

export async function crearContrato(
  input: ContratoEspecialistaInput
): Promise<DireccionamientoActionResult> {
  const parsed = contratoEspecialistaSchema.safeParse(input)
  if (!parsed.success) return { error: primerError(parsed.error) }

  const acceso = await especialistaAccesible(
    parsed.data.especialista_id,
    true
  )
  if ("error" in acceso) return { error: acceso.error }

  const { data, error } = await createAdminClient()
    .from("contratos_especialistas")
    .insert({ ...parsed.data, created_by: acceso.usuario.id, updated_by: acceso.usuario.id })
    .select("id")
    .single()

  if (error) return { error: mensajeError(error) }
  revalidar(parsed.data.especialista_id)
  return { success: true, id: data.id as string }
}

export async function actualizarContrato(
  id: string,
  input: ContratoEspecialistaInput
): Promise<DireccionamientoActionResult> {
  const parsed = contratoEspecialistaSchema.safeParse(input)
  if (!parsed.success) return { error: primerError(parsed.error) }

  const contrato = await obtenerContrato(id)
  if (!contrato) return { error: "No se encontró el contrato." }
  if (contrato.especialista_id !== parsed.data.especialista_id) {
    return { error: "No se puede cambiar el especialista del contrato." }
  }

  const acceso = await especialistaAccesible(contrato.especialista_id, true)
  if ("error" in acceso) return { error: acceso.error }

  const { error } = await createAdminClient()
    .from("contratos_especialistas")
    .update({ ...parsed.data, updated_by: acceso.usuario.id })
    .eq("id", id)

  if (error) return { error: mensajeError(error) }
  revalidar(contrato.especialista_id)
  return { success: true }
}

// ============ servicios CUPS contratados ============

export async function crearServicioContratado(
  input: ServicioContratadoInput
): Promise<DireccionamientoActionResult> {
  const parsed = servicioContratadoSchema.safeParse(input)
  if (!parsed.success) return { error: primerError(parsed.error) }

  const contrato = await obtenerContrato(parsed.data.contrato_especialista_id)
  if (!contrato) return { error: "No se encontró el contrato." }
  const acceso = await especialistaAccesible(contrato.especialista_id, true)
  if ("error" in acceso) return { error: acceso.error }

  const derivados = await getCupsDerivados(parsed.data.cups_id)
  if (!derivados) return { error: "El servicio CUPS seleccionado no existe." }

  const { data, error } = await createAdminClient()
    .from("servicios_contratados_especialistas")
    .insert({
      ...parsed.data,
      agrupador: derivados.agrupador,
      especialidad: derivados.especialidad,
      created_by: acceso.usuario.id,
      updated_by: acceso.usuario.id,
    })
    .select("id")
    .single()

  if (error) return { error: mensajeError(error) }
  revalidar(contrato.especialista_id)
  return { success: true, id: data.id as string }
}

export async function actualizarServicioContratado(
  id: string,
  input: ServicioContratadoInput
): Promise<DireccionamientoActionResult> {
  const parsed = servicioContratadoSchema.safeParse(input)
  if (!parsed.success) return { error: primerError(parsed.error) }

  const servicio = await obtenerServicio(id)
  if (!servicio) return { error: "No se encontró el servicio contratado." }
  if (servicio.contrato_especialista_id !== parsed.data.contrato_especialista_id) {
    return { error: "No se puede cambiar el contrato del servicio." }
  }

  const contrato = await obtenerContrato(servicio.contrato_especialista_id)
  if (!contrato) return { error: "No se encontró el contrato." }
  const acceso = await especialistaAccesible(contrato.especialista_id, true)
  if ("error" in acceso) return { error: acceso.error }

  const derivados = await getCupsDerivados(parsed.data.cups_id)
  if (!derivados) return { error: "El servicio CUPS seleccionado no existe." }

  const { error } = await createAdminClient()
    .from("servicios_contratados_especialistas")
    .update({
      ...parsed.data,
      agrupador: derivados.agrupador,
      especialidad: derivados.especialidad,
      updated_by: acceso.usuario.id,
    })
    .eq("id", id)

  if (error) return { error: mensajeError(error) }
  revalidar(contrato.especialista_id)
  return { success: true }
}

// ============ asignación independiente de sedes ============

export async function crearAsignacionSede(
  input: AsignacionSedeInput
): Promise<DireccionamientoActionResult> {
  const parsed = asignacionSedeCrearSchema.safeParse(input)
  if (!parsed.success) return { error: primerError(parsed.error) }

  const acceso = await especialistaAccesible(parsed.data.especialista_id, true)
  if ("error" in acceso) return { error: acceso.error }

  const contrato = await obtenerContrato(parsed.data.contrato_especialista_id)
  if (!contrato || contrato.especialista_id !== parsed.data.especialista_id) {
    return { error: "El contrato no pertenece al especialista." }
  }
  const servicio = await obtenerServicio(parsed.data.servicio_contratado_id)
  if (!servicio || servicio.contrato_especialista_id !== contrato.id) {
    return { error: "El servicio no pertenece al contrato seleccionado." }
  }

  const sedeIds = [...new Set(parsed.data.sede_ids)]
  const errorSedes = await validarSedesParaAsignacion(acceso.usuario, sedeIds)
  if (errorSedes) return { error: errorSedes }

  const { error } = await createAdminClient()
    .from("sedes_servicios_especialistas")
    .insert(
      sedeIds.map((sede_id) => ({
        especialista_id: parsed.data.especialista_id,
        contrato_especialista_id: parsed.data.contrato_especialista_id,
        servicio_contratado_id: parsed.data.servicio_contratado_id,
        sede_id,
        tipo_red: parsed.data.tipo_red,
        observaciones: parsed.data.observaciones,
        created_by: acceso.usuario.id,
        updated_by: acceso.usuario.id,
      }))
    )

  if (error) return { error: mensajeError(error) }
  revalidar(parsed.data.especialista_id)
  return { success: true }
}

export async function actualizarAsignacionSede(
  id: string,
  input: AsignacionSedeInput
): Promise<DireccionamientoActionResult> {
  const parsed = asignacionSedeActualizarSchema.safeParse(input)
  if (!parsed.success) return { error: primerError(parsed.error) }

  const asignacion = await obtenerAsignacion(id)
  if (!asignacion) return { error: "No se encontró la asignación de sede." }
  if (
    asignacion.especialista_id !== parsed.data.especialista_id ||
    asignacion.contrato_especialista_id !== parsed.data.contrato_especialista_id ||
    asignacion.servicio_contratado_id !== parsed.data.servicio_contratado_id
  ) {
    return {
      error:
        "El contrato y el servicio CUPS de una asignación no se pueden cambiar.",
    }
  }
  if (!parsed.data.sede_ids.includes(asignacion.sede_id)) {
    return { error: "La sede original de la asignación no se puede quitar." }
  }

  const acceso = await especialistaAccesible(asignacion.especialista_id, true)
  if ("error" in acceso) return { error: acceso.error }

  const errorSedes = await validarSedesParaAsignacion(
    acceso.usuario,
    parsed.data.sede_ids
  )
  if (errorSedes) return { error: errorSedes }

  const comun = {
    especialista_id: asignacion.especialista_id,
    contrato_especialista_id: asignacion.contrato_especialista_id,
    servicio_contratado_id: asignacion.servicio_contratado_id,
    tipo_red: parsed.data.tipo_red,
    observaciones: parsed.data.observaciones,
    updated_by: acceso.usuario.id,
  }
  const sedesNuevas = parsed.data.sede_ids.filter(
    (sede_id) => sede_id !== asignacion.sede_id
  )

  const { error } = await createAdminClient()
    .from("sedes_servicios_especialistas")
    .upsert([
      {
        ...comun,
        id: asignacion.id,
        sede_id: asignacion.sede_id,
        created_by: asignacion.created_by,
      },
      ...sedesNuevas.map((sede_id) => ({
        ...comun,
        id: randomUUID(),
        sede_id,
        created_by: acceso.usuario.id,
      })),
    ])

  if (error) return { error: mensajeError(error) }
  revalidar(asignacion.especialista_id)
  return { success: true }
}

/**
 * Retira una asignación individual. No afecta a las demás relaciones del
 * especialista: la fila eliminada es únicamente la combinación
 * contrato + servicio + sede indicada.
 */
export async function retirarAsignacionSede(
  id: string
): Promise<DireccionamientoActionResult> {
  const asignacion = await obtenerAsignacion(id)
  if (!asignacion) return { error: "No se encontró la asignación de sede." }

  const acceso = await especialistaAccesible(asignacion.especialista_id, true)
  if ("error" in acceso) return { error: acceso.error }

  const sede = await obtenerSede(asignacion.sede_id)
  if (!sede) return { error: "La sede asignada no existe." }
  if (!(await puedeGestionarRegional(acceso.usuario, sede.regional))) {
    return { error: "No puedes gestionar sedes de esa regional." }
  }

  const { error } = await createAdminClient()
    .from("sedes_servicios_especialistas")
    .delete()
    .eq("id", id)

  if (error) return { error: mensajeError(error) }
  revalidar(asignacion.especialista_id)
  return { success: true }
}

// ============ novedades ============

export async function crearNovedad(
  input: NovedadInput
): Promise<DireccionamientoActionResult> {
  const parsed = novedadSchema.safeParse(input)
  if (!parsed.success) return { error: primerError(parsed.error) }

  const acceso = await especialistaAccesible(parsed.data.especialista_id, true)
  if ("error" in acceso) return { error: acceso.error }

  const admin = createAdminClient()
  const errorPadres = await verificarPadresNovedad(parsed.data)
  if (errorPadres) return { error: errorPadres }

  const { data, error } = await admin
    .from("novedades_direccionamiento")
    .insert({ ...parsed.data, created_by: acceso.usuario.id, updated_by: acceso.usuario.id })
    .select("id")
    .single()

  if (error) return { error: mensajeError(error) }
  revalidar(parsed.data.especialista_id)
  return { success: true, id: data.id as string }
}

export async function actualizarNovedad(
  id: string,
  input: NovedadInput
): Promise<DireccionamientoActionResult> {
  const parsed = novedadSchema.safeParse(input)
  if (!parsed.success) return { error: primerError(parsed.error) }

  const novedad = await obtenerNovedad(id)
  if (!novedad) return { error: "No se encontró la novedad." }
  if (novedad.especialista_id !== parsed.data.especialista_id) {
    return { error: "No se puede cambiar el especialista de la novedad." }
  }

  const acceso = await especialistaAccesible(novedad.especialista_id, true)
  if ("error" in acceso) return { error: acceso.error }

  const admin = createAdminClient()
  const errorPadres = await verificarPadresNovedad(parsed.data)
  if (errorPadres) return { error: errorPadres }

  const { error } = await admin
    .from("novedades_direccionamiento")
    .update({ ...parsed.data, updated_by: acceso.usuario.id })
    .eq("id", id)

  if (error) return { error: mensajeError(error) }
  revalidar(novedad.especialista_id)
  return { success: true }
}

export async function cambiarValidacionNovedad(
  id: string,
  estadoValidacion: string
): Promise<DireccionamientoActionResult> {
  if (
    !ESTADO_VALIDACION_VALUES.includes(
      estadoValidacion as (typeof ESTADO_VALIDACION_VALUES)[number]
    )
  ) {
    return { error: "Estado de validación inválido." }
  }

  const novedad = await obtenerNovedad(id)
  if (!novedad) return { error: "No se encontró la novedad." }
  const acceso = await especialistaAccesible(novedad.especialista_id, true)
  if ("error" in acceso) return { error: acceso.error }

  const { error } = await createAdminClient()
    .from("novedades_direccionamiento")
    .update({
      estado_validacion: estadoValidacion,
      updated_by: acceso.usuario.id,
    })
    .eq("id", id)

  if (error) return { error: mensajeError(error) }
  revalidar(novedad.especialista_id)
  return { success: true }
}

// ============ apoyo a formularios ============

export async function buscarCupsAction(
  termino: string
): Promise<{ success: true; resultados: CupsOpcion[] } | { error: string }> {
  await requireAccesoDireccionamiento()
  try {
    return { success: true, resultados: await buscarCups(termino) }
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "No se pudo buscar el CUPS.",
    }
  }
}

