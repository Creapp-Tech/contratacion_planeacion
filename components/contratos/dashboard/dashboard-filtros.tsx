"use client"

import { RotateCcwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

import { MultiSelectFilter } from "./multi-select-filter"
import type {
  FiltrosDashboard,
  OpcionesFiltrosDashboard,
} from "./dashboard-utils"

export function DashboardFiltros({
  opciones,
  filtros,
  onCambiar,
  onLimpiar,
  hayFiltros,
}: {
  opciones: OpcionesFiltrosDashboard
  filtros: FiltrosDashboard
  onCambiar: (clave: keyof FiltrosDashboard, valores: string[]) => void
  onLimpiar: () => void
  hayFiltros: boolean
}) {
  return (
    <section
      aria-labelledby="dashboard-filtros"
      className="flex flex-col gap-3 rounded-xl border bg-card p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="dashboard-filtros"
            className="font-heading text-lg font-semibold"
          >
            Filtros
          </h2>
          <p className="text-sm text-muted-foreground">
            Aplican a las tarjetas, las gráficas y la tabla.
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={onLimpiar}
          disabled={!hayFiltros}
        >
          <RotateCcwIcon />
          Limpiar filtros
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <MultiSelectFilter
          id="filtro-pais"
          label="País"
          options={opciones.paises}
          value={filtros.paises}
          onChange={(valores) => onCambiar("paises", valores)}
          searchPlaceholder="Buscar país..."
        />

        <MultiSelectFilter
          id="filtro-legalizacion"
          label="Estado de legalización"
          options={opciones.legalizaciones}
          value={filtros.legalizaciones}
          onChange={(valores) => onCambiar("legalizaciones", valores)}
          searchPlaceholder="Buscar estado..."
        />

        <MultiSelectFilter
          id="filtro-regimen"
          label="Régimen"
          options={opciones.regimenes}
          value={filtros.regimenes}
          onChange={(valores) => onCambiar("regimenes", valores)}
          searchPlaceholder="Buscar régimen..."
        />

        <MultiSelectFilter
          id="filtro-aseguradora"
          label="Aseguradora (EPS)"
          options={opciones.aseguradoras}
          value={filtros.aseguradoras}
          onChange={(valores) => onCambiar("aseguradoras", valores)}
          searchPlaceholder="Buscar EPS..."
        />

        <MultiSelectFilter
          id="filtro-regional"
          label="Regional"
          options={opciones.regionales}
          value={filtros.regionales}
          onChange={(valores) => onCambiar("regionales", valores)}
          searchPlaceholder="Buscar regional..."
        />

        <MultiSelectFilter
          id="filtro-ejecucion"
          label="Estado de ejecución"
          options={opciones.estadosEjecucion}
          value={filtros.estadosEjecucion}
          onChange={(valores) => onCambiar("estadosEjecucion", valores)}
          searchPlaceholder="Buscar estado..."
        />
      </div>
    </section>
  )
}
