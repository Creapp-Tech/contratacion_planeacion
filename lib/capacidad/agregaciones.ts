import {
  calcularOcupacion,
  formatoNumero,
  formatoPct,
} from "@/lib/sedes/ocupacion"
import type { FrecuenciaAreaCruda, SedeInfraCruda, SedePoblacionCruda } from "./queries"

export { calcularOcupacion, formatoNumero, formatoPct }

export const AREAS_NINGUNA = "__ninguna__"

export type CapacidadTipo = "inicial" | "actual"
export type PoblacionTipo = "activa" | "pagada" | "certificada"
export type CategoriaOcupacion = "sin" | "cerca" | "disp"
export const CATEGORIAS: CategoriaOcupacion[] = ["sin", "cerca", "disp"]

export const ETIQUETAS_CATEGORIA: Record<
  CategoriaOcupacion,
  { titulo: string; detalle: string; larga: string }
> = {
  sin: {
    titulo: "Sedes sin capacidad",
    detalle: "Ocupación ≥ 100%",
    larga: "Sedes sin capacidad",
  },
  cerca: {
    titulo: "Cerca del límite de su capacidad",
    detalle: "Ocupación > 80%",
    larga: "Cerca del límite",
  },
  disp: {
    titulo: "Sedes con capacidad disponible",
    detalle: "Ocupación ≤ 80%",
    larga: "Con capacidad disponible",
  },
}

export type FiltrosPoblacion = {
  regional?: string
  sede?: string
  eps?: string
  capacidad: CapacidadTipo
  poblacion: PoblacionTipo
  categoria?: CategoriaOcupacion
  departamento?: string
  municipio?: string
}

export type SedePoblacion = {
  sedeId: string
  sede: string
  regional: string
  departamento: string | null
  municipio: string | null
  capacidadInicial: number | null
  capacidadActual: number | null
  filasEps: {
    eps: string
    activa: number
    pagada: number
    certificada: number
  }[]
}

export type OpcionesPoblacion = {
  regionales: string[]
  sedes: { id: string; nombre: string; regional: string }[]
  eps: string[]
  departamentos: string[]
  municipios: string[]
}

export type FiltrosInfra = {
  regional?: string
  sede?: string
  areas?: string[]
  tipoPoblacion: "activa" | "pagada" | "personalizada"
  personalizada: number
}

export type AreaFila = {
  areaId: string
  area: string
  categoria: string
  capacidadActual: number
  capacidadPlaneacion: number
  capacidadEjecucion: number
}

export type ResumenInfra = {
  poblacionActiva: number
  poblacionPagada: number
  capacidadActual: number
  capacidadPlaneacion: number
  capacidadEjecucion: number
  areas: AreaFila[]
}

export type OpcionesInfra = {
  regionales: string[]
  sedes: { id: string; nombre: string; regional: string }[]
  areas: { id: string; nombre: string; categoria: string }[]
}

export type NodoArbol = {
  id: string
  etiqueta: string
  capacidad: number
  poblacion: number
  hijos: NodoArbol[] | null
}

function unicos(valores: (string | null)[]): string[] {
  return [
    ...new Set(
      valores
        .map((valor) => (valor ?? "").trim())
        .filter((valor) => valor.length > 0)
    ),
  ].sort((a, b) => a.localeCompare(b, "es"))
}

// Orden fijo del módulo de capacidad instalada (áreas de revisión frecuente).
const ORDEN_AREAS_CAPACIDAD = [
  "medicina general",
  "especialidades",
  "apoyo paramedico",
  "enfermeria",
  "odontologia",
]

function normalizarArea(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export function ordenAreaCapacidad(nombre: string): number {
  const clave = normalizarArea(nombre)
  for (let i = 0; i < ORDEN_AREAS_CAPACIDAD.length; i++) {
    const slot = ORDEN_AREAS_CAPACIDAD[i]
    const coincide =
      slot === "odontologia"
        ? clave.startsWith("odontologia")
        : clave === slot
    if (coincide) return i
  }
  return ORDEN_AREAS_CAPACIDAD.length
}

export function compararAreasCapacidad(a: string, b: string): number {
  const orden = ordenAreaCapacidad(a) - ordenAreaCapacidad(b)
  if (orden !== 0) return orden
  return a.localeCompare(b, "es")
}

export function aplanarPoblacion(sedes: SedePoblacionCruda[]): SedePoblacion[] {
  return sedes.map((sede) => ({
    sedeId: sede.id,
    sede: sede.nombre,
    regional: (sede.regional ?? "").trim() || "Sin regional",
    departamento: sede.departamento,
    municipio: sede.municipio,
    capacidadInicial:
      sede.capacidad_inicial == null ? null : Number(sede.capacidad_inicial),
    capacidadActual:
      sede.capacidad_usuarios == null ? null : Number(sede.capacidad_usuarios),
    filasEps: (sede.poblacion_aseguradora ?? []).map((fila) => ({
      eps: fila.aseguradores_eps?.nombre_eps?.trim() || "Sin EPS",
      activa: fila.poblacion_activa ?? 0,
      pagada: fila.poblacion_pagada ?? 0,
      certificada: fila.poblacion_certificada ?? 0,
    })),
  }))
}

export function opcionesPoblacion(
  sedes: SedePoblacion[]
): OpcionesPoblacion {
  return {
    regionales: unicos(sedes.map((sede) => sede.regional)),
    sedes: sedes.map((sede) => ({
      id: sede.sedeId,
      nombre: sede.sede,
      regional: sede.regional,
    })),
    eps: unicos(sedes.flatMap((sede) => sede.filasEps.map((fila) => fila.eps))),
    departamentos: unicos(sedes.map((sede) => sede.departamento)),
    municipios: unicos(sedes.map((sede) => sede.municipio)),
  }
}

export function filtrarPoblacion(
  sedes: SedePoblacion[],
  filtros: FiltrosPoblacion
): SedePoblacion[] {
  return sedes
    .filter((sede) => !filtros.regional || sede.regional === filtros.regional)
    .filter((sede) => !filtros.sede || sede.sedeId === filtros.sede)
    .filter((sede) => !filtros.departamento || sede.departamento === filtros.departamento)
    .filter((sede) => !filtros.municipio || sede.municipio === filtros.municipio)
    .map((sede) => {
      const filasEps = filtros.eps
        ? sede.filasEps.filter((fila) => fila.eps === filtros.eps)
        : sede.filasEps
      return { ...sede, filasEps }
    })
    .filter((sede) => (filtros.eps ? sede.filasEps.length > 0 : true))
}

export function capacidadDe(
  sede: SedePoblacion,
  tipo: CapacidadTipo
): number | null {
  return tipo === "inicial" ? sede.capacidadInicial : sede.capacidadActual
}

export function poblacionDe(
  sede: SedePoblacion,
  tipo: PoblacionTipo
): number {
  return sede.filasEps.reduce((total, fila) => total + fila[tipo], 0)
}

export function categoriaOcupacion(
  poblacion: number,
  capacidad: number | null | undefined
): CategoriaOcupacion {
  if (!capacidad || capacidad <= 0) return "sin"
  const ocupacion = poblacion / capacidad
  if (ocupacion >= 1) return "sin"
  if (ocupacion > 0.8) return "cerca"
  return "disp"
}

export function resumenPoblacion(
  sedes: SedePoblacion[],
  capacidad: CapacidadTipo,
  poblacion: PoblacionTipo
) {
  let totalCapacidad = 0
  let totalPoblacion = 0
  const conteo: Record<CategoriaOcupacion, number> = { sin: 0, cerca: 0, disp: 0 }

  for (const sede of sedes) {
    const cap = capacidadDe(sede, capacidad) ?? 0
    const pob = poblacionDe(sede, poblacion)
    totalCapacidad += cap
    totalPoblacion += pob
    conteo[categoriaOcupacion(pob, capacidadDe(sede, capacidad))] += 1
  }

  return {
    capacidad: totalCapacidad,
    poblacion: totalPoblacion,
    ocupacion: calcularOcupacion(totalPoblacion, totalCapacidad),
    conteo,
  }
}

type EntradaJerarquia = {
  ruta: string[]
  capacidad: number
  poblacion: number
}

export function construirArbol(
  entradas: EntradaJerarquia[],
  nivel = 0,
  prefijo = ""
): NodoArbol[] {
  if (nivel === 0 && entradas.length === 0) return []

  const grupos = new Map<string, EntradaJerarquia[]>()
  for (const entrada of entradas) {
    const clave = entrada.ruta[nivel] ?? ""
    const grupo = grupos.get(clave)
    if (grupo) {
      grupo.push(entrada)
    } else {
      grupos.set(clave, [entrada])
    }
  }

  return [...grupos.entries()].map(([etiqueta, grupo]) => {
    const id = prefijo ? `${prefijo}/${etiqueta}` : `/${etiqueta}`
    const esHoja = nivel === grupo[0].ruta.length - 1
    if (esHoja) {
      return {
        id,
        etiqueta,
        capacidad: grupo.reduce((total, item) => total + item.capacidad, 0),
        poblacion: grupo.reduce((total, item) => total + item.poblacion, 0),
        hijos: null,
      }
    }
    const hijos = construirArbol(grupo, nivel + 1, id)
    return {
      id,
      etiqueta,
      capacidad: hijos.reduce((total, hijo) => total + hijo.capacidad, 0),
      poblacion: hijos.reduce((total, hijo) => total + hijo.poblacion, 0),
      hijos,
    }
  })
}

export function entradasPorSede(
  sedes: SedePoblacion[],
  capacidad: CapacidadTipo,
  poblacion: PoblacionTipo,
  categoria?: CategoriaOcupacion
): EntradaJerarquia[] {
  return sedes
    .filter((sede) => {
      if (!categoria) return true
      return (
        categoriaOcupacion(
          poblacionDe(sede, poblacion),
          capacidadDe(sede, capacidad)
        ) === categoria
      )
    })
    .map((sede) => ({
      ruta: ["Colombia", sede.regional, sede.sede],
      capacidad: capacidadDe(sede, capacidad) ?? 0,
      poblacion: poblacionDe(sede, poblacion),
    }))
}

export function idsDelArbol(nodos: NodoArbol[]): string[] {
  return nodos.flatMap((nodo) =>
    nodo.hijos
      ? [nodo.id, ...idsDelArbol(nodo.hijos)]
      : [nodo.id]
  )
}

function esEnfermeria(nombre: string, categoria: string): boolean {
  const n = normalizarArea(nombre)
  const c = normalizarArea(categoria)
  return n.includes("enfermeria") || c.includes("enfermeria")
}

function calcularCapacidadDesdeFreqPop(
  freqPop: number,
  esEnfermeriaArea: boolean
): number {
  const horas = (freqPop * 20) / 60
  if (esEnfermeriaArea) {
    return (60 / 20) * (horas / 540)
  }
  return horas / 135 / 2
}

export function resumenInfraestructura(
  sedes: SedeInfraCruda[],
  frecuencias: FrecuenciaAreaCruda[],
  filtros: FiltrosInfra
): ResumenInfra {
  const filtradas = sedes
    .filter(
      (sede) =>
        !filtros.regional ||
        ((sede.regional ?? "").trim() || "Sin regional") === filtros.regional
    )
    .filter((sede) => !filtros.sede || sede.id === filtros.sede)

  let poblacionActiva = 0
  let poblacionPagada = 0
  let capacidadActual = 0
  const areas = new Map<string, AreaFila>()

  for (const sede of filtradas) {
    for (const fila of sede.poblacion_aseguradora ?? []) {
      poblacionActiva += fila.poblacion_activa ?? 0
      poblacionPagada += fila.poblacion_pagada ?? 0
    }
    for (const area of sede.sedes_areas ?? []) {
      const nombre = area.areas_catalogo?.nombre
      if (!nombre) continue
      if (!area.areas_catalogo?.mide_capacidad_ocupacion) continue
      if (filtros.areas && !filtros.areas.includes(area.area_id)) continue
      const clave = area.area_id
      const existente = areas.get(clave)
      if (existente) {
        existente.capacidadActual += area.cantidad_habilitada
      } else {
        areas.set(clave, {
          areaId: area.area_id,
          area: nombre,
          categoria: area.areas_catalogo?.categoria ?? "",
          capacidadActual: area.cantidad_habilitada,
          capacidadPlaneacion: 0,
          capacidadEjecucion: 0,
        })
      }
    }
  }

  for (const area of areas.values()) capacidadActual += area.capacidadActual

  const frecuenciasPorSedeArea = new Map<
    string,
    { notaTecnica: number; ejecucion: number }
  >()
  const sedeIds = new Set(filtradas.map((sede) => sede.id))

  for (const freq of frecuencias) {
    if (!sedeIds.has(freq.sedeId)) continue
    const clave = `${freq.sedeId}|${freq.areaId}`
    const existente = frecuenciasPorSedeArea.get(clave) ?? {
      notaTecnica: 0,
      ejecucion: 0,
    }
    if (freq.tipoFrecuencia === "nota_tecnica_viva") {
      existente.notaTecnica += freq.frecuencia
    } else {
      existente.ejecucion += freq.frecuencia
    }
    frecuenciasPorSedeArea.set(clave, existente)
  }

  const poblacionPorSede = new Map<string, number>()
  if (filtros.tipoPoblacion === "personalizada") {
    const totalActiva = filtradas.reduce((total, sede) => {
      for (const fila of sede.poblacion_aseguradora ?? []) {
        total += fila.poblacion_activa ?? 0
      }
      return total
    }, 0)
    for (const sede of filtradas) {
      let pobActivaSede = 0
      for (const fila of sede.poblacion_aseguradora ?? []) {
        pobActivaSede += fila.poblacion_activa ?? 0
      }
      const proporcion =
        totalActiva > 0 ? pobActivaSede / totalActiva : 1 / filtradas.length
      poblacionPorSede.set(sede.id, filtros.personalizada * proporcion)
    }
  } else {
    for (const sede of filtradas) {
      let pob = 0
      for (const fila of sede.poblacion_aseguradora ?? []) {
        if (filtros.tipoPoblacion === "activa") {
          pob += fila.poblacion_activa ?? 0
        } else {
          pob += fila.poblacion_pagada ?? 0
        }
      }
      poblacionPorSede.set(sede.id, pob)
    }
  }

  const freqPopPorArea = new Map<string, { notaTecnica: number; ejecucion: number }>()
  for (const sede of filtradas) {
    const pobSede = poblacionPorSede.get(sede.id) ?? 0
    for (const area of sede.sedes_areas ?? []) {
      const nombre = area.areas_catalogo?.nombre
      if (!nombre) continue
      if (!area.areas_catalogo?.mide_capacidad_ocupacion) continue
      if (filtros.areas && !filtros.areas.includes(area.area_id)) continue

      const claveFreq = `${sede.id}|${area.area_id}`
      const freq = frecuenciasPorSedeArea.get(claveFreq) ?? {
        notaTecnica: 0,
        ejecucion: 0,
      }

      const claveArea = area.area_id
      const existente = freqPopPorArea.get(claveArea) ?? {
        notaTecnica: 0,
        ejecucion: 0,
      }
      existente.notaTecnica += freq.notaTecnica * pobSede
      existente.ejecucion += freq.ejecucion * pobSede
      freqPopPorArea.set(claveArea, existente)
    }
  }

  for (const area of areas.values()) {
    const freqPop = freqPopPorArea.get(area.areaId) ?? {
      notaTecnica: 0,
      ejecucion: 0,
    }
    const esEnf = esEnfermeria(area.area, area.categoria)
    area.capacidadPlaneacion = calcularCapacidadDesdeFreqPop(
      freqPop.notaTecnica,
      esEnf
    )
    area.capacidadEjecucion = calcularCapacidadDesdeFreqPop(
      freqPop.ejecucion,
      esEnf
    )
  }

  let capacidadPlaneacion = 0
  let capacidadEjecucion = 0
  for (const area of areas.values()) {
    capacidadPlaneacion += area.capacidadPlaneacion
    capacidadEjecucion += area.capacidadEjecucion
  }

  return {
    poblacionActiva,
    poblacionPagada,
    capacidadActual,
    capacidadPlaneacion,
    capacidadEjecucion,
    areas: [...areas.values()].sort((a, b) =>
      compararAreasCapacidad(a.area, b.area)
    ),
  }
}

export function opcionesInfra(sedes: SedeInfraCruda[]): OpcionesInfra {
  const areas = new Map<string, { id: string; nombre: string; categoria: string }>()
  for (const sede of sedes) {
    for (const area of sede.sedes_areas ?? []) {
      const nombre = area.areas_catalogo?.nombre
      if (!nombre || areas.has(area.area_id)) continue
      if (!area.areas_catalogo?.mide_capacidad_ocupacion) continue
      areas.set(area.area_id, {
        id: area.area_id,
        nombre,
        categoria: area.areas_catalogo?.categoria ?? "",
      })
    }
  }

  return {
    regionales: unicos(sedes.map((sede) => sede.regional)),
    sedes: sedes.map((sede) => ({
      id: sede.id,
      nombre: sede.nombre,
      regional: (sede.regional ?? "").trim() || "Sin regional",
    })),
    areas: [...areas.values()].sort((a, b) =>
      compararAreasCapacidad(a.nombre, b.nombre)
    ),
  }
}
