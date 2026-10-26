import { requireSuperadmin } from "@/lib/auth/session"
import { listAreas } from "@/lib/areas/queries"
import { listCatalogos } from "@/lib/catalogos/queries"
import { listGruposServicio, listServicios } from "@/lib/servicios/queries"

import { ServicioFiltros } from "./servicio-filtros"
import { ServicioHerramientas } from "./servicio-herramientas"
import { ServiciosTabla } from "./servicios-tabla"

function pick(value: string | string[] | undefined) {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

export async function ServiciosContenido({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireSuperadmin()

  const params = (await searchParams) ?? {}
  const filtros = {
    q: pick(params.q),
    grupo_id: pick(params.grupo),
    area_id: pick(params.area),
    tipo_personal: pick(params.tipo),
  }

  const [servicios, grupos, areas, tiposPersonal] = await Promise.all([
    listServicios(filtros),
    listGruposServicio(),
    listAreas(),
    listCatalogos("tipo_personal"),
  ])

  const hayFiltros = Boolean(
    filtros.q || filtros.grupo_id || filtros.area_id || filtros.tipo_personal
  )

  return (
    <div className="flex flex-col gap-4">
      <ServicioFiltros
        grupos={grupos}
        areas={areas}
        tiposPersonal={tiposPersonal}
        filtros={filtros}
      />
      <ServicioHerramientas
        tiposPersonal={tiposPersonal.map((tipo) => tipo.nombre)}
      />
      <ServiciosTabla servicios={servicios} filtrado={hayFiltros} />
    </div>
  )
}
