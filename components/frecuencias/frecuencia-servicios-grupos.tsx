"use client"

import { useMemo, useCallback } from "react"
import { ChevronRightIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { FrecuenciaServicio } from "@/lib/frecuencias/queries"

import { FrecuenciaServicioFila } from "./frecuencia-servicio-fila"

const SIN_GRUPO = "Sin grupo"

function formatear(valor: number) {
  return new Intl.NumberFormat("es-CO", { minimumFractionDigits: 8, maximumFractionDigits: 8 }).format(
    valor
  )
}

type Grupo = {
  nombre: string
  servicios: FrecuenciaServicio[]
  total: number
}

function filtrarServicios(
  servicios: FrecuenciaServicio[],
  q: string,
  servicio_grupo: string | null,
  area_nombre: string | null,
  tipo_personal: string | null
): FrecuenciaServicio[] {
  return servicios.filter((servicio) => {
    const coincideBusqueda =
      q === "" ||
      servicio.servicio_nombre.toLowerCase().includes(q.toLowerCase())

    const coincideGrupo =
      servicio_grupo === null ||
      servicio.servicio_grupo === servicio_grupo

    const coincideArea =
      area_nombre === null ||
      (servicio.area_nombre?.toLowerCase().includes(area_nombre.toLowerCase()) &&
        servicio.area_categoria?.toLowerCase().includes(area_nombre.toLowerCase()))

    const coincideTipoPersonal =
      tipo_personal === null ||
      servicio.tipo_personal.toLowerCase().includes(tipo_personal.toLowerCase())

    return (
      coincideBusqueda &&
      coincideGrupo &&
      coincideArea &&
      coincideTipoPersonal
    )
  })
}

function agruparServicios(servicios: FrecuenciaServicio[]): Grupo[] {
  const mapa = new Map<string, FrecuenciaServicio[]>()

  for (const servicio of servicios) {
    const nombre = servicio.servicio_grupo ?? SIN_GRUPO
    const lista = mapa.get(nombre) ?? []
    lista.push(servicio)
    mapa.set(nombre, lista)
  }

  return [...mapa.entries()]
    .map(([nombre, items]) => ({
      nombre,
      servicios: items,
      total: items.reduce((acc, item) => acc + item.frecuencia, 0),
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
}

export function FrecuenciaServiciosGrupos({
  servicios,
  q = "",
  servicio_grupo = null,
  area_nombre = null,
  tipo_personal = null,
}: {
  servicios: FrecuenciaServicio[]
  q: string
  servicio_grupo: string | null
  area_nombre: string | null
  tipo_personal: string | null
}) {
  const serviciosFiltrados = useMemo(
    () => filtrarServicios(servicios, q, servicio_grupo, area_nombre, tipo_personal),
    [servicios, q, servicio_grupo, area_nombre, tipo_personal]
  )

  const grupos = useMemo(() => agruparServicios(serviciosFiltrados), [
    serviciosFiltrados,
  ])

  return (
    <div className="flex flex-col gap-3">
      {grupos.map((grupo) => (
        <Collapsible
          key={grupo.nombre}
          defaultOpen
          className="group/grupo rounded-xl border"
        >
          <CollapsibleTrigger className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40">
            <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[open]/grupo:rotate-90" />
            <span className="font-medium">{grupo.nombre}</span>
            <span className="ml-auto flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                {grupo.servicios.length} servicio
                {grupo.servicios.length === 1 ? "" : "s"}
              </span>
              <span>
                Subtotal:{" "}
                <span className="font-semibold text-foreground">
                  {formatear(grupo.total)}
                </span>
              </span>
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Frecuencia</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grupo.servicios.map((servicio) => (
                  <FrecuenciaServicioFila
                    key={servicio.id}
                    servicio={servicio}
                  />
                ))}
              </TableBody>
            </Table>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  )
}
