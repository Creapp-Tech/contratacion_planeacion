import { notFound } from "next/navigation"

import { requireSuperadmin } from "@/lib/auth/session"
import { getUsuario, listRegionales } from "@/lib/usuarios/queries"

import { UsuarioForm } from "./usuario-form"

export async function UsuarioEditarContenido({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireSuperadmin()

  const { id } = await params
  const [regionales, usuario] = await Promise.all([
    listRegionales(),
    getUsuario(id),
  ])

  if (!usuario) {
    notFound()
  }

  return <UsuarioForm mode="editar" regionales={regionales} usuario={usuario} />
}
