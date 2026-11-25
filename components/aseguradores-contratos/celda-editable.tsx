"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckIcon, Loader2Icon } from "lucide-react"

import { actualizarCmeServicio } from "@/app/(dashboard)/aseguradores-contratos/actions"
import { Input } from "@/components/ui/input"

type Estado = "idle" | "guardando" | "guardado" | "error"

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
  valor: number | string | null
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
      const resultado = await actualizarCmeServicio(id, nuevo)
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
        {valor == null || valor === ""
          ? "—"
          : `$${Number(valor).toLocaleString("es-CO", {
              maximumFractionDigits: 2,
            })}`}
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
          aria-label="CME Asegurador"
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
