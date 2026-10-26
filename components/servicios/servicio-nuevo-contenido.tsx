import { requireSuperadmin } from "@/lib/auth/session"
import { listAreas } from "@/lib/areas/queries"
import { listCatalogos } from "@/lib/catalogos/queries"
import { listGruposServicio } from "@/lib/servicios/queries"

import { ServicioForm } from "./servicio-form"

export async function ServicioNuevoContenido() {
  await requireSuperadmin()

  const [areas, grupos, tiposPersonal] = await Promise.all([
    listAreas(),
    listGruposServicio(),
    listCatalogos("tipo_personal"),
  ])

  return (
    <ServicioForm
      mode="crear"
      areas={areas}
      grupos={grupos}
      tiposPersonal={tiposPersonal}
    />
  )
}