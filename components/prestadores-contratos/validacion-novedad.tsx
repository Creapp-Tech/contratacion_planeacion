"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2Icon } from "lucide-react"

import { cambiarValidacionNovedad } from "@/app/(dashboard)/prestadores-contratos/actions"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ESTADO_VALIDACION } from "@/lib/prestadores-contratos/constantes"

export function ValidacionNovedad({
  id,
  valor,
}: {
  id: string
  valor: string
}) {
  const router = useRouter()
  const [pendiente, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-1">
      <Select
        value={valor}
        disabled={pendiente}
        onValueChange={(nuevo) => {
          setError(null)
          startTransition(async () => {
            const resultado = await cambiarValidacionNovedad(id, nuevo ?? "")
            if (resultado && "error" in resultado) {
              setError(resultado.error)
              return
            }
            router.refresh()
          })
        }}
      >
        <SelectTrigger className="w-40" aria-label="Estado de validación">
          <SelectValue />
          {pendiente ? <Loader2Icon className="size-3 animate-spin" /> : null}
        </SelectTrigger>
        <SelectContent>
          {ESTADO_VALIDACION.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  )
}
