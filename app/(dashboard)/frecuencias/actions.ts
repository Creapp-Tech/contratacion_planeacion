"use server"

import { revalidatePath } from "next/cache"

import { requireSuperadmin } from "@/lib/auth/session"
import {
  mapearFila,
  normalizarNombre,
  normalizarTipoFrecuencia,
  type FilaImportacion,
} from "@/lib/frecuencias/importar"
import { getFrecuenciaEnCalculo } from "@/lib/frecuencias/queries"
import { tipoCalculaOcupacion } from "@/lib/frecuencias/tipos"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  frecuenciaSchema,
  frecuenciaServicioEditarSchema,
  type FrecuenciaInput,
  type FrecuenciaServicioEditarInput,
} from "@/lib/validations/frecuencia"

export type FrecuenciaActionResult = { success: true } | { error: string }

const FRECUENCIAS_PATH = "/frecuencias"

function mensajeError(error: { code?: string; message: string }) {
  if (error.code === "23505") {
    return "Ya existe una frecuencia con esa combinación de nota técnica, sede, régimen, asegurador y versión."
  }
  return error.message
}

export async function crearFrecuencia(
  input: FrecuenciaInput
): Promise<FrecuenciaActionResult> {
  await requireSuperadmin()

  const parsed = frecuenciaSchema.safeParse(input)
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    }
  }

  const {
    tipo_frecuencia,
    nombre_nota_tecnica,
    sede_id,
    regimen_id,
    asegurador_eps_id,
    version,
    servicios,
  } = parsed.data

  const supabase = createAdminClient()

  const { data: frecuencia, error } = await supabase
    .from("frecuencias")
    .insert([
      {
        tipo_frecuencia,
        nombre_nota_tecnica,
        sede_id,
        regimen_id,
        asegurador_eps_id,
        version,
      },
    ])
    .select("id")
    .single()

  if (error) return { error: mensajeError(error) }

  const { error: insertError } = await supabase
    .from("frecuencias_servicios")
    .insert(
      servicios.map((servicio) => ({
        frecuencia_id: frecuencia.id,
        servicio_id: servicio.servicio_id,
        frecuencia: servicio.frecuencia,
      }))
    )

  if (insertError) return { error: mensajeError(insertError) }

  revalidatePath(FRECUENCIAS_PATH)
  return { success: true }
}

export async function actualizarFrecuencia(
  id: string,
  input: FrecuenciaInput
): Promise<FrecuenciaActionResult> {
  await requireSuperadmin()

  const parsed = frecuenciaSchema.safeParse(input)
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    }
  }

  const {
    tipo_frecuencia,
    nombre_nota_tecnica,
    sede_id,
    regimen_id,
    asegurador_eps_id,
    version,
    servicios,
  } = parsed.data

  const supabase = createAdminClient()

  const { data: actual, error: actualError } = await supabase
    .from("frecuencias")
    .select("sede_id, tipo_frecuencia, usar_en_calculo")
    .eq("id", id)
    .maybeSingle()

  if (actualError) return { error: actualError.message }

  if (
    actual?.usar_en_calculo &&
    (actual.sede_id !== sede_id || actual.tipo_frecuencia !== tipo_frecuencia)
  ) {
    return {
      error:
        "Esta frecuencia se usa para el cálculo de ocupación. Desmárcala antes de cambiar la sede o el tipo.",
    }
  }

  const { error } = await supabase
    .from("frecuencias")
    .update({
      tipo_frecuencia,
      nombre_nota_tecnica,
      sede_id,
      regimen_id,
      asegurador_eps_id,
      version,
    })
    .eq("id", id)

  if (error) return { error: mensajeError(error) }

  const { error: deleteError } = await supabase
    .from("frecuencias_servicios")
    .delete()
    .eq("frecuencia_id", id)

  if (deleteError) return { error: deleteError.message }

  const { error: insertError } = await supabase
    .from("frecuencias_servicios")
    .insert(servicios.map((servicio) => ({ ...servicio, frecuencia_id: id })))

  if (insertError) return { error: mensajeError(insertError) }

  revalidatePath(FRECUENCIAS_PATH)
  revalidatePath(`${FRECUENCIAS_PATH}/${id}`)
  return { success: true }
}

export async function actualizarFrecuenciaServicio(
  id: string,
  input: FrecuenciaServicioEditarInput
): Promise<FrecuenciaActionResult> {
  await requireSuperadmin()

  const parsed = frecuenciaServicioEditarSchema.safeParse(input)
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    }
  }

  const { error } = await createAdminClient()
    .from("frecuencias_servicios")
    .update({ frecuencia: parsed.data.frecuencia })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath(FRECUENCIAS_PATH)
  return { success: true }
}

export async function eliminarFrecuenciaServicio(
  id: string
): Promise<FrecuenciaActionResult> {
  await requireSuperadmin()

  const { error } = await createAdminClient()
    .from("frecuencias_servicios")
    .delete()
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath(FRECUENCIAS_PATH)
  return { success: true }
}

export async function eliminarFrecuencia(
  id: string
): Promise<FrecuenciaActionResult> {
  await requireSuperadmin()

  const { error } = await createAdminClient()
    .from("frecuencias")
    .delete()
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath(FRECUENCIAS_PATH)
  return { success: true }
}

function revalidarCalculo(id: string) {
  revalidatePath(FRECUENCIAS_PATH)
  revalidatePath(`${FRECUENCIAS_PATH}/${id}`)
  revalidatePath("/capacidad-instalada")
}

function mensajeErrorCalculo(error: { code?: string; message: string }) {
  if (error.code === "23505") {
    return "Otra frecuencia de esa sede y tipo ya está marcada para el cálculo. Vuelve a intentarlo."
  }
  return error.message
}

export async function consultarReemplazoCalculo(
  id: string
): Promise<{ reemplazo: Awaited<ReturnType<typeof getFrecuenciaEnCalculo>> } | { error: string }> {
  await requireSuperadmin()

  const { data, error } = await createAdminClient()
    .from("frecuencias")
    .select("sede_id, tipo_frecuencia, activo")
    .eq("id", id)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return { error: "La frecuencia ya no existe." }
  if (!data.activo) return { error: "No puedes marcar una frecuencia inactiva." }
  if (!tipoCalculaOcupacion(data.tipo_frecuencia)) {
    return {
      error: "Este tipo de frecuencia no se usa en el cálculo de ocupación.",
    }
  }

  const reemplazo = await getFrecuenciaEnCalculo(
    data.sede_id,
    data.tipo_frecuencia,
    id
  )

  return { reemplazo }
}

export async function alternarFrecuenciaCalculo(
  id: string,
  marcar: boolean
): Promise<FrecuenciaActionResult> {
  await requireSuperadmin()

  const admin = createAdminClient()

  const { data: frecuencia, error } = await admin
    .from("frecuencias")
    .select("id, sede_id, tipo_frecuencia, activo")
    .eq("id", id)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!frecuencia) return { error: "La frecuencia ya no existe." }

  if (!marcar) {
    const { error: updateError } = await admin
      .from("frecuencias")
      .update({ usar_en_calculo: false })
      .eq("id", id)

    if (updateError) return { error: mensajeErrorCalculo(updateError) }

    revalidarCalculo(id)
    return { success: true }
  }

  if (!frecuencia.activo) {
    return { error: "No puedes marcar una frecuencia inactiva." }
  }

  if (!tipoCalculaOcupacion(frecuencia.tipo_frecuencia)) {
    return {
      error: "Este tipo de frecuencia no se usa en el cálculo de ocupación.",
    }
  }

  const { error: unmarkError } = await admin
    .from("frecuencias")
    .update({ usar_en_calculo: false })
    .eq("sede_id", frecuencia.sede_id)
    .eq("tipo_frecuencia", frecuencia.tipo_frecuencia)
    .eq("usar_en_calculo", true)
    .neq("id", id)

  if (unmarkError) return { error: mensajeErrorCalculo(unmarkError) }

  const { error: markError } = await admin
    .from("frecuencias")
    .update({ usar_en_calculo: true })
    .eq("id", id)

  if (markError) return { error: mensajeErrorCalculo(markError) }

  revalidarCalculo(id)
  return { success: true }
}

export type ImportarFrecuenciasResultado = {
  importadas: number
  actualizadas: number
  omitidas: { fila: number; motivo: string }[]
}

type GrupoFrecuencia = {
  tipo_frecuencia: string
  nombre_nota_tecnica: string
  sede_id: string
  regimen_id: string
  asegurador_eps_id: string
  version: string
  usar_en_calculo: boolean | null
  servicios: { servicio_id: string; frecuencia: number; fila: number }[]
}

export async function importarFrecuencias(
  filas: FilaImportacion[]
): Promise<ImportarFrecuenciasResultado | { error: string }> {
  await requireSuperadmin()

  const admin = createAdminClient()

  const [sedes, regimenes, aseguradores, servicios] = await Promise.all([
    admin.from("sedes").select("id, nombre"),
    admin.from("regimenes").select("id, nombre"),
    admin.from("aseguradores_eps").select("id, nombre_eps"),
    admin.from("servicios").select("id, nombre").eq("activo", true),
  ])

  if (sedes.error || regimenes.error || aseguradores.error || servicios.error) {
    return { error: "No se pudieron cargar catálogos de referencia." }
  }

  const mapaSedes = new Map(
    ((sedes.data ?? []) as { id: string; nombre: string }[]).map((s) => [
      normalizarNombre(s.nombre),
      s.id,
    ])
  )
  const mapaSedesPorId = new Map(
    ((sedes.data ?? []) as { id: string; nombre: string }[]).map((s) => [
      s.id,
      s.nombre,
    ])
  )
  const mapaRegimenes = new Map(
    ((regimenes.data ?? []) as { id: string; nombre: string }[]).map((r) => [
      normalizarNombre(r.nombre),
      r.id,
    ])
  )
  const mapaAseguradores = new Map(
    ((aseguradores.data ?? []) as { id: string; nombre_eps: string }[]).map(
      (a) => [normalizarNombre(a.nombre_eps), a.id]
    )
  )
  const mapaServicios = new Map(
    ((servicios.data ?? []) as { id: string; nombre: string }[]).map((s) => [
      normalizarNombre(s.nombre),
      s.id,
    ])
  )
  const mapaServiciosPorId = new Map(
    ((servicios.data ?? []) as { id: string; nombre: string }[]).map((s) => [
      s.id,
      s,
    ])
  )

  const resultado: ImportarFrecuenciasResultado = {
    importadas: 0,
    actualizadas: 0,
    omitidas: [],
  }

  const grupos = new Map<string, GrupoFrecuencia>()

  for (let i = 0; i < filas.length; i++) {
    const numeroFila = i + 2
    const frecuencia = mapearFila(filas[i])

    const tipoFrecuencia = normalizarTipoFrecuencia(frecuencia.tipo_frecuencia)
    if (!tipoFrecuencia) {
      resultado.omitidas.push({
        fila: numeroFila,
        motivo: `Tipo de frecuencia inválido: "${frecuencia.tipo_frecuencia}"`,
      })
      continue
    }

    if (
      frecuencia.usar_en_calculo === true &&
      !tipoCalculaOcupacion(tipoFrecuencia)
    ) {
      resultado.omitidas.push({
        fila: numeroFila,
        motivo: "Este tipo de frecuencia no se usa en el cálculo de ocupación",
      })
      continue
    }

    if (!frecuencia.nombre_nota_tecnica) {
      resultado.omitidas.push({
        fila: numeroFila,
        motivo: "Falta el nombre de la nota técnica",
      })
      continue
    }

    if (!frecuencia.sede) {
      resultado.omitidas.push({ fila: numeroFila, motivo: "Falta la sede" })
      continue
    }

    const sedeId = mapaSedes.get(normalizarNombre(frecuencia.sede))
    if (!sedeId) {
      resultado.omitidas.push({
        fila: numeroFila,
        motivo: `Sede no encontrada: "${frecuencia.sede}"`,
      })
      continue
    }

    if (!frecuencia.regimen) {
      resultado.omitidas.push({ fila: numeroFila, motivo: "Falta el régimen" })
      continue
    }

    const regimenId = mapaRegimenes.get(normalizarNombre(frecuencia.regimen))
    if (!regimenId) {
      resultado.omitidas.push({
        fila: numeroFila,
        motivo: `Régimen no encontrado: "${frecuencia.regimen}"`,
      })
      continue
    }

    if (!frecuencia.asegurador) {
      resultado.omitidas.push({ fila: numeroFila, motivo: "Falta el asegurador" })
      continue
    }

    const aseguradorId = mapaAseguradores.get(
      normalizarNombre(frecuencia.asegurador)
    )
    if (!aseguradorId) {
      resultado.omitidas.push({
        fila: numeroFila,
        motivo: `Asegurador no encontrado: "${frecuencia.asegurador}"`,
      })
      continue
    }

    if (!frecuencia.version) {
      resultado.omitidas.push({ fila: numeroFila, motivo: "Falta la versión" })
      continue
    }

    if (!frecuencia.servicio && !frecuencia.servicio_id) {
      resultado.omitidas.push({ fila: numeroFila, motivo: "Falta el servicio" })
      continue
    }

    let servicioId: string | undefined
    let etiquetaServicio = frecuencia.servicio

    if (frecuencia.servicio_id) {
      const encontrado = mapaServiciosPorId.get(frecuencia.servicio_id)
      if (!encontrado) {
        resultado.omitidas.push({
          fila: numeroFila,
          motivo: `Servicio no encontrado (id): "${frecuencia.servicio_id}"`,
        })
        continue
      }
      servicioId = encontrado.id
      etiquetaServicio = encontrado.nombre
    } else {
      servicioId = mapaServicios.get(normalizarNombre(frecuencia.servicio))
      if (!servicioId) {
        resultado.omitidas.push({
          fila: numeroFila,
          motivo: `Servicio no encontrado: "${frecuencia.servicio}"`,
        })
        continue
      }
    }

    if (frecuencia.frecuencia == null) {
      resultado.omitidas.push({
        fila: numeroFila,
        motivo: "Frecuencia inválida o ausente",
      })
      continue
    }

    const clave = [
      tipoFrecuencia,
      frecuencia.nombre_nota_tecnica,
      sedeId,
      regimenId,
      aseguradorId,
      frecuencia.version,
    ].join("|")

    let grupo = grupos.get(clave)
    if (!grupo) {
      grupo = {
        tipo_frecuencia: tipoFrecuencia,
        nombre_nota_tecnica: frecuencia.nombre_nota_tecnica,
        sede_id: sedeId,
        regimen_id: regimenId,
        asegurador_eps_id: aseguradorId,
        version: frecuencia.version,
        usar_en_calculo: frecuencia.usar_en_calculo,
        servicios: [],
      }
      grupos.set(clave, grupo)
    } else if (frecuencia.usar_en_calculo !== null) {
      if (grupo.usar_en_calculo === null) {
        grupo.usar_en_calculo = frecuencia.usar_en_calculo
      } else if (grupo.usar_en_calculo !== frecuencia.usar_en_calculo) {
        resultado.omitidas.push({
          fila: numeroFila,
          motivo:
            "El valor de usar_en_calculo no coincide con las demás filas de la misma frecuencia",
        })
        continue
      }
    }

    if (grupo.servicios.some((s) => s.servicio_id === servicioId)) {
      resultado.omitidas.push({
        fila: numeroFila,
        motivo: `Servicio duplicado en el mismo encabezado: "${etiquetaServicio || servicioId}"`,
      })
      continue
    }

    grupo.servicios.push({
      servicio_id: servicioId,
      frecuencia: frecuencia.frecuencia,
      fila: numeroFila,
    })
  }

  const marcadasPorSedeTipo = new Map<string, GrupoFrecuencia[]>()
  for (const grupo of grupos.values()) {
    if (grupo.usar_en_calculo !== true) continue
    const clave = `${grupo.sede_id}|${grupo.tipo_frecuencia}`
    const lista = marcadasPorSedeTipo.get(clave) ?? []
    lista.push(grupo)
    marcadasPorSedeTipo.set(clave, lista)
  }

  for (const lista of marcadasPorSedeTipo.values()) {
    if (lista.length <= 1) continue
    const sede = mapaSedesPorId.get(lista[0].sede_id) ?? "Sede desconocida"
    const detalle = lista
      .map((grupo) => `"${grupo.nombre_nota_tecnica}" v${grupo.version}`)
      .join(", ")
    return {
      error: `El archivo marca más de una frecuencia para el mismo tipo en la sede ${sede}: ${detalle}. Deja solo una marcada e inténtalo de nuevo.`,
    }
  }

  for (const grupo of grupos.values()) {
    const queryExistente = admin
      .from("frecuencias")
      .select("id")
      .eq("tipo_frecuencia", grupo.tipo_frecuencia)
      .eq("nombre_nota_tecnica", grupo.nombre_nota_tecnica)
      .eq("sede_id", grupo.sede_id)
      .eq("regimen_id", grupo.regimen_id)
      .eq("asegurador_eps_id", grupo.asegurador_eps_id)
      .eq("version", grupo.version)

    const { data: existente } = await queryExistente.maybeSingle()

    let frecuenciaId: string
    let esNueva = false

    if (existente) {
      frecuenciaId = existente.id as string
    } else {
      const { data: nueva, error: insertError } = await admin
        .from("frecuencias")
        .insert([
          {
            tipo_frecuencia: grupo.tipo_frecuencia,
            nombre_nota_tecnica: grupo.nombre_nota_tecnica,
            sede_id: grupo.sede_id,
            regimen_id: grupo.regimen_id,
            asegurador_eps_id: grupo.asegurador_eps_id,
            version: grupo.version,
          },
        ])
        .select("id")
        .single()

      if (insertError) {
        for (const servicio of grupo.servicios) {
          resultado.omitidas.push({
            fila: servicio.fila,
            motivo: insertError.message,
          })
        }
        continue
      }

      frecuenciaId = nueva.id as string
      esNueva = true
    }

    const { data: serviciosExistentes } = await admin
      .from("frecuencias_servicios")
      .select("id, servicio_id, frecuencia")
      .eq("frecuencia_id", frecuenciaId)

    const mapaServiciosExistentes = new Map(
      ((serviciosExistentes ?? []) as {
        id: string
        servicio_id: string
        frecuencia: number
      }[]).map((s) => [s.servicio_id, s])
    )

    let huboErrores = false

    for (const servicio of grupo.servicios) {
      const existenteServicio = mapaServiciosExistentes.get(servicio.servicio_id)

      if (existenteServicio) {
        if (existenteServicio.frecuencia !== servicio.frecuencia) {
          const { error: updateError } = await admin
            .from("frecuencias_servicios")
            .update({ frecuencia: servicio.frecuencia })
            .eq("id", existenteServicio.id)

          if (updateError) {
            resultado.omitidas.push({
              fila: servicio.fila,
              motivo: updateError.message,
            })
            huboErrores = true
          } else if (!esNueva) {
            resultado.actualizadas++
          }
        } else if (!esNueva) {
          resultado.actualizadas++
        }
      } else {
        const { error: insertServicioError } = await admin
          .from("frecuencias_servicios")
          .insert([
            {
              frecuencia_id: frecuenciaId,
              servicio_id: servicio.servicio_id,
              frecuencia: servicio.frecuencia,
            },
          ])

        if (insertServicioError) {
          resultado.omitidas.push({
            fila: servicio.fila,
            motivo: insertServicioError.message,
          })
          huboErrores = true
        } else if (!esNueva) {
          resultado.actualizadas++
        }
      }
    }

    if (grupo.usar_en_calculo !== null) {
      let flagError: { message: string } | null = null

      if (grupo.usar_en_calculo) {
        const { error: unmarkError } = await admin
          .from("frecuencias")
          .update({ usar_en_calculo: false })
          .eq("sede_id", grupo.sede_id)
          .eq("tipo_frecuencia", grupo.tipo_frecuencia)
          .eq("usar_en_calculo", true)
          .neq("id", frecuenciaId)

        if (unmarkError) {
          flagError = unmarkError
        } else {
          const { error: markError } = await admin
            .from("frecuencias")
            .update({ usar_en_calculo: true })
            .eq("id", frecuenciaId)
          flagError = markError
        }
      } else {
        const { error: unmarkError } = await admin
          .from("frecuencias")
          .update({ usar_en_calculo: false })
          .eq("id", frecuenciaId)
        flagError = unmarkError
      }

      if (flagError) {
        for (const servicio of grupo.servicios) {
          resultado.omitidas.push({
            fila: servicio.fila,
            motivo: `No se pudo actualizar usar_en_calculo: ${flagError.message}`,
          })
        }
        huboErrores = true
      }
    }

    if (esNueva && !huboErrores) {
      resultado.importadas++
    }
  }

  revalidatePath(FRECUENCIAS_PATH)
  revalidatePath("/capacidad-instalada")
  return resultado
}
