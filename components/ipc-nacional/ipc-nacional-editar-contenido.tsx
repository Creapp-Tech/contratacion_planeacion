import { notFound } from "next/navigation"

import { requireSuperadmin } from "@/lib/auth/session"
import { getIpcNacional } from "@/lib/ipc/queries"

import { IpcNacionalForm } from "./ipc-nacional-form"

export async function IpcNacionalEditarContenido({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireSuperadmin()

  const { id } = await params
  const registro = await getIpcNacional(id)

  if (!registro) {
    notFound()
  }

  return <IpcNacionalForm mode="editar" registro={registro} />
}
