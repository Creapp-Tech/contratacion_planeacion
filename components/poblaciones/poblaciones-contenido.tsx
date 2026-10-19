import { requireAlcancePlaneacion } from "@/lib/auth/session"
import { puedeEditarPlaneacion } from "@/lib/constants/roles"
import {
  listPoblaciones,
  opcionesFiltrosPoblaciones,
  type PoblacionFiltros,
} from "@/lib/poblaciones/queries"

import { PoblacionFiltros as PoblacionFiltrosBar } from "./poblacion-filtros"
import { PoblacionesTabla } from "./poblaciones-tabla"
import { PoblacionHerramientas } from "./poblacion-herramientas"

const SIN_REGIONAL = "__sin_regional__"

function pick(value: string | string[] | undefined) {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

export async function PoblacionesContenido({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const alcance = await requireAlcancePlaneacion()
  const params = await searchParams

  const filtros: PoblacionFiltros = {
    regimen_id: pick(params.regimen_id),
    asegurador_eps_id: pick(params.asegurador_eps_id),
    regional: alcance.verTodo
      ? pick(params.regional)
      : (alcance.regional ?? SIN_REGIONAL),
    departamento: pick(params.departamento),
    municipio: pick(params.municipio),
  }

  const [filas, opciones] = await Promise.all([
    listPoblaciones(filtros),
    opcionesFiltrosPoblaciones(),
  ])

  const opcionesFiltradas = alcance.verTodo
    ? opciones
    : { ...opciones, regionales: alcance.regional ? [alcance.regional] : [] }

  return (
    <div className="flex flex-col gap-4">
      <PoblacionFiltrosBar opciones={opcionesFiltradas} filtros={filtros} />
      {alcance.usuario.rol === "superadmin" ? <PoblacionHerramientas /> : null}
      <PoblacionesTabla
        filas={filas}
        puedeEditar={puedeEditarPlaneacion(alcance.usuario.rol)}
      />
    </div>
  )
}
