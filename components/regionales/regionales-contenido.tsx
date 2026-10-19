import { requireSuperadmin } from "@/lib/auth/session"
import { listRegionales } from "@/lib/regionales/queries"

import { RegionalesTabla } from "./regionales-tabla"

export async function RegionalesContenido() {
  await requireSuperadmin()

  const regionales = await listRegionales()

  return <RegionalesTabla regionales={regionales} />
}
