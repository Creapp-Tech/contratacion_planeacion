import { notFound } from "next/navigation"

import { requireSuperadmin } from "@/lib/auth/session"
import { getRegional } from "@/lib/regionales/queries"

const fecha = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "long",
  timeStyle: "short",
})

export async function RegionalDetalleContenido({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireSuperadmin()

  const { id } = await params
  const regional = await getRegional(id)

  if (!regional) {
    notFound()
  }

  const creada = new Date(regional.created_at)

  return (
    <dl className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <dt className="text-sm font-medium text-muted-foreground">Nombre</dt>
        <dd className="text-base">{regional.nombre}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-sm font-medium text-muted-foreground">
          Fecha de creación
        </dt>
        <dd className="text-base">
          {Number.isNaN(creada.getTime()) ? "—" : fecha.format(creada)}
        </dd>
      </div>
    </dl>
  )
}
