"use client"

import { useState } from "react"
import { Loader2Icon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { FiltrosInfra, OpcionesInfra } from "@/lib/capacidad/agregaciones"
import { AREAS_NINGUNA } from "@/lib/capacidad/agregaciones"

import { MultiSelect } from "../multi-select"
import { useParametrosBusqueda } from "../use-parametros"

const ALL = "__all__"
const PARAM = {
  regional: "i_regional",
  sede: "i_sede",
  areas: "i_areas",
  tipo: "i_tipo",
  custom: "i_custom",
} as const

function toItems(placeholder: string, values: string[]) {
  return Object.fromEntries([
    [ALL, placeholder],
    ...values.map((value) => [value, value]),
  ])
}

export function InfraFiltros({
  opciones,
  filtros,
}: {
  opciones: OpcionesInfra
  filtros: FiltrosInfra
}) {
  const { actualizar, limpiar, pending } = useParametrosBusqueda()

  const [customLocal, setCustomLocal] = useState<string>(
    filtros.tipoPoblacion === "personalizada" ? String(filtros.personalizada) : ""
  )

  function aplicarCustom() {
    const valor = Number(customLocal)
    actualizar({
      [PARAM.tipo]: "personalizada",
      [PARAM.custom]: Number.isFinite(valor) && valor > 0 ? String(valor) : undefined,
    })
  }

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
  const tipoOptions = [
    { value: "activa", label: "Activa" },
    { value: "pagada", label: "Pagada" },
    { value: "personalizada", label: "Personalizada" },
  ]

  const hayFiltros = Boolean(
    filtros.regional ||
      filtros.sede ||
      (filtros.areas && filtros.areas.length < opciones.areas.length) ||
      filtros.tipoPoblacion !== "activa"
  )

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex flex-col gap-1">
        <Label htmlFor="infra-regional" className="text-xs text-muted-foreground">
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
          <SelectTrigger id="infra-regional" className="w-full sm:w-52">
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
        <Label htmlFor="infra-sede" className="text-xs text-muted-foreground">
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
          <SelectTrigger id="infra-sede" className="w-full sm:w-52">
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
        <Label className="text-xs text-muted-foreground">Áreas</Label>
        <MultiSelect
          id="infra-areas"
          opciones={opciones.areas}
          seleccion={
            filtros.areas ?? opciones.areas.map((area) => area.id)
          }
          onChange={(ids) =>
            actualizar({
              [PARAM.areas]:
                ids.length === 0
                  ? AREAS_NINGUNA
                  : ids.length === opciones.areas.length
                    ? undefined
                    : ids.join(","),
            })
          }
          placeholderTodas="Todas las áreas"
          placeholderNinguna="Ninguna área"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="infra-tipo" className="text-xs text-muted-foreground">
          Tipo de población
        </Label>
        <Select
          value={filtros.tipoPoblacion}
          onValueChange={(next) => {
            const tipo = next ?? "activa"
            if (tipo === "personalizada") {
              actualizar({
                [PARAM.tipo]: "personalizada",
                [PARAM.custom]: String(filtros.personalizada),
              })
            } else {
              actualizar({
                [PARAM.tipo]: tipo === "activa" ? undefined : tipo,
              })
            }
          }}
          items={Object.fromEntries(tipoOptions.map((o) => [o.value, o.label]))}
        >
          <SelectTrigger id="infra-tipo" className="w-full sm:w-48">
            <SelectValue placeholder="Tipo de población" />
          </SelectTrigger>
          <SelectContent>
            {tipoOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtros.tipoPoblacion === "personalizada" ? (
        <div className="flex flex-col gap-1">
          <Label htmlFor="infra-custom" className="text-xs text-muted-foreground">
            Población
          </Label>
          <div className="flex gap-2">
            <Input
              id="infra-custom"
              type="number"
              min={0}
              className="w-full sm:w-40"
              value={customLocal}
              onChange={(evento) => setCustomLocal(evento.target.value)}
              onKeyDown={(evento) => {
                if (evento.key === "Enter") aplicarCustom()
              }}
            />
            <Button
              type="button"
              size="sm"
              onClick={aplicarCustom}
              disabled={pending}
            >
              Calcular
            </Button>
          </div>
        </div>
      ) : null}

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
