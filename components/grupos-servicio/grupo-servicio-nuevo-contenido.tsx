import { requireSuperadmin } from "@/lib/auth/session"

import { GrupoServicioForm } from "./grupo-servicio-form"

export async function GrupoServicioNuevoContenido() {
  await requireSuperadmin()

  return <GrupoServicioForm mode="crear" />
}
