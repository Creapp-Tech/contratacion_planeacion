"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { Loader2Icon, SearchIcon, XIcon } from "lucide-react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { CheckIcon, ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { ContratoFiltros, OpcionesContrato } from "@/lib/contratos/queries"

const TODOS = "__todos__"
const NINGUNO = "__ninguno__"

function idsReales(seleccion: string[]): string[] {
  return seleccion.filter((v) => v !== TODOS && v !== NINGUNO)
}

function estaTodoSeleccionado(
  seleccion: string[],
  todosLosIds: string[]
): boolean {
  return (
    seleccion.includes(TODOS) ||
    (seleccion.length > 0 &&
      seleccion.length === todosLosIds.length &&
      todosLosIds.every((id) => seleccion.includes(id)))
  )
}

/**
 * Dropdown múltiple para filtros. Permite seleccionar una o varias opciones
 * e incluye las opciones "Seleccionar todos" y "Desmarcar todos" al inicio.
 */
function FiltroSelectMulti({
  id,
  value,
  placeholder,
  items,
  options,
  onChange,
  todosLosIds,
  etiquetaTodos,
}: {
  id: string
  value: string[]
  placeholder: string
  items: Record<string, string>
  options: { value: string; label: string }[]
  onChange: (ids: string[]) => void
  todosLosIds: string[]
  etiquetaTodos: string
}) {
  const [primitiveValue, setPrimitiveValue] = useState<string[]>(() =>
    estaTodoSeleccionado(value, todosLosIds)
      ? [TODOS, ...todosLosIds]
      : value
  )

  // Sincroniza la selección interna cuando el padre la reinicia (p. ej. "Limpiar").
  const [valorPrevio, setValorPrevio] = useState(value)
  if (value !== valorPrevio) {
    setValorPrevio(value)
    setPrimitiveValue(
      estaTodoSeleccionado(value, todosLosIds) ? [TODOS, ...todosLosIds] : value
    )
  }

  const seleccionadaComoTodos = primitiveValue.includes(TODOS)

  function handleValueChange(next: string[] | null) {
    const arr = next ?? []

    if (arr.includes(NINGUNO)) {
      // El usuario tocó "Desmarcar todos": se limpia el grupo.
      setPrimitiveValue([])
      onChange([])
      return
    }

    if (arr.includes(TODOS)) {
      // El usuario tocó "Seleccionar todos": se selecciona todo el grupo.
      const completo = [TODOS, ...todosLosIds]
      setPrimitiveValue(completo)
      onChange(todosLosIds)
      return
    }

    setPrimitiveValue(arr)
    onChange(arr)
  }

  const etiquetas = options
    .filter((o) => o.value !== TODOS && primitiveValue.includes(o.value))
    .map((o) => o.label)

  const valorMostrado =
    seleccionadaComoTodos ||
    (todosLosIds.length > 0 && etiquetas.length === todosLosIds.length)
      ? etiquetaTodos
      : etiquetas.length > 0
        ? etiquetas.join(", ")
        : placeholder

  return (
    <SelectPrimitive.Root
      id={id}
      multiple
      value={primitiveValue}
      onValueChange={handleValueChange}
      items={items}
    >
      <SelectPrimitive.Trigger
        className={cn(
          "w-full flex items-center justify-between gap-1.5 overflow-hidden rounded-4xl border border-input bg-input/30 px-3 py-2 text-sm whitespace-nowrap transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
          seleccionadaComoTodos ? "bg-accent text-accent-foreground" : ""
        )}
      >
        <SelectPrimitive.Value className="flex min-w-0 flex-1 truncate text-left">
          {seleccionadaComoTodos || etiquetas.length > 0 ? (
            valorMostrado
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon
          render={
            <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
          }
        />
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner className="isolate z-50">
          <SelectPrimitive.Popup
            className="relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-2xl bg-popover text-popover-foreground shadow-2xl ring-1 ring-foreground/5 data-[side=bottom]:slide-in-from-top-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
          >
            <SelectPrimitive.List>
              {options.map((option) => {
                const seleccionado = primitiveValue.includes(option.value)
                return (
                  <SelectPrimitive.Item
                    key={option.value}
                    value={option.value}
                    className={cn(
                      "relative flex w-full cursor-default items-center gap-2.5 rounded-xl py-2 pr-8 pl-3 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                      seleccionado
                        ? "bg-accent text-accent-foreground"
                        : "text-popover-foreground"
                    )}
                  >
                    <SelectPrimitive.ItemText className="flex flex-1 shrink-0 gap-2 whitespace-normal">
                      {option.label}
                    </SelectPrimitive.ItemText>
                    <SelectPrimitive.ItemIndicator
                      className="pointer-events-none absolute right-2 flex size-4 items-center justify-center"
                    >
                      {seleccionado ? (
                        <CheckIcon className="pointer-events-none size-4" />
                      ) : null}
                    </SelectPrimitive.ItemIndicator>
                  </SelectPrimitive.Item>
                )
              })}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

export function ContratoFiltros({
  opciones,
  filtros,
  verRegional,
}: {
  opciones: OpcionesContrato
  filtros: ContratoFiltros
  verRegional: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [q, setQ] = useState(filtros.q ?? "")
  const [qPrevio, setQPrevio] = useState(filtros.q)
  const [aseguradorSeleccionado, setAseguradorSeleccionado] = useState(
    filtros.asegurador ?? []
  )
  const [regionalSeleccionada, setRegionalSeleccionada] = useState(
    filtros.regional ?? []
  )
  const [estadoLegalizacionSeleccionado, setEstadoLegalizacionSeleccionado] =
    useState(filtros.estadoLegalizacion ?? [])

  if (filtros.q !== qPrevio) {
    setQPrevio(filtros.q)
    setQ(filtros.q ?? "")
  }

  const aseguradorItems = Object.fromEntries([
    [TODOS, "Seleccionar todos"],
    [NINGUNO, "Desmarcar todos"],
    ...opciones.aseguradores.map((asegurador) => [
      asegurador.id,
      asegurador.nombre_eps,
    ]),
  ])

  const aseguradorOptions = [
    { value: TODOS, label: "Seleccionar todos" },
    { value: NINGUNO, label: "Desmarcar todos" },
    ...opciones.aseguradores.map((asegurador) => ({
      value: asegurador.id,
      label: asegurador.nombre_eps,
    })),
  ]

  const aseguradorIds = opciones.aseguradores.map((a) => a.id)

  const regionalItems = Object.fromEntries([
    [TODOS, "Seleccionar todos"],
    [NINGUNO, "Desmarcar todos"],
    ...opciones.regionales.map((regional) => [regional.id, regional.nombre]),
  ])

  const regionalOptions = [
    { value: TODOS, label: "Seleccionar todos" },
    { value: NINGUNO, label: "Desmarcar todos" },
    ...opciones.regionales.map((regional) => ({
      value: regional.id,
      label: regional.nombre,
    })),
  ]

  const regionalIds = opciones.regionales.map((r) => r.id)

  const estadoLegalizacionItems = Object.fromEntries([
    [TODOS, "Seleccionar todos"],
    [NINGUNO, "Desmarcar todos"],
    ...opciones.estadosLegalizacion.map((estado) => [estado.id, estado.nombre]),
  ])

  const estadoLegalizacionOptions = [
    { value: TODOS, label: "Seleccionar todos" },
    { value: NINGUNO, label: "Desmarcar todos" },
    ...opciones.estadosLegalizacion.map((estado) => ({
      value: estado.id,
      label: estado.nombre,
    })),
  ]

  const estadoLegalizacionIds = opciones.estadosLegalizacion.map((e) => e.id)

  function updateParams(next: Record<string, string | string[] | undefined>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const key of Object.keys(next)) {
      params.delete(key)
    }
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined) continue
      const arr = Array.isArray(value) ? value : [value]
      for (const v of arr) {
        if (v) params.append(key, v)
      }
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`)
    })
  }

  function onChangeAsegurador(siguiente: string[]) {
    setAseguradorSeleccionado(siguiente)
    const reales = idsReales(siguiente)
    updateParams({
      asegurador: reales.length > 0 ? reales : undefined,
    })
  }

  function onChangeRegional(siguiente: string[]) {
    setRegionalSeleccionada(siguiente)
    const reales = idsReales(siguiente)
    updateParams({
      regional: reales.length > 0 ? reales : undefined,
    })
  }

  function onChangeEstadoLegalizacion(siguiente: string[]) {
    setEstadoLegalizacionSeleccionado(siguiente)
    const reales = idsReales(siguiente)
    updateParams({
      legalizacion: reales.length > 0 ? reales : undefined,
    })
  }

  const hasFiltros = Boolean(
    filtros.q ||
      (filtros.asegurador?.length ?? 0) > 0 ||
      (filtros.regional?.length ?? 0) > 0 ||
      (filtros.estadoLegalizacion?.length ?? 0) > 0
  )

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:flex-nowrap">
      <div className="w-full min-w-0 sm:flex-[1.5]">
        <form
          className="relative flex-1"
          onSubmit={(event) => {
            event.preventDefault()
            updateParams({ q: q.trim() || undefined })
          }}
        >
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Buscar por nombre o número"
            className="pl-8 w-full"
            aria-label="Buscar contratos"
          />
        </form>
      </div>

      <div className="w-full min-w-0 sm:min-w-40 sm:flex-1 lg:min-w-0">
        <FiltroSelectMulti
          id="filtro-asegurador"
          value={aseguradorSeleccionado}
          placeholder="Asegurador"
          items={aseguradorItems}
          options={aseguradorOptions}
          onChange={onChangeAsegurador}
          todosLosIds={aseguradorIds}
          etiquetaTodos="Todos los aseguradores"
        />
      </div>

      {verRegional ? (
        <div className="w-full min-w-0 sm:min-w-40 sm:flex-1 lg:min-w-0">
          <FiltroSelectMulti
            id="filtro-regional"
            value={regionalSeleccionada}
            placeholder="Regional"
            items={regionalItems}
            options={regionalOptions}
            onChange={onChangeRegional}
            todosLosIds={regionalIds}
            etiquetaTodos="Todas las regionales"
          />
        </div>
      ) : null}

      <div className="w-full min-w-0 sm:min-w-40 sm:flex-1 lg:min-w-0">
        <FiltroSelectMulti
          id="filtro-legalizacion"
          value={estadoLegalizacionSeleccionado}
          placeholder="Estado de legalización"
          items={estadoLegalizacionItems}
          options={estadoLegalizacionOptions}
          onChange={onChangeEstadoLegalizacion}
          todosLosIds={estadoLegalizacionIds}
          etiquetaTodos="Todos los estados"
        />
      </div>

      {hasFiltros ? (
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setQ("")
            setAseguradorSeleccionado([])
            setRegionalSeleccionada([])
            setEstadoLegalizacionSeleccionado([])
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
