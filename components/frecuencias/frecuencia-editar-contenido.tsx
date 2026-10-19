import { notFound } from "next/navigation"

import { requireSuperadmin } from "@/lib/auth/session"
import { getFrecuencia } from "@/lib/frecuencias/queries"
import { listRegimenes } from "@/lib/regimenes/queries"
import { listAseguradores, listSedesOpciones } from "@/lib/sedes/queries"
import { listServiciosOpciones } from "@/lib/servicios/queries"

import { FrecuenciaForm } from "./frecuencia-form"

export async function FrecuenciaEditarContenido({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireSuperadmin()

  const { id } = await params
  const [frecuencia, sedes, regimenes, aseguradores, servicios] =
    await Promise.all([
      getFrecuencia(id),
      listSedesOpciones(),
      listRegimenes(),
      listAseguradores(),
      listServiciosOpciones(),
    ])

  if (!frecuencia) {
    notFound()
  }

  return (
    <FrecuenciaForm
      mode="editar"
      frecuencia={frecuencia}
      opciones={{
        sedes: sedes.map((sede) => ({ id: sede.id, nombre: sede.nombre })),
        regimenes: regimenes.map((regimen) => ({
          id: regimen.id,
          nombre: regimen.nombre,
        })),
        aseguradores: aseguradores.map((asegurador) => ({
          id: asegurador.id,
          nombre: asegurador.nombre_eps,
        })),
        servicios,
      }}
    />
  )
}
