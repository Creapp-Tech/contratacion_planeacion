import { notFound } from "next/navigation"

import { requireSuperadmin } from "@/lib/auth/session"
import { getArea, listGrupos } from "@/lib/areas/queries"

import { AreaForm } from "./area-form"

export async function AreaEditarContenido({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireSuperadmin()

  const { id } = await params
  const [area, grupos] = await Promise.all([getArea(id), listGrupos()])

  if (!area) {
    notFound()
  }

  return <AreaForm mode="editar" area={area} grupos={grupos} />
}
