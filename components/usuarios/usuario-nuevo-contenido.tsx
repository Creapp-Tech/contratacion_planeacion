import { requireSuperadmin } from "@/lib/auth/session"
import { listRegionales } from "@/lib/usuarios/queries"

import { UsuarioForm } from "./usuario-form"

export async function UsuarioNuevoContenido() {
  await requireSuperadmin()

  const regionales = await listRegionales()

  return <UsuarioForm mode="crear" regionales={regionales} />
}
