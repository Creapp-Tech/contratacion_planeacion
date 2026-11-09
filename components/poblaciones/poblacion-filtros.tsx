"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { Loader2Icon, SearchIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  OpcionesFiltrosPoblaciones,
  PoblacionFiltros,
} from "@/lib/poblaciones/queries"

const ALL = "__all__"

type FiltroSelectProps = {
  id: string
  value: string | undefined
  placeholder: string
  items: Record<string, string>
  options: { value: string; label: string }[]
  onChange: (value: string | undefined) => void
}

function FiltroSelect({
  id,
  value,
  placeholder,
  items,
  options,
  onChange,
}: FiltroSelectProps) {
  return (
    <Select
      value={value ?? ALL}
      onValueChange={(next) =>
        onChange(next === ALL || next == null ? undefined : next)
      }
      items={items}
    >
      <SelectTrigger id={id} className="w-full sm:w-48">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function opcionesIdNombre(
  placeholder: string,
  opciones: { id: string; nombre: string }[]
) {
  return {
    items: Object.fromEntries([
      [ALL, placeholder],
      ...opciones.map((opcion) => [opcion.id, opcion.nombre]),
    ]),
    options: [
      { value: ALL, label: placeholder },
      ...opciones.map((opcion) => ({ value: opcion.id, label: opcion.nombre })),
    ],
  }
}

function opcionesTexto(placeholder: string, valores: string[]) {
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

export function PoblacionFiltros({
  opciones,
  filtros,
}: {
  opciones: OpcionesFiltrosPoblaciones
  filtros: PoblacionFiltros
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [sede, setSede] = useState(filtros.sede ?? "")

  const regimen = opcionesIdNombre("Todos los regímenes", opciones.regimenes)
  const asegurador = opcionesIdNombre(
    "Todos los aseguradores",
    opciones.aseguradores.map((eps) => ({
      id: eps.id,
      nombre: eps.nombre_eps,
    }))
  )
  const regional = opcionesTexto("Todas las regionales", opciones.regionales)
  const departamento = opcionesTexto(
    "Todos los departamentos",
    opciones.departamentos
  )

  const municipiosDisponibles = filtros.departamento
    ? opciones.municipiosPorDepartamento[filtros.departamento] ?? []
    : opciones.municipios
  const municipio = opcionesTexto("Todos los municipios", municipiosDisponibles)

  function updateParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(next)) {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`)
    })
  }

  function onDepartamentoChange(value: string | undefined) {
    const municipios = value
      ? opciones.municipiosPorDepartamento[value] ?? []
      : opciones.municipios
    const municipioValido =
      filtros.municipio && municipios.includes(filtros.municipio)
    updateParams({
      departamento: value,
      municipio: municipioValido ? filtros.municipio : undefined,
    })
  }

  const hasFiltros = Boolean(
    filtros.sede ||
      filtros.regimen_id ||
      filtros.asegurador_eps_id ||
      filtros.regional ||
      filtros.departamento ||
      filtros.municipio
  )

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <form
        className="relative w-full sm:w-64"
        onSubmit={(event) => {
          event.preventDefault()
          updateParams({ sede: sede.trim() || undefined })
        }}
      >
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={sede}
          onChange={(event) => setSede(event.target.value)}
          placeholder="Buscar sede por nombre"
          className="pl-8"
          aria-label="Buscar sedes"
        />
      </form>

      <FiltroSelect
        id="filtro-regimen"
        value={filtros.regimen_id}
        placeholder="Régimen"
        items={regimen.items}
        options={regimen.options}
        onChange={(value) => updateParams({ regimen_id: value })}
      />

      <FiltroSelect
        id="filtro-asegurador"
        value={filtros.asegurador_eps_id}
        placeholder="Asegurador"
        items={asegurador.items}
        options={asegurador.options}
        onChange={(value) => updateParams({ asegurador_eps_id: value })}
      />

      <FiltroSelect
        id="filtro-regional"
        value={filtros.regional}
        placeholder="Regional"
        items={regional.items}
        options={regional.options}
        onChange={(value) => updateParams({ regional: value })}
      />

      <FiltroSelect
        id="filtro-departamento"
        value={filtros.departamento}
        placeholder="Departamento"
        items={departamento.items}
        options={departamento.options}
        onChange={onDepartamentoChange}
      />

      <FiltroSelect
        id="filtro-municipio"
        value={filtros.municipio}
        placeholder="Municipio"
        items={municipio.items}
        options={municipio.options}
        onChange={(value) => updateParams({ municipio: value })}
      />

      {hasFiltros ? (
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setSede("")
            startTransition(() => router.replace(pathname))
          }}
        >
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
