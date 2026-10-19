import { requireSuperadmin } from "@/lib/auth/session"
import { listPlantilla } from "@/lib/plantilla/queries"

function pick(value: string | string[] | undefined) {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

export async function PlantillaContenido({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireSuperadmin()

  const params = await searchParams
  const filtros = {
    q: pick(params.q),
  }

  const plantilla = await listPlantilla(filtros)

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border bg-card p-4">
        {plantilla.length === 0 && (
          <p className="text-muted-foreground">No hay registros.</p>
        )}
        {plantilla.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 border-b">
            <span>{item.nombre}</span>
            <small className="text-xs text-muted-foreground">{item.descripcion || ""}</small>
          </div>
        ))}
      </div>
    </div>
  )
}
