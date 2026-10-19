import * as XLSX from "xlsx"

import { requireSuperadmin } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"

const COLUMNAS_DATOS = [
  "sede",
  "asegurador",
  "regimen",
  "poblacion_activa",
  "poblacion_pagada",
  "poblacion_certificada",
  "fecha_actualizacion",
]

export async function GET() {
  await requireSuperadmin()

  const admin = createAdminClient()

  const [sedesRes, aseguradoresRes, regimenesRes] = await Promise.all([
    admin.from("sedes").select("nombre").order("nombre", { ascending: true }),
    admin
      .from("aseguradores_eps")
      .select("nombre_eps")
      .order("nombre_eps", { ascending: true }),
    admin.from("regimenes").select("nombre").order("nombre", { ascending: true }),
  ])

  if (sedesRes.error) throw sedesRes.error
  if (aseguradoresRes.error) throw aseguradoresRes.error
  if (regimenesRes.error) throw regimenesRes.error

  const workbook = XLSX.utils.book_new()

  const hojaDatos = XLSX.utils.aoa_to_sheet([
    COLUMNAS_DATOS,
    [
      "SEDE DE EJEMPLO",
      "ASEGURADOR DE EJEMPLO",
      "Contributivo",
      0,
      0,
      0,
      new Date().toISOString().slice(0, 10),
    ],
  ])
  hojaDatos["!cols"] = [
    { wch: 28 },
    { wch: 28 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
  ]
  XLSX.utils.book_append_sheet(workbook, hojaDatos, "Poblacion")

  const hojaSedes = XLSX.utils.aoa_to_sheet([
    ["nombre"],
    ...((sedesRes.data ?? []) as { nombre: string }[]).map((sede) => [
      sede.nombre,
    ]),
  ])
  hojaSedes["!cols"] = [{ wch: 40 }]
  XLSX.utils.book_append_sheet(workbook, hojaSedes, "Sedes")

  const hojaAseguradores = XLSX.utils.aoa_to_sheet([
    ["nombre_eps"],
    ...((aseguradoresRes.data ?? []) as { nombre_eps: string }[]).map((eps) => [
      eps.nombre_eps,
    ]),
  ])
  hojaAseguradores["!cols"] = [{ wch: 40 }]
  XLSX.utils.book_append_sheet(workbook, hojaAseguradores, "Aseguradores")

  const hojaRegimenes = XLSX.utils.aoa_to_sheet([
    ["nombre"],
    ...((regimenesRes.data ?? []) as { nombre: string }[]).map((regimen) => [
      regimen.nombre,
    ]),
  ])
  hojaRegimenes["!cols"] = [{ wch: 24 }]
  XLSX.utils.book_append_sheet(workbook, hojaRegimenes, "Regimenes")

  const hojaInstrucciones = XLSX.utils.aoa_to_sheet([
    ["Instrucciones"],
    [
      "La hoja 'Poblacion' es la que se importa. Reemplaza la fila de ejemplo por tus datos y no dejes filas vacías.",
    ],
    [
      "Columnas: sede, asegurador, regimen, poblacion_activa, poblacion_pagada, poblacion_certificada, fecha_actualizacion (AAAA-MM-DD).",
    ],
    [
      "Las hojas 'Sedes', 'Aseguradores' y 'Regimenes' son informativas: usa sus nombres exactos para que coincidan.",
    ],
    [
      "Puedes dejar en blanco asegurador, regimen, poblacion_activa, poblacion_pagada y poblacion_certificada; se guardarán como vacío. Las celdas con 'null', 'N/A', '-' o 'sin dato' también se toman como vacío. La sede y la fecha son obligatorias.",
    ],
  ])
  hojaInstrucciones["!cols"] = [{ wch: 110 }]
  XLSX.utils.book_append_sheet(workbook, hojaInstrucciones, "Instrucciones")

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="plantilla-poblacion.xlsx"',
    },
  })
}
