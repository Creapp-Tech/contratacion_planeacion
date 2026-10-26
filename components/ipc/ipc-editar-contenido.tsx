import { notFound } from "next/navigation"

import {
  alcanceContratos,
  requireAccesoContratacion,
} from "@/lib/auth/session"
import { getIpcRegistro, listContratosIpc } from "@/lib/ipc/queries"

import { IpcForm } from "./ipc-form"

export async function IpcEditarContenido({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const usuario = await requireAccesoContratacion()
  const alcance = alcanceContratos(usuario)
  const { id } = await params

  const [registro, contratos] = await Promise.all([
    getIpcRegistro(id, alcance),
    listContratosIpc(alcance),
  ])

  if (!registro) {
    notFound()
  }

  return (
    <IpcForm mode="editar" registro={registro} contratos={contratos} />
  )
}
