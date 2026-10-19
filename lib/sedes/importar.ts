export type FilaImportacion = Record<string, string>

export type SedeImportada = {
  nombre: string
  marca: string | null
  tipo_ips: string | null
  nivel: string | null
  codigo_reps: string | null
  departamento: string | null
  municipio: string | null
  barrio: string | null
  direccion: string | null
  pais: string | null
  latitud: number | null
  longitud: number | null
  gerente: string | null
  fecha_apertura: string | null
  regional: string | null
  zonal: string | null
  estado: string
  fecha_cierre: string | null
  metros_cuadrado: number | null
  capacidad_inicial: number | null
  capacidad_usuarios: number | null
  numero_pisos: number | null
}

export const ALIAS_COLUMNAS: Record<string, keyof SedeImportada> = {
  nombre: "nombre",
  nombre_sede: "nombre",
  sede: "nombre",
  sedes: "nombre",
  razon_social: "nombre",
  codigo_reps: "codigo_reps",
  codigoreps: "codigo_reps",
  codigo: "codigo_reps",
  codigo_sede: "codigo_reps",
  departamento: "departamento",
  depto: "departamento",
  municipio: "municipio",
  barrio: "barrio",
  direccion: "direccion",
  pais: "pais",
  gerente: "gerente",
  fecha_apertura: "fecha_apertura",
  fechaapertura: "fecha_apertura",
  regional: "regional",
  zonal: "zonal",
  marca: "marca",
  nivel: "nivel",
  tipo_ips: "tipo_ips",
  tipoips: "tipo_ips",
  tipo: "tipo_ips",
  estado: "estado",
  fecha_cierre: "fecha_cierre",
  fechacierre: "fecha_cierre",
  metros_cuadrado: "metros_cuadrado",
  metroscuadrado: "metros_cuadrado",
  m2: "metros_cuadrado",
  capacidad_inicial: "capacidad_inicial",
  capacidadinicial: "capacidad_inicial",
  capacidad_usuarios: "capacidad_usuarios",
  capacidadusuarios: "capacidad_usuarios",
  capacidad_actual: "capacidad_usuarios",
  capacidadactual: "capacidad_usuarios",
  capacidad: "capacidad_usuarios",
  numero_pisos: "numero_pisos",
  numeropisos: "numero_pisos",
  pisos: "numero_pisos",
  latitud: "latitud",
  longitud: "longitud",
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

export function mapearFila(fila: FilaImportacion): SedeImportada {
  const resultado: Partial<Record<keyof SedeImportada, string>> = {}

  for (const [columna, valor] of Object.entries(fila)) {
    const campo = ALIAS_COLUMNAS[columna]
    if (campo && !resultado[campo]) {
      resultado[campo] = valor
    }
  }

  const numero = (value: string | undefined) => {
    if (value === undefined || value === "") return null
    const n = Number(value)
    return Number.isNaN(n) ? null : n
  }

  const texto = (value: string | undefined) =>
    value === undefined || value === "" ? null : value

  const estado = normalizarEstado(resultado.estado)

  return {
    nombre: resultado.nombre?.trim() ?? "",
    marca: texto(resultado.marca),
    tipo_ips: texto(resultado.tipo_ips),
    nivel: texto(resultado.nivel),
    codigo_reps: texto(resultado.codigo_reps),
    departamento: texto(resultado.departamento),
    municipio: texto(resultado.municipio),
    barrio: texto(resultado.barrio),
    direccion: texto(resultado.direccion),
    pais: texto(resultado.pais),
    latitud: numero(resultado.latitud),
    longitud: numero(resultado.longitud),
    gerente: texto(resultado.gerente),
    fecha_apertura: texto(resultado.fecha_apertura),
    regional: texto(resultado.regional),
    zonal: texto(resultado.zonal),
    estado,
    fecha_cierre: estado === "inactiva" ? texto(resultado.fecha_cierre) : null,
    metros_cuadrado: numero(resultado.metros_cuadrado),
    capacidad_inicial: numero(resultado.capacidad_inicial),
    capacidad_usuarios: numero(resultado.capacidad_usuarios),
    numero_pisos: numero(resultado.numero_pisos),
  }
}

function normalizarEstado(value: string | undefined) {
  const normalizado = (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")

  if (normalizado === "inactiva" || normalizado === "inactivo") return "inactiva"
  if (normalizado === "en_apertura") return "en_apertura"
  return "activa"
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
