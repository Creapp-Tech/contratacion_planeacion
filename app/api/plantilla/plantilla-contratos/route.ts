import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(req: NextRequest) {
  const admin = createAdminClient()
  const wb = XLSX.utils.book_new()

  // Datos reales de listas desde Supabase
  const [aseguradoresRes, regionalesRes, responsablesRes, sedesRes, programasRes] = await Promise.all([
    admin.from("aseguradores_eps").select("id,nombre_eps").eq("estado","activo").order("nombre_eps"),
    admin.from("regionales").select("id,nombre").order("nombre"),
    admin.from("catalogos_opciones").select("id,nombre").eq("dominio","responsable").eq("activo",true).order("nombre"),
    admin.from("sedes").select("id,nombre").eq("estado","activa").order("nombre"),
    admin.from("catalogos_opciones").select("id,nombre").eq("dominio","programa").eq("activo",true).order("nombre"),
  ])

  const aseguradoresData = ((aseguradoresRes.data ?? []) as {id:string, nombre_eps:string}[]).map(r => [r.id, r.nombre_eps])
  const regionalesData = ((regionalesRes.data ?? []) as {id:string, nombre:string}[]).map(r => [r.id, r.nombre])
  const responsablesData = ((responsablesRes.data ?? []) as {id:string, nombre:string}[]).map(r => [r.id, r.nombre])
  const sedesData = ((sedesRes.data ?? []) as {id:string, nombre:string}[]).map(r => [r.id, r.nombre])
  const programasData = ((programasRes.data ?? []) as {id:string, nombre:string}[]).map(r => [r.id, r.nombre])

  // ID y nombre usados en el ejemplo de contrato
  const primerAseguradorId = aseguradoresData[0]?.[0] ?? ""
  const primerRegionalId = regionalesData[0]?.[0] ?? ""
  const primerResponsableId = responsablesData[0]?.[0] ?? ""
  const primeraSedeId = sedesData[0]?.[0] ?? ""
  const primeraSedeNombre = sedesData[0]?.[1] ?? "Sede Norte"

  // 1) Contratos
  const datosContratos = [
    ["nombre*", "asegurador_id*", "numero_contrato*", "regional_id*", "ciudad*", "modalidad*", "responsable_id*", "prorroga_automatica* (Sí/No)", "tiene_programas* (Sí/No)", "sede_ids* (separado por ;)", "programa_ids* (separado por ;)", "categoria_contrato_id", "tipo_contrato_id", "estado_legalizacion_id", "estado_ejecucion_id", "fecha_inicio (dd/mm/aaaa)", "fecha_fin (dd/mm/aaaa)", "periodicidad", "poblacion_total", "valor_total", "valor_percapita_manual", "notas"],
    ["Ejemplo contrato", primerAseguradorId, "EJEMPLO-1", primerRegionalId, "Bogotá", "capita", primerResponsableId, "Sí", "No", primeraSedeId, "", "", "", "", "", "01/01/2026", "31/12/2026", "mensual", 100, 5000, 50, "Notas ejemplo"]
  ]
  const wsContratos = XLSX.utils.aoa_to_sheet(datosContratos)
  wsContratos["!cols"] = [{ wch: 30 }, { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 30 }, { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(wb, wsContratos, "Contratos")

  // 2) Listas con datos reales (solo lectura)
  const listasReales = {
    Aseguradores: [["id", "nombre"], ...aseguradoresData],
    Regionales: [["id", "nombre"], ...regionalesData],
    Modalidades: [["valor"], ["capita"], ["especial"], ["evento"], ["integral"], ["pgp"]],
    Responsables: [["id", "nombre"], ...responsablesData],
    Sedes: [["id", "nombre"], ...sedesData],
    Periodos: [["valor"], ["mensual"], ["anual"]],
    Programas: [["id", "nombre"], ...programasData],
  }
  for (const [nombre, datos] of Object.entries(listasReales)) {
    const ws = XLSX.utils.aoa_to_sheet(datos)
    XLSX.utils.book_append_sheet(wb, ws, nombre)
  }

  // 3) Pestañas hijas para relaciones N:M (ligadas por numero_contrato) con IDs reales
  const sedeIdsEjemplo = sedesData.slice(0, 2).map((r) => String(r[0] || "").trim()).filter(Boolean)
  const contratoSedes = [["numero_contrato", "sede_id", "orden"], ...sedeIdsEjemplo.map((sid, i) => ["EJEMPLO-1", sid, i + 1])]
  const contratoValores = [["numero_contrato", "regimen_id", "poblacion", "valor_total", "valor_percapita_manual"], ["EJEMPLO-1", "", 100, 5000, 50]]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(contratoSedes), "Contrato_Sedes")
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(contratoValores), "Contrato_Valores")

  // 4) Instrucciones
  const instrucciones = [
    ["INSTRUCCIONES"],
    ["- Completa la pestaña 'Contratos' con los datos (usando valores exactos de las pestañas de listas)."],
    ["- Obligatorios marcados con *. Fechas: dd/mm/aaaa. Booleanos: Sí / No."],
    ["- Sedes y valores: usa las pestañas 'Contrato_Sedes' y 'Contrato_Valores' ligadas por numero_contrato."],
    ["- Las pestañas de listas (Aseguradores, Regionales, etc.) son de solo lectura."],
    ["- Guarda el archivo como .xlsx antes de subirlo."],
  ]
  const wsInstr = XLSX.utils.aoa_to_sheet(instrucciones)
  XLSX.utils.book_append_sheet(wb, wsInstr, "Instrucciones")

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=plantilla_contratos.xlsx",
    },
  })
}