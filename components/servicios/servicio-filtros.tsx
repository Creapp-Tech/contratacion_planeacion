"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition, type CSSProperties } from "react"
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
import type { Area } from "@/lib/areas/queries"
import type { CatalogoItem } from "@/lib/catalogos/queries"
import type { GrupoServicio, ServicioFiltros } from "@/lib/servicios/queries"

const ALL = "__all__"

// El popup se dimensiona al contenido para que las etiquetas largas
// (área + tipo de persona) no queden recortadas, pero nunca por debajo del
// ancho del disparador ni fuera de la pantalla.
const POPUP_STYLE: CSSProperties = {
  width: "max-content",
  minWidth: "var(--anchor-width)",
  maxWidth: "min(28rem, calc(100vw - 1rem))",
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
      <SelectContent style={POPUP_STYLE}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function ServicioFiltros({
  grupos,
  areas,
  tiposPersonal,
  filtros,
}: {
  grupos: GrupoServicio[]
  areas: Area[]
  tiposPersonal: CatalogoItem[]
  filtros: ServicioFiltros
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [q, setQ] = useState(filtros.q ?? "")

  const grupoOptions = [
    { value: ALL, label: "Todos los grupos" },
    ...grupos.map((grupo) => ({ value: grupo.id, label: grupo.nombre })),
  ]

  const areaOptions = [
    { value: ALL, label: "Todas las áreas" },
    ...areas.map((area) => ({
      value: area.id,
      label: `${area.categoria} · ${area.nombre}`,
    })),
  ]

  const tipoPersonalOptions = [
    { value: ALL, label: "Todos los tipos de personal" },
    ...tiposPersonal.map((tipo) => ({ value: tipo.nombre, label: tipo.nombre })),
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
    filtros.q ||
      filtros.grupo_id ||
      filtros.area_id ||
      filtros.tipo_personal
  )

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <form
        className="relative w-full sm:w-52 sm:flex-none"
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
          aria-label="Buscar servicios por nombre"
        />
      </form>

      <FiltroSelect
        id="filtro-grupo"
        value={filtros.grupo_id}
        placeholder="Grupo"
        items={Object.fromEntries(
          grupoOptions.map((option) => [option.value, option.label])
        )}
        options={grupoOptions}
        onChange={(value) => updateParams({ grupo: value })}
      />

      <FiltroSelect
        id="filtro-area"
        value={filtros.area_id}
        placeholder="Área relacionada"
        items={Object.fromEntries(
          areaOptions.map((option) => [option.value, option.label])
        )}
        options={areaOptions}
        onChange={(value) => updateParams({ area: value })}
      />

      <FiltroSelect
        id="filtro-tipo-personal"
        value={filtros.tipo_personal}
        placeholder="Tipo de persona"
        items={Object.fromEntries(
          tipoPersonalOptions.map((option) => [option.value, option.label])
        )}
        options={tipoPersonalOptions}
        onChange={(value) => updateParams({ tipo: value })}
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
