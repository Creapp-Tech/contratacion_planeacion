import { requireAccesoPlaneacion } from "@/lib/auth/session"
import { listAreas, listGrupos } from "@/lib/areas/queries"

import { AreasTabla } from "./areas-tabla"
import { GrupoHerramientas } from "./grupo-herramientas"
import { SoloEscritura } from "@/components/auth/permisos-provider"

export async function AreasContenido() {
  await requireAccesoPlaneacion()

  const [areas, grupos] = await Promise.all([listAreas(), listGrupos()])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-semibold">Catálogo de áreas</h2>
          <p className="text-sm text-muted-foreground">
            Define el catálogo de áreas con grupo, medida y si mide capacidad.
          </p>
        </div>
        <SoloEscritura>
          <GrupoHerramientas grupos={grupos} />
        </SoloEscritura>
      </div>
      <AreasTabla areas={areas} />
    </div>
  )
}
