import { notFound } from "next/navigation"

import { requireSuperadmin } from "@/lib/auth/session"
import { getAsegurador } from "@/lib/aseguradores/queries"

const fecha = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "long",
  timeStyle: "short",
})

export async function AseguradorDetalleContenido({
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

  const creado = new Date(asegurador.created_at)

  return (
    <dl className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <dt className="text-sm font-medium text-muted-foreground">Nombre</dt>
        <dd className="text-base">{asegurador.nombre_eps}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-sm font-medium text-muted-foreground">
          Fecha de creación
        </dt>
        <dd className="text-base">
          {Number.isNaN(creado.getTime()) ? "—" : fecha.format(creado)}
        </dd>
      </div>
    </dl>
  )
}
