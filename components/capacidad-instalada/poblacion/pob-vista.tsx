import {
  aplanarPoblacion,
  construirArbol,
  entradasPorSede,
  filtrarPoblacion,
  resumenPoblacion,
  type FiltrosPoblacion,
  type OpcionesPoblacion,
} from "@/lib/capacidad/agregaciones"
import type { SedePoblacionCruda } from "@/lib/capacidad/queries"

import { PobFiltros } from "./pob-filtros"
import { PobTablaJerarquia } from "./pob-tabla-jerarquia"
import { PobTarjetas } from "./pob-tarjetas"

const ETIQUETA_CAPACIDAD = (valor: string) =>
  valor === "inicial" ? "Inicial" : "Actual"

export function PobVista({
  sedes,
  opciones,
  filtros,
}: {
  sedes: SedePoblacionCruda[]
  opciones: OpcionesPoblacion
  filtros: FiltrosPoblacion
}) {
  const aplanadas = aplanarPoblacion(sedes)
  const filtradas = filtrarPoblacion(aplanadas, filtros)
  const resumen = resumenPoblacion(filtradas, filtros.capacidad, filtros.poblacion)

  const arbolSede = construirArbol(
    entradasPorSede(filtradas, filtros.capacidad, filtros.poblacion, filtros.categoria)
  )

  const etiquetaCapacidad = ETIQUETA_CAPACIDAD(filtros.capacidad)
  const etiquetaPoblacion =
    filtros.poblacion === "activa"
      ? "Activa"
      : filtros.poblacion === "pagada"
        ? "Pagada"
        : "Certificada"

  return (
    <div className="flex flex-col gap-4">
      <PobFiltros opciones={opciones} filtros={filtros} />
      <PobTarjetas
        capacidad={resumen.capacidad}
        poblacion={resumen.poblacion}
        ocupacion={resumen.ocupacion}
        conteo={resumen.conteo}
        categoria={filtros.categoria}
        etiquetaCapacidad={etiquetaCapacidad}
        etiquetaPoblacion={etiquetaPoblacion}
      />
      <PobTablaJerarquia
        nodos={arbolSede}
        titulo="País › Regional › Sede"
        primeraColumna="País / Regional / Sede"
        etiquetaCapacidad={etiquetaCapacidad}
        etiquetaPoblacion={etiquetaPoblacion}
      />
    </div>
  )
}
