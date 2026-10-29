import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { z } from "zod"
import { contratoSchema } from "@/lib/validations/contrato"
import { createAdminClient } from "@/lib/supabase/admin"
import { MODALIDAD_VALUES } from "@/lib/contratos/constantes"

function filaAObjeto(fila: any[]): Record<string, any> {
  // Mapeo basado en la plantilla (encabezados de fila 1)
  return {
    nombre: fila[0],
    asegurador_id: fila[1],
    numero_contrato: fila[2],
    regional_id: fila[3],
    ciudad: fila[4],
    modalidad: fila[5],
    responsable_id: fila[6],
    prorroga_automatica: fila[7],
    tiene_programas: fila[8],
    sede_ids_str: fila[9],
    programa_ids_str: fila[10],
    categoria_contrato_id: fila[11] || null,
    tipo_contrato_id: fila[12] || null,
    estado_legalizacion_id: fila[13] || null,
    estado_ejecucion_id: fila[14] || null,
    fecha_inicio: fila[15] || null,
    fecha_fin: fila[16] || null,
    periodicidad: fila[17] || null,
    poblacion_total: fila[18] || null,
    valor_total: fila[19] || null,
    valor_percapita_manual: fila[20] || null,
    url_ubicacion: fila[22] || null,
    notas: fila[21] || null,
  }
}

function parseBool(val: any): boolean {
  if (typeof val === "boolean") return val
  const s = String(val).trim().toLowerCase()
  return s === "sí" || s === "si" || s === "true" || s === "1"
}

function parseFechaExcel(val: any): string | undefined {
  if (!val) return undefined
  if (val instanceof Date) {
    const d = val as Date
    return `${String(d.getUTCFullYear()).padStart(4,"0")}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`
  }
  if (typeof val === "number") {
    // Excel serial number - convert (approximate)
    const d = new Date((val - 25569) * 86400 * 1000)
    return `${String(d.getFullYear()).padStart(4,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
  }
  const s = String(val).trim()
  // Si viene como dd/mm/aaaa, convertir
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  return s || undefined
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const archivo = formData.get("archivo") as File | null
    if (!archivo) {
      return NextResponse.json({ error: "No se envió ningún archivo" }, { status: 400 })
    }

    const arrayBuffer = await archivo.arrayBuffer()
    const wb = XLSX.read(arrayBuffer, { type: "buffer" })
    const wsContratos = wb.Sheets["Contratos"]
    if (!wsContratos) {
      return NextResponse.json({ error: "No se encontró la pestaña 'Contratos'" }, { status: 400 })
    }
    const datosExcel: any[][] = XLSX.utils.sheet_to_json(wsContratos, { header: 1 })

    if (datosExcel.length < 2) {
      return NextResponse.json({ error: "No hay datos en la plantilla" }, { status: 400 })
    }

    // Leer pestañas de relaciones
    const wsSedes = wb.Sheets["Contrato_Sedes"] ? XLSX.utils.sheet_to_json(wb.Sheets["Contrato_Sedes"], { header: 1 }) as any[][] : []
    const wsValores = wb.Sheets["Contrato_Valores"] ? XLSX.utils.sheet_to_json(wb.Sheets["Contrato_Valores"], { header: 1 }) as any[][] : []
    // Construir mapas por numero_contrato
    const mapaSedes: Record<string, string[]> = {}
    if (wsSedes.length > 1) {
      for (let i = 1; i < wsSedes.length; i++) {
        const fila = wsSedes[i]
        if (!fila || fila.length < 2) continue
        const num = String(fila[0] || "").trim()
        const sedeId = String(fila[1] || "").trim()
        if (!num || !sedeId) continue
        if (!mapaSedes[num]) mapaSedes[num] = []
        mapaSedes[num].push(sedeId)
      }
    }
    const mapaValores: Record<string, Array<{ regimen_id?: string; poblacion?: number; valor_total?: number; valor_percapita_manual?: number }>> = {}
    if (wsValores.length > 1) {
      for (let i = 1; i < wsValores.length; i++) {
        const fila = wsValores[i]
        if (!fila || fila.length < 2) continue
        const num = String(fila[0] || "").trim()
        if (!num) continue
        if (!mapaValores[num]) mapaValores[num] = []
        mapaValores[num].push({
          regimen_id: fila[1] ? String(fila[1]).trim() || undefined : undefined,
          poblacion: fila[2] ? Number(fila[2]) || undefined : undefined,
          valor_total: fila[3] ? Number(fila[3]) || undefined : undefined,
          valor_percapita_manual: fila[4] ? Number(fila[4]) || undefined : undefined,
        })
      }
    }

    const admin = createAdminClient()
    const resultados = {
      creados: 0,
      rechazados: 0,
      errores: [] as { fila: number; motivo: string; campos?: string[] }[],
      detalles: [] as { fila: number; numero_contrato?: string; creado: boolean; mensaje?: string }[],
    }

    // Procesar fila por fila (desde fila 2 en Excel)
    for (let i = 1; i < datosExcel.length; i++) {
      const filaExcel = datosExcel[i]
      const filaNum = i + 1 // número real en Excel (1-based, encabezado fila 1)
      if (!filaExcel || filaExcel.length === 0 || filaExcel.every((v) => v === null || v === undefined || String(v).trim() === "")) {
        // Fila vacía, ignorar
        continue
      }
      const raw = filaAObjeto(filaExcel)
      const numContrato = String(raw.numero_contrato || "").trim()

      // Convertir valores para zod
      const valoresPrelim = (mapaValores[numContrato] || []).map((v) => ({
        regimen_id: v.regimen_id || null,
        poblacion: v.poblacion ? Number(v.poblacion) || null : null,
        valor_total: v.valor_total ? Number(v.valor_total) || null : null,
        valor_percapita_manual: v.valor_percapita_manual ? Number(v.valor_percapita_manual) || null : null,
      }))

      const inputZod: any = {
        nombre: String(raw.nombre || "").trim(),
        asegurador_id: String(raw.asegurador_id || "").trim(),
        numero_contrato: numContrato,
        regional_id: String(raw.regional_id || "").trim(),
        ciudad: String(raw.ciudad || "").trim(),
        modalidad: String(raw.modalidad || "").trim() as any,
        responsable_id: String(raw.responsable_id || "").trim(),
        categoria_contrato_id: raw.categoria_contrato_id ? String(raw.categoria_contrato_id).trim() || null : null,
        tipo_contrato_id: raw.tipo_contrato_id ? String(raw.tipo_contrato_id).trim() || null : null,
        estado_legalizacion_id: raw.estado_legalizacion_id ? String(raw.estado_legalizacion_id).trim() || null : null,
        estado_ejecucion_id: raw.estado_ejecucion_id ? String(raw.estado_ejecucion_id).trim() || null : null,
        fecha_inicio: parseFechaExcel(raw.fecha_inicio) ?? null,
        fecha_fin: parseFechaExcel(raw.fecha_fin) ?? null,
        prorroga_automatica: parseBool(raw.prorroga_automatica),
        periodicidad: (String(raw.periodicidad || "").trim() || null) as any,
        tiene_programas: parseBool(raw.tiene_programas),
        notas: raw.notas ? String(raw.notas).trim() || null : null,
        poblacion_total: raw.poblacion_total ? Number(raw.poblacion_total) || null : null,
        valor_total: raw.valor_total ? Number(raw.valor_total) || null : null,
        valor_percapita_manual: raw.valor_percapita_manual ? Number(raw.valor_percapita_manual) || null : null,
        contrato_id: raw.contrato_id ? String(raw.contrato_id).trim() || null : null,
        tipo_documento: raw.tipo_documento ? String(raw.tipo_documento).trim() || null : null,
        numero_documento: raw.numero_documento ? String(raw.numero_documento).trim() || null : null,
        fecha_otorgamiento: parseFechaExcel(raw.fecha_otorgamiento) ?? null,
        archivo_url: raw.archivo_url ? String(raw.archivo_url).trim() || null : null,
        url_ubicacion: raw.url_ubicacion ? String(raw.url_ubicacion).trim() || null : null,
        resumen_cambios: raw.resumen_cambios ? String(raw.resumen_cambios).trim() || null : null,
        sede_ids: raw.sede_ids_str ? String(raw.sede_ids_str).split(";").map((s: string) => s.trim()).filter((s: string) => s) : [],
        programa_ids: raw.programa_ids_str ? String(raw.programa_ids_str).split(";").map((s: string) => s.trim()).filter((s: string) => s) : [],
        valores: valoresPrelim,
      }

      // Si tiene programas por pestaña pero no en la fila, usar mapa
      if (mapaSedes[numContrato] && mapaSedes[numContrato].length > 0) {
        inputZod.sede_ids = mapaSedes[numContrato]
      }

      // Validar zod
      const parsed = contratoSchema.safeParse(inputZod)
      if (!parsed.success) {
        const messages = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
        resultados.rechazados++
        resultados.errores.push({ fila: filaNum, motivo: messages })
        resultados.detalles.push({ fila: filaNum, numero_contrato: inputZod.numero_contrato, creado: false, mensaje: messages })
        continue
      }

      const datos = parsed.data
      // Validaciones adicionales de referencias en DB
      const erroresReferencia: string[] = []
      const camposErroneos: string[] = []

      // Asegurador
      const { data: asegurador } = await admin.from("aseguradores_eps").select("id, estado").eq("id", datos.asegurador_id).eq("estado", "activo").maybeSingle()
      if (!asegurador) { erroresReferencia.push("El asegurador no existe o no está activo"); camposErroneos.push("asegurador_id") }

      // Regional
      const { data: regional } = await admin.from("regionales").select("id, nombre, estado").eq("id", datos.regional_id).maybeSingle()
      if (!regional || regional.estado !== "activo") { erroresReferencia.push("La regional no existe o no está activa"); camposErroneos.push("regional_id") }

      // Responsable
      const { data: responsable } = await admin.from("catalogos_opciones").select("id, nombre").eq("dominio", "responsable").eq("activo", true).eq("id", datos.responsable_id).maybeSingle()
      if (!responsable) { erroresReferencia.push("El responsable no existe o no está activo"); camposErroneos.push("responsable_id") }

      // Sedes
      if (datos.sede_ids.length === 0) {
        erroresReferencia.push("Selecciona al menos una sede"); camposErroneos.push("sede_ids")
      } else {
        const { data: sedesData } = await admin.from("sedes").select("id, estado, regional").in("id", datos.sede_ids)
        const sedesEncontradas = (sedesData || []) as { id: string; estado: string; regional: string | null }[]
        if (sedesEncontradas.length !== datos.sede_ids.length) {
          erroresReferencia.push("Alguna sede seleccionada no existe"); camposErroneos.push("sede_ids")
        } else if (sedesEncontradas.some((s) => s.estado !== "activa")) {
          erroresReferencia.push("Todas las sedes deben estar activas"); camposErroneos.push("sede_ids")
        } else if (regional && sedesEncontradas.some((s) => (s.regional ?? "").trim().toLowerCase() !== regional.nombre.trim().toLowerCase())) {
          erroresReferencia.push("Las sedes deben pertenecer a la regional seleccionada"); camposErroneos.push("sede_ids")
        }
      }

      // Programas
      if (datos.tiene_programas && datos.programa_ids.length > 0) {
        const { data: programasData } = await admin.from("catalogos_opciones").select("id, dominio, activo").in("id", datos.programa_ids).eq("dominio", "programa")
        const programasEncontradas = (programasData || []) as { id: string; dominio: string; activo: boolean }[]
        if (programasEncontradas.length !== datos.programa_ids.length || programasEncontradas.some((p) => !p.activo)) {
          erroresReferencia.push("Algún programa no existe o no está activo"); camposErroneos.push("programa_ids")
        }
      }

      // Categoría, tipo, estados (opcional)
      for (const [campo, dominio, etiqueta] of [
        [datos.categoria_contrato_id, "categoria", "categoría"],
        [datos.tipo_contrato_id, "tipo", "tipo de contrato"],
        [datos.estado_legalizacion_id, "estado_legalizacion", "estado de legalización"],
        [datos.estado_ejecucion_id, "estado_ejecucion", "estado de ejecución"],
      ] as [string | null, string, string][]) {
        if (campo) {
          const { data: opc } = await admin.from("catalogos_opciones").select("id, activo, dominio").eq("id", campo).maybeSingle()
          if (!opc || opc.activo === false || opc.dominio !== dominio) {
            erroresReferencia.push(`El ${etiqueta} seleccionado no es válido`); camposErroneos.push(campo ? String(campo) : "")
          }
        }
      }

      // Duplicado de numero_contrato
      const { data: existente } = await admin.from("contratos").select("id").eq("numero_contrato", datos.numero_contrato).maybeSingle()
      if (existente) {
        erroresReferencia.push("Ya existe un contrato con ese número"); camposErroneos.push("numero_contrato")
      }

      if (erroresReferencia.length > 0) {
        resultados.rechazados++
        resultados.errores.push({ fila: filaNum, motivo: erroresReferencia.join("; "), campos: [...new Set(camposErroneos)] })
        resultados.detalles.push({ fila: filaNum, numero_contrato: datos.numero_contrato, creado: false, mensaje: erroresReferencia.join("; ") })
        continue
      }

      // Insertar contrato
      const { data: contratoInsertado, error: errorInsert } = await admin.from("contratos").insert({
        ...datos,
        sede_ids: undefined,
        programa_ids: undefined,
        valores: undefined,
        estado: "activo",
        // Nota: no tenemos created_by real del archivo; usar usuario anon por defecto o dejarlo vacío. Como la tabla puede requerirlo, verifico estructura.
      } as any).select("id").single()

      if (errorInsert || !contratoInsertado) {
        resultados.rechazados++
        resultados.errores.push({ fila: filaNum, motivo: errorInsert?.message || "Error al insertar contrato", campos: ["base"] })
        resultados.detalles.push({ fila: filaNum, numero_contrato: datos.numero_contrato, creado: false, mensaje: errorInsert?.message || "Error al insertar contrato" })
        continue
      }

      const contratoId = contratoInsertado.id

      // Insertar sedes
      const insertSedes = datos.sede_ids.map((sedeId: string) => ({ contrato_id: contratoId, sede_id: sedeId }))
      if (insertSedes.length > 0) {
        const { error: errorSedes } = await admin.from("contratos_sedes").insert(insertSedes)
        if (errorSedes) {
          resultados.rechazados++
          resultados.errores.push({ fila: filaNum, motivo: `Error en sedes: ${errorSedes.message}`, campos: ["sede_ids"] })
          resultados.detalles.push({ fila: filaNum, numero_contrato: datos.numero_contrato, creado: false, mensaje: `Error en sedes: ${errorSedes.message}` })
          continue
        }
      }

      // Insertar programas
      const programaIds = datos.tiene_programas ? datos.programa_ids : []
      if (programaIds.length > 0) {
        const insertProgramas = programaIds.map((opcionId: string) => ({ contrato_id: contratoId, opcion_id: opcionId }))
        const { error: errorProgramas } = await admin.from("contratos_programas").insert(insertProgramas)
        if (errorProgramas) {
          resultados.rechazados++
          resultados.errores.push({ fila: filaNum, motivo: `Error en programas: ${errorProgramas.message}`, campos: ["programa_ids"] })
          resultados.detalles.push({ fila: filaNum, numero_contrato: datos.numero_contrato, creado: false, mensaje: `Error en programas: ${errorProgramas.message}` })
          continue
        }
      }

      // Insertar valores
      if (datos.valores && datos.valores.length > 0) {
        const insertValores = datos.valores.map((v: any) => ({
          contrato_id: contratoId,
          regimen_id: v.regimen_id,
          poblacion: v.poblacion,
          valor_total: v.valor_total,
          valor_percapita_manual: v.valor_percapita_manual,
        }))
        const { error: errorValores } = await admin.from("contratos_valores").insert(insertValores)
        if (errorValores) {
          resultados.rechazados++
          resultados.errores.push({ fila: filaNum, motivo: `Error en valores: ${errorValores.message}`, campos: ["valores"] })
          resultados.detalles.push({ fila: filaNum, numero_contrato: datos.numero_contrato, creado: false, mensaje: `Error en valores: ${errorValores.message}` })
          continue
        }
      }

      resultados.creados++
      resultados.detalles.push({ fila: filaNum, numero_contrato: datos.numero_contrato, creado: true })
    }

    return NextResponse.json({
      creados: resultados.creados,
      rechazados: resultados.rechazados,
      errores: resultados.errores,
      detalles: resultados.detalles,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Error interno" }, { status: 500 })
  }
}
