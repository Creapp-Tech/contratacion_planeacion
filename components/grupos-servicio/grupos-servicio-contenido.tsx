import { requireAccesoModulo } from "@/lib/auth/session"
import { listGruposServicioAdmin } from "@/lib/servicios/queries"

import { GruposServicioTabla } from "./grupos-servicio-tabla"

export async function GruposServicioContenido() {
  await requireAccesoModulo()

  const grupos = await listGruposServicioAdmin()

  return <GruposServicioTabla grupos={grupos} />
}
