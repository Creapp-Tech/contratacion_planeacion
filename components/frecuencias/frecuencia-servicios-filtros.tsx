"use client"

import { useMemo, useState } from "react"
import { SearchIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { FrecuenciaServicio } from "@/lib/frecuencias/queries"

import { FrecuenciaServiciosGrupos } from "./frecuencia-servicios-grupos"

const ALL = "__all__"

function valoresUnicos(valores: (string | null)[]) {
  return [...new Set(valores.filter((valor): valor is string => Boolean(valor)))].sort(
    (a, b) => a.localeCompare(b)
  )
}

function opcionesSelect(placeholder: string, valores: string[]) {
  return {
    items: Object.fromEntries([
      [ALL, placeholder],
      ...valores.map((valor) => [valor, valor]),
    ]),
    options: [
      { value: ALL, label: placeholder },
      ...valores.map((valor) => ({ value: valor, label: valor })),
    ],
  }
}

function normalizar(valor: string | null) {
  return valor === ALL || valor == null ? undefined : valor
}

export function FrecuenciaServiciosFiltros({
  servicios,
}: {
  servicios: FrecuenciaServicio[]
}) {
  const [q, setQ] = useState("")
  const [grupo, setGrupo] = useState<string | undefined>(undefined)
  const [area, setArea] = useState<string | undefined>(undefined)
  const [tipoPersonal, setTipoPersonal] = useState<string | undefined>(undefined)

  const grupoSelect = useMemo(
    () =>
      opcionesSelect(
        "Todos los grupos",
        valoresUnicos(servicios.map((servicio) => servicio.servicio_grupo))
      ),
    [servicios]
  )
  const areaSelect = useMemo(
    () =>
      opcionesSelect(
        "Todas las áreas",
        valoresUnicos(servicios.map((servicio) => servicio.area_nombre))
      ),
    [servicios]
  )
  const tipoPersonalSelect = useMemo(
    () =>
      opcionesSelect(
        "Todos los tipos de personal",
        valoresUnicos(servicios.map((servicio) => servicio.tipo_personal))
      ),
    [servicios]
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 sm:min-w-64">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Buscar servicio..."
            className="pl-8"
            aria-label="Buscar servicio"
          />
        </div>

        <Select
          value={grupo ?? ALL}
          onValueChange={(next) => setGrupo(normalizar(next))}
          items={grupoSelect.items}
        >
          <SelectTrigger className="w-full sm:w-48" aria-label="Filtrar por grupo">
            <SelectValue placeholder="Todos los grupos" />
          </SelectTrigger>
          <SelectContent>
            {grupoSelect.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={area ?? ALL}
          onValueChange={(next) => setArea(normalizar(next))}
          items={areaSelect.items}
        >
          <SelectTrigger className="w-full sm:w-48" aria-label="Filtrar por área">
            <SelectValue placeholder="Todas las áreas" />
          </SelectTrigger>
          <SelectContent>
            {areaSelect.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={tipoPersonal ?? ALL}
          onValueChange={(next) => setTipoPersonal(normalizar(next))}
          items={tipoPersonalSelect.items}
        >
          <SelectTrigger
            className="w-full sm:w-48"
            aria-label="Filtrar por tipo de personal"
          >
            <SelectValue placeholder="Todos los tipos de personal" />
          </SelectTrigger>
          <SelectContent>
            {tipoPersonalSelect.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {servicios.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Esta frecuencia no tiene servicios registrados.
        </div>
      ) : (
        <FrecuenciaServiciosGrupos
          servicios={servicios}
          q={q}
          servicio_grupo={grupo ?? null}
          area_nombre={area ?? null}
          tipo_personal={tipoPersonal ?? null}
        />
      )}
    </div>
  )
}
