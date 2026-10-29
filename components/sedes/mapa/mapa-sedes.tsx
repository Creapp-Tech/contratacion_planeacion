"use client"

import dynamic from "next/dynamic"

import { Skeleton } from "@/components/ui/skeleton"
import type { SedeMapa } from "@/lib/sedes/ocupacion-utils"

const MapaLeaflet = dynamic(() => import("./mapa-leaflet"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
})

const LEYENDA = [
  { color: "#f59e0b", texto: "Cerca del limite (>80%)" },
  { color: "#22c55e", texto: "Óptima (<80%)" },
  { color: "#ef4444", texto: "Sin Capacidad (≥100%)" },
  { color: "#9ca3af", texto: "Sin datos" },
]

function Vacio({ mensaje }: { mensaje: string }) {
  return (
    <div className="flex h-[520px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
      <span>{mensaje}</span>
    </div>
  )
}

export function MapaSedes({ sedes }: { sedes: SedeMapa[] }) {
  if (sedes.length === 0) {
    return (
      <Vacio mensaje="No hay sedes para los filtros seleccionados." />
    )
  }

  const conUbicacion = sedes.some(
    (sede) => sede.latitud != null && sede.longitud != null
  )

  if (!conUbicacion) {
    return (
      <Vacio mensaje="Las sedes filtradas no tienen coordenadas registradas." />
    )
  }

  return (
    <div className="relative isolate h-[520px] overflow-hidden rounded-xl border">
      <MapaLeaflet sedes={sedes} />

      <div className="absolute bottom-3 left-3 z-[1000] rounded-lg border bg-background/95 px-3 py-2 shadow-sm">
        <p className="mb-1 text-[11px] font-medium text-muted-foreground">
          Ocupación
        </p>
        <ul className="flex flex-col gap-0.5 text-[11px]">
          {LEYENDA.map((item) => (
            <li key={item.texto} className="flex items-center gap-1.5">
              <span
                className="inline-block size-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.texto}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
