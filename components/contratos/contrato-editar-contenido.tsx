import { notFound } from "next/navigation"

import {
  alcanceContratos,
  requireEditorContratacion,
} from "@/lib/auth/session"
import {
  getContrato,
  listOpcionesContrato,
} from "@/lib/contratos/queries"

import { ContratoForm } from "./contrato-form"

export async function ContratoEditarContenido({
  params,
  volverA,
}: {
  params: Promise<{ id: string }>
  volverA?: string
}) {
  const usuario = await requireEditorContratacion()
  const alcance = alcanceContratos(usuario)
  const { id } = await params

  const [contrato, opciones] = await Promise.all([
    getContrato(id, alcance),
    listOpcionesContrato(alcance),
  ])

  if (!contrato) {
    notFound()
  }

  return (
    <ContratoForm
      mode="editar"
      contrato={contrato}
      opciones={opciones}
      volverA={volverA}
    />
  )
}
