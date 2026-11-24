import { requireAccesoModulo } from "@/lib/auth/session"
import {
  listCups,
  listGruposServicio,
  listOpcionesCups,
  listServiciosActivos,
  normalizarPaginacion,
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
  const usuario = await requireAccesoModulo()
  const puedeEditar = usuario.rol === "superadmin"

  const params = (await searchParams) ?? {}
  const filtros = {
    q: pick(params.q),
    capitulo: pick(params.capitulo),
    seccion: pick(params.seccion),
    grupo_id: pick(params.grupo),
    servicio_id: pick(params.servicio),
  }

  const { page, pageSize } = normalizarPaginacion(
    params.pagina,
    params.por_pagina
  )

  const [listado, grupos, servicios, opciones] = await Promise.all([
    listCups(filtros, { page, pageSize }),
    listGruposServicio(),
    listServiciosActivos(),
    listOpcionesCups(),
  ])

  const { rows: cups, total } = listado

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
        <CupsTarjetaTotal cups={total} filtrado={hayFiltros} />
        <SoloEscritura>
          <CupsHerramientas />
        </SoloEscritura>
      </div>

      <CupsListadoClient
        cups={cups}
        total={total}
        page={page}
        pageSize={pageSize}
        filtrado={hayFiltros}
        grupos={grupos}
        servicios={servicios}
        puedeEditar={puedeEditar}
      />
    </div>
  )
}
