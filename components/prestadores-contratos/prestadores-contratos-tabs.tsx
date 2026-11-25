"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "cn"

export type TabPrestadoresContratos =
  | "resumen"
  | "contratos"
  | "servicios"
  | "sedes"
  | "novedades"
  | "historial"

const TABS: { id: TabPrestadoresContratos; etiqueta: string }[] = [
  { id: "resumen", etiqueta: "Resumen" },
  { id: "contratos", etiqueta: "Contratos" },
  { id: "servicios", etiqueta: "Servicios CUPS" },
  { id: "sedes", etiqueta: "Sedes" },
  { id: "novedades", etiqueta: "Novedades" },
  { id: "historial", etiqueta: "Historial" },
]

export function PrestadoresContratosTabs({
  activa,
  contratos,
  servicios,
  sedes,
  novedades,
}: {
  activa: TabPrestadoresContratos
  contratos: number
  servicios: number
  sedes: number
  novedades: number
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const conteos: Record<string, number> = {
    contratos,
    servicios,
    sedes,
    novedades,
  }

  function crearHref(tab: TabPrestadoresContratos) {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === "resumen") {
      params.delete("tab")
    } else {
      params.set("tab", tab)
    }
    const query = params.toString()
    return query ? `${pathname}?${query}` : pathname
  }

  return (
    <div className="flex gap-1 overflow-x-auto border-b">
      {TABS.map((tab) => {
        const seleccionada = tab.id === activa
        return (
          <Link
            key={tab.id}
            href={crearHref(tab.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              seleccionada
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.etiqueta}
            {conteos[tab.id] ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs",
                  seleccionada
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {conteos[tab.id]}
              </span>
            ) : null}
          </Link>
        )
      })}
    </div>
  )
}
