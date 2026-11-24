"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2Icon, SearchIcon } from "lucide-react"
import { cn } from "cn"

import { buscarCupsAction } from "@/app/(dashboard)/direccionamiento/actions"
import { Input } from "@/components/ui/input"
import type { CupsOpcion } from "@/lib/direccionamiento/types"

/**
 * Buscador asíncrono de CUPS. Nunca carga los ~10.000 registros en el
 * navegador: consulta al servidor con debounce y muestra hasta 25 resultados.
 */
export function BuscadorCups({
  value,
  onValueChange,
  onSeleccion,
  labelInicial = null,
  disabled = false,
  ariaInvalid = false,
}: {
  value: string
  onValueChange: (value: string) => void
  /** Entrega el CUPS completo, incluidos agrupador y especialidad del catálogo. */
  onSeleccion?: (opcion: CupsOpcion) => void
  labelInicial?: string | null
  disabled?: boolean
  ariaInvalid?: boolean
}) {
  const [termino, setTermino] = useState("")
  const [resultados, setResultados] = useState<CupsOpcion[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [abierto, setAbierto] = useState(false)
  const contenedor = useRef<HTMLDivElement>(null)

  const seleccionado = resultados.find((item) => item.id === value)
  const etiqueta =
    seleccionado?.codigo && seleccionado?.nombre
      ? `${seleccionado.codigo} — ${seleccionado.nombre}`
      : seleccionado?.codigo ?? labelInicial ?? value

  useEffect(() => {
    if (!abierto) return
    function cerrarFuera(event: MouseEvent) {
      if (
        contenedor.current &&
        !contenedor.current.contains(event.target as Node)
      ) {
        setAbierto(false)
      }
    }
    document.addEventListener("mousedown", cerrarFuera)
    return () => document.removeEventListener("mousedown", cerrarFuera)
  }, [abierto])

  useEffect(() => {
    if (!abierto) return
    let cancelado = false

    async function buscar() {
      setCargando(true)
      setError(null)
      try {
        const respuesta = await buscarCupsAction(termino)
        if (cancelado) return
        if ("error" in respuesta) {
          setError(respuesta.error)
          setResultados([])
        } else {
          setResultados(respuesta.resultados)
        }
      } catch {
        if (!cancelado) setError("No se pudo buscar el CUPS.")
      } finally {
        if (!cancelado) setCargando(false)
      }
    }

    const temporizador = setTimeout(buscar, 300)
    return () => {
      cancelado = true
      clearTimeout(temporizador)
    }
  }, [termino, abierto])

  return (
    <div className="relative" ref={contenedor}>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={abierto ? termino : etiqueta === value ? "" : etiqueta}
          placeholder={value ? etiqueta : "Buscar por código o nombre CUPS..."}
          disabled={disabled}
          aria-invalid={ariaInvalid}
          className="pl-9"
          onFocus={() => setAbierto(true)}
          onChange={(event) => {
            setTermino(event.target.value)
            setAbierto(true)
          }}
        />
        {cargando ? (
          <Loader2Icon className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : null}
      </div>

      {abierto ? (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border bg-popover p-1 shadow-lg">
          {error ? (
            <p className="px-3 py-2 text-sm text-destructive">{error}</p>
          ) : resultados.length === 0 && !cargando ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No se encontraron CUPS.
            </p>
          ) : (
            resultados.map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "flex w-full flex-col gap-0.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent",
                  item.id === value && "bg-accent"
                )}
                onClick={() => {
                  onValueChange(item.id)
                  onSeleccion?.(item)
                  setTermino("")
                  setAbierto(false)
                }}
              >
                <span className="font-medium">{item.codigo}</span>
                <span className="text-xs text-muted-foreground">
                  {item.nombre ?? item.descripcion ?? "Sin descripción"}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}
