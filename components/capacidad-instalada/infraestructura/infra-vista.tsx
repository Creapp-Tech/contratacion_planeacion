import Link from "next/link"
import { DownloadIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import {
  resumenInfraestructura,
  type FiltrosInfra,
  type OpcionesInfra,
} from "@/lib/capacidad/agregaciones"
import type { FrecuenciaAreaCruda, SedeInfraCruda } from "@/lib/capacidad/queries"
import { cn } from "cn"

import { InfraFiltros } from "./infra-filtros"
import { InfraFrecuenciasSede } from "./infra-frecuencias-sede"
import { InfraTabla } from "./infra-tabla"
import { InfraTarjetas } from "./infra-tarjetas"

export function InfraVista({
  sedes,
  frecuencias,
  opciones,
  filtros,
}: {
  sedes: SedeInfraCruda[]
  frecuencias: FrecuenciaAreaCruda[]
  opciones: OpcionesInfra
  filtros: FiltrosInfra
}) {
  const resumen = resumenInfraestructura(sedes, frecuencias, filtros)

  const parametros = new URLSearchParams()
  if (filtros.regional) parametros.set("i_regional", filtros.regional)
  if (filtros.sede) parametros.set("i_sede", filtros.sede)
  const exportHref = `/capacidad-instalada/exportar${
    parametros.size > 0 ? `?${parametros.toString()}` : ""
  }`

  return (
    <div className="flex flex-col gap-4">
      <InfraFiltros opciones={opciones} filtros={filtros} />
      <InfraTarjetas
        resumen={resumen}
        personalizada={
          filtros.tipoPoblacion === "personalizada"
            ? filtros.personalizada
            : null
        }
      />
      <div className="flex justify-end">
        <Link
          href={exportHref}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <DownloadIcon />
          Exportar frecuencias por sede
        </Link>
      </div>
      <InfraTabla
        areas={resumen.areas}
        hayAreasDisponibles={opciones.areas.length > 0}
      />
      <InfraFrecuenciasSede sedes={resumen.sedes} />
    </div>
  )
}
