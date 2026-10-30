"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDownIcon } from "lucide-react"
import { cn } from "cn"

export type OpcionMultiselect = { id: string; nombre: string }

export function MultiSelect({
  id,
  opciones,
  seleccion,
  onChange,
  placeholderTodas,
  placeholderNinguna,
  mensajeVacio = "Sin opciones disponibles.",
  className,
}: {
  id: string
  opciones: OpcionMultiselect[]
  seleccion: string[]
  onChange: (ids: string[]) => void
  placeholderTodas: string
  placeholderNinguna: string
  mensajeVacio?: string
  className?: string
}) {
  const [abierto, setAbierto] = useState(false)
  const contenedorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return

    function manejarClic(evento: MouseEvent) {
      if (!contenedorRef.current?.contains(evento.target as Node)) {
        setAbierto(false)
      }
    }

    document.addEventListener("mousedown", manejarClic)
    return () => document.removeEventListener("mousedown", manejarClic)
  }, [abierto])

  function alternar(idOpcion: string) {
    const esta = seleccion.includes(idOpcion)
    onChange(
      esta
        ? seleccion.filter((valor) => valor !== idOpcion)
        : [...seleccion, idOpcion]
    )
    setAbierto(true)
  }

  const etiqueta =
    seleccion.length === 0
      ? placeholderNinguna
      : seleccion.length === opciones.length
        ? placeholderTodas
        : seleccion.length === 1
          ? (opciones.find((opcion) => seleccion.includes(opcion.id))?.nombre ??
            `${seleccion.length} seleccionadas`)
          : `${seleccion.length} seleccionadas`

  return (
    <div ref={contenedorRef} className={cn("relative", className)}>
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        onClick={() => setAbierto((valor) => !valor)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-2 text-left text-sm whitespace-nowrap shadow-xs transition-colors outline-none hover:bg-input/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:w-56"
      >
        <span className="truncate">{etiqueta}</span>
        <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
      </button>

      {abierto ? (
        <div
          role="listbox"
          className="absolute top-full left-0 z-50 mt-1 max-h-72 w-full min-w-56 overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {opciones.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">
              {mensajeVacio}
            </p>
          ) : (
            opciones.map((opcion) => {
              const marcado = seleccion.includes(opcion.id)
              return (
                <label
                  key={opcion.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                >
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={() => alternar(opcion.id)}
                    className="size-4 accent-primary"
                  />
                  <span className="truncate">{opcion.nombre}</span>
                </label>
              )
            })
          )}
        </div>
      ) : null}
    </div>
  )
}
