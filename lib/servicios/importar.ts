export type FilaImportacion = Record<string, string>

// Tokens que representan "sin dato" y deben tratarse como vacío.
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

export type ServicioImportado = {
  nombre: string | null
  grupo: string | null
  area: string | null
  tipo_personal: string | null
}

export const ALIAS_COLUMNAS: Record<string, keyof ServicioImportado> = {
  nombre: "nombre",
  servicio: "nombre",
  nombre_servicio: "nombre",
  nombre_del_servicio: "nombre",
  grupo: "grupo",
  grupo_servicio: "grupo",
  grupo_del_servicio: "grupo",
  area: "area",
  areas: "area",
  area_nombre: "area",
  nombre_area: "area",
  tipo_personal: "tipo_personal",
  tipo_de_personal: "tipo_personal",
  tipo_persona: "tipo_personal",
  tipo_de_persona: "tipo_personal",
  personal: "tipo_personal",
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
}

export function parseCsv(texto: string): FilaImportacion[] {
  const finPrimeraLinea = texto.indexOf("\n")
  const primeraLinea =
    finPrimeraLinea === -1 ? texto : texto.slice(0, finPrimeraLinea)
  const delimitador =
    primeraLinea.includes(";") && !primeraLinea.includes(",") ? ";" : ","

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
    } else if (char === delimitador) {
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

export function mapearFila(fila: FilaImportacion): ServicioImportado {
  const resultado: Partial<Record<keyof ServicioImportado, string>> = {}

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

  return {
    nombre: texto(resultado.nombre),
    grupo: texto(resultado.grupo),
    area: texto(resultado.area),
    tipo_personal: texto(resultado.tipo_personal),
  }
}

export function construirCsv(
  filas: Record<string, string | number | null | boolean>[]
): string {
  if (filas.length === 0) return ""

  const encabezados = Object.keys(filas[0])
  const escapar = (value: string | number | null | boolean) => {
    const texto = value == null ? "" : String(value)
    return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
  }

  const lineas = [
    encabezados.join(","),
    ...filas.map((fila) => encabezados.map((key) => escapar(fila[key])).join(",")),
  ]

  return lineas.join("\n")
}
