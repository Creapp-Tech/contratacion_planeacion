import { requireSuperadmin } from "@/lib/auth/session"
import { listAseguradoresAdmin } from "@/lib/aseguradores/queries"

import { AseguradoresTabla } from "./aseguradores-tabla"

export async function AseguradoresContenido() {
  await requireSuperadmin()

  const aseguradores = await listAseguradoresAdmin()

  return <AseguradoresTabla aseguradores={aseguradores} />
}
