import * as XLSX from "xlsx"

import { requireSuperadmin } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"

const COLUMNAS_DATOS = [
  "tipo_frecuencia",
  "nombre_nota_tecnica",
  "sede",
  "regimen",
  "asegurador",
  "version",
  "servicio",
  "frecuencia",
]

export async function GET() {
  await requireSuperadmin()

  const admin = createAdminClient()

  const [sedesRes, aseguradoresRes, regimenesRes, serviciosRes] =
    await Promise.all([
      admin.from("sedes").select("nombre").order("nombre", { ascending: true }),
      admin
        .from("aseguradores_eps")
        .select("nombre_eps")
        .order("nombre_eps", { ascending: true }),
      admin
        .from("regimenes")
        .select("nombre")
        .order("nombre", { ascending: true }),
      admin
        .from("servicios")
        .select("nombre")
        .eq("activo", true)
        .order("nombre", { ascending: true }),
    ])

  if (sedesRes.error) throw sedesRes.error
  if (aseguradoresRes.error) throw aseguradoresRes.error
  if (regimenesRes.error) throw regimenesRes.error
  if (serviciosRes.error) throw serviciosRes.error

  const workbook = XLSX.utils.book_new()

  const hojaDatos = XLSX.utils.aoa_to_sheet([
    COLUMNAS_DATOS,
    [
      "nota_tecnica_viva",
      "Ejemplo de nota técnica",
      "SEDE DE EJEMPLO",
      "Contributivo",
      "ASEGURADOR DE EJEMPLO",
      "v1",
      "SERVICIO DE EJEMPLO",
      "1,5",
    ],
  ])
  hojaDatos["!cols"] = [
    { wch: 22 },
    { wch: 32 },
    { wch: 32 },
    { wch: 20 },
    { wch: 32 },
    { wch: 12 },
    { wch: 32 },
    { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(workbook, hojaDatos, "Frecuencias")

  const hojaSedes = XLSX.utils.aoa_to_sheet([
    ["sede"],
    ...((sedesRes.data ?? []) as { nombre: string }[]).map((sede) => [
      sede.nombre,
    ]),
  ])
  hojaSedes["!cols"] = [{ wch: 40 }]
  XLSX.utils.book_append_sheet(workbook, hojaSedes, "Sedes")

  const hojaRegimenes = XLSX.utils.aoa_to_sheet([
    ["regimen"],
    ...((regimenesRes.data ?? []) as { nombre: string }[]).map((regimen) => [
      regimen.nombre,
    ]),
  ])
  hojaRegimenes["!cols"] = [{ wch: 24 }]
  XLSX.utils.book_append_sheet(workbook, hojaRegimenes, "Regimenes")

  const hojaAseguradores = XLSX.utils.aoa_to_sheet([
    ["asegurador"],
    ...((aseguradoresRes.data ?? []) as { nombre_eps: string }[]).map((eps) => [
      eps.nombre_eps,
    ]),
  ])
  hojaAseguradores["!cols"] = [{ wch: 40 }]
  XLSX.utils.book_append_sheet(workbook, hojaAseguradores, "Aseguradores")

  const hojaServicios = XLSX.utils.aoa_to_sheet([
    ["servicio"],
    ...((serviciosRes.data ?? []) as { nombre: string }[]).map((servicio) => [
      servicio.nombre,
    ]),
  ])
  hojaServicios["!cols"] = [{ wch: 40 }]
  XLSX.utils.book_append_sheet(workbook, hojaServicios, "Servicios")

  const hojaInstrucciones = XLSX.utils.aoa_to_sheet([
    ["Instrucciones"],
    [
      "La hoja 'Frecuencias' es la que se importa. Reemplaza la fila de ejemplo por tus datos.",
    ],
    [
      "Columnas: tipo_frecuencia, nombre_nota_tecnica, sede, regimen, asegurador, version, servicio, frecuencia.",
    ],
    [
      "tipo_frecuencia válidos: nota_tecnica_viva, ejecucion_servicios, asegurador.",
    ],
    [
      "Las hojas 'Sedes', 'Regimenes', 'Aseguradores' y 'Servicios' son informativas: copia sus nombres exactos para que coincidan en la importación.",
    ],
    [
      "El separador decimal es la coma (,). Ejemplo: 1,5. También se acepta punto (1.5).",
    ],
    [
      "La misma combinación de tipo, nota técnica, sede, régimen, asegurador y versión agrupa los servicios en una sola frecuencia.",
    ],
    [
      "Si un servicio ya existe en esa frecuencia se actualiza; si no, se agrega.",
    ],
    [
      "Las celdas con 'null', 'N/A', '-' o 'sin dato' se toman como vacío. Sede, régimen, asegurador, versión y servicio son obligatorios.",
    ],
  ])
  hojaInstrucciones["!cols"] = [{ wch: 120 }]
  XLSX.utils.book_append_sheet(workbook, hojaInstrucciones, "Instrucciones")

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="plantilla-frecuencias.xlsx"',
    },
  })
}
