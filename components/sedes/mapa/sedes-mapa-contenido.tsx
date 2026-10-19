import { requireSuperadmin } from "@/lib/auth/session"
import {
  listSedesMapa,
  opcionesMapa,
  resumenMapa,
  type MapaFiltros,
} from "@/lib/sedes/ocupacion"

import {
  TarjetaOcupacionGlobal,
  TarjetaOcupacionPorSede,
} from "./mapa-graficos"
import { MapaFiltros as MapaFiltrosBar } from "./mapa-filtros"
import { MapaSedes } from "./mapa-sedes"
import { MapaTarjetas } from "./mapa-tarjetas"

function pick(value: string | string[] | undefined) {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

export async function SedesMapaContenido({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireSuperadmin()

  const params = await searchParams
  const filtros: MapaFiltros = {
    regional: pick(params.regional),
    zonal: pick(params.zonal),
    marca: pick(params.marca),
    tipoIps: pick(params.tipoIps),
    departamento: pick(params.departamento),
    municipio: pick(params.municipio),
    asegurador: pick(params.asegurador),
    sede: pick(params.sede),
  }

  const [sedes, opciones] = await Promise.all([
    listSedesMapa(filtros),
    opcionesMapa(),
  ])

  return (
    <div className="flex flex-col gap-4">
      <MapaFiltrosBar opciones={opciones} filtros={filtros} />
      <MapaTarjetas resumen={resumenMapa(sedes)} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MapaSedes sedes={sedes} />
        </div>
        <div className="lg:col-span-1">
          <TarjetaOcupacionGlobal sedes={sedes} />
        </div>
      </div>
      <TarjetaOcupacionPorSede sedes={sedes} />
    </div>
  )
}
