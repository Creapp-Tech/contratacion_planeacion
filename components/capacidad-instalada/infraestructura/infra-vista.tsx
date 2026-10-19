import {
  resumenInfraestructura,
  type FiltrosInfra,
  type OpcionesInfra,
} from "@/lib/capacidad/agregaciones"
import type { FrecuenciaAreaCruda, SedeInfraCruda } from "@/lib/capacidad/queries"

import { InfraFiltros } from "./infra-filtros"
import { InfraTabla } from "./infra-tabla"
import { InfraTarjetas } from "./infra-tarjetas"

export function InfraVista({
  sedes,
  frecuencias,
  opciones,
  filtros,
}: {
  sedes: SedeInfraCruda[]
  frecuencias: FrecuenciaAreaCruda[]
  opciones: OpcionesInfra
  filtros: FiltrosInfra
}) {
  const resumen = resumenInfraestructura(sedes, frecuencias, filtros)

  return (
    <div className="flex flex-col gap-4">
      <InfraFiltros opciones={opciones} filtros={filtros} />
      <InfraTarjetas
        resumen={resumen}
        personalizada={
          filtros.tipoPoblacion === "personalizada"
            ? filtros.personalizada
            : null
        }
      />
      <InfraTabla
        areas={resumen.areas}
        hayAreasDisponibles={opciones.areas.length > 0}
      />
    </div>
  )
}
