import { requireSuperadmin } from "@/lib/auth/session"
import { listAreas } from "@/lib/areas/queries"
import { listCatalogos } from "@/lib/catalogos/queries"

import { ServicioForm } from "./servicio-form"

export async function ServicioNuevoContenido() {
  await requireSuperadmin()

  const [areas, tiposPersonal] = await Promise.all([
    listAreas(),
    listCatalogos("tipo_personal"),
  ])

  return (
    <ServicioForm
      mode="crear"
      areas={areas}
      tiposPersonal={tiposPersonal}
    />
  )
}