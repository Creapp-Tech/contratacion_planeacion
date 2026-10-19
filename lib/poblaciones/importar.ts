export type FilaImportacion = Record<string, string>

// Tokens que representan "sin dato" y deben tratarse como vacío (NULL).
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
  "sin asegurador",
  "sin regimen",
  "no aplica",
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

export type PoblacionImportada = {
  sede: string | null
  asegurador: string | null
  regimen: string | null
  poblacion_activa: number | null
  poblacion_pagada: number | null
  poblacion_certificada: number | null
  fecha_actualizacion: string | null
}

export const ALIAS_COLUMNAS: Record<string, keyof PoblacionImportada> = {
  sede: "sede",
  sedes: "sede",
  nombre_sede: "sede",
  sede_nombre: "sede",
  asegurador: "asegurador",
  aseguradora: "asegurador",
  asegurador_eps: "asegurador",
  eps: "asegurador",
  regimen: "regimen",
  regimenes: "regimen",
  regimen_afiliacion: "regimen",
  regimen_de_afiliacion: "regimen",
  tipo_regimen: "regimen",
  poblacion_activa: "poblacion_activa",
  poblacionactiva: "poblacion_activa",
  poblacion_activas: "poblacion_activa",
  activa: "poblacion_activa",
  poblacion_pagada: "poblacion_pagada",
  poblacionpagada: "poblacion_pagada",
  pagada: "poblacion_pagada",
  poblacion_certificada: "poblacion_certificada",
  poblacioncertificada: "poblacion_certificada",
  certificada: "poblacion_certificada",
  fecha_actualizacion: "fecha_actualizacion",
  fechaactualizacion: "fecha_actualizacion",
  fecha: "fecha_actualizacion",
  fecha_de_actualizacion: "fecha_actualizacion",
  actualizacion: "fecha_actualizacion",
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

export function mapearFila(fila: FilaImportacion): PoblacionImportada {
  const resultado: Partial<Record<keyof PoblacionImportada, string>> = {}

  for (const [columna, valor] of Object.entries(fila)) {
    const campo = ALIAS_COLUMNAS[columna]
    if (campo && !resultado[campo]) {
      resultado[campo] = valor
    }
  }

  const entero = (value: string | undefined) => {
    if (esValorVacio(value)) return null
    const trimmed = (value as string).trim()
    const n = Number(trimmed.replace(",", "."))
    if (Number.isNaN(n)) return null
    return Math.trunc(n)
  }

  const texto = (value: string | undefined) => {
    if (esValorVacio(value)) return null
    return (value as string).trim()
  }

  const fecha = (value: string | undefined) => {
    if (esValorVacio(value)) return null
    const limpio = (value as string).trim()
    if (!limpio) return null
    if (/^\d{4}-\d{2}-\d{2}$/.test(limpio)) return limpio
    const d = new Date(limpio)
    if (Number.isNaN(d.getTime())) return null
    const ano = d.getFullYear()
    const mes = String(d.getMonth() + 1).padStart(2, "0")
    const dia = String(d.getDate()).padStart(2, "0")
    return `${ano}-${mes}-${dia}`
  }

  return {
    sede: texto(resultado.sede),
    asegurador: texto(resultado.asegurador),
    regimen: texto(resultado.regimen),
    poblacion_activa: entero(resultado.poblacion_activa),
    poblacion_pagada: entero(resultado.poblacion_pagada),
    poblacion_certificada: entero(resultado.poblacion_certificada),
    fecha_actualizacion: fecha(resultado.fecha_actualizacion),
  }
}
