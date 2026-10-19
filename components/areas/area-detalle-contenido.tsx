import { notFound } from "next/navigation"

import { requireSuperadmin } from "@/lib/auth/session"
import { getArea } from "@/lib/areas/queries"
import { Badge } from "@/components/ui/badge"

const fecha = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "long",
  timeStyle: "short",
})

export async function AreaDetalleContenido({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireSuperadmin()

  const { id } = await params
  const area = await getArea(id)

  if (!area) {
    notFound()
  }

  const creada = new Date(area.created_at)

  return (
    <dl className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <dt className="text-sm font-medium text-muted-foreground">Grupo</dt>
        <dd className="text-base">{area.categoria}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-sm font-medium text-muted-foreground">
          Nombre del área
        </dt>
        <dd className="text-base">{area.nombre}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-sm font-medium text-muted-foreground">Medida</dt>
        <dd className="text-base">{area.medida}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-sm font-medium text-muted-foreground">
          ¿Mide capacidad?
        </dt>
        <dd className="text-base">
          {area.mide_capacidad_ocupacion ? (
            <Badge variant="outline">Sí</Badge>
          ) : (
            <Badge variant="secondary">No</Badge>
          )}
        </dd>
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
