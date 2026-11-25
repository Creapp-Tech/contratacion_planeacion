"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import {
  alcanceDelUsuario,
  requireAccesoPrestadoresContratos,
  requireEditorPrestadoresContratos,
  type CurrentUsuario,
} from "@/lib/auth/session"
import { RUTA } from "@/lib/aseguradores-contratos/constantes"
import { puedeEditarServicioAsegurador } from "@/lib/aseguradores-contratos/permisos"
import {
  getServicioParaPermisos,
  regionalesDelContrato,
} from "@/lib/aseguradores-contratos/queries"
import {
  claveCups,
  mapearFila,
  type FilaImportacion,
} from "@/lib/aseguradores-contratos/importar"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  editarCmeSchema,
  servicioCupsSchema,
  type ServicioCupsInput,
} from "@/lib/validations/aseguradores-contratos"

export type AccionServicioResultado =
  | { success: true; id: string }
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
  const usuario = await requireEditorPrestadoresContratos()

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
  const usuario = await requireEditorPrestadoresContratos()

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
      updated_by: usuario.id,
    })
    .eq("id", id)

  if (error) return { error: mensajeError(error) }
  revalidar()
  return { success: true, id }
}

export async function actualizarCmeServicio(
  id: string,
  valor: string | number
): Promise<AccionServicioResultado> {
  const usuario = await requireEditorPrestadoresContratos()

  const registro = await getServicioParaPermisos(id)
  if (!registro) return { error: "No se encontró el servicio CUPS." }
  if (!(await puedeEditar(usuario, registro.contrato_id, registro.created_by))) {
    return { error: "No tienes permiso para editar este servicio CUPS." }
  }

  const parseado = editarCmeSchema.safeParse({ id, cme_contratado: valor })
  if (!parseado.success) return { error: primerError(parseado.error) }

  const { error } = await createAdminClient()
    .from("servicios_cups_aseguradores")
    .update({
      cme_contratado: parseado.data.cme_contratado,
      updated_by: usuario.id,
    })
    .eq("id", id)

  if (error) return { error: mensajeError(error) }
  revalidar()
  return { success: true, id }
}

export async function eliminarServicioCups(
  id: string
): Promise<AccionServicioResultado> {
  const usuario = await requireEditorPrestadoresContratos()
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

export type ImportarServiciosCupsResultado = {
  creados: number
  rechazados: { fila: number; motivo: string }[]
}

type RegistroImportado = {
  fila: number
  values: {
    asegurador_id: string
    contrato_id: string
    cups_asegurador: string
    cups_id: string
    frecuencia_uso_contratada: number | null
    cme_contratado: number | null
  }
}

type FilaRechazada = { fila: number; motivo: string }

const MAX_FILAS_IMPORTACION = 5000
const TAMANO_LOTE = 200

async function indiceCupsHomologos(
  codigos: string[]
): Promise<Map<string, string>> {
  const indice = new Map<string, string>()
  const admin = createAdminClient()

  for (let i = 0; i < codigos.length; i += 100) {
    const lote = Array.from(new Set(codigos.slice(i, i + 100)))
    const { data, error } = await admin
      .from("cups")
      .select("id,codigo,activo")
      .in("codigo", lote)
      .order("activo", { ascending: false })
    if (error) throw error

    for (const fila of (data ?? []) as {
      id: string
      codigo: string
    }[]) {
      const codigo = fila.codigo.trim().toLowerCase()
      if (!indice.has(codigo)) indice.set(codigo, fila.id)
    }
  }

  return indice
}

async function clavesCupsDelContrato(contratoId: string): Promise<Set<string>> {
  const claves = new Set<string>()
  const admin = createAdminClient()
  const tamano = 1000

  for (let desde = 0; ; desde += tamano) {
    const { data, error } = await admin
      .from("servicios_cups_aseguradores")
      .select("cups_asegurador")
      .eq("contrato_id", contratoId)
      .order("created_at", { ascending: true })
      .range(desde, desde + tamano - 1)
    if (error) throw error

    const filas = (data ?? []) as { cups_asegurador: string }[]
    for (const fila of filas) claves.add(claveCups(fila.cups_asegurador))
    if (filas.length < tamano) break
  }

  return claves
}

async function insertarRegistros(
  registros: RegistroImportado[],
  rechazados: FilaRechazada[],
  usuarioId: string
): Promise<number> {
  const admin = createAdminClient()
  let creados = 0

  for (let i = 0; i < registros.length; i += TAMANO_LOTE) {
    const lote = registros.slice(i, i + TAMANO_LOTE)
    const payload = lote.map((registro) => ({
      ...registro.values,
      created_by: usuarioId,
      updated_by: usuarioId,
    }))

    const { error } = await admin
      .from("servicios_cups_aseguradores")
      .insert(payload)

    if (!error) {
      creados += lote.length
      continue
    }
    if (error.code !== "23505") throw new Error(mensajeError(error))

    // Si el lote falla por duplicados, se inserta fila por fila para aislarlos.
    for (const registro of lote) {
      const { error: errorFila } = await admin
        .from("servicios_cups_aseguradores")
        .insert({
          ...registro.values,
          created_by: usuarioId,
          updated_by: usuarioId,
        })
      if (errorFila) {
        if (errorFila.code !== "23505") {
          throw new Error(mensajeError(errorFila))
        }
        rechazados.push({
          fila: registro.fila,
          motivo: mensajeError(errorFila),
        })
      } else {
        creados++
      }
    }
  }

  return creados
}

export async function importarServiciosCups(
  aseguradorId: string,
  contratoId: string,
  filas: FilaImportacion[]
): Promise<ImportarServiciosCupsResultado | { error: string }> {
  const usuario = await requireEditorPrestadoresContratos()

  const uuid = z.string().uuid()
  if (
    !uuid.safeParse(aseguradorId).success ||
    !uuid.safeParse(contratoId).success
  ) {
    return { error: "Selecciona un asegurador y un contrato válidos." }
  }
  if (!Array.isArray(filas) || filas.length === 0) {
    return { error: "El archivo no contiene filas de datos." }
  }
  if (filas.length > MAX_FILAS_IMPORTACION) {
    return {
      error: `El archivo supera el máximo de ${MAX_FILAS_IMPORTACION} filas.`,
    }
  }

  const asegurador = await aseguradorDelContrato(contratoId)
  if (!asegurador) return { error: "No se encontró el contrato seleccionado." }
  if (asegurador !== aseguradorId) {
    return { error: "El contrato seleccionado no pertenece al asegurador indicado." }
  }
  if (!(await puedeEditar(usuario, contratoId))) {
    return { error: "No tienes permiso para gestionar este contrato." }
  }

  const mapeadas = filas.map(mapearFila)
  const codigos = mapeadas
    .map((fila) => fila.cups_homologo)
    .filter((codigo): codigo is string => Boolean(codigo))

  let indice: Map<string, string>
  let existentes: Set<string>
  try {
    ;[indice, existentes] = await Promise.all([
      indiceCupsHomologos(codigos),
      clavesCupsDelContrato(contratoId),
    ])
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo consultar el catálogo CUPS o el contrato.",
    }
  }

  const rechazados: FilaRechazada[] = []
  const vistos = new Set<string>()
  const registros: RegistroImportado[] = []

  mapeadas.forEach((fila, index) => {
    const numeroFila = index + 2

    if (!fila.cups_asegurador) {
      rechazados.push({ fila: numeroFila, motivo: "Falta el CUPS asegurador" })
      return
    }
    if (!fila.cups_homologo) {
      rechazados.push({ fila: numeroFila, motivo: "Falta el CUPS homologado" })
      return
    }

    const cupsId = indice.get(fila.cups_homologo.trim().toLowerCase())
    if (!cupsId) {
      rechazados.push({
        fila: numeroFila,
        motivo: "El CUPS homologado no existe en el catálogo",
      })
      return
    }

    const parseado = servicioCupsSchema.safeParse({
      asegurador_id: aseguradorId,
      contrato_id: contratoId,
      cups_asegurador: fila.cups_asegurador,
      cups_id: cupsId,
      frecuencia_uso_contratada: fila.frecuencia_uso_contratada,
      cme_contratado: fila.cme_contratado,
    })
    if (!parseado.success) {
      rechazados.push({ fila: numeroFila, motivo: primerError(parseado.error) })
      return
    }

    const clave = claveCups(parseado.data.cups_asegurador)
    if (vistos.has(clave) || existentes.has(clave)) {
      rechazados.push({
        fila: numeroFila,
        motivo: "Ya existe un servicio con ese CUPS asegurador en el contrato",
      })
      return
    }
    vistos.add(clave)

    registros.push({
      fila: numeroFila,
      values: {
        asegurador_id: parseado.data.asegurador_id,
        contrato_id: parseado.data.contrato_id,
        cups_asegurador: parseado.data.cups_asegurador,
        cups_id: parseado.data.cups_id as string,
        frecuencia_uso_contratada: parseado.data.frecuencia_uso_contratada,
        cme_contratado: parseado.data.cme_contratado,
      },
    })
  })

  if (registros.length === 0) return { creados: 0, rechazados }

  let creados: number
  try {
    creados = await insertarRegistros(registros, rechazados, usuario.id)
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudieron guardar los servicios CUPS.",
    }
  }
  revalidar()
  return { creados, rechazados }
}

/** Expuesto para el panel: la lectura usa el mismo guard que PrestadoresContratos. */
export async function verificarAcceso(): Promise<void> {
  await requireAccesoPrestadoresContratos()
}
