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
import { ESTADOS, ROLES } from "@/lib/constants/roles"
import type { Regional, UsuarioFiltros } from "@/lib/usuarios/queries"

const ALL = "__all__"

const ROL_ITEMS = Object.fromEntries([
  [ALL, "Todos los roles"],
  ...ROLES.map((rol) => [rol.value, rol.label]),
])

const ESTADO_ITEMS = Object.fromEntries([
  [ALL, "Todos los estados"],
  ...ESTADOS.map((estado) => [estado.value, estado.label]),
])

type FiltroSelectProps = {
  id: string
  value: string | undefined
  placeholder: string
  items: Record<string, string>
  options: readonly { value: string; label: string }[]
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

export function UsuarioFiltros({
  regionales,
  filtros,
}: {
  regionales: Regional[]
  filtros: UsuarioFiltros
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [q, setQ] = useState(filtros.q ?? "")

  const regionalItems = Object.fromEntries([
    [ALL, "Todas las regionales"],
    ...regionales.map((regional) => [regional.id, regional.nombre]),
  ])

  const regionalOptions = [
    { value: ALL, label: "Todas las regionales" },
    ...regionales.map((regional) => ({
      value: regional.id,
      label: regional.nombre,
    })),
  ]

  const rolOptions = [
    { value: ALL, label: "Todos los roles" },
    ...ROLES.map((rol) => ({ value: rol.value, label: rol.label })),
  ]

  const estadoOptions = [
    { value: ALL, label: "Todos los estados" },
    ...ESTADOS.map((estado) => ({ value: estado.value, label: estado.label })),
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
    filtros.q || filtros.rol || filtros.regional || filtros.estado
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
          placeholder="Buscar por nombre o correo"
          className="pl-8"
          aria-label="Buscar usuarios"
        />
      </form>

      <FiltroSelect
        id="filtro-rol"
        value={filtros.rol}
        placeholder="Rol"
        items={ROL_ITEMS}
        options={rolOptions}
        onChange={(value) => updateParams({ rol: value })}
      />

      <FiltroSelect
        id="filtro-regional"
        value={filtros.regional}
        placeholder="Regional"
        items={regionalItems}
        options={regionalOptions}
        onChange={(value) => updateParams({ regional: value })}
      />

      <FiltroSelect
        id="filtro-estado"
        value={filtros.estado}
        placeholder="Estado"
        items={ESTADO_ITEMS}
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
