import { notFound } from "next/navigation"

import { requireSuperadmin } from "@/lib/auth/session"
import { getAsegurador } from "@/lib/aseguradores/queries"

import { AseguradorForm } from "./asegurador-form"

export async function AseguradorEditarContenido({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireSuperadmin()

  const { id } = await params
  const asegurador = await getAsegurador(id)

  if (!asegurador) {
    notFound()
  }

  return <AseguradorForm mode="editar" asegurador={asegurador} />
}
