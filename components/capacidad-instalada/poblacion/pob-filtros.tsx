"use client"

import { useState, useEffect } from "react"
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
import { SEDES_NINGUNA } from "@/lib/capacidad/agregaciones"
import { obtenerMunicipiosPorDepartamento } from "@/app/(dashboard)/capacidad-instalada/municipios-actions"

import { MultiSelect } from "../multi-select"
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

  const seleccionSedes = filtros.sedes
    ? filtros.sedes.filter((id) =>
        sedesVisibles.some((sede) => sede.id === id)
      )
    : sedesVisibles.map((sede) => sede.id)
  const regionalOptions = [
    { value: ALL, label: "Todas las regionales" },
    ...opciones.regionales.map((value) => ({ value, label: value })),
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
  const departamentoOptions: { value: string; label: string }[] = [
    { value: ALL, label: "Todos los departamentos" },
    ...opciones.departamentos.map((value) => ({ value, label: value })),
  ]
  const municipioOptionsRaw = [
    { value: ALL, label: "Todos los municipios" },
    ...opciones.municipios.map((value) => ({ value, label: value })),
  ]

  const [departamento, setDepartamento] = useState<string | undefined>(
    filtros.departamento
  )
  const [municipio, setMunicipio] = useState<string | undefined>(filtros.municipio)

  const [municipioOptions, setMunicipioOptions] = useState<{
    value: string
    label: string
  }[]>([])

  useEffect(() => {
    async function cargarMunicipios() {
      if (departamento) {
        try {
          const result = await obtenerMunicipiosPorDepartamento(departamento)
          const municipios = result.ok ? result.data ?? [] : []
          setMunicipioOptions(municipios.map((m) => ({ value: m, label: m })))
        } catch (e) {
          setMunicipioOptions([])
        }
        setMunicipio(undefined)
      } else {
        setMunicipioOptions(
          municipioOptionsRaw.filter((o) => o.value !== ALL).map((o) => ({
            value: o.value,
            label: o.label,
          }))
        )
        setMunicipio(undefined)
      }
    }
    cargarMunicipios()
  }, [departamento])

  const hayFiltros = Boolean(
    filtros.regional ||
      filtros.sedes !== undefined ||
      filtros.eps ||
      filtros.departamento ||
      filtros.municipio
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
        <Label htmlFor="pob-departamento" className="text-xs text-muted-foreground">
          Departamento
        </Label>
        <Select
          value={departamento ?? ALL}
          onValueChange={(next) =>
            setDepartamento(next === ALL || next == null ? undefined : next)
          }
          items={toItems("Todos los departamentos", opciones.departamentos)}
        >
          <SelectTrigger id="pob-departamento" className="w-full sm:w-52">
            <SelectValue placeholder="Departamento" />
          </SelectTrigger>
          <SelectContent>
            {departamentoOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="pob-municipio" className="text-xs text-muted-foreground">
          Municipio
        </Label>
        <Select
          value={municipio ?? ALL}
          onValueChange={(next) => setMunicipio(next === ALL || next == null ? undefined : next)}
          items={toItems("Todos los municipios", municipioOptions.map((o) => o.value as string))}
        >
          <SelectTrigger id="pob-municipio" className="w-full sm:w-52">
            <SelectValue placeholder="Municipio" />
          </SelectTrigger>
          <SelectContent>
            {municipioOptions.length > 0 ? (
              municipioOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="" disabled>Cargando...</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="pob-sede" className="text-xs text-muted-foreground">
          Sedes
        </Label>
        <MultiSelect
          id="pob-sede"
          opciones={sedesVisibles}
          seleccion={seleccionSedes}
          onChange={(ids) =>
            actualizar({
              [PARAM.sede]:
                ids.length === 0
                  ? SEDES_NINGUNA
                  : ids.length === sedesVisibles.length
                    ? undefined
                    : ids.join(","),
            })
          }
          placeholderTodas="Todas las sedes"
          placeholderNinguna="Ninguna sede"
          mensajeVacio="Sin sedes disponibles."
        />
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