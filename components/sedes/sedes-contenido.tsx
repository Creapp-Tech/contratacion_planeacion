import { requireAlcancePlaneacion } from "@/lib/auth/session"
import { puedeEditarPlaneacion } from "@/lib/constants/roles"
import {
  listOpcionesFiltros,
  listSedes,
  resumenSedes,
  type SedeFiltros,
} from "@/lib/sedes/queries"

import { SedeFiltros as SedeFiltrosBar } from "./sede-filtros"
import { SedesTabla } from "./sedes-tabla"
import { SedeHerramientas } from "./sede-herramientas"

const SIN_REGIONAL = "__sin_regional__"

function pick(value: string | string[] | undefined) {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

export async function SedesContenido({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const alcance = await requireAlcancePlaneacion()
  const params = await searchParams

  const filtros: SedeFiltros = {
    q: pick(params.q),
    departamento: pick(params.departamento),
    regional: alcance.verTodo
      ? pick(params.regional)
      : (alcance.regional ?? SIN_REGIONAL),
    marca: pick(params.marca),
    estado: pick(params.estado),
  }

  const [sedes, opciones] = await Promise.all([
    listSedes(filtros),
    listOpcionesFiltros(),
  ])

  const opcionesFiltradas = alcance.verTodo
    ? opciones
    : { ...opciones, regionales: alcance.regional ? [alcance.regional] : [] }

  return (
    <div className="flex flex-col gap-4">
      <SedeFiltrosBar opciones={opcionesFiltradas} filtros={filtros} />
      {alcance.usuario.rol === "superadmin" ? <SedeHerramientas /> : null}
      <SedesTabla
        sedes={sedes}
        resumen={resumenSedes(sedes)}
        puedeEditar={puedeEditarPlaneacion(alcance.usuario.rol)}
      />
    </div>
  )
}
