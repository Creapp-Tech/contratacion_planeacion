import { requireSuperadmin } from "@/lib/auth/session"

import { AseguradorForm } from "./asegurador-form"

export async function AseguradorNuevoContenido() {
  await requireSuperadmin()

  return <AseguradorForm mode="crear" />
}
