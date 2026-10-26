/**
 * Lista oficial de departamentos de Colombia (32 departamentos + Bogotá D.C.).
 * Se usa para validar el campo `departamento` en la importación CSV/Excel,
 * de forma que no entren ciudades u otros valores no válidos.
 */
export const DEPARTAMENTOS_COLOMBIA = [
  "Amazonas",
  "Antioquia",
  "Arauca",
  "Atlántico",
  "Bogotá D.C.",
  "Bolívar",
  "Boyacá",
  "Caldas",
  "Caquetá",
  "Casanare",
  "Cauca",
  "Cesar",
  "Chocó",
  "Córdoba",
  "Cundinamarca",
  "Guainía",
  "Guaviare",
  "Huila",
  "La Guajira",
  "Magdalena",
  "Meta",
  "Nariño",
  "Norte de Santander",
  "Putumayo",
  "Quindío",
  "Risaralda",
  "San Andrés y Providencia",
  "Santander",
  "Sucre",
  "Tolima",
  "Valle del Cauca",
  "Vaupés",
  "Vichada",
] as const

/**
 * Normaliza un texto para comparación: minúsculas, sin acentos y sin
 * puntuación ("Bogotá D.C." → "bogotadc"). Se usa para validar tanto
 * departamentos como regionales contra sus catálogos.
 */
export function normalizarTexto(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
}

const MAPA_DEPARTAMENTOS = new Map<string, string>(
  DEPARTAMENTOS_COLOMBIA.map(
    (nombre): [string, string] => [normalizarTexto(nombre), nombre]
  )
)

// Alias frecuentes que deben resolver al nombre oficial.
MAPA_DEPARTAMENTOS.set("bogota", "Bogotá D.C.")

/**
 * Devuelve el nombre oficial del departamento si el valor pertenece a la
 * lista oficial, o `null` si está vacío o no es un departamento válido.
 * Tolera mayúsculas, tildes y puntuación.
 */
export function departamentoOficial(
  value: string | null | undefined
): string | null {
  if (!value?.trim()) return null
  return MAPA_DEPARTAMENTOS.get(normalizarTexto(value)) ?? null
}
