import { notFound } from "next/navigation"

import { requireSuperadmin } from "@/lib/auth/session"
import { getPoblacion } from "@/lib/poblaciones/queries"

function Dato({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex flex-col gap-1 border-b py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-4">
      <dt className="w-48 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  )
}

function numero(value: number | null) {
  return value == null ? "—" : new Intl.NumberFormat("es-CO").format(value)
}

function formatearFecha(fecha: string | null) {
  if (!fecha) return "—"
  const partes = fecha.split("-")
  if (partes.length !== 3) return fecha
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "long" }).format(
    new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]))
  )
}

export async function PoblacionDetalleContenido({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireSuperadmin()

  const { id } = await params
  const poblacion = await getPoblacion(id)

  if (!poblacion) {
    notFound()
  }

  return (
    <dl className="flex flex-col">
      <Dato label="Sede" value={poblacion.sedes?.nombre ?? "—"} />
      <Dato label="Regional" value={poblacion.sedes?.regional ?? "—"} />
      <Dato label="Zonal" value={poblacion.sedes?.zonal ?? "—"} />
      <Dato
        label="Asegurador"
        value={poblacion.aseguradores_eps?.nombre_eps ?? "—"}
      />
      <Dato label="Régimen" value={poblacion.regimenes?.nombre ?? "—"} />
      <Dato label="Población activa" value={numero(poblacion.poblacion_activa)} />
      <Dato label="Población pagada" value={numero(poblacion.poblacion_pagada)} />
      <Dato
        label="Población certificada"
        value={numero(poblacion.poblacion_certificada)}
      />
      <Dato
        label="Fecha de actualización"
        value={formatearFecha(poblacion.fecha_actualizacion)}
      />
    </dl>
  )
}
