"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckIcon, Loader2Icon, XIcon } from "lucide-react"

import { aplicarCambioMasivo } from "@/app/(dashboard)/aseguradores-contratos/actions"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CAMPOS_OPCION,
  ETIQUETA_CAMPO,
  type CampoOpcion,
} from "@/lib/aseguradores-contratos/constantes"
import type { EspecialistaOpcion } from "@/lib/aseguradores-contratos/types"

const SIN_ESPECIALISTA = "__none__"

function etiquetaEspecialista(
  id: string,
  opciones: EspecialistaOpcion[]
) {
  if (id === SIN_ESPECIALISTA) return "Sin definir"
  const especialista = opciones.find((opcion) => opcion.id === id)
  return especialista
    ? `${especialista.numero_identificacion} · ${especialista.nombre_completo}`
    : "Sin definir"
}

export function BarraAccionesMasivas({
  seleccionados,
  opciones,
  onLimpiar,
}: {
  seleccionados: string[]
  opciones: EspecialistaOpcion[]
  onLimpiar: () => void
}) {
  const router = useRouter()
  const [campo, setCampo] = useState<CampoOpcion>(CAMPOS_OPCION[0])
  const [especialista, setEspecialista] = useState(SIN_ESPECIALISTA)
  const [pendiente, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)

  if (seleccionados.length === 0) return null

  function aplicar() {
    setError(null)
    setMensaje(null)
    startTransition(async () => {
      const resultado = await aplicarCambioMasivo(
        seleccionados,
        campo,
        especialista === SIN_ESPECIALISTA ? null : especialista
      )
      if ("error" in resultado) {
        setError(resultado.error)
        return
      }
      setMensaje(
        `Se actualizaron ${resultado.actualizados ?? seleccionados.length} servicios.`
      )
      onLimpiar()
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">
          {seleccionados.length} servicio
          {seleccionados.length === 1 ? "" : "s"} seleccionado
          {seleccionados.length === 1 ? "" : "s"}
        </p>
        <Button variant="ghost" size="sm" onClick={onLimpiar} disabled={pendiente}>
          <XIcon />
          Limpiar selección
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Cambiar</span>
          <Select
            value={campo}
            onValueChange={(nuevo) => {
              if (nuevo) setCampo(nuevo as CampoOpcion)
            }}
          >
            <SelectTrigger className="h-9 w-44" aria-label="Campo a cambiar">
              <SelectValue>{ETIQUETA_CAMPO[campo]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {CAMPOS_OPCION.map((opcion) => (
                <SelectItem key={opcion} value={opcion}>
                  {ETIQUETA_CAMPO[opcion]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">A</span>
          <Select
            value={especialista}
            onValueChange={(nuevo) => setEspecialista(nuevo ?? SIN_ESPECIALISTA)}
          >
            <SelectTrigger className="h-9 w-64" aria-label="Especialista">
              <SelectValue>{etiquetaEspecialista(especialista, opciones)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SIN_ESPECIALISTA}>Sin definir</SelectItem>
              {opciones.map((opcion) => (
                <SelectItem key={opcion.id} value={opcion.id}>
                  {opcion.numero_identificacion} · {opcion.nombre_completo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={aplicar} disabled={pendiente}>
          {pendiente ? <Loader2Icon className="animate-spin" /> : <CheckIcon />}
          Aplicar a seleccionados
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {mensaje ? <p className="text-sm text-emerald-700">{mensaje}</p> : null}
    </div>
  )
}
