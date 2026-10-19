import { requireSuperadmin } from "@/lib/auth/session"
import { listCatalogos } from "@/lib/catalogos/queries"
import { listServicios } from "@/lib/servicios/queries"

import { ServicioHerramientas } from "./servicio-herramientas"
import { ServiciosTabla } from "./servicios-tabla"

export async function ServiciosContenido() {
  await requireSuperadmin()

  const [servicios, tiposPersonal] = await Promise.all([
    listServicios(),
    listCatalogos("tipo_personal"),
  ])

  return (
    <div className="flex flex-col gap-4">
      <ServicioHerramientas
        tiposPersonal={tiposPersonal.map((tipo) => tipo.nombre)}
      />
      <ServiciosTabla servicios={servicios} />
    </div>
  )
}