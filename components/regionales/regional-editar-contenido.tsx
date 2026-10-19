import { notFound } from "next/navigation"

import { requireSuperadmin } from "@/lib/auth/session"
import { getRegional } from "@/lib/regionales/queries"

import { RegionalForm } from "./regional-form"

export async function RegionalEditarContenido({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireSuperadmin()

  const { id } = await params
  const regional = await getRegional(id)

  if (!regional) {
    notFound()
  }

  return <RegionalForm mode="editar" regional={regional} />
}
