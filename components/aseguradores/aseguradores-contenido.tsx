import { requireAccesoModulo } from "@/lib/auth/session"
import { listAseguradoresAdmin } from "@/lib/aseguradores/queries"

import { AseguradoresTabla } from "./aseguradores-tabla"

export async function AseguradoresContenido() {
  await requireAccesoModulo()

  const aseguradores = await listAseguradoresAdmin()

  return <AseguradoresTabla aseguradores={aseguradores} />
}
