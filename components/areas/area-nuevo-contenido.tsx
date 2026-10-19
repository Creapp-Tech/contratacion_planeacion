import { requireSuperadmin } from "@/lib/auth/session"

import { AreaForm } from "./area-form"
import { listGrupos } from "@/lib/areas/queries"

export async function AreaNuevoContenido() {
  await requireSuperadmin()
  const grupos = await listGrupos()
  return <AreaForm mode="crear" grupos={grupos} />
}
