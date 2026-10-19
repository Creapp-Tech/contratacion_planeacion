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
import { SEDE_ESTADOS } from "@/lib/sedes/estados"
import type { OpcionesFiltros, SedeFiltros } from "@/lib/sedes/queries"

const ALL = "__all__"

function toItems(placeholder: string, values: string[]) {
  return Object.fromEntries([
    [ALL, placeholder],
    ...values.map((value) => [value, value]),
  ])
}

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

export function SedeFiltros({
  opciones,
  filtros,
}: {
  opciones: OpcionesFiltros
  filtros: SedeFiltros
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [q, setQ] = useState(filtros.q ?? "")

  const departamentoOptions = [
    { value: ALL, label: "Todos los departamentos" },
    ...opciones.departamentos.map((value) => ({ value, label: value })),
  ]
  const regionalOptions = [
    { value: ALL, label: "Todas las regionales" },
    ...opciones.regionales.map((value) => ({ value, label: value })),
  ]
  const marcaOptions = [
    { value: ALL, label: "Todas las marcas" },
    ...opciones.marcas.map((value) => ({ value, label: value })),
  ]
  const estadoOptions = [
    { value: ALL, label: "Todos los estados" },
    ...SEDE_ESTADOS.map((estado) => ({
      value: estado.value,
      label: estado.label,
    })),
  ]

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
    filtros.q || filtros.departamento || filtros.regional || filtros.marca || filtros.estado
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
          placeholder="Buscar por nombre"
          className="pl-8"
          aria-label="Buscar sedes"
        />
      </form>

      <FiltroSelect
        id="filtro-departamento"
        value={filtros.departamento}
        placeholder="Departamento"
        items={toItems("Todos los departamentos", opciones.departamentos)}
        options={departamentoOptions}
        onChange={(value) => updateParams({ departamento: value })}
      />

      <FiltroSelect
        id="filtro-regional"
        value={filtros.regional}
        placeholder="Regional"
        items={toItems("Todas las regionales", opciones.regionales)}
        options={regionalOptions}
        onChange={(value) => updateParams({ regional: value })}
      />

      <FiltroSelect
        id="filtro-marca"
        value={filtros.marca}
        placeholder="Marca"
        items={toItems("Todas las marcas", opciones.marcas)}
        options={marcaOptions}
        onChange={(value) => updateParams({ marca: value })}
      />

      <FiltroSelect
        id="filtro-estado"
        value={filtros.estado}
        placeholder="Estado"
        items={toItems(
          "Todos los estados",
          SEDE_ESTADOS.map((estado) => estado.value)
        )}
        options={estadoOptions}
        onChange={(value) => updateParams({ estado: value })}
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
