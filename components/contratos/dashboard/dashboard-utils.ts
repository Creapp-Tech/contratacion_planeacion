import type { ContratoDashboard } from "@/lib/contratos/dashboard-queries"

export type OpcionFiltro = {
  value: string
  label: string
}

export type FiltrosDashboard = {
  paises: string[]
  legalizaciones: string[]
  regimenes: string[]
  aseguradoras: string[]
  regionales: string[]
  estadosEjecucion: string[]
}

export type OpcionesFiltrosDashboard = {
  paises: OpcionFiltro[]
  legalizaciones: OpcionFiltro[]
  regimenes: OpcionFiltro[]
  aseguradoras: OpcionFiltro[]
  regionales: OpcionFiltro[]
  estadosEjecucion: OpcionFiltro[]
}

const SIN_DATO = "__sin_dato__"
const SIN_REGIONAL = "__sin_regional__"

const LEGALIZADO = "__legalizado__"
const NO_LEGALIZADO = "__no_legalizado__"
const LEGALIZADO_VIVA1A = "__legalizado_viva1a__"

const REGIMEN_CONTRIBUTIVO = "__regimen_contributivo__"
const REGIMEN_SUBSIDIADO = "__regimen_subsidiado__"
const REGIMEN_MIXTO = "__regimen_mixto__"
const REGIMEN_SIN = "__regimen_sin__"

function agregar(
  mapa: Map<string, string>,
  value: string,
  label: string
): void {
  if (!mapa.has(value)) {
    mapa.set(value, label)
  }
}

function opcionesDesdeMapa(mapa: Map<string, string>): OpcionFiltro[] {
  return [...mapa.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "es"))
}

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim()
}

export function legalizacionesDe(contrato: ContratoDashboard): string[] {
  const nombre = contrato.estado_legalizacion?.trim()
  if (!nombre) return [SIN_DATO]

  const normalizado = normalizar(nombre)
  if (normalizado === "legalizado") {
    const valores = [LEGALIZADO]
    if (normalizar(contrato.tipo_contrato ?? "") === "viva1a") {
      valores.push(LEGALIZADO_VIVA1A)
    }
    return valores
  }

  if (normalizado === "no legalizado") return [NO_LEGALIZADO]
  return [nombre]
}

export function regimenesDe(contrato: ContratoDashboard): string[] {
  const nombres = contrato.regimenes
    .map((regimen) => regimen.nombre.trim())
    .filter(Boolean)

  if (nombres.length === 0) return [REGIMEN_SIN]

  const normalizados = nombres.map(normalizar)
  const tieneContributivo = normalizados.includes("contributivo")
  const tieneSubsidiado = normalizados.includes("subsidiado")
  const resultado = new Set<string>()

  if (tieneContributivo && tieneSubsidiado) {
    resultado.add(REGIMEN_MIXTO)
  } else if (tieneContributivo) {
    resultado.add(REGIMEN_CONTRIBUTIVO)
  } else if (tieneSubsidiado) {
    resultado.add(REGIMEN_SUBSIDIADO)
  }

  // Otros regímenes (p. ej. Especial) se conservan como categorías propias
  // para que ningún contrato quede fuera de los filtros.
  for (const nombre of nombres) {
    const normalizado = normalizar(nombre)
    if (normalizado === "contributivo" || normalizado === "subsidiado") continue
    resultado.add(nombre)
  }

  return [...resultado]
}

export function crearOpcionesFiltros(
  contratos: ContratoDashboard[]
): OpcionesFiltrosDashboard {
  const paises = new Map<string, string>()
  const aseguradoras = new Map<string, string>()
  const estadosEjecucion = new Map<string, string>()
  const regionales = new Map<string, string>()
  const otrasLegalizaciones = new Map<string, string>()
  const otrosRegimenes = new Map<string, string>()

  for (const contrato of contratos) {
    const pais = contrato.pais?.trim()
    agregar(paises, pais || SIN_DATO, pais || "Sin país")

    const aseguradora = contrato.aseguradora?.trim()
    agregar(
      aseguradoras,
      aseguradora || SIN_DATO,
      aseguradora || "Sin EPS"
    )

    const ejecucion = contrato.estado_ejecucion?.trim()
    agregar(
      estadosEjecucion,
      ejecucion || SIN_DATO,
      ejecucion || "Sin estado"
    )

    if (contrato.regionales.length === 0) {
      agregar(regionales, SIN_REGIONAL, "Sin regional")
    } else {
      for (const regional of contrato.regionales) {
        agregar(
          regionales,
          regional.id,
          regional.nombre.trim() || "Sin nombre"
        )
      }
    }

    for (const legalizacion of legalizacionesDe(contrato)) {
      if (legalizacion === SIN_DATO) {
        agregar(otrasLegalizaciones, SIN_DATO, "Sin estado")
      } else if (
        legalizacion !== LEGALIZADO &&
        legalizacion !== NO_LEGALIZADO &&
        legalizacion !== LEGALIZADO_VIVA1A
      ) {
        agregar(otrasLegalizaciones, legalizacion, legalizacion)
      }
    }

    for (const regimen of regimenesDe(contrato)) {
      if (regimen === REGIMEN_SIN) {
        agregar(otrosRegimenes, REGIMEN_SIN, "Sin régimen")
      } else if (
        regimen !== REGIMEN_CONTRIBUTIVO &&
        regimen !== REGIMEN_SUBSIDIADO &&
        regimen !== REGIMEN_MIXTO
      ) {
        agregar(otrosRegimenes, regimen, regimen)
      }
    }
  }

  const legalizacionSinEstado = otrasLegalizaciones.get(SIN_DATO)
  const legalizacionesExtras = opcionesDesdeMapa(
    new Map(
      [...otrasLegalizaciones].filter(([value]) => value !== SIN_DATO)
    )
  )

  const regimenSin = otrosRegimenes.get(REGIMEN_SIN)
  const regimenesExtras = opcionesDesdeMapa(
    new Map([...otrosRegimenes].filter(([value]) => value !== REGIMEN_SIN))
  )

  return {
    paises: opcionesDesdeMapa(paises),
    legalizaciones: [
      { value: LEGALIZADO, label: "Legalizado" },
      { value: NO_LEGALIZADO, label: "No legalizado" },
      { value: LEGALIZADO_VIVA1A, label: "Legalizado VIVA1A" },
      ...legalizacionesExtras,
      ...(legalizacionSinEstado
        ? [{ value: SIN_DATO, label: legalizacionSinEstado }]
        : []),
    ],
    regimenes: [
      { value: REGIMEN_CONTRIBUTIVO, label: "Contributivo" },
      { value: REGIMEN_SUBSIDIADO, label: "Subsidiado" },
      { value: REGIMEN_MIXTO, label: "Mixto" },
      ...regimenesExtras,
      ...(regimenSin ? [{ value: REGIMEN_SIN, label: regimenSin }] : []),
    ],
    aseguradoras: opcionesDesdeMapa(aseguradoras),
    regionales: opcionesDesdeMapa(regionales),
    estadosEjecucion: opcionesDesdeMapa(estadosEjecucion),
  }
}

export function crearFiltrosIniciales(
  opciones: OpcionesFiltrosDashboard
): FiltrosDashboard {
  return {
    paises: opciones.paises.map((opcion) => opcion.value),
    legalizaciones: opciones.legalizaciones.map((opcion) => opcion.value),
    regimenes: opciones.regimenes.map((opcion) => opcion.value),
    aseguradoras: opciones.aseguradoras.map((opcion) => opcion.value),
    regionales: opciones.regionales.map((opcion) => opcion.value),
    estadosEjecucion: opciones.estadosEjecucion.map((opcion) => opcion.value),
  }
}

export function cumpleFiltros(
  contrato: ContratoDashboard,
  filtros: FiltrosDashboard
): boolean {
  const pais = contrato.pais?.trim() || SIN_DATO
  if (!filtros.paises.includes(pais)) return false

  const aseguradora = contrato.aseguradora?.trim() || SIN_DATO
  if (!filtros.aseguradoras.includes(aseguradora)) return false

  const ejecucion = contrato.estado_ejecucion?.trim() || SIN_DATO
  if (!filtros.estadosEjecucion.includes(ejecucion)) return false

  if (contrato.regionales.length === 0) {
    if (!filtros.regionales.includes(SIN_REGIONAL)) return false
  } else if (
    !contrato.regionales.some((regional) =>
      filtros.regionales.includes(regional.id)
    )
  ) {
    return false
  }

  if (
    !legalizacionesDe(contrato).some((legalizacion) =>
      filtros.legalizaciones.includes(legalizacion)
    )
  ) {
    return false
  }

  if (
    !regimenesDe(contrato).some((regimen) =>
      filtros.regimenes.includes(regimen)
    )
  ) {
    return false
  }

  return true
}

export function hayFiltrosActivos(
  filtros: FiltrosDashboard,
  opciones: OpcionesFiltrosDashboard
): boolean {
  const grupos: Array<[string[], OpcionFiltro[]]> = [
    [filtros.paises, opciones.paises],
    [filtros.legalizaciones, opciones.legalizaciones],
    [filtros.regimenes, opciones.regimenes],
    [filtros.aseguradoras, opciones.aseguradoras],
    [filtros.regionales, opciones.regionales],
    [filtros.estadosEjecucion, opciones.estadosEjecucion],
  ]

  return grupos.some(
    ([seleccionados, disponibles]) =>
      seleccionados.length !== disponibles.length ||
      disponibles.some((opcion) => !seleccionados.includes(opcion.value))
  )
}

export type IndicadoresDashboard = {
  totalContratos: number
  aseguradoras: number
  regionales: number
  legalizados: number
  noLegalizados: number
  legalizadosViva1a: number
}

/**
 * Calcula los indicadores del dashboard sobre el conjunto ya filtrado.
 *
 * - Contratos: total del conjunto filtrado.
 * - Aseguradoras: EPS distintas (se ignoran los contratos sin EPS).
 * - Regionales: regionales distintas de la relación N:M.
 * - Legalizados / No legalizados: estado de legalización del contrato.
 * - Legalizado VIVA1A: subconjunto de los legalizados con tipo de contrato VIVA1A.
 */
export function calcularIndicadores(
  contratos: ContratoDashboard[]
): IndicadoresDashboard {
  const aseguradoras = new Set<string>()
  const regionales = new Set<string>()
  let legalizados = 0
  let noLegalizados = 0
  let legalizadosViva1a = 0

  for (const contrato of contratos) {
    const aseguradora = contrato.aseguradora?.trim()
    if (aseguradora) aseguradoras.add(aseguradora)

    for (const regional of contrato.regionales) {
      regionales.add(regional.id)
    }

    const legalizaciones = legalizacionesDe(contrato)
    if (legalizaciones.includes(LEGALIZADO)) legalizados += 1
    if (legalizaciones.includes(NO_LEGALIZADO)) noLegalizados += 1
    if (legalizaciones.includes(LEGALIZADO_VIVA1A)) legalizadosViva1a += 1
  }

  return {
    totalContratos: contratos.length,
    aseguradoras: aseguradoras.size,
    regionales: regionales.size,
    legalizados,
    noLegalizados,
    legalizadosViva1a,
  }
}

export type PuntoGrafica = {
  clave: string
  etiqueta: string
  total: number
  color: string
}

const COLOR_NEUTRO = "#94a3b8"
const COLORES_CATEGORICOS = [
  "#0f766e",
  "#2563eb",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#65a30d",
  "#ea580c",
  "#4f46e5",
  "#a16207",
]

const ETIQUETAS_REGIMEN: Record<string, string> = {
  [REGIMEN_CONTRIBUTIVO]: "Contributivo",
  [REGIMEN_SUBSIDIADO]: "Subsidiado",
  [REGIMEN_MIXTO]: "Mixto",
  [REGIMEN_SIN]: "Sin régimen",
}

const COLORES_REGIMEN: Record<string, string> = {
  [REGIMEN_CONTRIBUTIVO]: "#0f766e",
  [REGIMEN_SUBSIDIADO]: "#2563eb",
  [REGIMEN_MIXTO]: "#d97706",
  Especial: "#7c3aed",
  [REGIMEN_SIN]: COLOR_NEUTRO,
}

const COLORES_EJECUCION: Record<string, string> = {
  "En ejecución": "#0f766e",
  Finalizado: "#64748b",
}

const COLORES_LEGALIZACION: Record<string, string> = {
  "Legalizado VIVA1A": "#16a34a",
  Legalizado: "#0d9488",
  "No legalizado": "#dc2626",
  "Sin estado": COLOR_NEUTRO,
}

function suma(
  conteos: Map<string, number>,
  clave: string,
  cantidad = 1
): void {
  conteos.set(clave, (conteos.get(clave) ?? 0) + cantidad)
}

function ordenarDescendente(
  conteos: Map<string, number>
): Array<[string, number]> {
  return [...conteos.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es")
  )
}

function colorPorIndice(indice: number): string {
  return COLORES_CATEGORICOS[indice % COLORES_CATEGORICOS.length]
}

/**
 * Convierte los conteos en puntos de gráfica, ordenados de mayor a menor y con
 * un color por categoría.
 */
function construirPuntos(
  conteos: Map<string, number>,
  colores: Record<string, string> = {}
): PuntoGrafica[] {
  return ordenarDescendente(conteos).map(([etiqueta, total], indice) => ({
    clave: etiqueta,
    etiqueta,
    total,
    color: colores[etiqueta] ?? colorPorIndice(indice),
  }))
}

/**
 * Agrupa en una sola porción o barra los valores que quedan por fuera del
 * límite, para que las gráficas sigan siendo legibles con muchas categorías.
 */
function limitarCategorias(
  conteos: Map<string, number>,
  limite: number,
  etiquetaResto: string,
  colores: Record<string, string> = {}
): PuntoGrafica[] {
  const ordenados = ordenarDescendente(conteos)

  if (ordenados.length <= limite) {
    return construirPuntos(conteos, colores)
  }

  const principales = ordenados.slice(0, limite)
  const resto = ordenados
    .slice(limite)
    .reduce((acumulado, [, total]) => acumulado + total, 0)

  return [
    ...principales.map(([etiqueta, total], indice) => ({
      clave: etiqueta,
      etiqueta,
      total,
      color: colores[etiqueta] ?? colorPorIndice(indice),
    })),
    {
      clave: "__resto__",
      etiqueta: etiquetaResto,
      total: resto,
      color: COLOR_NEUTRO,
    },
  ]
}

/**
 * Distribución por régimen. Cada contrato cuenta una sola vez: si combina
 * Contributivo y Subsidiado se clasifica como Mixto.
 */
export function serieRegimen(
  contratos: ContratoDashboard[]
): PuntoGrafica[] {
  const conteos = new Map<string, number>()

  for (const contrato of contratos) {
    const claves = regimenesDe(contrato)
    const clave = claves.includes(REGIMEN_MIXTO)
      ? REGIMEN_MIXTO
      : claves.includes(REGIMEN_CONTRIBUTIVO)
        ? REGIMEN_CONTRIBUTIVO
        : claves.includes(REGIMEN_SUBSIDIADO)
          ? REGIMEN_SUBSIDIADO
          : (claves.find((item) => item !== REGIMEN_SIN) ?? REGIMEN_SIN)

    suma(conteos, clave)
  }

  const orden = [
    REGIMEN_CONTRIBUTIVO,
    REGIMEN_SUBSIDIADO,
    REGIMEN_MIXTO,
    REGIMEN_SIN,
  ]

  const principales = orden
    .filter((clave) => conteos.has(clave))
    .map((clave, indice) => ({
      clave,
      etiqueta: ETIQUETAS_REGIMEN[clave] ?? clave,
      total: conteos.get(clave) ?? 0,
      color: COLORES_REGIMEN[clave] ?? colorPorIndice(indice),
    }))

  const extras = [...conteos.keys()]
    .filter((clave) => !orden.includes(clave))
    .sort((a, b) => a.localeCompare(b, "es"))
    .map((clave, indice) => ({
      clave,
      etiqueta: clave,
      total: conteos.get(clave) ?? 0,
      color: COLORES_REGIMEN[clave] ?? colorPorIndice(indice),
    }))

  return [...principales, ...extras]
}

/**
 * Distribución por ciudad. Las 10 ciudades con más contratos se muestran por
 * separado y el resto se agrupa en "Otras ciudades".
 */
export function serieCiudad(
  contratos: ContratoDashboard[],
  limite = 10
): PuntoGrafica[] {
  const conteos = new Map<string, number>()

  for (const contrato of contratos) {
    suma(conteos, contrato.ciudad?.trim() || "Sin ciudad")
  }

  return limitarCategorias(conteos, limite, "Otras ciudades")
}

/** Distribución por estado de ejecución. */
export function serieEjecucion(
  contratos: ContratoDashboard[]
): PuntoGrafica[] {
  const conteos = new Map<string, number>()

  for (const contrato of contratos) {
    suma(conteos, contrato.estado_ejecucion?.trim() || "Sin estado")
  }

  return construirPuntos(conteos, COLORES_EJECUCION)
}

/**
 * Distribución por regional. Un contrato vinculado a varias regionales cuenta
 * en cada una, por lo que la suma puede superar el total de contratos.
 */
export function serieRegional(
  contratos: ContratoDashboard[]
): PuntoGrafica[] {
  const conteos = new Map<string, number>()

  for (const contrato of contratos) {
    if (contrato.regionales.length === 0) {
      suma(conteos, "Sin regional")
      continue
    }

    for (const regional of contrato.regionales) {
      suma(conteos, regional.nombre.trim() || "Sin nombre")
    }
  }

  return construirPuntos(conteos, {
    "Sin regional": COLOR_NEUTRO,
  })
}

/**
 * Distribución por estado de legalización en categorías excluyentes para que
 * una porción no se cuente dos veces: "Legalizado VIVA1A" se muestra aparte
 * del resto de legalizados.
 */
export function serieLegalizacion(
  contratos: ContratoDashboard[]
): PuntoGrafica[] {
  const conteos = new Map<string, number>()

  for (const contrato of contratos) {
    const legalizaciones = legalizacionesDe(contrato)
    const etiqueta = legalizaciones.includes(LEGALIZADO_VIVA1A)
      ? "Legalizado VIVA1A"
      : legalizaciones.includes(LEGALIZADO)
        ? "Legalizado"
        : legalizaciones.includes(NO_LEGALIZADO)
          ? "No legalizado"
          : (legalizaciones[0] ?? "Sin estado")

    suma(conteos, etiqueta)
  }

  const orden = ["Legalizado VIVA1A", "Legalizado", "No legalizado"]
  const principales = orden
    .filter((etiqueta) => conteos.has(etiqueta))
    .map((etiqueta) => ({
      clave: etiqueta,
      etiqueta,
      total: conteos.get(etiqueta) ?? 0,
      color: COLORES_LEGALIZACION[etiqueta] ?? COLOR_NEUTRO,
    }))

  const extras = [...conteos.keys()]
    .filter((etiqueta) => !orden.includes(etiqueta))
    .sort((a, b) => a.localeCompare(b, "es"))
    .map((etiqueta, indice) => ({
      clave: etiqueta,
      etiqueta,
      total: conteos.get(etiqueta) ?? 0,
      color: COLORES_LEGALIZACION[etiqueta] ?? colorPorIndice(indice),
    }))

  return [...principales, ...extras]
}

/**
 * Distribución por EPS. Las 10 aseguradoras con más contratos se muestran por
 * separado y el resto se agrupa en "Otras EPS".
 */
export function serieAseguradora(
  contratos: ContratoDashboard[],
  limite = 10
): PuntoGrafica[] {
  const conteos = new Map<string, number>()

  for (const contrato of contratos) {
    suma(conteos, contrato.aseguradora?.trim() || "Sin EPS")
  }

  return limitarCategorias(conteos, limite, "Otras EPS")
}
