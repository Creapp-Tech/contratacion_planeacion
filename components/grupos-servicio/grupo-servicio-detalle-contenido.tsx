import { notFound } from "next/navigation"

import { requireSuperadmin } from "@/lib/auth/session"
import { getGrupoServicio } from "@/lib/servicios/queries"
import { Badge } from "@/components/ui/badge"

const fecha = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "long",
  timeStyle: "short",
})

export async function GrupoServicioDetalleContenido({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireSuperadmin()

  const { id } = await params
  const grupo = await getGrupoServicio(id)

  if (!grupo) {
    notFound()
  }

  const creada = new Date(grupo.created_at)

  return (
    <dl className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <dt className="text-sm font-medium text-muted-foreground">
          Nombre del grupo
        </dt>
        <dd className="text-base">{grupo.nombre}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-sm font-medium text-muted-foreground">Estado</dt>
        <dd className="text-base">
          {grupo.activo ? (
            <Badge variant="outline">Activo</Badge>
          ) : (
            <Badge variant="secondary">Inactivo</Badge>
          )}
        </dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-sm font-medium text-muted-foreground">
          Servicios con este grupo
        </dt>
        <dd className="text-base">{grupo.servicios_count}</dd>
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
