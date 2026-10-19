import { requireAlcancePlaneacion } from "@/lib/auth/session"
import {
  listSedesMapa,
  opcionesMapa,
  resumenMapa,
  type MapaFiltros,
  type OpcionesMapa,
  type SedeMapa,
} from "@/lib/sedes/ocupacion"

import {
  TarjetaOcupacionGlobal,
  TarjetaOcupacionPorSede,
} from "./mapa-graficos"
import { MapaFiltros as MapaFiltrosBar } from "./mapa-filtros"
import { MapaSedes } from "./mapa-sedes"
import { MapaTarjetas } from "./mapa-tarjetas"

const SIN_REGIONAL = "__sin_regional__"

function pick(value: string | string[] | undefined) {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

function unicos(valores: (string | null)[]) {
  return [
    ...new Set(valores.filter((valor): valor is string => Boolean(valor))),
  ].sort((a, b) => a.localeCompare(b))
}

function opcionesDesdeSedes(sedes: SedeMapa[]): OpcionesMapa {
  return {
    regionales: unicos(sedes.map((sede) => sede.regional)),
    zonales: unicos(sedes.map((sede) => sede.zonal)),
    marcas: unicos(sedes.map((sede) => sede.marca)),
    tiposIps: unicos(sedes.map((sede) => sede.tipo_ips)),
    departamentos: unicos(sedes.map((sede) => sede.departamento)),
    municipios: unicos(sedes.map((sede) => sede.municipio)),
    aseguradores: [],
    sedes: sedes.map((sede) => ({ id: sede.id, nombre: sede.nombre })),
  }
}

export async function SedesMapaContenido({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const alcance = await requireAlcancePlaneacion()
  const params = await searchParams

  const filtros: MapaFiltros = {
    regional: alcance.verTodo
      ? pick(params.regional)
      : (alcance.regional ?? SIN_REGIONAL),
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

  const opcionesFiltradas: OpcionesMapa = alcance.verTodo
    ? opciones
    : {
        ...opcionesDesdeSedes(sedes),
        regionales: alcance.regional ? [alcance.regional] : [],
        aseguradores: opciones.aseguradores,
      }

  return (
    <div className="flex flex-col gap-4">
      <MapaFiltrosBar opciones={opcionesFiltradas} filtros={filtros} />
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
