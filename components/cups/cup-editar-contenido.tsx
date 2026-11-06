import { notFound } from "next/navigation"

import { requireSuperadmin } from "@/lib/auth/session"
import { getCups } from "@/lib/cups/queries"

import { CupEditarForm } from "./cup-editar-form"

export async function CupEditarContenido({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireSuperadmin()

  const { id } = await params
  const cup = await getCups(id)

  if (!cup) {
    notFound()
  }

  return <CupEditarForm cup={cup} />
}
