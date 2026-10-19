import { requireSuperadmin } from "@/lib/auth/session"
import { opcionesPoblaciones } from "@/lib/poblaciones/queries"

import { PoblacionForm } from "./poblacion-form"

export async function PoblacionNuevoContenido() {
  await requireSuperadmin()

  const opciones = await opcionesPoblaciones()

  return <PoblacionForm mode="crear" opciones={opciones} />
}
