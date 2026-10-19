"use server"

import { revalidatePath } from "next/cache"

import { requireSuperadmin } from "@/lib/auth/session"
import {
  mapearFila,
  normalizarNombre,
  type FilaImportacion,
} from "@/lib/poblaciones/importar"
import { createAdminClient } from "@/lib/supabase/admin"

export type PoblacionActionResult = { success: true } | { error: string }

export type ImportarPoblacionesResultado = {
  importadas: number
  actualizadas: number
  omitidas: { fila: number; motivo: string }[]
}

const POBLACIONES_PATH = "/poblaciones"

async function getUsuarioId() {
  const usuario = await requireSuperadmin()
  return usuario.id
}

export async function importarPoblaciones(
  filas: FilaImportacion[]
): Promise<ImportarPoblacionesResultado | { error: string }> {
  await requireSuperadmin()

  const admin = createAdminClient()

  const { data: sedes } = await admin
    .from("sedes")
    .select("id, nombre")

  const { data: aseguradores } = await admin
    .from("aseguradores_eps")
    .select("id, nombre_eps")

  const { data: regimenes } = await admin
    .from("regimenes")
    .select("id, nombre")

  if (!sedes || !aseguradores || !regimenes) {
    return { error: "No se pudieron cargar sedes, aseguradores o regímenes." }
  }

  const mapaSedes = new Map(
    sedes.map((s) => [normalizarNombre(s.nombre), s.id])
  )
  const mapaAseguradores = new Map(
    aseguradores.map((a) => [normalizarNombre(a.nombre_eps), a.id])
  )
  const mapaRegimenes = new Map(
    regimenes.map((r) => [normalizarNombre(r.nombre), r.id])
  )

  const resultado: ImportarPoblacionesResultado = {
    importadas: 0,
    actualizadas: 0,
    omitidas: [],
  }

  const usuarioId = await getUsuarioId()

  for (let i = 0; i < filas.length; i++) {
    const numeroFila = i + 2
    const poblacion = mapearFila(filas[i])

    if (!poblacion.sede) {
      resultado.omitidas.push({
        fila: numeroFila,
        motivo: "Falta el nombre de la sede",
      })
      continue
    }

    const sedeId = mapaSedes.get(normalizarNombre(poblacion.sede))
    if (!sedeId) {
      resultado.omitidas.push({
        fila: numeroFila,
        motivo: "Sede no encontrada",
      })
      continue
    }

    let aseguradorId: string | null = null
    if (poblacion.asegurador) {
      aseguradorId =
        mapaAseguradores.get(normalizarNombre(poblacion.asegurador)) ?? null
      if (!aseguradorId) {
        resultado.omitidas.push({
          fila: numeroFila,
          motivo: "Asegurador no encontrado",
        })
        continue
      }
    }

    let regimenId: string | null = null
    if (poblacion.regimen) {
      regimenId =
        mapaRegimenes.get(normalizarNombre(poblacion.regimen)) ?? null
      if (!regimenId) {
        resultado.omitidas.push({
          fila: numeroFila,
          motivo: "Régimen no encontrado",
        })
        continue
      }
    }

    if (
      poblacion.poblacion_activa == null &&
      poblacion.poblacion_pagada == null &&
      poblacion.poblacion_certificada == null
    ) {
      resultado.omitidas.push({
        fila: numeroFila,
        motivo: "Debe indicar al menos un valor de población",
      })
      continue
    }

    const payloadBase = {
      sede_id: sedeId,
      asegurador_eps_id: aseguradorId,
      regimen_id: regimenId,
      poblacion_activa: poblacion.poblacion_activa,
      poblacion_pagada: poblacion.poblacion_pagada,
      poblacion_certificada: poblacion.poblacion_certificada,
      fecha_actualizacion: poblacion.fecha_actualizacion,
      usuario_id: usuarioId,
    }

    let consultaExistente = admin
      .from("poblacion_aseguradora")
      .select("id")
      .eq("sede_id", sedeId)

    consultaExistente = aseguradorId
      ? consultaExistente.eq("asegurador_eps_id", aseguradorId)
      : consultaExistente.is("asegurador_eps_id", null)

    consultaExistente = regimenId
      ? consultaExistente.eq("regimen_id", regimenId)
      : consultaExistente.is("regimen_id", null)

    const { data: existente } = await consultaExistente.maybeSingle()

    if (existente) {
      const { error: updateError } = await admin
        .from("poblacion_aseguradora")
        .update(payloadBase)
        .eq("id", existente.id)

      if (updateError) {
        resultado.omitidas.push({
          fila: numeroFila,
          motivo: updateError.message,
        })
        continue
      }
      resultado.actualizadas++
    } else {
      const { error: insertError } = await admin
        .from("poblacion_aseguradora")
        .insert([payloadBase])

      if (insertError) {
        resultado.omitidas.push({
          fila: numeroFila,
          motivo: insertError.message,
        })
        continue
      }
      resultado.importadas++
    }
  }

  revalidatePath(POBLACIONES_PATH)
  return resultado
}
