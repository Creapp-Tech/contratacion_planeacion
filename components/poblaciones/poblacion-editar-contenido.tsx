import { notFound } from "next/navigation"

import { requireSuperadmin } from "@/lib/auth/session"
import { getPoblacion, opcionesPoblaciones } from "@/lib/poblaciones/queries"

import { PoblacionForm } from "./poblacion-form"

export async function PoblacionEditarContenido({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireSuperadmin()

  const { id } = await params
  const [poblacion, opciones] = await Promise.all([
    getPoblacion(id),
    opcionesPoblaciones(),
  ])

  if (!poblacion) {
    notFound()
  }

  if (!opciones.sedes.some((sede) => sede.id === poblacion.sede_id)) {
    opciones.sedes = [
      {
        id: poblacion.sede_id,
        nombre: `${poblacion.sedes?.nombre ?? "Sede"} (inactiva)`,
      },
      ...opciones.sedes,
    ]
  }

  if (
    poblacion.asegurador_eps_id &&
    !opciones.aseguradores.some(
      (eps) => eps.id === poblacion.asegurador_eps_id
    )
  ) {
    opciones.aseguradores = [
      {
        id: poblacion.asegurador_eps_id,
        nombre_eps: `${
          poblacion.aseguradores_eps?.nombre_eps ?? "Asegurador"
        } (inactivo)`,
      },
      ...opciones.aseguradores,
    ]
  }

  return (
    <PoblacionForm mode="editar" opciones={opciones} poblacion={poblacion} />
  )
}
