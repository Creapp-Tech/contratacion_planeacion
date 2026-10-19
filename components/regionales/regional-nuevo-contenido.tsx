import { requireSuperadmin } from "@/lib/auth/session"

import { RegionalForm } from "./regional-form"

export async function RegionalNuevoContenido() {
  await requireSuperadmin()

  return <RegionalForm mode="crear" />
}
