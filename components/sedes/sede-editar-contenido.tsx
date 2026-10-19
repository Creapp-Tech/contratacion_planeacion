import { notFound } from "next/navigation"

import {
  puedeGestionarRegional,
  requireEditorPlaneacion,
} from "@/lib/auth/session"
import {
  getSede,
  listAreasCatalogo,
  listAseguradores,
  listOpcionesCatalogo,
} from "@/lib/sedes/queries"

import { SedeForm } from "./sede-form"

export async function SedeEditarContenido({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const usuario = await requireEditorPlaneacion()

  const { id } = await params
  const [sede, opciones, areasCatalogo, aseguradores] = await Promise.all([
    getSede(id),
    listOpcionesCatalogo(),
    listAreasCatalogo(),
    listAseguradores(),
  ])

  if (!sede) {
    notFound()
  }

  if (!(await puedeGestionarRegional(usuario, sede.regional))) {
    notFound()
  }

  return (
    <SedeForm
      mode="editar"
      sede={sede}
      opciones={opciones}
      areasCatalogo={areasCatalogo}
      aseguradores={aseguradores}
    />
  )
}
