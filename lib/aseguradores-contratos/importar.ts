import {
  esValorVacio,
  normalizarEncabezado,
  parseCsv,
  type FilaImportacion,
} from "@/lib/servicios/importar"

export type { FilaImportacion }

export type ServicioCupsImportado = {
  cups_asegurador: string | null
  cups_homologo: string | null
  frecuencia_uso_contratada: string | null
  cme_contratado: string | null
}

const ALIAS_COLUMNAS: Record<string, keyof ServicioCupsImportado> = {
  cups_asegurador: "cups_asegurador",
  cups_aseguradora: "cups_asegurador",
  cups_asignado: "cups_asegurador",
  codigo_asegurador: "cups_asegurador",
  cups_homologo: "cups_homologo",
  homologo: "cups_homologo",
  cups_homologado: "cups_homologo",
  cups_resolucion: "cups_homologo",
  frecuencia_uso_contratada: "frecuencia_uso_contratada",
  frecuencia_uso: "frecuencia_uso_contratada",
  frecuencia: "frecuencia_uso_contratada",
  cme_contratado: "cme_contratado",
  cme_asegurador: "cme_contratado",
  cme: "cme_contratado",
}

function valor(texto: string | null | undefined): string | null {
  return texto == null || esValorVacio(texto) ? null : texto.trim()
}

/** Convierte decimales con coma a punto; deja los inválidos para que Zod los rechace. */
export function normalizarNumero(texto: string | null | undefined): string | null {
  const limpio = valor(texto)
  if (!limpio) return null

  const sinEspacios = limpio.replace(/\s/g, "")
  if (!/^\d+(?:[.,]\d+)?$/.test(sinEspacios)) return sinEspacios

  const ultimaComa = sinEspacios.lastIndexOf(",")
  const ultimoPunto = sinEspacios.lastIndexOf(".")
  if (ultimaComa > -1 && ultimoPunto > -1) {
    return ultimaComa > ultimoPunto
      ? sinEspacios.replace(/\./g, "").replace(",", ".")
      : sinEspacios.replace(/,/g, "")
  }
  return sinEspacios.replace(",", ".")
}

/** El catálogo guarda códigos de 6 dígitos; tolera que falten ceros a la izquierda. */
export function normalizarCodigoCups(texto: string | null): string | null {
  const limpio = valor(texto)
  if (!limpio) return null
  return /^\d{1,6}$/.test(limpio) ? limpio.padStart(6, "0") : limpio
}

export function mapearFila(fila: FilaImportacion): ServicioCupsImportado {
  const resultado: ServicioCupsImportado = {
    cups_asegurador: null,
    cups_homologo: null,
    frecuencia_uso_contratada: null,
    cme_contratado: null,
  }

  for (const [encabezado, texto] of Object.entries(fila)) {
    const campo = ALIAS_COLUMNAS[normalizarEncabezado(encabezado)]
    if (!campo) continue
    if (
      campo === "frecuencia_uso_contratada" ||
      campo === "cme_contratado"
    ) {
      resultado[campo] = normalizarNumero(texto)
    } else if (campo === "cups_homologo") {
      resultado[campo] = normalizarCodigoCups(texto)
    } else {
      resultado[campo] = valor(texto)
    }
  }

  return resultado
}

/** Réplica la clave única funcional de la tabla: lower(trim(cups_asegurador)). */
export function claveCups(texto: string) {
  return texto.trim().toLowerCase()
}

export function parseCsvServiciosCups(texto: string): FilaImportacion[] {
  return parseCsv(texto)
}
