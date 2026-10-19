export type FilaImportacion = Record<string, string>

const TOKENS_VACIOS = new Set([
  "",
  "null",
  "nil",
  "none",
  "n/a",
  "na",
  "n.a.",
  "n.a",
  "-",
  "--",
  "sin dato",
  "sin datos",
  "sin asignar",
])

export function esValorVacio(value: string | undefined | null) {
  if (value === undefined || value === null) return true
  const normalizado = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
  return TOKENS_VACIOS.has(normalizado)
}

export type FrecuenciaImportada = {
  tipo_frecuencia: string
  nombre_nota_tecnica: string
  sede: string
  regimen: string
  asegurador: string
  version: string
  servicio: string
  frecuencia: number | null
}

export const ALIAS_COLUMNAS: Record<string, keyof FrecuenciaImportada> = {
  tipo_frecuencia: "tipo_frecuencia",
  tipo: "tipo_frecuencia",
  tipo_de_frecuencia: "tipo_frecuencia",
  origen: "tipo_frecuencia",
  nombre_nota_tecnica: "nombre_nota_tecnica",
  nota_tecnica: "nombre_nota_tecnica",
  nota: "nombre_nota_tecnica",
  nombre: "nombre_nota_tecnica",
  nombre_nota: "nombre_nota_tecnica",
  sede: "sede",
  sedes: "sede",
  nombre_sede: "sede",
  sede_nombre: "sede",
  regimen: "regimen",
  regimenes: "regimen",
  regimen_afiliacion: "regimen",
  regimen_de_afiliacion: "regimen",
  tipo_regimen: "regimen",
  asegurador: "asegurador",
  aseguradora: "asegurador",
  asegurador_eps: "asegurador",
  eps: "asegurador",
  version: "version",
  version_de_frecuencia: "version",
  servicio: "servicio",
  servicios: "servicio",
  servicio_nombre: "servicio",
  nombre_servicio: "servicio",
  frecuencia: "frecuencia",
  valor: "frecuencia",
  valor_frecuencia: "frecuencia",
}

export function normalizarEncabezado(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

export function normalizarNombre(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .replace(
      /\b(e\.?p\.?s\.?|epss?|eps|\bs\.?a\.?s\b|\bs\.?a\.?u\b|\bs\.?a\.?l\b|\bs\.?a\b|\bs\.?a\.?e\.?c\b|ltda|limitada|fondo de pensiones)\b/g,
      ""
    )
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^servicio occidental de salud\s*-?\s*sos$/g, "servicio occidental de salud - sos")
    .replace(/^sos eps$/g, "servicio occidental de salud - sos")
    .replace(/^sos$/g, "servicio occidental de salud - sos")
    .replace(/^servicio occidental de salud eps - sos$/g, "servicio occidental de salud - sos")
}

const MAPA_TIPOS: Record<string, string> = {
  nota_tecnica_viva: "nota_tecnica_viva",
  "nota tecnica viva": "nota_tecnica_viva",
  viva: "nota_tecnica_viva",
  ejecucion_servicios: "ejecucion_servicios",
  "ejecucion de servicios": "ejecucion_servicios",
  ejecucion: "ejecucion_servicios",
  servicios: "ejecucion_servicios",
  asegurador: "asegurador",
  aseguradores: "asegurador",
  eps: "asegurador",
}

export function normalizarTipoFrecuencia(value: string | undefined): string | null {
  if (esValorVacio(value)) return null
  const normalizado = (value as string)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
  return MAPA_TIPOS[normalizado] ?? MAPA_TIPOS[normalizado.replace(/_/g, " ")] ?? null
}

export function parseCsv(texto: string): FilaImportacion[] {
  const filas: string[][] = []
  let fila: string[] = []
  let campo = ""
  let entreComillas = false

  for (let i = 0; i < texto.length; i++) {
    const char = texto[i]

    if (entreComillas) {
      if (char === '"') {
        if (texto[i + 1] === '"') {
          campo += '"'
          i++
        } else {
          entreComillas = false
        }
      } else {
        campo += char
      }
      continue
    }

    if (char === '"') {
      entreComillas = true
    } else if (char === ",") {
      fila.push(campo)
      campo = ""
    } else if (char === "\n") {
      fila.push(campo)
      filas.push(fila)
      fila = []
      campo = ""
    } else if (char === "\r") {
      continue
    } else {
      campo += char
    }
  }

  if (campo.length > 0 || fila.length > 0) {
    fila.push(campo)
    filas.push(fila)
  }

  if (filas.length === 0) return []

  const encabezados = filas[0].map((valor) => normalizarEncabezado(valor))

  return filas.slice(1).flatMap((valores) => {
    if (valores.every((valor) => valor.trim() === "")) return []

    const registro: FilaImportacion = {}
    encabezados.forEach((encabezado, index) => {
      registro[encabezado] = (valores[index] ?? "").trim()
    })
    return [registro]
  })
}

export function mapearFila(fila: FilaImportacion): FrecuenciaImportada {
  const resultado: Partial<Record<keyof FrecuenciaImportada, string>> = {}

  for (const [columna, valor] of Object.entries(fila)) {
    const campo = ALIAS_COLUMNAS[columna]
    if (campo && !resultado[campo]) {
      resultado[campo] = valor
    }
  }

  const texto = (value: string | undefined) => {
    if (esValorVacio(value)) return null
    return (value as string).trim()
  }

  const decimal = (value: string | undefined): number | null => {
    if (esValorVacio(value)) return null
    const n = Number((value as string).trim().replace(",", "."))
    if (Number.isNaN(n) || n < 0) return null
    return n
  }

  return {
    tipo_frecuencia: texto(resultado.tipo_frecuencia) ?? "",
    nombre_nota_tecnica: texto(resultado.nombre_nota_tecnica) ?? "",
    sede: texto(resultado.sede) ?? "",
    regimen: texto(resultado.regimen) ?? "",
    asegurador: texto(resultado.asegurador) ?? "",
    version: texto(resultado.version) ?? "",
    servicio: texto(resultado.servicio) ?? "",
    frecuencia: decimal(resultado.frecuencia),
  }
}

export function construirCsv(
  filas: Record<string, string | number | null>[]
): string {
  if (filas.length === 0) return ""

  const encabezados = Object.keys(filas[0])
  const escapar = (value: string | number | null) => {
    const texto = value == null ? "" : String(value)
    return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
  }

  const lineas = [
    encabezados.join(","),
    ...filas.map((fila) => encabezados.map((key) => escapar(fila[key])).join(",")),
  ]

  return lineas.join("\n")
}
