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
  FrecuenciaFiltros,
  OpcionesFiltrosFrecuencias,
} from "@/lib/frecuencias/queries"
import { TIPOS_FRECUENCIA } from "@/lib/frecuencias/tipos"

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

function opcionesSelect(
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

export function FrecuenciaFiltros({
  opciones,
  filtros,
}: {
  opciones: OpcionesFiltrosFrecuencias
  filtros: FrecuenciaFiltros
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [q, setQ] = useState(filtros.q ?? "")

  const tipo = opcionesSelect(
    "Todos los tipos",
    TIPOS_FRECUENCIA.map((item) => ({ id: item.value, nombre: item.label }))
  )
  const regional = opcionesSelect(
    "Todas las regionales",
    opciones.regionales.map((nombre) => ({ id: nombre, nombre }))
  )
  const sede = opcionesSelect("Todas las sedes", opciones.sedes)
  const regimen = opcionesSelect("Todos los regímenes", opciones.regimenes)
  const asegurador = opcionesSelect(
    "Todos los aseguradores",
    opciones.aseguradores
  )

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

  const hasFiltros = Boolean(
    filtros.q ||
      filtros.tipo_frecuencia ||
      filtros.sede_id ||
      filtros.regional ||
      filtros.regimen_id ||
      filtros.asegurador_eps_id
  )

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <form
        className="relative flex-1 sm:min-w-64"
        onSubmit={(event) => {
          event.preventDefault()
          updateParams({ q: q.trim() || undefined })
        }}
      >
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Buscar por nota técnica"
          className="pl-8"
          aria-label="Buscar frecuencias"
        />
      </form>

      <FiltroSelect
        id="filtro-tipo"
        value={filtros.tipo_frecuencia}
        placeholder="Tipo de frecuencia"
        items={tipo.items}
        options={tipo.options}
        onChange={(value) => updateParams({ tipo_frecuencia: value })}
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
        id="filtro-sede"
        value={filtros.sede_id}
        placeholder="Sede"
        items={sede.items}
        options={sede.options}
        onChange={(value) => updateParams({ sede_id: value })}
      />

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

      {hasFiltros ? (
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setQ("")
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
