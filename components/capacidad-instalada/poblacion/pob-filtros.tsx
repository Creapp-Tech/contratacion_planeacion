"use client"

import { Loader2Icon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  CapacidadTipo,
  FiltrosPoblacion,
  OpcionesPoblacion,
  PoblacionTipo,
} from "@/lib/capacidad/agregaciones"

import { useParametrosBusqueda } from "../use-parametros"

const ALL = "__all__"
const PARAM = {
  regional: "p_regional",
  sede: "p_sede",
  eps: "p_eps",
  capacidad: "p_cap",
  poblacion: "p_pob",
} as const

function toItems(placeholder: string, values: string[]) {
  return Object.fromEntries([
    [ALL, placeholder],
    ...values.map((value) => [value, value]),
  ])
}

export function PobFiltros({
  opciones,
  filtros,
}: {
  opciones: OpcionesPoblacion
  filtros: FiltrosPoblacion
}) {
  const { actualizar, limpiar, pending } = useParametrosBusqueda()

  const sedesVisibles = opciones.sedes.filter(
    (sede) => !filtros.regional || sede.regional === filtros.regional
  )

  const sedeItems = Object.fromEntries([
    [ALL, "Todas las sedes"],
    ...sedesVisibles.map((sede) => [sede.id, sede.nombre]),
  ])
  const regionalOptions = [
    { value: ALL, label: "Todas las regionales" },
    ...opciones.regionales.map((value) => ({ value, label: value })),
  ]
  const sedeOptions = [
    { value: ALL, label: "Todas las sedes" },
    ...sedesVisibles.map((sede) => ({ value: sede.id, label: sede.nombre })),
  ]
  const epsOptions = [
    { value: ALL, label: "Todas las EPS" },
    ...opciones.eps.map((value) => ({ value, label: value })),
  ]
  const capacidadOptions: { value: CapacidadTipo; label: string }[] = [
    { value: "inicial", label: "Inicial" },
    { value: "actual", label: "Actual" },
  ]
  const poblacionOptions: { value: PoblacionTipo; label: string }[] = [
    { value: "activa", label: "Activa" },
    { value: "pagada", label: "Pagada" },
    { value: "certificada", label: "Certificada" },
  ]

  const hayFiltros = Boolean(
    filtros.regional || filtros.sede || filtros.eps
  )

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex flex-col gap-1">
        <Label htmlFor="pob-regional" className="text-xs text-muted-foreground">
          Regional
        </Label>
        <Select
          value={filtros.regional ?? ALL}
          onValueChange={(next) =>
            actualizar({
              [PARAM.regional]: next === ALL || next == null ? undefined : next,
              [PARAM.sede]: undefined,
            })
          }
          items={toItems("Todas las regionales", opciones.regionales)}
        >
          <SelectTrigger id="pob-regional" className="w-full sm:w-52">
            <SelectValue placeholder="Regional" />
          </SelectTrigger>
          <SelectContent>
            {regionalOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="pob-sede" className="text-xs text-muted-foreground">
          Sede
        </Label>
        <Select
          value={filtros.sede ?? ALL}
          onValueChange={(next) =>
            actualizar({
              [PARAM.sede]: next === ALL || next == null ? undefined : next,
            })
          }
          items={sedeItems}
        >
          <SelectTrigger id="pob-sede" className="w-full sm:w-52">
            <SelectValue placeholder="Sede" />
          </SelectTrigger>
          <SelectContent>
            {sedeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="pob-eps" className="text-xs text-muted-foreground">
          EPS
        </Label>
        <Select
          value={filtros.eps ?? ALL}
          onValueChange={(next) =>
            actualizar({
              [PARAM.eps]: next === ALL || next == null ? undefined : next,
            })
          }
          items={toItems("Todas las EPS", opciones.eps)}
        >
          <SelectTrigger id="pob-eps" className="w-full sm:w-52">
            <SelectValue placeholder="EPS" />
          </SelectTrigger>
          <SelectContent>
            {epsOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="pob-capacidad" className="text-xs text-muted-foreground">
          Capacidad de la sede
        </Label>
        <Select
          value={filtros.capacidad}
          onValueChange={(next) => {
            const valor = next === "inicial" ? "inicial" : "actual"
            actualizar({
              [PARAM.capacidad]: valor === "actual" ? undefined : valor,
            })
          }}
          items={{ inicial: "Inicial", actual: "Actual" }}
        >
          <SelectTrigger id="pob-capacidad" className="w-full sm:w-48">
            <SelectValue placeholder="Capacidad de la sede" />
          </SelectTrigger>
          <SelectContent>
            {capacidadOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="pob-poblacion" className="text-xs text-muted-foreground">
          Población
        </Label>
        <Select
          value={filtros.poblacion}
          onValueChange={(next) => {
            const valor = next === "pagada" ? "pagada" : next === "certificada" ? "certificada" : "activa"
            actualizar({
              [PARAM.poblacion]: valor === "activa" ? undefined : valor,
            })
          }}
          items={{ activa: "Activa", pagada: "Pagada", certificada: "Certificada" }}
        >
          <SelectTrigger id="pob-poblacion" className="w-full sm:w-48">
            <SelectValue placeholder="Población" />
          </SelectTrigger>
          <SelectContent>
            {poblacionOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hayFiltros ? (
        <Button type="button" variant="ghost" onClick={limpiar}>
          <XIcon />
          Limpiar
        </Button>
      ) : null}

      {pending ? (
        <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
      ) : null}
    </div>
  )
}
