import { notFound } from "next/navigation"

import { requireSuperadmin } from "@/lib/auth/session"
import { listAreas } from "@/lib/areas/queries"
import { listCatalogos } from "@/lib/catalogos/queries"
import { getServicio, listGruposServicio } from "@/lib/servicios/queries"

import { ServicioForm } from "./servicio-form"

export async function ServicioEditarContenido({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireSuperadmin()

  const { id } = await params
  const [servicio, areas, grupos, tiposPersonal] = await Promise.all([
    getServicio(id),
    listAreas(),
    listGruposServicio(),
    listCatalogos("tipo_personal"),
  ])

  if (!servicio) {
    notFound()
  }

  return (
    <ServicioForm
      mode="editar"
      servicio={servicio}
      areas={areas}
      grupos={grupos}
      tiposPersonal={tiposPersonal}
    />
  )
}