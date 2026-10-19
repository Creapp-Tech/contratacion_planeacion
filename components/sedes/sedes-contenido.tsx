import { requireSuperadmin } from "@/lib/auth/session"
import {
  listOpcionesFiltros,
  listSedes,
  resumenSedes,
  type SedeFiltros,
} from "@/lib/sedes/queries"

import { SedeFiltros as SedeFiltrosBar } from "./sede-filtros"
import { SedeHerramientas } from "./sede-herramientas"
import { SedesTabla } from "./sedes-tabla"

function pick(value: string | string[] | undefined) {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

export async function SedesContenido({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireSuperadmin()

  const params = await searchParams
  const filtros: SedeFiltros = {
    q: pick(params.q),
    departamento: pick(params.departamento),
    regional: pick(params.regional),
    marca: pick(params.marca),
    estado: pick(params.estado),
  }

  const [sedes, opciones] = await Promise.all([
    listSedes(filtros),
    listOpcionesFiltros(),
  ])

  return (
    <div className="flex flex-col gap-4">
      <SedeFiltrosBar opciones={opciones} filtros={filtros} />
      <SedeHerramientas />
      <SedesTabla sedes={sedes} resumen={resumenSedes(sedes)} />
    </div>
  )
}
