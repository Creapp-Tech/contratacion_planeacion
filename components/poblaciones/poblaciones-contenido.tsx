import { requireSuperadmin } from "@/lib/auth/session"
import {
  listPoblaciones,
  opcionesFiltrosPoblaciones,
  type PoblacionFiltros,
} from "@/lib/poblaciones/queries"

import { PoblacionFiltros as PoblacionFiltrosBar } from "./poblacion-filtros"
import { PoblacionesTabla } from "./poblaciones-tabla"
import { PoblacionHerramientas } from "./poblacion-herramientas"

function pick(value: string | string[] | undefined) {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

export async function PoblacionesContenido({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireSuperadmin()

  const params = await searchParams
  const filtros: PoblacionFiltros = {
    regimen_id: pick(params.regimen_id),
    asegurador_eps_id: pick(params.asegurador_eps_id),
    regional: pick(params.regional),
    municipio: pick(params.municipio),
    departamento: pick(params.departamento),
  }

  const [filas, opciones] = await Promise.all([
    listPoblaciones(filtros),
    opcionesFiltrosPoblaciones(),
  ])

  return (
    <div className="flex flex-col gap-4">
      <PoblacionFiltrosBar opciones={opciones} filtros={filtros} />
      <PoblacionHerramientas />
      <PoblacionesTabla filas={filas} />
    </div>
  )
}
