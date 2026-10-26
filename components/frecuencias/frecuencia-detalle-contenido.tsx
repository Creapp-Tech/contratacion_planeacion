import { notFound } from "next/navigation"

import { requireSuperadmin } from "@/lib/auth/session"
import { getFrecuencia } from "@/lib/frecuencias/queries"
import {
  etiquetaTipoFrecuencia,
  tipoCalculaOcupacion,
} from "@/lib/frecuencias/tipos"

import { FrecuenciaServiciosFiltros } from "./frecuencia-servicios-filtros"

export async function FrecuenciaDetalleContenido({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireSuperadmin()

  const { id } = await params
  const frecuencia = await getFrecuencia(id)

  if (!frecuencia) {
    notFound()
  }

  const encabezado = [
    { label: "Nombre de la nota técnica", value: frecuencia.nombre_nota_tecnica },
    { label: "Tipo de frecuencia", value: etiquetaTipoFrecuencia(frecuencia.tipo_frecuencia) },
    { label: "Sede", value: frecuencia.sede_nombre },
    { label: "Régimen", value: frecuencia.regimen_nombre },
    { label: "Asegurador", value: frecuencia.asegurador_nombre },
    { label: "Versión", value: frecuencia.version },
    { label: "Regional", value: frecuencia.regional ?? "—" },
    { label: "Zonal", value: frecuencia.zonal ?? "—" },
  ]

  if (tipoCalculaOcupacion(frecuencia.tipo_frecuencia)) {
    encabezado.push({
      label: "Cálculo de ocupación",
      value: frecuencia.usar_en_calculo
        ? "En uso para el cálculo de ocupación"
        : "No se usa para el cálculo de ocupación",
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <dl className="grid gap-4 sm:grid-cols-2">
        {encabezado.map((item) => (
          <div key={item.label} className="flex flex-col gap-1">
            <dt className="text-sm font-medium text-muted-foreground">
              {item.label}
            </dt>
            <dd className="text-base">{item.value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold">Servicios</h2>
        <FrecuenciaServiciosFiltros servicios={frecuencia.servicios} />
      </div>
    </div>
  )
}
