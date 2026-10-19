import { notFound } from "next/navigation"

import { requireSuperadmin } from "@/lib/auth/session"
import { getServicio } from "@/lib/servicios/queries"

const fecha = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "long",
  timeStyle: "short",
})

export async function ServicioDetalleContenido({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireSuperadmin()

  const { id } = await params
  const servicio = await getServicio(id)

  if (!servicio) {
    notFound()
  }

  const creada = new Date(servicio.created_at)

  return (
    <dl className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <dt className="text-sm font-medium text-muted-foreground">Nombre</dt>
        <dd className="text-base">{servicio.nombre}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-sm font-medium text-muted-foreground">Grupo</dt>
        <dd className="text-base">{servicio.grupo ?? "—"}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-sm font-medium text-muted-foreground">
          Área relacionada
        </dt>
        <dd className="text-base">
          {servicio.area_nombre
            ? `${servicio.area_categoria ? `${servicio.area_categoria} · ` : ""}${servicio.area_nombre}`
            : "—"}
        </dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-sm font-medium text-muted-foreground">
          Tipo de personal
        </dt>
        <dd className="text-base">{servicio.tipo_personal}</dd>
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