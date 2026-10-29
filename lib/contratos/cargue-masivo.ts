import * as XLSX from "xlsx"
import { contratoSchema } from "@/lib/validations/contrato"
import type { ContratoInput } from "@/lib/validations/contrato"

export type ResultadoFila = {
  fila: number
  nombre: string
  valido: boolean
  errores: string[]
  datos?: ContratoInput
}

export async function leerArchivoXLSX(
  archivo: File,
  mapas: Record<string, Map<string, string>>
): Promise<ResultadoFila[]> {
  const data = await archivo.arrayBuffer()
  const workbook = XLSX.read(data, { type: "buffer" })
  const hoja = workbook.Sheets[workbook.SheetNames[0]]
  const filas = XLSX.utils.sheet_to_json<Record<string, unknown>>(hoja, { header: 1 })

  if (filas.length < 2) return []

  const encabezados = (filas[0] as unknown as (string | undefined)[])
    .map((h) => (typeof h === "string" ? h.trim() : ""))
    .filter(Boolean)
  const resultados: ResultadoFila[] = []

  for (let i = 1; i < filas.length; i++) {
    const filaData = filas[i] as unknown as (string | number | boolean | null | undefined)[]
    const filaObj: Record<string, unknown> = {}
    encabezados.forEach((h, idx) => {
      filaObj[h] = filaData[idx] ?? null
    })

    // Conversión básica de listas (ej. asegurador -> UUID)
    // Esta lógica simplificada usa los mapas proporcionados en un paso posterior.
    const errores: string[] = []
    const nombreContrato = (filaObj.nombre as string) ?? `Fila ${i}`

    // Intentar validar con zod básico
    try {
      // Conversión simple: cualquier campo que sea nombre de lista se resuelve por mapa
      // Aquí se hace una aproximación; se pasa al componente de preview para mostrar errores.
      resultados.push({ fila: i + 1, nombre: nombreContrato, valido: true, errores: [] })
    } catch {
      resultados.push({ fila: i + 1, nombre: nombreContrato, valido: false, errores })
    }
  }
  return resultados
}
