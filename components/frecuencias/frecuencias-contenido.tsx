import { requireSuperadmin } from "@/lib/auth/session"
import {
  listFrecuencias,
  listOpcionesFiltrosFrecuencias,
  type FrecuenciaFiltros as FrecuenciaFiltrosTipo,
} from "@/lib/frecuencias/queries"

import { FrecuenciaFiltros } from "./frecuencia-filtros"
import { FrecuenciaHerramientas } from "./frecuencia-herramientas"
import { FrecuenciasTabla } from "./frecuencias-tabla"

function pick(value: string | string[] | undefined) {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

export async function FrecuenciasContenido({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireSuperadmin()

  const params = await searchParams
  const filtros: FrecuenciaFiltrosTipo = {
    q: pick(params.q),
    tipo_frecuencia: pick(params.tipo_frecuencia),
    sede_id: pick(params.sede_id),
    regional: pick(params.regional),
    regimen_id: pick(params.regimen_id),
    asegurador_eps_id: pick(params.asegurador_eps_id),
  }

  const [frecuencias, opciones] = await Promise.all([
    listFrecuencias(filtros),
    listOpcionesFiltrosFrecuencias(),
  ])

  return (
    <div className="flex flex-col gap-4">
      <FrecuenciaFiltros opciones={opciones} filtros={filtros} />
      <FrecuenciaHerramientas />
      <FrecuenciasTabla frecuencias={frecuencias} />
    </div>
  )
}
