"use server"

import { revalidatePath } from "next/cache"

import {
  alcanceContratos,
  requireAccesoContratacion,
} from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  contratoSchema,
  type ContratoInput,
} from "@/lib/validations/contrato"

export type ContratoActionResult = { success: true } | { error: string }

export type DuplicarContratoResult =
  | { success: true; id: string }
  | { error: string }

const CONTRATOS_PATH = "/contratos"
const HISTORIAL_PATH = "/historial"
const UNIQUE_VIOLATION = "23505"
const FOREIGN_KEY_VIOLATION = "23503"
const NOT_FOUND = "P0002"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type SupabaseError = {
  code?: string
  message: string
  details?: string | null
}

function mensajeError(error: SupabaseError) {
  if (error.code === NOT_FOUND) {
    return "El contrato ya no existe"
  }
  if (error.code === UNIQUE_VIOLATION) {
    if (error.details?.includes("numero_contrato")) {
      return "Ya existe un contrato con ese número"
    }
    return "Hay datos duplicados en las relaciones del contrato"
  }
  if (error.code === FOREIGN_KEY_VIOLATION) {
    return "Alguno de los datos relacionados ya no está disponible"
  }
  return error.message
}

function limpiarOpcional(value: string | null) {
  const limpio = value?.trim()
  return limpio ? limpio : null
}

async function responsableValido(responsableId: string): Promise<boolean> {
  const { data, error } = await createAdminClient()
    .from("catalogos_opciones")
    .select("id")
    .eq("dominio", "responsable")
    .eq("activo", true)
    .eq("id", responsableId)
    .maybeSingle()

  if (error || !data) return false

  return true
}

async function validarReferencias(
  datos: ContratoInput
): Promise<string | null> {
  const admin = createAdminClient()

  const { data: asegurador, error: errorAsegurador } = await admin
    .from("aseguradores_eps")
    .select("id")
    .eq("id", datos.asegurador_id)
    .eq("estado", "activo")
    .maybeSingle()

  if (errorAsegurador) throw errorAsegurador
  if (!asegurador) return "El asegurador seleccionado no está disponible"

  const { data: regional, error: errorRegional } = await admin
    .from("regionales")
    .select("id, nombre")
    .eq("id", datos.regional_id)
    .maybeSingle()

  if (errorRegional) throw errorRegional
  if (!regional) return "La regional seleccionada no está disponible"

  const sedeIds = [...new Set(datos.sede_ids)]
  if (sedeIds.length === 0) return "Selecciona al menos una sede"

  const { data: sedes, error: errorSedes } = await admin
    .from("sedes")
    .select("id, regional, estado")
    .in("id", sedeIds)

  if (errorSedes) throw errorSedes

  const sedesEncontradas = (sedes ?? []) as {
    id: string
    regional: string | null
    estado: string
  }[]

  if (sedesEncontradas.length !== sedeIds.length) {
    return "Alguna de las sedes seleccionadas no existe"
  }

  if (sedesEncontradas.some((sede) => sede.estado !== "activa")) {
    return "Todas las sedes deben estar activas"
  }

  const regionalNombre = (regional as { nombre: string }).nombre
    .trim()
    .toLowerCase()

  if (
    sedesEncontradas.some(
      (sede) => (sede.regional ?? "").trim().toLowerCase() !== regionalNombre
    )
  ) {
    return "Todas las sedes deben pertenecer a la regional del contrato"
  }

  const opcionesEsperadas: {
    id: string
    dominio: string
    etiqueta: string
  }[] = []

  if (datos.categoria_contrato_id) {
    opcionesEsperadas.push({
      id: datos.categoria_contrato_id,
      dominio: "categoria",
      etiqueta: "categoría",
    })
  }
  if (datos.tipo_contrato_id) {
    opcionesEsperadas.push({
      id: datos.tipo_contrato_id,
      dominio: "tipo_contrato",
      etiqueta: "tipo de contrato",
    })
  }
  if (datos.estado_legalizacion_id) {
    opcionesEsperadas.push({
      id: datos.estado_legalizacion_id,
      dominio: "estado_legalizacion",
      etiqueta: "estado de legalización",
    })
  }
  if (datos.estado_ejecucion_id) {
    opcionesEsperadas.push({
      id: datos.estado_ejecucion_id,
      dominio: "estado_ejecucion",
      etiqueta: "estado de ejecución",
    })
  }
  if (datos.tiene_programas) {
    for (const programaId of datos.programa_ids) {
      opcionesEsperadas.push({
        id: programaId,
        dominio: "programa",
        etiqueta: "programa",
      })
    }
  }

  const opcionIds = [...new Set(opcionesEsperadas.map((opcion) => opcion.id))]

  if (opcionIds.length > 0) {
    const { data: opciones, error: errorOpciones } = await admin
      .from("catalogos_opciones")
      .select("id, dominio, activo")
      .in("id", opcionIds)

    if (errorOpciones) throw errorOpciones

    const porId = new Map(
      ((opciones ?? []) as {
        id: string
        dominio: string
        activo: boolean
      }[]).map((opcion) => [opcion.id, opcion])
    )

    for (const esperada of opcionesEsperadas) {
      const encontrada = porId.get(esperada.id)
      if (
        !encontrada ||
        !encontrada.activo ||
        encontrada.dominio !== esperada.dominio
      ) {
        return `La ${esperada.etiqueta} seleccionada no está disponible`
      }
    }
  }

  const regimenIds = [
    ...new Set(
      datos.valores
        .map((valor) => valor.regimen_id)
        .filter((regimenId): regimenId is string => Boolean(regimenId))
    ),
  ]

  if (regimenIds.length > 0) {
    const { data: regimenes, error: errorRegimenes } = await admin
      .from("regimenes")
      .select("id")
      .in("id", regimenIds)

    if (errorRegimenes) throw errorRegimenes
    if ((regimenes ?? []).length !== regimenIds.length) {
      return "Alguno de los regímenes seleccionados no existe"
    }
  }

  return null
}

function prepararContrato(input: ContratoInput) {
  const poblacionTotal = input.valores.length
    ? input.valores.reduce((total, valor) => total + (valor.poblacion ?? 0), 0)
    : input.poblacion_total

  const valorTotal = input.valores.length
    ? input.valores.reduce((total, valor) => total + (valor.valor_total ?? 0), 0)
    : input.valor_total

  return {
    nombre: input.nombre,
    asegurador_id: input.asegurador_id,
    numero_contrato: input.numero_contrato,
    regional_id: input.regional_id,
    ciudad: input.ciudad,
    modalidad: input.modalidad,
    responsable_id: input.responsable_id,
    categoria_contrato_id: input.categoria_contrato_id,
    tipo_contrato_id: input.tipo_contrato_id,
    estado_legalizacion_id: input.estado_legalizacion_id,
    estado_ejecucion_id: input.estado_ejecucion_id,
    fecha_inicio: input.fecha_inicio,
    fecha_fin: input.fecha_fin,
    prorroga_automatica: input.prorroga_automatica,
    periodicidad: input.periodicidad,
    poblacion_total: poblacionTotal,
    valor_total: valorTotal,
    valor_percapita_manual: input.valor_percapita_manual,
    tiene_programas: input.tiene_programas && input.programa_ids.length > 0,
    url_ubicacion: limpiarOpcional(input.url_ubicacion),
    notas: limpiarOpcional(input.notas),
  }
}

async function guardarRelaciones(
  contratoId: string,
  input: ContratoInput
): Promise<string | null> {
  const admin = createAdminClient()

  const { error: errorSedes } = await admin.from("contratos_sedes").insert(
    input.sede_ids.map((sedeId) => ({
      contrato_id: contratoId,
      sede_id: sedeId,
    }))
  )

  if (errorSedes) return mensajeError(errorSedes)

  const programaIds = input.tiene_programas ? input.programa_ids : []
  if (programaIds.length > 0) {
    const { error: errorProgramas } = await admin
      .from("contratos_programas")
      .insert(
        programaIds.map((opcionId) => ({
          contrato_id: contratoId,
          opcion_id: opcionId,
        }))
      )
    if (errorProgramas) return mensajeError(errorProgramas)
  }

  if (input.valores.length > 0) {
    const { error: errorValores } = await admin
      .from("contratos_valores")
      .insert(
        input.valores.map((valor) => ({
          contrato_id: contratoId,
          regimen_id: valor.regimen_id,
          poblacion: valor.poblacion,
          valor_total: valor.valor_total,
          valor_percapita_manual: valor.valor_percapita_manual,
        }))
      )
    if (errorValores) return mensajeError(errorValores)
  }

  return null
}

export async function crearContrato(
  input: ContratoInput
): Promise<ContratoActionResult> {
  const usuario = await requireAccesoContratacion()
  const alcance = alcanceContratos(usuario)

  const parsed = contratoSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const datos = { ...parsed.data }

  if (!alcance.verTodo) {
    if (!alcance.regionalId) {
      return { error: "Tu usuario no tiene una regional asignada" }
    }
    datos.regional_id = alcance.regionalId
  }

  if (!(await responsableValido(datos.responsable_id))) {
    return { error: "El responsable seleccionado no existe o no está activo" }
  }

  let errorReferencias: string | null
  try {
    errorReferencias = await validarReferencias(datos)
  } catch {
    return { error: "No se pudieron validar los datos del contrato" }
  }

  if (errorReferencias) return { error: errorReferencias }

  const fila = prepararContrato(datos)

  const { data, error } = await createAdminClient()
    .from("contratos")
    .insert([
      {
        ...fila,
        created_by: usuario.id,
      },
    ])
    .select("id")
    .single()

  if (error) return { error: mensajeError(error) }

  const contratoId = (data as { id: string }).id
  const errorRelaciones = await guardarRelaciones(contratoId, datos)
  if (errorRelaciones) {
    await createAdminClient().from("contratos").delete().eq("id", contratoId)
    return { error: errorRelaciones }
  }

  revalidatePath(CONTRATOS_PATH, "layout")
  revalidatePath(HISTORIAL_PATH, "layout")
  return { success: true }
}

export async function actualizarContrato(
  id: string,
  input: ContratoInput
): Promise<ContratoActionResult> {
  if (!UUID_RE.test(id)) return { error: "El contrato no existe" }

  const usuario = await requireAccesoContratacion()
  const alcance = alcanceContratos(usuario)

  const parsed = contratoSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const admin = createAdminClient()
  const { data: actual, error: errorActual } = await admin
    .from("contratos")
    .select("id, regional_id")
    .eq("id", id)
    .maybeSingle()

  if (errorActual) return { error: errorActual.message }
  if (!actual) return { error: "El contrato no existe" }

  const regionalActual = (actual as { regional_id: string }).regional_id

  if (!alcance.verTodo && regionalActual !== alcance.regionalId) {
    return { error: "Solo puedes gestionar contratos de tu regional" }
  }

  const datos = { ...parsed.data }

  if (!alcance.verTodo) {
    if (!alcance.regionalId) {
      return { error: "Tu usuario no tiene una regional asignada" }
    }
    datos.regional_id = alcance.regionalId
  }

  if (!(await responsableValido(datos.responsable_id))) {
    return { error: "El responsable seleccionado no existe o no está activo" }
  }

  let errorReferencias: string | null
  try {
    errorReferencias = await validarReferencias(datos)
  } catch {
    return { error: "No se pudieron validar los datos del contrato" }
  }

  if (errorReferencias) return { error: errorReferencias }

  const fila = prepararContrato(datos)

  const { error } = await admin.rpc("actualizar_contrato_completo", {
    p_id: id,
    p_datos: fila,
    p_sede_ids: datos.sede_ids,
    p_programa_ids: datos.tiene_programas ? datos.programa_ids : [],
    p_valores: datos.valores,
  })

  if (error) return { error: mensajeError(error) }

  revalidatePath(CONTRATOS_PATH, "layout")
  revalidatePath(HISTORIAL_PATH, "layout")
  return { success: true }
}

export async function duplicarContrato(
  id: string
): Promise<DuplicarContratoResult> {
  if (!UUID_RE.test(id)) return { error: "El contrato no existe" }

  const usuario = await requireAccesoContratacion()
  const alcance = alcanceContratos(usuario)

  const admin = createAdminClient()
  const { data: actual, error: errorActual } = await admin
    .from("contratos")
    .select("id, regional_id")
    .eq("id", id)
    .maybeSingle()

  if (errorActual) return { error: errorActual.message }
  if (!actual) return { error: "El contrato no existe" }

  const regionalActual = (actual as { regional_id: string }).regional_id

  if (!alcance.verTodo && regionalActual !== alcance.regionalId) {
    return { error: "Solo puedes duplicar contratos de tu regional" }
  }

  const { data, error } = await admin.rpc("duplicar_contrato", {
    p_id: id,
    p_created_by: usuario.id,
  })

  if (error) return { error: mensajeError(error) }

  revalidatePath(CONTRATOS_PATH, "layout")
  revalidatePath(HISTORIAL_PATH, "layout")
  return { success: true, id: data as string }
}

export async function eliminarContrato(
  id: string
): Promise<ContratoActionResult> {
  if (!UUID_RE.test(id)) return { error: "El contrato no existe" }

  const usuario = await requireAccesoContratacion()
  const alcance = alcanceContratos(usuario)

  const admin = createAdminClient()
  const { data: actual, error: errorActual } = await admin
    .from("contratos")
    .select("id, regional_id")
    .eq("id", id)
    .maybeSingle()

  if (errorActual) return { error: errorActual.message }
  if (!actual) return { error: "El contrato no existe" }

  const regionalActual = (actual as { regional_id: string }).regional_id

  if (!alcance.verTodo && regionalActual !== alcance.regionalId) {
    return { error: "Solo puedes gestionar contratos de tu regional" }
  }

  const { error } = await admin
    .from("contratos")
    .update({ estado: "inactivo" })
    .eq("id", id)

  if (error) return { error: mensajeError(error) }

  revalidatePath(CONTRATOS_PATH, "layout")
  revalidatePath(HISTORIAL_PATH, "layout")
  return { success: true }
}

export type CrearDocumentoResult =
  | { success: true; documentoId: string }
  | { error: string }

export async function crearDocumentoContrato(
  contratoId: string,
  input: ContratoInput,
  documentoMeta: {
    tipo_documento: 'primigenio' | 'modificatorio' | 'otro_si' | 'anexo'
    numero_documento: string
    fecha_otorgamiento: string | null
    archivo_url: string
    resumen_cambios: string | null
  }
): Promise<CrearDocumentoResult> {
  if (!UUID_RE.test(contratoId)) return { error: "El contrato no existe" }
  const usuario = await requireAccesoContratacion()
  const alcance = alcanceContratos(usuario)

  // Validar acceso al contrato base
  const admin = createAdminClient()
  const { data: contratoBase, error: errorContrato } = await admin
    .from("contratos")
    .select("id, regional_id, valor_total")
    .eq("id", contratoId)
    .maybeSingle()
  if (errorContrato) return { error: errorContrato.message }
  if (!contratoBase) return { error: "El contrato no existe" }
  const regionalContr = (contratoBase as { regional_id: string }).regional_id
  if (!alcance.verTodo && regionalContr !== alcance.regionalId) {
    return { error: "Solo puedes gestionar contratos de tu regional" }
  }

  const parsed = contratoSchema.safeParse({ ...input, contrato_id: contratoId })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  // Verificar que hay un archivo_url válido (OneDrive pública)
  const archivoUrl = documentoMeta.archivo_url?.trim()
  if (!archivoUrl || !archivoUrl.startsWith("http")) {
    return { error: "Debes proporcionar una URL válida del archivo (OneDrive)" }
  }

  const datos = parsed.data

  const fechaOtorg =
    documentoMeta.fecha_otorgamiento ?? datos.fecha_inicio ?? null

  if (!documentoMeta.tipo_documento) {
    return { error: "Selecciona el tipo de documento" }
  }
  if (!documentoMeta.numero_documento?.trim()) {
    return { error: "Ingresa el número del documento" }
  }

  const camposAfectados: string[] = []
  const base = contratoBase as unknown as {
    valor_total: number | null
    fecha_fin: string | null
    poblacion_total: number | null
  }
  if (base.valor_total !== datos.valor_total) camposAfectados.push("valor_total")
  if (base.fecha_fin !== datos.fecha_fin) camposAfectados.push("fecha_fin")
  if (base.poblacion_total !== datos.poblacion_total)
    camposAfectados.push("poblacion_total")

  try {
    // Obtener el número de versión más alto
    const { data: versionActual } = await admin
      .from("contrato_documentos")
      .select("numero_version")
      .eq("contrato_id", contratoId)
      .order("numero_version", { ascending: false })
      .limit(1)

    const maxVersion =
      versionActual && versionActual.length > 0
        ? (versionActual[0] as { numero_version: number }).numero_version
        : 0
    const nuevoNumeroVersion = maxVersion + 1

    // Marcar como no vigente al documento vigente anterior
    const vigenteActual = await admin
      .from("contrato_documentos")
      .select("id")
      .eq("contrato_id", contratoId)
      .eq("es_vigente", true)
      .maybeSingle()

    if (vigenteActual?.data) {
      const { error: errVigente } = await admin
        .from("contrato_documentos")
        .update({ es_vigente: false })
        .eq("id", (vigenteActual.data as { id: string }).id)
      if (errVigente)
        return { error: "Error al actualizar el documento vigente anterior" }
    }

    // Insertar el nuevo documento
    const { data: docData, error: docError } = await admin
      .from("contrato_documentos")
      .insert({
        contrato_id: contratoId,
        tipo_documento: documentoMeta.tipo_documento,
        numero_documento: documentoMeta.numero_documento.trim(),
        fecha_otorgamiento: fechaOtorg,
        archivo_url: archivoUrl,
        resumen_cambios: documentoMeta.resumen_cambios?.trim() ?? null,
        campos_afectados: JSON.stringify(camposAfectados),
        es_vigente: true,
        numero_version: nuevoNumeroVersion,
        created_by: usuario.id,
      })
      .select("id")
      .single()

    if (docError) return { error: mensajeError(docError) }
    const documentoId = (docData as { id: string }).id

    // Actualizar el contrato con los nuevos valores del documento
    const filaContrato = prepararContrato(datos)
    const { error: errorActualizacion } = await admin.rpc(
      "actualizar_contrato_completo",
      {
        p_id: contratoId,
        p_datos: filaContrato,
        p_sede_ids: datos.sede_ids,
        p_programa_ids: datos.tiene_programas ? datos.programa_ids : [],
        p_valores: datos.valores,
      }
    )

    if (errorActualizacion) {
      return {
        error: mensajeError({
          message: errorActualizacion.message,
          code: errorActualizacion.code,
        }),
      }
    }

    revalidatePath(CONTRATOS_PATH, "layout")
    revalidatePath(`/contratos/${contratoId}`, "layout")
    return { success: true, documentoId }
  } catch (e: any) {
    return { error: e?.message ?? "Error al crear el documento" }
  }
}
