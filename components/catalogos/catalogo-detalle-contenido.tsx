import { notFound } from "next/navigation"

import { requireSuperadmin } from "@/lib/auth/session"
import { CATALOGOS, type CatalogoDominio } from "@/lib/catalogos/dominios"
import { getCatalogo } from "@/lib/catalogos/queries"

const fecha = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "long",
  timeStyle: "short",
})

export async function CatalogoDetalleContenido({
  dominio,
  id,
}: {
  dominio: CatalogoDominio
  id: string
}) {
  await requireSuperadmin()

  const item = await getCatalogo(dominio, id)

  if (!item) {
    notFound()
  }

  const config = CATALOGOS[dominio]
  const creada = new Date(item.created_at)

  return (
    <dl className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <dt className="text-sm font-medium text-muted-foreground">Nombre</dt>
        <dd className="text-base">{item.nombre}</dd>
      </div>
      {config.usaDescripcion ? (
        <div className="flex flex-col gap-1">
          <dt className="text-sm font-medium text-muted-foreground">
            Descripción
          </dt>
          <dd className="text-base">{item.descripcion ?? "—"}</dd>
        </div>
      ) : null}
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
