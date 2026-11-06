import { requireAccesoModulo } from "@/lib/auth/session"
import {
  listCups,
  listGruposServicio,
  listOpcionesCups,
} from "@/lib/cups/queries"
import { Card, CardContent } from "@/components/ui/card"
import { CupsFiltros } from "./cups-filtros"
import { CupsHerramientas } from "./cups-herramientas"
import { CupsTarjetaTotal } from "./cups-tarjeta-total"
import { CupsListadoClient } from "./cups-listado-client"
import { SoloEscritura } from "@/components/auth/permisos-provider"

function pick(value: string | string[] | undefined) {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

export async function CupsContenido({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireAccesoModulo()

  const params = (await searchParams) ?? {}
  const filtros = {
    q: pick(params.q),
    capitulo: pick(params.capitulo),
    seccion: pick(params.seccion),
    grupo_id: pick(params.grupo),
    servicio_id: pick(params.servicio),
  }

  const [cups, grupos, opciones] = await Promise.all([
    listCups(filtros),
    listGruposServicio(),
    listOpcionesCups(),
  ])

  const hayFiltros = Boolean(
    filtros.q ||
      filtros.capitulo ||
      filtros.seccion ||
      filtros.grupo_id ||
      filtros.servicio_id
  )

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent>
          <CupsFiltros
            grupos={grupos}
            capitulos={opciones.capitulos}
            secciones={opciones.secciones}
            q={filtros.q}
            capitulo={filtros.capitulo}
            seccion={filtros.seccion}
            grupo_id={filtros.grupo_id}
            servicio_id={filtros.servicio_id}
          />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <CupsTarjetaTotal cups={cups.length} filtrado={hayFiltros} />
        <SoloEscritura>
          <CupsHerramientas />
        </SoloEscritura>
      </div>

      <CupsListadoClient cups={cups} filtrado={hayFiltros} />
    </div>
  )
}
