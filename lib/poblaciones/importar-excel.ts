import * as XLSX from "xlsx"

import {
  normalizarEncabezado,
  type FilaImportacion,
} from "@/lib/poblaciones/importar"

// Nombres (normalizados) de hojas que son informativas y no contienen datos.
const HOJAS_REFERENCIA = new Set([
  "sedes",
  "sede",
  "aseguradores",
  "asegurador",
  "eps",
  "regimenes",
  "regimen",
])

// Nombres (normalizados) preferidos para la hoja de datos.
const HOJAS_DATOS = [
  "poblacion",
  "poblaciones",
  "datos",
  "data",
  "poblacion_aseguradora",
]

function elegirHojaDatos(nombres: string[]): string | undefined {
  const normalizados = nombres.map((nombre) => ({
    original: nombre,
    normalizado: normalizarEncabezado(nombre),
  }))

  for (const candidato of HOJAS_DATOS) {
    const encontrada = normalizados.find(
      (hoja) => hoja.normalizado === candidato
    )
    if (encontrada) return encontrada.original
  }

  const sinReferencia = normalizados.find(
    (hoja) => !HOJAS_REFERENCIA.has(hoja.normalizado)
  )
  if (sinReferencia) return sinReferencia.original

  return nombres[0]
}

export function parseExcel(data: ArrayBuffer): FilaImportacion[] {
  const workbook = XLSX.read(data, { type: "array" })
  const hoja = elegirHojaDatos(workbook.SheetNames)
  if (!hoja) return []

  const worksheet = workbook.Sheets[hoja]
  const matriz = XLSX.utils.sheet_to_json<string[]>(worksheet, {
    header: 1,
    blankrows: false,
    defval: "",
    raw: false,
  }) as string[][]

  if (matriz.length === 0) return []

  const encabezados = matriz[0].map((valor) =>
    normalizarEncabezado(String(valor ?? ""))
  )

  return matriz.slice(1).flatMap((valores) => {
    if (valores.every((valor) => String(valor ?? "").trim() === "")) return []

    const registro: FilaImportacion = {}
    encabezados.forEach((encabezado, index) => {
      registro[encabezado] = String(valores[index] ?? "").trim()
    })
    return [registro]
  })
}
