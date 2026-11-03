import type { Asegurador } from "@/lib/sedes/queries"

export type MapaFiltros = {
  regional?: string
  zonal?: string
  asegurador?: string
  sede?: string
  marca?: string
  tipoIps?: string
  departamento?: string
  municipio?: string
}

export type SedeMapa = {
  id: string
  nombre: string
  regional: string | null
  zonal: string | null
  marca: string | null
  tipo_ips: string | null
  departamento: string | null
  municipio: string | null
  estado: string
  latitud: number | null
  longitud: number | null
  capacidad_usuarios: number | null
  poblacion: number
  ocupacion: number | null
  aseguradores: string[]
}

export type OpcionesMapa = {
  regionales: string[]
  zonales: string[]
  marcas: string[]
  tiposIps: string[]
  departamentos: string[]
  municipios: string[]
  municipiosPorDepartamento: Record<string, string[]>
  aseguradores: Asegurador[]
  sedes: { id: string; nombre: string }[]
}

export type ResumenMapa = {
  sedes: number
  conUbicacion: number
  sinUbicacion: number
  capacidad: number
  poblacion: number
  ocupacion: number | null
}

export function calcularOcupacion(
  poblacion: number,
  capacidad: number | null | undefined
): number | null {
  if (!capacidad || capacidad <= 0) return null
  return (poblacion / capacidad) * 100
}

export type ColorOcupacion = {
  hex: string
  texto: string
  etiqueta: "Sin datos" | "Baja" | "Óptima" | "Saturada"
}

export function colorOcupacion(pct: number | null): ColorOcupacion {
  if (pct == null || !Number.isFinite(pct)) {
    return { hex: "#9ca3af", texto: "#4b5563", etiqueta: "Sin datos" }
  }
  if (pct >= 100) {
    return { hex: "#ef4444", texto: "#b91c1c", etiqueta: "Saturada" }
  }
  if (pct >= 50) {
    return { hex: "#22c55e", texto: "#15803d", etiqueta: "Óptima" }
  }
  return { hex: "#f59e0b", texto: "#b45309", etiqueta: "Baja" }
}

export function formatoNumero(value: number | null | undefined): string {
  if (value == null) return "—"
  return new Intl.NumberFormat("es-CO").format(value)
}

export function formatoPct(pct: number | null): string {
  if (pct == null || !Number.isFinite(pct)) return "—"
  const valor = new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 1,
  }).format(pct)
  return `${valor}%`
}

export function resumenMapa(sedes: SedeMapa[]): ResumenMapa {
  const conUbicacion = sedes.filter(
    (sede) => sede.latitud != null && sede.longitud != null
  ).length

  const capacidad = sedes.reduce(
    (total, sede) => total + (sede.capacidad_usuarios ?? 0),
    0
  )
  const poblacion = sedes.reduce((total, sede) => total + sede.poblacion, 0)

  return {
    sedes: sedes.length,
    conUbicacion,
    sinUbicacion: sedes.length - conUbicacion,
    capacidad,
    poblacion,
    ocupacion: calcularOcupacion(poblacion, capacidad),
  }
}