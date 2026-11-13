"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronDownIcon, SearchIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type MultiSelectFilterOption = {
  value: string
  label: string
}

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim()
}

/**
 * Filtro multiselección reutilizable.
 *
 * El componente es controlado: el padre debe inicializar `value` con todos los
 * valores de `options` si quiere que todas las opciones vengan seleccionadas.
 */
export function MultiSelectFilter({
  id,
  label,
  options,
  value,
  onChange,
  className,
  todosLabel = "Todos",
  ningunoLabel = "Ninguno",
  searchPlaceholder = "Buscar...",
  emptyMessage = "No hay opciones disponibles.",
}: {
  id: string
  label: string
  options: MultiSelectFilterOption[]
  value: string[]
  onChange: (value: string[]) => void
  className?: string
  todosLabel?: string
  ningunoLabel?: string
  searchPlaceholder?: string
  emptyMessage?: string
}) {
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const contenedorRef = useRef<HTMLDivElement>(null)
  const buscadorRef = useRef<HTMLInputElement>(null)

  const mostrarBuscador = options.length > 8

  useEffect(() => {
    if (!abierto) return

    function cerrar() {
      setBusqueda("")
      setAbierto(false)
    }

    function manejarClic(evento: MouseEvent) {
      if (!contenedorRef.current?.contains(evento.target as Node)) {
        cerrar()
      }
    }

    function manejarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        cerrar()
      }
    }

    document.addEventListener("mousedown", manejarClic)
    document.addEventListener("keydown", manejarTecla)

    return () => {
      document.removeEventListener("mousedown", manejarClic)
      document.removeEventListener("keydown", manejarTecla)
    }
  }, [abierto])

  useEffect(() => {
    if (abierto && mostrarBuscador) {
      buscadorRef.current?.focus()
    }
  }, [abierto, mostrarBuscador])

  const opcionesFiltradas = useMemo(() => {
    const consulta = normalizar(busqueda)
    if (!consulta) return options
    return options.filter((opcion) =>
      normalizar(opcion.label).includes(consulta)
    )
  }, [busqueda, options])

  const seleccionados = useMemo(() => new Set(value), [value])

  const cantidadSeleccionada = options.filter((opcion) =>
    seleccionados.has(opcion.value)
  ).length

  const todosSeleccionados =
    options.length > 0 && cantidadSeleccionada === options.length
  const ningunoSeleccionado = cantidadSeleccionada === 0

  const resumen = todosSeleccionados
    ? todosLabel
    : ningunoSeleccionado
      ? ningunoLabel
      : cantidadSeleccionada === 1
        ? (options.find((opcion) => seleccionados.has(opcion.value))?.label ??
          "1 seleccionado")
        : `${cantidadSeleccionada} seleccionados`

  function alternar(valorOpcion: string) {
    const siguiente = seleccionados.has(valorOpcion)
      ? value.filter((item) => item !== valorOpcion)
      : [...value, valorOpcion]

    onChange([...new Set(siguiente)])
  }

  function seleccionarTodos() {
    onChange(options.map((opcion) => opcion.value))
  }

  function desmarcarTodos() {
    onChange([])
  }

  function alternarAbierto() {
    if (abierto) {
      setBusqueda("")
      setAbierto(false)
      return
    }
    setAbierto(true)
  }

  return (
    <div
      ref={contenedorRef}
      className={cn("relative flex flex-col gap-1.5", className)}
    >
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>

      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        onClick={alternarAbierto}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-2 text-left text-sm shadow-xs transition-colors outline-none hover:bg-input/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          abierto && "border-ring ring-[3px] ring-ring/50"
        )}
      >
        <span className="truncate">{resumen}</span>
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0 opacity-50 transition-transform",
            abierto && "rotate-180"
          )}
        />
      </button>

      {abierto ? (
        <div className="absolute top-full left-0 z-50 mt-1 max-h-80 w-full min-w-56 overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md">
          {options.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">
              {emptyMessage}
            </p>
          ) : (
            <>
              <div className="sticky top-0 z-10 -mx-1 border-b bg-popover px-2 py-1.5">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={seleccionarTodos}
                    disabled={todosSeleccionados}
                    className="rounded-sm text-xs font-medium text-primary outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
                  >
                    Seleccionar todos
                  </button>
                  <button
                    type="button"
                    onClick={desmarcarTodos}
                    disabled={ningunoSeleccionado}
                    className="rounded-sm text-xs font-medium text-muted-foreground outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
                  >
                    Desmarcar todos
                  </button>
                </div>

                {mostrarBuscador ? (
                  <div className="relative mt-1">
                    <SearchIcon className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      ref={buscadorRef}
                      value={busqueda}
                      onChange={(evento) => setBusqueda(evento.target.value)}
                      placeholder={searchPlaceholder}
                      className="h-8 pl-7 text-sm"
                      aria-label={`Buscar en ${label}`}
                    />
                  </div>
                ) : null}
              </div>

              <div role="group" aria-label={label}>
                {opcionesFiltradas.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-muted-foreground">
                    No se encontraron opciones.
                  </p>
                ) : (
                  opcionesFiltradas.map((opcion) => {
                    const marcado = seleccionados.has(opcion.value)
                    return (
                      <label
                        key={opcion.value}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                      >
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={() => alternar(opcion.value)}
                          className="size-4 accent-primary"
                        />
                        <span className="truncate" title={opcion.label}>
                          {opcion.label}
                        </span>
                      </label>
                    )
                  })
                )}
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
