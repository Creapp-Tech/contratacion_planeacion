"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckIcon, Loader2Icon } from "lucide-react"
import { cn } from "cn"

import { actualizarCeldaServicio } from "@/app/(dashboard)/aseguradores-contratos/actions"
import {
  CAMPO_CME,
  CAMPO_PRIMERA_OPCION,
  CAMPO_SEGUNDA_OPCION,
} from "@/lib/aseguradores-contratos/constantes"
import type { EspecialistaOpcion } from "@/lib/aseguradores-contratos/types"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Estado = "idle" | "guardando" | "guardado" | "error"

function etiquetaEspecialista(especialista: EspecialistaOpcion | null) {
  if (!especialista) return "Sin definir"
  return `${especialista.numero_identificacion} · ${especialista.nombre_completo}`
}

function Indicador({ estado }: { estado: Estado }) {
  if (estado === "guardando") {
    return <Loader2Icon className="size-3.5 animate-spin text-muted-foreground" />
  }
  if (estado === "guardado") {
    return <CheckIcon className="size-3.5 text-emerald-600" aria-hidden />
  }
  return null
}

export function CeldaCme({
  id,
  valor,
  puedeEditar,
}: {
  id: string
  valor: number | string
  puedeEditar: boolean
}) {
  const router = useRouter()
  const [texto, setTexto] = useState(String(valor ?? ""))
  const [estado, setEstado] = useState<Estado>("idle")
  const [error, setError] = useState<string | null>(null)
  const [pendiente, startTransition] = useTransition()
  const cancelado = useRef(false)

  function guardar() {
    if (cancelado.current) {
      cancelado.current = false
      return
    }
    const nuevo = texto.trim()
    if (nuevo === String(valor ?? "")) return

    setError(null)
    setEstado("guardando")
    startTransition(async () => {
      const resultado = await actualizarCeldaServicio(id, CAMPO_CME, nuevo)
      if ("error" in resultado) {
        setError(resultado.error)
        setEstado("error")
        return
      }
      setEstado("guardado")
      router.refresh()
    })
  }

  if (!puedeEditar) {
    return (
      <span className="whitespace-nowrap tabular-nums">
        ${Number(valor || 0).toLocaleString("es-CO", { maximumFractionDigits: 2 })}
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-1" aria-live="polite">
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={texto}
          aria-label="CME contratado"
          aria-invalid={estado === "error"}
          className="h-8 w-28 px-2 tabular-nums"
          disabled={pendiente}
          onChange={(event) => {
            setTexto(event.target.value)
            setEstado("idle")
            setError(null)
          }}
          onBlur={guardar}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              event.currentTarget.blur()
            }
            if (event.key === "Escape") {
              cancelado.current = true
              setTexto(String(valor ?? ""))
              setEstado("idle")
              setError(null)
              event.currentTarget.blur()
            }
          }}
        />
        <Indicador estado={estado} />
      </div>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  )
}

const SIN_ESPECIALISTA = "__none__"

export function CeldaOpcion({
  id,
  campo,
  valor,
  opciones,
  puedeEditar,
}: {
  id: string
  campo: typeof CAMPO_PRIMERA_OPCION | typeof CAMPO_SEGUNDA_OPCION
  valor: EspecialistaOpcion | null
  opciones: EspecialistaOpcion[]
  puedeEditar: boolean
}) {
  const router = useRouter()
  const [estado, setEstado] = useState<Estado>("idle")
  const [error, setError] = useState<string | null>(null)
  const [pendiente, startTransition] = useTransition()

  const titulo =
    campo === CAMPO_PRIMERA_OPCION ? "Primera opción" : "Segunda opción"

  if (!puedeEditar) {
    return <span className="text-sm">{etiquetaEspecialista(valor)}</span>
  }

  return (
    <div className="flex flex-col gap-1" aria-live="polite">
      <div className="flex items-center gap-1.5">
        <Select
          value={valor?.id ?? SIN_ESPECIALISTA}
          disabled={pendiente}
          onValueChange={(nuevo) => {
            const especialistaId = nuevo === SIN_ESPECIALISTA ? null : nuevo
            setError(null)
            setEstado("guardando")
            startTransition(async () => {
              const resultado = await actualizarCeldaServicio(
                id,
                campo,
                especialistaId
              )
              if ("error" in resultado) {
                setError(resultado.error)
                setEstado("error")
                return
              }
              setEstado("guardado")
              router.refresh()
            })
          }}
        >
          <SelectTrigger
            className={cn("h-8 w-44", estado === "error" && "border-destructive")}
            aria-label={titulo}
          >
            <SelectValue placeholder="Sin definir">
              {etiquetaEspecialista(valor ?? null)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SIN_ESPECIALISTA}>Sin definir</SelectItem>
            {opciones.map((opcion) => (
              <SelectItem key={opcion.id} value={opcion.id}>
                {etiquetaEspecialista(opcion)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Indicador estado={estado} />
      </div>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  )
}
