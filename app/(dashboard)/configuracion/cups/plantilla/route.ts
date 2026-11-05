import * as XLSX from "xlsx"

import { requireSuperadmin } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"

const COLUMNAS_DATOS = [
  "codigo",
  "descripcion",
  "seccion",
  "version_resolucion",
  "fecha_inicio",
  "fecha_fin",
  "activo",
]

export async function GET() {
  await requireSuperadmin()

  const workbook = XLSX.utils.book_new()

  const hojaDatos = XLSX.utils.aoa_to_sheet([
    COLUMNAS_DATOS,
    [
      "000001",
      "Consulta médica general",
      "Consultas externas",
      "v1",
      "2024-01-01",
      "",
      "true",
    ],
  ])
  hojaDatos["!cols"] = [
    { wch: 12 },
    { wch: 40 },
    { wch: 30 },
    { wch: 20 },
    { wch: 16 },
    { wch: 16 },
    { wch: 10 },
  ]
  XLSX.utils.book_append_sheet(workbook, hojaDatos, "CUPS")

  const hojaInstrucciones = XLSX.utils.aoa_to_sheet([
    ["Instrucciones"],
    [
      "La hoja 'CUPS' es la que se importa. Reemplaza la fila de ejemplo por tus datos y no dejes filas vacías.",
    ],
    [
      "Columnas: codigo* (6 dígitos), descripcion*, seccion*, version_resolucion*, fecha_inicio* (YYYY-MM-DD), fecha_fin (opcional, YYYY-MM-DD), activo (true/false, opcional, por defecto true).",
    ],
    [
      "El código CUPS debe tener exactamente 6 dígitos numéricos.",
    ],
    [
      "La combinación de código + versión de resolución debe ser única.",
    ],
    [
      "Las celdas vacías en fecha_fin indican vigencia permanente.",
    ],
    [
      "Si un CUPS con el mismo código y versión ya existe, se actualizará con los nuevos datos.",
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
        'attachment; filename="plantilla-cups.xlsx"',
    },
  })
}
