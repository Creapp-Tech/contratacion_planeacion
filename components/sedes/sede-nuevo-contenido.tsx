import { requireSuperadmin } from "@/lib/auth/session"
import {
  listAreasCatalogo,
  listAseguradores,
  listOpcionesCatalogo,
} from "@/lib/sedes/queries"

import { SedeForm } from "./sede-form"

export async function SedeNuevoContenido() {
  await requireSuperadmin()

  const [opciones, areasCatalogo, aseguradores] = await Promise.all([
    listOpcionesCatalogo(),
    listAreasCatalogo(),
    listAseguradores(),
  ])

  return (
    <SedeForm
      mode="crear"
      opciones={opciones}
      areasCatalogo={areasCatalogo}
      aseguradores={aseguradores}
    />
  )
}
