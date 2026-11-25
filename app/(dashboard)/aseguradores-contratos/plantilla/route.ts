import * as XLSX from "xlsx"

import { requireEditorPrestadoresContratos } from "@/lib/auth/session"

const COLUMNAS_DATOS = [
  "cups_asegurador",
  "cups_homologo",
  "frecuencia_uso_contratada",
  "cme_contratado",
]

export async function GET() {
  await requireEditorPrestadoresContratos()

  const workbook = XLSX.utils.book_new()

  const hojaDatos = XLSX.utils.aoa_to_sheet([COLUMNAS_DATOS])
  hojaDatos["!cols"] = [
    { wch: 32 },
    { wch: 18 },
    { wch: 26 },
    { wch: 18 },
  ]
  XLSX.utils.book_append_sheet(workbook, hojaDatos, "Servicios_CUPS")

  const hojaInstrucciones = XLSX.utils.aoa_to_sheet([
    ["Instrucciones para la carga masiva de servicios CUPS"],
    [
      "1. Selecciona el asegurador y el contrato en la pantalla antes de cargar el archivo. Todas las filas pertenecen a ese contrato.",
    ],
    [
      "2. En la hoja 'Servicios_CUPS' escribe una fila por servicio. No dejes filas vacías ni cambies los nombres de las columnas.",
    ],
    [
      "3. cups_asegurador* y cups_homologo* son obligatorios. cups_homologo es el código del CUPS homologado del catálogo oficial (6 dígitos).",
    ],
    [
      "4. frecuencia_uso_contratada y cme_contratado son opcionales; déjalos vacíos si no aplican. Usa coma o punto decimal (ej. 1.555,55 o 1555.55) y no separadores de miles.",
    ],
    [
      "5. No se sobreescriben registros: si el cups_asegurador ya existe en el contrato, la fila se omite y se reporta en el resultado.",
    ],
    ["Ejemplo: CONSULTA GENERAL | 010101 | 1.55555555 | 125000.00"],
  ])
  hojaInstrucciones["!cols"] = [{ wch: 140 }]
  XLSX.utils.book_append_sheet(workbook, hojaInstrucciones, "Instrucciones")

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="plantilla-servicios-cups-aseguradores.xlsx"',
    },
  })
}
