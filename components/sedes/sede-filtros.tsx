"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { Loader2Icon, RefreshCwIcon, SearchIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { OpcionesFiltros, SedeFiltros } from "@/lib/sedes/queries"

const ALL = "__all__"

type FiltroFiltrosUI = Pick<
  SedeFiltros,
  "q" | "departamento" | "municipio" | "asegurador" | "marca"
>

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

type FiltroSelectProps = {
  id: string
  value: string | undefined
  placeholder: string
  vacio: string
  valores: string[]
  disabled?: boolean
  onChange: (value: string | undefined) => void
}

function FiltroSelect({
  id,
  value,
  placeholder,
  vacio,
  valores,
  disabled,
  onChange,
}: FiltroSelectProps) {
  const { items, options } = opcionesTexto(placeholder, valores)

  return (
    <Select
      value={value ?? ALL}
      onValueChange={(next) =>
        onChange(next === ALL || next == null ? undefined : next)
      }
      items={items}
      disabled={disabled || valores.length === 0}
    >
      <SelectTrigger id={id} className="w-full sm:w-44">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {valores.length === 0 ? (
          <SelectItem value={ALL} disabled>
            {vacio}
          </SelectItem>
        ) : (
          options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}

export function SedeFiltros({
  opciones,
  filtros,
  verRegional,
  opcionesError,
}: {
  opciones: OpcionesFiltros
  filtros: FiltroFiltrosUI
  verRegional: boolean
  opcionesError?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [q, setQ] = useState(filtros.q ?? "")

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
      filtros.departamento ||
      filtros.municipio ||
      filtros.asegurador ||
      filtros.marca ||
      searchParams.get("regional")
  )

  const filtrosVacios =
    opcionesError ||
    (!opciones.regionales.length &&
      !opciones.departamentos.length &&
      !opciones.municipios.length &&
      !opciones.aseguradores.length &&
      !opciones.marcas.length)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
        <form
          className="relative flex-1 lg:min-w-56"
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

        {verRegional ? (
          <FiltroSelect
            id="filtro-regional"
            value={searchParams.get("regional") ?? undefined}
            placeholder="Regional"
            vacio="Sin regionales"
            valores={opciones.regionales}
            disabled={filtrosVacios}
            onChange={(value) => updateParams({ regional: value })}
          />
        ) : null}

        <FiltroSelect
          id="filtro-departamento"
          value={filtros.departamento}
          placeholder="Departamento"
          vacio="Sin departamentos"
          valores={opciones.departamentos}
          disabled={filtrosVacios}
          onChange={(value) =>
            updateParams({ departamento: value, municipio: undefined })
          }
        />

        <FiltroSelect
          id="filtro-municipio"
          value={filtros.municipio}
          placeholder="Municipio"
          vacio="Sin municipios"
          valores={opciones.municipios}
          disabled={filtrosVacios}
          onChange={(value) => updateParams({ municipio: value })}
        />

        <FiltroSelect
          id="filtro-asegurador"
          value={filtros.asegurador}
          placeholder="Asegurador"
          vacio="Sin aseguradores"
          valores={opciones.aseguradores}
          disabled={filtrosVacios}
          onChange={(value) => updateParams({ asegurador: value })}
        />

        <FiltroSelect
          id="filtro-marca"
          value={filtros.marca}
          placeholder="Marca"
          vacio="Todas las marcas"
          valores={opciones.marcas}
          disabled={filtrosVacios}
          onChange={(value) => updateParams({ marca: value })}
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

      {filtrosVacios ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-300">
          <span>No se pudieron cargar los filtros.</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.refresh()}
          >
            <RefreshCwIcon />
            Reintentar
          </Button>
        </div>
      ) : null}
    </div>
  )
}

