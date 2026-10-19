import { mismaRegional, requireAlcancePlaneacion } from "@/lib/auth/session"
import {
  aplanarPoblacion,
  AREAS_NINGUNA,
  opcionesInfra,
  opcionesPoblacion,
  type CategoriaOcupacion,
  type FiltrosInfra,
  type FiltrosPoblacion,
} from "@/lib/capacidad/agregaciones"
import {
  listFrecuenciasAreas,
  listSedesInfraestructura,
  listSedesPoblacion,
} from "@/lib/capacidad/queries"

import { CapacidadTabs } from "./capacidad-tabs"
import { InfraVista } from "./infraestructura/infra-vista"
import { PobVista } from "./poblacion/pob-vista"

const POBLACION_PERSONALIZADA_DEFECTO = 45000

function pick(value: string | string[] | undefined) {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

function parseAreas(value: string | undefined): string[] | undefined {
  if (!value) return undefined
  if (value === AREAS_NINGUNA) return []
  return value.split(",").filter((id) => id.length > 0)
}

function parseCategoria(value: string | undefined): CategoriaOcupacion | undefined {
  return value === "sin" || value === "cerca" || value === "disp"
    ? value
    : undefined
}

export async function CapacidadContenido({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const alcance = await requireAlcancePlaneacion()
  const enAlcance = (regional: string | null) =>
    alcance.verTodo || mismaRegional(regional, alcance.regional)

  const params = await searchParams
  const tab = pick(params.tab) === "poblacion" ? "poblacion" : "infraestructura"

  if (tab === "poblacion") {
    const sedes = (await listSedesPoblacion()).filter((sede) =>
      enAlcance(sede.regional)
    )

    const filtros: FiltrosPoblacion = {
      regional: pick(params.p_regional),
      sede: pick(params.p_sede),
      eps: pick(params.p_eps),
      capacidad: pick(params.p_cap) === "inicial" ? "inicial" : "actual",
      poblacion:
        pick(params.p_pob) === "pagada"
          ? "pagada"
          : pick(params.p_pob) === "certificada"
            ? "certificada"
            : "activa",
      categoria: parseCategoria(pick(params.p_cat)),
    }

    return (
      <div className="flex flex-col gap-4">
        <CapacidadTabs />
        <PobVista
          sedes={sedes}
          opciones={opcionesPoblacion(aplanarPoblacion(sedes))}
          filtros={filtros}
        />
      </div>
    )
  }

  const [sedes, frecuencias] = await Promise.all([
    listSedesInfraestructura(),
    listFrecuenciasAreas(),
  ])

  const sedesEnAlcance = sedes.filter((sede) => enAlcance(sede.regional))
  const sedeIds = new Set(sedesEnAlcance.map((sede) => sede.id))
  const frecuenciasEnAlcance = frecuencias.filter((fila) =>
    sedeIds.has(fila.sedeId)
  )

  const tipoPoblacion =
    pick(params.i_tipo) === "pagada"
      ? "pagada"
      : pick(params.i_tipo) === "personalizada"
        ? "personalizada"
        : "activa"

  const personalizada = Number(pick(params.i_custom))

  const filtros: FiltrosInfra = {
    regional: pick(params.i_regional),
    sede: pick(params.i_sede),
    areas: parseAreas(pick(params.i_areas)),
    tipoPoblacion,
    personalizada:
      Number.isFinite(personalizada) && personalizada >= 0
        ? personalizada
        : POBLACION_PERSONALIZADA_DEFECTO,
  }

  return (
    <div className="flex flex-col gap-4">
      <CapacidadTabs />
      <InfraVista
        sedes={sedesEnAlcance}
        frecuencias={frecuenciasEnAlcance}
        opciones={opcionesInfra(sedesEnAlcance)}
        filtros={filtros}
      />
    </div>
  )
}
