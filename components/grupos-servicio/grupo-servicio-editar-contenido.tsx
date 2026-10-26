import { notFound } from "next/navigation"

import { requireSuperadmin } from "@/lib/auth/session"
import { getGrupoServicio } from "@/lib/servicios/queries"

import { GrupoServicioForm } from "./grupo-servicio-form"

export async function GrupoServicioEditarContenido({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireSuperadmin()

  const { id } = await params
  const grupo = await getGrupoServicio(id)

  if (!grupo) {
    notFound()
  }

  return <GrupoServicioForm mode="editar" grupo={grupo} />
}
