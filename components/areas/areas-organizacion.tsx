import Link from "next/link"
import { ExternalLinkIcon } from "lucide-react"
import { cn } from "cn"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import type { SedeOrganizacion } from "@/lib/areas/queries"

export function AreasOrganizacion({ sedes }: { sedes: SedeOrganizacion[] }) {
  if (sedes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        No hay sedes registradas.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {sedes.map((sede) => {
        const areas = sede.areas
        const agrupados = areas.reduce<Record<string, typeof areas>>(
          (mapa, area) => {
            if (!mapa[area.categoria]) {
              mapa[area.categoria] = []
            }
            mapa[area.categoria].push(area)
            return mapa
          },
          {}
        )

        const grupos = Object.entries(agrupados).sort(([a], [b]) =>
          a.localeCompare(b)
        )

        return (
          <Card key={sede.id}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-heading text-lg font-semibold">
                    {sede.nombre}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {sede.estado}
                  </span>
                </div>
                <Link
                  href={`/sedes/${sede.id}/editar`}
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                >
                  Organizar
                  <ExternalLinkIcon />
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {grupos.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay áreas asignadas a esta sede.
                </p>
              ) : (
                grupos.map(([grupo, items]) => {
                  const total = items.reduce(
                    (sum, area) => sum + area.medida * area.cantidad,
                    0
                  )
                  return (
                    <div key={grupo} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-muted-foreground">
                          {grupo}
                        </h3>
                        <span className="text-sm font-medium">{total}</span>
                      </div>
                      <ul className="flex flex-col gap-1 text-sm">
                        {items.map((area) => (
                          <li
                            key={area.id}
                            className="flex items-center justify-between gap-3"
                          >
                            <span>{area.nombre}</span>
                            <span className="text-muted-foreground">
                              {area.medida}
                              {area.cantidad > 1 ? ` × ${area.cantidad}` : null}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
