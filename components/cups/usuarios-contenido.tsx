import { requireSuperadmin } from "@/lib/auth/session"
import { listCups, listGruposServicio } from "@/lib/cups/queries"
import { Card } from "@/components/ui/card"
import { CupsFiltros } from "./cups-filtros"
import { CupsTabla } from "./cups-tabla"
import { CupsHerramientas } from "./cups-herramientas"
import { CupsTarjetaTotal } from "./cups-tarjeta-total"
import { CupsListadoClient } from "./cups-listado-client"

function pick(value: string | string[] | undefined) {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

export async function CupsContenido({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireSuperadmin()

  const params = (await searchParams) ?? {}
  const filtros = {
    q: pick(params.q),
    seccion: pick(params.seccion),
    version: pick(params.version),
    grupo_id: pick(params.grupo),
    servicio_id: pick(params.servicio),
    activo: pick(params.activo) === "true" ? true : pick(params.activo) === "false" ? false : undefined,
  }

  const [cups, grupos] = await Promise.all([
    listCups(filtros),
    listGruposServicio(),
  ])

  const hayFiltros = Boolean(filtros.q || filtros.seccion || filtros.version || filtros.grupo_id || filtros.servicio_id)

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CupsFiltros
          grupos={grupos}
          q={filtros.q}
          seccion={filtros.seccion}
          version={filtros.version}
          activo={filtros.activo}
          grupo_id={filtros.grupo_id}
          servicio_id={filtros.servicio_id}
        />
      </Card>

      <div className="flex items-center justify-between gap-4">
        <CupsTarjetaTotal cups={cups.length} />
        <CupsListadoClient cups={cups} filtrado={hayFiltros && cups.length === 0} />
      </div>

      <CupsHerramientas />
    </div>
  )
}
